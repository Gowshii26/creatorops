import {
  NextResponse,
} from "next/server";

import {
  getWorkspaceContext,
} from "@/lib/auth/workspace";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";

const GRAPH_VERSION =
  process.env
    .INSTAGRAM_GRAPH_API_VERSION
    ?.trim() ||
  "v26.0";

const GRAPH_BASE =
  `https://graph.instagram.com/${GRAPH_VERSION}`;

const STANDARD_METRICS = [
  "views",
  "reach",
  "likes",
  "comments",
  "shares",
  "saved",
  "total_interactions",
];

const REEL_METRICS = [
  "ig_reels_avg_watch_time",
  "ig_reels_video_view_total_time",
];

type MetricValue =
  | number
  | string
  | Record<string, unknown>
  | null;

type MetaErrorResponse = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

type InsightItem = {
  name?: string;
  period?: string;
  values?: Array<{
    value?: MetricValue;
    end_time?: string;
  }>;
  total_value?: {
    value?: MetricValue;
  };
  title?: string;
  description?: string;
  id?: string;
};

type InsightResponse =
  MetaErrorResponse & {
    data?: InsightItem[];
  };

type MetricFetchResult = {
  values: Record<string, MetricValue>;
  unavailable: Array<{
    metric: string;
    error: string;
  }>;
};

function metaErrorMessage(
  data: MetaErrorResponse,
  fallback: string
) {
  return (
    data.error?.message ||
    fallback
  );
}

function normalizeMetricValue(
  item: InsightItem | undefined
): MetricValue {
  if (!item) {
    return null;
  }

  if (
    item.total_value?.value !==
    undefined
  ) {
    return (
      item.total_value.value ??
      null
    );
  }

  if (
    item.values?.[0]?.value !==
    undefined
  ) {
    return (
      item.values[0].value ??
      null
    );
  }

  return null;
}

function asNumber(
  value: MetricValue
) {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string"
  ) {
    const parsed =
      Number(value);

    return Number.isFinite(
      parsed
    )
      ? parsed
      : 0;
  }

  return 0;
}

async function fetchMetricsBatch(
  mediaId: string,
  metrics: string[],
  accessToken: string
): Promise<MetricFetchResult> {
  const url =
    new URL(
      `${GRAPH_BASE}/${mediaId}/insights`
    );

  url.searchParams.set(
    "metric",
    metrics.join(",")
  );

  url.searchParams.set(
    "access_token",
    accessToken
  );

  try {
    const response =
      await fetch(
        url.toString(),
        {
          method: "GET",
          cache: "no-store",
        }
      );

    const data =
      (await response.json()) as
        InsightResponse;

    if (response.ok) {
      const values:
        Record<
          string,
          MetricValue
        > = {};

      for (
        const metric of
        metrics
      ) {
        const item =
          data.data?.find(
            (row) =>
              row.name ===
              metric
          );

        values[metric] =
          normalizeMetricValue(
            item
          );
      }

      return {
        values,
        unavailable: [],
      };
    }
  } catch {
    /*
     * Fall back to individual
     * metric requests below.
     */
  }

  const individual =
    await Promise.all(
      metrics.map(
        async (
          metric
        ) => {
          const metricUrl =
            new URL(
              `${GRAPH_BASE}/${mediaId}/insights`
            );

          metricUrl
            .searchParams
            .set(
              "metric",
              metric
            );

          metricUrl
            .searchParams
            .set(
              "access_token",
              accessToken
            );

          try {
            const response =
              await fetch(
                metricUrl
                  .toString(),
                {
                  method:
                    "GET",
                  cache:
                    "no-store",
                }
              );

            const data =
              (await response.json()) as
                InsightResponse;

            if (
              !response.ok
            ) {
              return {
                metric,
                value:
                  null as MetricValue,
                error:
                  metaErrorMessage(
                    data,
                    `Instagram did not return ${metric}.`
                  ),
              };
            }

            return {
              metric,
              value:
                normalizeMetricValue(
                  data
                    .data?.[0]
                ),
              error: null,
            };
          } catch (
            error
          ) {
            return {
              metric,
              value:
                null as MetricValue,
              error:
                error instanceof
                Error
                  ? error.message
                  : `Unable to fetch ${metric}.`,
            };
          }
        }
      )
    );

  return {
    values:
      Object.fromEntries(
        individual.map(
          (item) => [
            item.metric,
            item.value,
          ]
        )
      ),
    unavailable:
      individual
        .filter(
          (item) =>
            item.error
        )
        .map(
          (item) => ({
            metric:
              item.metric,
            error:
              item.error ||
              "Unavailable",
          })
        ),
  };
}

