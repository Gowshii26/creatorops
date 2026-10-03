import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  getWorkspaceContext,
} from "@/lib/auth/workspace";

type MetricRow = {
  content_id: string;
  metric_date: string;
  reach: number;
  engagements: number;
  clicks: number;
};

function validDate(
  value: string | null
) {
  if (!value) {
    return null;
  }

  const date =
    new Date(
      `${value}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return value;
}

/*
 * GET /api/reports
 *
 * No campaignId:
 * - returns accessible campaigns
 * - returns generated report history
 *
 * With campaignId:
 * - returns report data
 */
export async function GET(
  request: Request
) {
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

    const url =
      new URL(
        request.url
      );

    const campaignId =
      url.searchParams.get(
        "campaignId"
      );

    const from =
      validDate(
        url.searchParams.get(
          "from"
        )
      );

    const to =
      validDate(
        url.searchParams.get(
          "to"
        )
      );

    const supabase =
      await createClient();

    /*
     * First obtain campaigns using
     * authenticated RLS.
     */
    const {
      data: accessibleCampaigns,
      error: campaignListError,
    } =
      await supabase
        .from(
          "campaigns"
        )
        .select(
          `
          id,
          client_id,
          name,
          status,
          start_date,
          end_date
          `
        )
        .neq(
          "status",
          "archived"
        )
        .order(
          "name",
          {
            ascending: true,
          }
        );

    if (
      campaignListError
    ) {
      throw campaignListError;
    }

    const campaigns =
      accessibleCampaigns ??
      [];

    const admin =
      createAdminClient();

    const clientIds =
      Array.from(
        new Set(
          campaigns.map(
            (campaign) =>
              campaign.client_id
          )
        )
      );

    const {
      data: clients,
    } =
      clientIds.length > 0
        ? await admin
            .from(
              "clients"
            )
            .select(
              "id, name"
            )
            .in(
              "id",
              clientIds
            )
        : {
            data: [],
          };

    const clientMap =
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

    const campaignOptions =
      campaigns.map(
        (campaign) => ({
          ...campaign,

          client_name:
            clientMap.get(
              campaign.client_id
            ) ||
            "Unknown Client",
        })
      );

    /*
     * No campaign selected:
     * return setup data + history.
     */
    if (!campaignId) {
      const accessibleIds =
        campaigns.map(
          (campaign) =>
            campaign.id
        );

      let savedReports:
        Record<
          string,
          unknown
        >[] = [];

      if (
        accessibleIds.length >
        0
      ) {
        const {
          data: reportRows,
          error:
            reportHistoryError,
        } =
          await admin
            .from(
              "generated_reports"
            )
            .select(
              `
              id,
              campaign_id,
              generated_by,
              report_name,
              report_type,
              parameters,
              created_at
              `
            )
            .eq(
              "organization_id",
              workspace.data
                .organizationId
            )
            .in(
              "campaign_id",
              accessibleIds
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            )
            .limit(20);

        if (
          reportHistoryError
        ) {
          console.warn(
            "Report history warning:",
            reportHistoryError.message
          );
        }

        savedReports =
          reportRows ?? [];
      }

      const generatorIds =
        Array.from(
          new Set(
            savedReports
              .map(
                (report) =>
                  report.generated_by
              )
              .filter(
                (
                  value
                ): value is string =>
                  typeof value ===
                  "string"
              )
          )
        );

      const {
        data: profiles,
      } =
        generatorIds.length >
        0
          ? await admin
              .from(
                "profiles"
              )
              .select(
                "id, full_name"
              )
              .in(
                "id",
                generatorIds
              )
          : {
              data: [],
            };

      const profileMap =
        new Map(
          (
            profiles ?? []
          ).map(
            (profile) => [
              profile.id,
              profile.full_name,
            ]
          )
        );

      const campaignNameMap =
        new Map(
          campaignOptions.map(
            (campaign) => [
              campaign.id,
              {
                name:
                  campaign.name,
                clientName:
                  campaign.client_name,
              },
            ]
          )
        );

      const history =
        savedReports.map(
          (report) => {
            const campaign =
              campaignNameMap.get(
                String(
                  report.campaign_id
                )
              );

            return {
              ...report,

              campaign_name:
                campaign?.name ||
                "Unknown Campaign",

              client_name:
                campaign
                  ?.clientName ||
                "Unknown Client",

              generated_by_name:
                typeof report.generated_by ===
                "string"
                  ? profileMap.get(
                      report.generated_by
                    ) ||
                    "CreatorOps User"
                  : "CreatorOps User",
            };
          }
        );

      return NextResponse.json({
        campaigns:
          campaignOptions,

        history,
      });
    }

    /*
     * Confirm the selected campaign was
     * visible through authenticated RLS.
     */
    const campaign =
      campaignOptions.find(
        (item) =>
          item.id ===
          campaignId
      );

    if (!campaign) {
      return NextResponse.json(
        {
          error:
            "Campaign not found or access denied.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Content is also loaded using RLS.
     */
    const {
      data: contentRows,
      error: contentError,
    } =
      await supabase
        .from(
          "content_items"
        )
        .select(
          `
          id,
          title,
          platform,
          content_type,
          status,
          publish_at,
          current_version
          `
        )
        .eq(
          "campaign_id",
          campaignId
        )
        .neq(
          "status",
          "archived"
        )
        .order(
          "title",
          {
            ascending: true,
          }
        );

    if (contentError) {
      throw contentError;
    }

    const content =
      contentRows ?? [];

    const contentIds =
      content.map(
        (item) =>
          item.id
      );

    let metrics:
      MetricRow[] = [];

    if (
      contentIds.length > 0
    ) {
      let metricQuery =
        admin
          .from(
            "content_metrics"
          )
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
          );

      if (from) {
        metricQuery =
          metricQuery.gte(
            "metric_date",
            from
          );
      }

      if (to) {
        metricQuery =
          metricQuery.lte(
            "metric_date",
            to
          );
      }

      const {
        data: metricRows,
        error: metricError,
      } =
        await metricQuery;

      if (metricError) {
        throw metricError;
      }

      metrics =
        (
          metricRows ??
          []
        ) as MetricRow[];
    }

    const metricMap =
      new Map<
        string,
        {
          reach: number;
          engagements: number;
          clicks: number;
        }
      >();

    for (
      const row of metrics
    ) {
      const current =
        metricMap.get(
          row.content_id
        ) ?? {
          reach: 0,
          engagements: 0,
          clicks: 0,
        };

      current.reach +=
        Number(
          row.reach || 0
        );

      current.engagements +=
        Number(
          row.engagements ||
            0
        );

      current.clicks +=
        Number(
          row.clicks || 0
        );

      metricMap.set(
        row.content_id,
        current
      );
    }

    const contentPerformance =
      content.map(
        (item) => {
          const metric =
            metricMap.get(
              item.id
            ) ?? {
              reach: 0,
              engagements: 0,
              clicks: 0,
            };

          const engagementRate =
            metric.reach > 0
              ? (
                  metric.engagements /
                  metric.reach
                ) *
                100
              : 0;

          return {
            ...item,

            reach:
              metric.reach,

            engagements:
              metric.engagements,

            clicks:
              metric.clicks,

            engagementRate,
          };
        }
      );

    const totalReach =
      contentPerformance.reduce(
        (
          total,
          item
        ) =>
          total +
          item.reach,
        0
      );

    const totalEngagements =
      contentPerformance.reduce(
        (
          total,
          item
        ) =>
          total +
          item.engagements,
        0
      );

    const totalClicks =
      contentPerformance.reduce(
        (
          total,
          item
        ) =>
          total +
          item.clicks,
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

    const published =
      content.filter(
        (item) =>
          item.status ===
          "published"
      ).length;

    const scheduled =
      content.filter(
        (item) =>
          item.status ===
          "scheduled"
      ).length;

    return NextResponse.json({
      campaign: {
        id:
          campaign.id,

        name:
          campaign.name,

        clientName:
          campaign.client_name,

        status:
          campaign.status,

        startDate:
          campaign.start_date,

        endDate:
          campaign.end_date,
      },

      filters: {
        from,
        to,
      },

      summary: {
        contentCount:
          content.length,

        published,

        scheduled,

        reach:
          totalReach,

        engagements:
          totalEngagements,

        clicks:
          totalClicks,

        engagementRate,
      },

      content:
        contentPerformance,
    });
  } catch (error) {
    console.error(
      "Reports GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to generate report.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * POST /api/reports
 *
 * Saves metadata after a report
 * has been exported by the browser.
 */
export async function POST(
  request: Request
) {
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

    const body =
      await request.json();

    const campaignId =
      typeof body.campaignId ===
      "string"
        ? body.campaignId
        : "";

    const reportName =
      typeof body.reportName ===
      "string"
        ? body.reportName.trim()
        : "";

    if (
      !campaignId ||
      !reportName
    ) {
      return NextResponse.json(
        {
          error:
            "Campaign and report name are required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Verify campaign access using RLS.
     */
    const supabase =
      await createClient();

    const {
      data: campaign,
    } =
      await supabase
        .from(
          "campaigns"
        )
        .select(
          "id"
        )
        .eq(
          "id",
          campaignId
        )
        .maybeSingle();

    if (!campaign) {
      return NextResponse.json(
        {
          error:
            "Campaign access denied.",
        },
        {
          status: 403,
        }
      );
    }

    const admin =
      createAdminClient();

    const {
      data: report,
      error,
    } =
      await admin
        .from(
          "generated_reports"
        )
        .insert({
          organization_id:
            workspace.data
              .organizationId,

          campaign_id:
            campaignId,

          generated_by:
            workspace.data.userId,

          report_name:
            reportName,

          report_type:
            "campaign_performance",

          parameters: {
            from:
              body.from ??
              null,

            to:
              body.to ??
              null,

            format:
              "pdf",
          },
        })
        .select(
          `
          id,
          campaign_id,
          report_name,
          report_type,
          created_at
          `
        )
        .single();

    if (error) {
      throw error;
    }

    await admin
      .from(
        "audit_logs"
      )
      .insert({
        organization_id:
          workspace.data
            .organizationId,

        actor_id:
          workspace.data.userId,

        action:
          "report_generated",

        entity_type:
          "campaign",

        entity_id:
          campaignId,

        metadata: {
          report_id:
            report.id,

          report_name:
            reportName,

          format:
            "pdf",
        },
      });

    return NextResponse.json(
      {
        success: true,
        report,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Reports POST error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to save report history.",
      },
      {
        status: 500,
      }
    );
  }
}