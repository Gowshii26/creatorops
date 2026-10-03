import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/auth/workspace";

type MetricRow = {
  content_id: string;
  metric_date: string;
  reach: number;
  engagements: number;
  clicks: number;
};

export async function GET() {
  try {
    const workspace =
      await getWorkspaceContext();

    if (!workspace.data) {
      return NextResponse.json(
        {
          error:
            workspace.error ||
            "Workspace access denied.",
        },
        {
          status:
            workspace.status,
        }
      );
    }

    /*
     * First use the authenticated client.
     *
     * This means RLS determines which
     * campaigns and content the current
     * user is actually allowed to see.
     */
    const supabase =
      await createClient();

    const [
      contentResult,
      campaignResult,
    ] =
      await Promise.all([
        supabase
          .from("content_items")
          .select(
            `
            id,
            campaign_id,
            title,
            platform,
            content_type,
            status
            `
          )
          .neq(
            "status",
            "archived"
          ),

        supabase
          .from("campaigns")
          .select(
            `
            id,
            client_id,
            name,
            status
            `
          )
          .neq(
            "status",
            "archived"
          ),
      ]);

    if (contentResult.error) {
      throw contentResult.error;
    }

    if (campaignResult.error) {
      throw campaignResult.error;
    }

    const content =
      contentResult.data ?? [];

    const campaigns =
      campaignResult.data ?? [];

    /*
     * Only metric rows linked to content
     * already visible through RLS are used.
     */
    const contentIds =
      content.map(
        (item) =>
          item.id
      );

    if (
      contentIds.length === 0
    ) {
      return NextResponse.json({
        summary: {
          reach: 0,
          engagements: 0,
          clicks: 0,
          engagementRate: 0,
          trackedContent: 0,
        },

        trend: [],

        topContent: [],
      });
    }

    const admin =
      createAdminClient();

    const {
      data: metricRows,
      error: metricError,
    } =
      await admin
        .from("content_metrics")
        .select(
          `
          content_id,
          metric_date,
          reach,
          engagements,
          clicks
          `
        )
        .in(
          "content_id",
          contentIds
        )
        .order(
          "metric_date",
          {
            ascending: true,
          }
        );

    if (metricError) {
      throw metricError;
    }

    const metrics =
      (metricRows ??
        []) as MetricRow[];

    /*
     * Client names.
     */
    const clientIds =
      Array.from(
        new Set(
          campaigns.map(
            (campaign) =>
              campaign.client_id
          )
        )
      );

    let clientMap =
      new Map<
        string,
        string
      >();

    if (
      clientIds.length > 0
    ) {
      const {
        data: clients,
      } =
        await admin
          .from("clients")
          .select(
            "id, name"
          )
          .in(
            "id",
            clientIds
          );

      clientMap =
        new Map(
          (
            clients ?? []
          ).map(
            (client) => [
              client.id,
              client.name,
            ]
          )
        );
    }

    const campaignMap =
      new Map(
        campaigns.map(
          (campaign) => [
            campaign.id,
            {
              name:
                campaign.name,

              clientName:
                clientMap.get(
                  campaign.client_id
                ) ||
                "Unknown Client",
            },
          ]
        )
      );

    const contentMap =
      new Map(
        content.map(
          (item) => [
            item.id,
            item,
          ]
        )
      );

    /*
     * Overall totals.
     */
    const totalReach =
      metrics.reduce(
        (
          total,
          row
        ) =>
          total +
          Number(
            row.reach || 0
          ),
        0
      );

    const totalEngagements =
      metrics.reduce(
        (
          total,
          row
        ) =>
          total +
          Number(
            row.engagements ||
              0
          ),
        0
      );

    const totalClicks =
      metrics.reduce(
        (
          total,
          row
        ) =>
          total +
          Number(
            row.clicks || 0
          ),
        0
      );

    const engagementRate =
      totalReach > 0
        ? (
            totalEngagements /
            totalReach
          ) *
          100
        : 0;

    /*
     * Daily trend.
     */
    const trendMap =
      new Map<
        string,
        {
          date: string;
          reach: number;
          engagements: number;
          clicks: number;
        }
      >();

    for (
      const metric of metrics
    ) {
      const existing =
        trendMap.get(
          metric.metric_date
        ) ?? {
          date:
            metric.metric_date,

          reach: 0,

          engagements: 0,

          clicks: 0,
        };

      existing.reach +=
        Number(
          metric.reach || 0
        );

      existing.engagements +=
        Number(
          metric.engagements ||
            0
        );

      existing.clicks +=
        Number(
          metric.clicks || 0
        );

      trendMap.set(
        metric.metric_date,
        existing
      );
    }

    const trend =
      Array.from(
        trendMap.values()
      ).sort(
        (a, b) =>
          a.date.localeCompare(
            b.date
          )
      );

    /*
     * Aggregate metrics by individual
     * content item.
     */
    const contentMetricMap =
      new Map<
        string,
        {
          reach: number;
          engagements: number;
          clicks: number;
        }
      >();

    for (
      const metric of metrics
    ) {
      const current =
        contentMetricMap.get(
          metric.content_id
        ) ?? {
          reach: 0,
          engagements: 0,
          clicks: 0,
        };

      current.reach +=
        Number(
          metric.reach || 0
        );

      current.engagements +=
        Number(
          metric.engagements ||
            0
        );

      current.clicks +=
        Number(
          metric.clicks || 0
        );

      contentMetricMap.set(
        metric.content_id,
        current
      );
    }

    const topContent =
      Array.from(
        contentMetricMap.entries()
      )
        .map(
          ([
            contentId,
            values,
          ]) => {
            const item =
              contentMap.get(
                contentId
              );

            if (!item) {
              return null;
            }

            const campaign =
              campaignMap.get(
                item.campaign_id
              );

            return {
              id:
                item.id,

              title:
                item.title,

              platform:
                item.platform,

              contentType:
                item.content_type,

              status:
                item.status,

              campaignName:
                campaign?.name ||
                "Unknown Campaign",

              clientName:
                campaign
                  ?.clientName ||
                "Unknown Client",

              reach:
                values.reach,

              engagements:
                values.engagements,

              clicks:
                values.clicks,

              engagementRate:
                values.reach >
                0
                  ? (
                      values.engagements /
                      values.reach
                    ) *
                    100
                  : 0,
            };
          }
        )
        .filter(
          (
            item
          ): item is NonNullable<
            typeof item
          > =>
            item !== null
        )
        .sort(
          (a, b) =>
            b.reach -
            a.reach
        );

    return NextResponse.json({
      summary: {
        reach:
          totalReach,

        engagements:
          totalEngagements,

        clicks:
          totalClicks,

        engagementRate,

        trackedContent:
          topContent.length,
      },

      trend,

      topContent,
    });
  } catch (error) {
    console.error(
      "Analytics GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load analytics.",
      },
      {
        status: 500,
      }
    );
  }
}