function emptyResponse() {
  return {
    success: true,
    source:
      "Instagram Insights API",
    live: true,
    refreshedAt:
      new Date()
        .toISOString(),
    summary: {
      views: 0,
      reach: 0,
      interactions: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      engagementRate: 0,
      trackedContent: 0,
    },
    performanceByPublishDate:
      [],
    contentPerformance: [],
    unavailableMetrics: [],
  };
}

export async function GET() {
  try {
    const workspaceResult =
      await getWorkspaceContext();

    if (
      !workspaceResult.data
    ) {
      return NextResponse.json(
        {
          error:
            workspaceResult.error ||
            "Workspace access denied.",
        },
        {
          status:
            workspaceResult.status ||
            401,
        }
      );
    }

    const workspace =
      workspaceResult.data;

    const accessToken =
      process.env
        .INSTAGRAM_ACCESS_TOKEN
        ?.trim();

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "Instagram access token is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Use the authenticated client first.
     * RLS decides which published
     * Instagram content this user may see.
     */
    const supabase =
      await createClient();

    const {
      data:
        accessibleContent,
      error:
        contentError,
    } =
      await supabase
        .from(
          "content_items"
        )
        .select(
          `
          id,
          campaign_id,
          title,
          content_type,
          platform,
          status
          `
        )
        .eq(
          "platform",
          "instagram"
        )
        .eq(
          "status",
          "published"
        );

    if (contentError) {
      throw contentError;
    }

    if (
      !accessibleContent ||
      accessibleContent.length ===
        0
    ) {
      return NextResponse.json(
        emptyResponse()
      );
    }

    const accessibleIds =
      accessibleContent.map(
        (item) =>
          item.id
      );

    const admin =
      createAdminClient();

    /*
     * social_media_links has no
     * direct browser RLS policy.
     * Query it only for content IDs
     * already authorized above.
     */
    const {
      data: links,
      error: linksError,
    } =
      await admin
        .from(
          "social_media_links"
        )
        .select(
          `
          id,
          content_id,
          external_media_id,
          media_type,
          permalink,
          published_at
          `
        )
        .eq(
          "organization_id",
          workspace.organizationId
        )
        .eq(
          "platform",
          "instagram"
        )
        .in(
          "content_id",
          accessibleIds
        )
        .order(
          "published_at",
          {
            ascending: false,
          }
        )
        .limit(20);

    if (linksError) {
      throw linksError;
    }

    if (
      !links ||
      links.length === 0
    ) {
      return NextResponse.json(
        emptyResponse()
      );
    }

    const contentMap =
      new Map(
        accessibleContent.map(
          (item) => [
            item.id,
            item,
          ]
        )
      );

    const campaignIds =
      Array.from(
        new Set(
          accessibleContent.map(
            (item) =>
              item.campaign_id
          )
        )
      );

    const {
      data: campaigns,
      error:
        campaignsError,
    } =
      await admin
        .from(
          "campaigns"
        )
        .select(
          `
          id,
          client_id,
          name,
          organization_id
          `
        )
        .eq(
          "organization_id",
          workspace.organizationId
        )
        .in(
          "id",
          campaignIds
        );

    if (
      campaignsError
    ) {
      throw campaignsError;
    }

    const clientIds =
      Array.from(
        new Set(
          (
            campaigns ??
            []
          ).map(
            (campaign) =>
              campaign.client_id
          )
        )
      );

    const {
      data: clients,
      error: clientsError,
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
            error: null,
          };

    if (clientsError) {
      throw clientsError;
    }

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

    const campaignMap =
      new Map(
        (
          campaigns ?? []
        ).map(
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

    const unavailableMetrics:
      Array<{
        contentId: string;
        title: string;
        metric: string;
        error: string;
      }> = [];

    const contentPerformance =
      await Promise.all(
        links.map(
          async (
            link
          ) => {
            const content =
              contentMap.get(
                link.content_id
              );

            if (!content) {
              return null;
            }

            const metrics =
              content
                .content_type ===
              "reel"
                ? [
                    ...STANDARD_METRICS,
                    ...REEL_METRICS,
                  ]
                : STANDARD_METRICS;

            const result =
              await fetchMetricsBatch(
                link.external_media_id,
                metrics,
                accessToken
              );

            for (
              const unavailable of
              result.unavailable
            ) {
              unavailableMetrics.push(
                {
                  contentId:
                    content.id,
                  title:
                    content.title,
                  metric:
                    unavailable.metric,
                  error:
                    unavailable.error,
                }
              );
            }

            const values =
              result.values;

            const views =
              asNumber(
                values.views
              );

            const reach =
              asNumber(
                values.reach
              );

            const likes =
              asNumber(
                values.likes
              );

            const comments =
              asNumber(
                values.comments
              );

            const shares =
              asNumber(
                values.shares
              );

            const saves =
              asNumber(
                values.saved
              );

            const directInteractions =
              asNumber(
                values
                  .total_interactions
              );

            const interactions =
              directInteractions >
              0
                ? directInteractions
                : likes +
                  comments +
                  shares +
                  saves;

            const engagementRate =
              reach > 0
                ? (
                    interactions /
                    reach
                  ) *
                  100
                : 0;

            const campaign =
              campaignMap.get(
                content.campaign_id
              );

            return {
              id:
                content.id,
              title:
                content.title,
              platform:
                content.platform,
              contentType:
                content.content_type,
              status:
                content.status,
              campaignName:
                campaign?.name ||
                "Unknown Campaign",
              clientName:
                campaign
                  ?.clientName ||
                "Unknown Client",
              permalink:
                link.permalink,
              publishedAt:
                link.published_at,
              mediaType:
                link.media_type,
              views,
              reach,
              interactions,
              likes,
              comments,
              shares,
              saves,
              engagementRate,
              avgWatchTimeMs:
                asNumber(
                  values
                    .ig_reels_avg_watch_time
                ),
              totalWatchTimeMs:
                asNumber(
                  values
                    .ig_reels_video_view_total_time
                ),
            };
          }
        )
      );

    const rows =
      contentPerformance
        .filter(
          (
            row
          ): row is NonNullable<
            typeof row
          > =>
            row !== null
        )
        .sort(
          (a, b) =>
            b.interactions -
              a.interactions ||
            b.reach -
              a.reach ||
            b.views -
              a.views
        );

    const summary =
      rows.reduce(
        (
          total,
          row
        ) => {
          total.views +=
            row.views;

          total.reach +=
            row.reach;

          total.interactions +=
            row.interactions;

          total.likes +=
            row.likes;

          total.comments +=
            row.comments;

          total.shares +=
            row.shares;

          total.saves +=
            row.saves;

          return total;
        },
        {
          views: 0,
          reach: 0,
          interactions: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          saves: 0,
          engagementRate:
            0,
          trackedContent:
            rows.length,
        }
      );

    summary.engagementRate =
      summary.reach > 0
        ? (
            summary.interactions /
            summary.reach
          ) *
          100
        : 0;

    const dateMap =
      new Map<
        string,
        {
          date: string;
          views: number;
          reach: number;
          interactions: number;
          contentCount: number;
        }
      >();

    for (
      const row of rows
    ) {
      const date =
        row.publishedAt
          ? row.publishedAt
              .slice(
                0,
                10
              )
          : "Unknown";

      const existing =
        dateMap.get(
          date
        ) || {
          date,
          views: 0,
          reach: 0,
          interactions: 0,
          contentCount: 0,
        };

      existing.views +=
        row.views;

      existing.reach +=
        row.reach;

      existing.interactions +=
        row.interactions;

      existing.contentCount +=
        1;

      dateMap.set(
        date,
        existing
      );
    }

    const performanceByPublishDate =
      Array.from(
        dateMap.values()
      ).sort(
        (a, b) =>
          a.date.localeCompare(
            b.date
          )
      );

    return NextResponse.json({
      success: true,
      source:
        "Instagram Insights API",
      live: true,
      refreshedAt:
        new Date()
          .toISOString(),
      summary,
      performanceByPublishDate,
      contentPerformance:
        rows,
      unavailableMetrics,
    });
  } catch (error) {
    console.error(
      "Instagram analytics error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Unable to load Instagram analytics.",
      },
      {
        status: 500,
      }
    );
  }
}
