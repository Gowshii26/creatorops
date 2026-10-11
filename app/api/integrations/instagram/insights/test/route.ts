import {
  NextResponse,
} from "next/server";

import {
  getWorkspaceContext,
} from "@/lib/auth/workspace";

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

const allowedRoles =
  new Set([
    "admin",
    "manager",
    "creator",
    "client",
  ]);

type MetaErrorResponse = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

type InsightValue = {
  value?: number | string | Record<string, unknown>;
  end_time?: string;
};

type InsightItem = {
  name?: string;
  period?: string;
  values?: InsightValue[];
  title?: string;
  description?: string;
  id?: string;
};

type InsightResponse =
  MetaErrorResponse & {
    data?: InsightItem[];
  };

type MetricResult = {
  metric: string;
  supported: boolean;
  value: number | string | Record<string, unknown> | null;
  period: string | null;
  title: string | null;
  error: string | null;
};

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

function metaErrorMessage(
  data: MetaErrorResponse,
  fallback: string
) {
  return (
    data.error?.message ||
    fallback
  );
}

async function fetchMetric(
  mediaId: string,
  metric: string,
  accessToken: string
): Promise<MetricResult> {
  const url =
    new URL(
      `${GRAPH_BASE}/${mediaId}/insights`
    );

  url.searchParams.set(
    "metric",
    metric
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

    if (!response.ok) {
      return {
        metric,
        supported: false,
        value: null,
        period: null,
        title: null,
        error:
          metaErrorMessage(
            data,
            `Instagram did not return ${metric}.`
          ),
      };
    }

    const item =
      data.data?.[0];

    const firstValue =
      item?.values?.[0]
        ?.value;

    return {
      metric,
      supported: true,
      value:
        firstValue ===
        undefined
          ? null
          : firstValue,
      period:
        item?.period ??
        null,
      title:
        item?.title ??
        null,
      error: null,
    };
  } catch (error) {
    return {
      metric,
      supported: false,
      value: null,
      period: null,
      title: null,
      error:
        error instanceof Error
          ? error.message
          : `Unable to fetch ${metric}.`,
    };
  }
}

export async function GET(
  request: Request
) {
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

    if (
      !allowedRoles.has(
        workspace.role
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Instagram analytics access denied.",
        },
        {
          status: 403,
        }
      );
    }

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

    const requestUrl =
      new URL(request.url);

    const requestedContentId =
      requestUrl.searchParams
        .get("contentId")
        ?.trim() ||
      "";

    const admin =
      createAdminClient();

    let linksQuery =
      admin
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
        .order(
          "published_at",
          {
            ascending: false,
          }
        )
        .limit(20);

    if (
      requestedContentId
    ) {
      linksQuery =
        linksQuery.eq(
          "content_id",
          requestedContentId
        );
    }

    const {
      data: links,
      error: linksError,
    } =
      await linksQuery;

    if (linksError) {
      throw linksError;
    }

    if (
      !links ||
      links.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            requestedContentId
              ? "No Instagram media is linked to this content item."
              : "No published Instagram media is linked to this workspace yet.",
        },
        {
          status: 404,
        }
      );
    }

    const contentIds =
      Array.from(
        new Set(
          links.map(
            (link) =>
              link.content_id
          )
        )
      );

    const {
      data: contentRows,
      error: contentError,
    } =
      await admin
        .from(
          "content_items"
        )
        .select(
          `
          id,
          title,
          content_type,
          platform,
          status
          `
        )
        .in(
          "id",
          contentIds
        );

    if (contentError) {
      throw contentError;
    }

    const contentMap =
      new Map(
        (
          contentRows ?? []
        ).map(
          (item) => [
            item.id,
            item,
          ]
        )
      );

    const selectedLink =
      requestedContentId
        ? links[0]
        : links.find(
            (link) =>
              contentMap.get(
                link.content_id
              )?.content_type ===
              "reel"
          ) ||
          links[0];

    const content =
      contentMap.get(
        selectedLink.content_id
      );

    if (!content) {
      return NextResponse.json(
        {
          error:
            "The linked CreatorOps content item could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    const isReel =
      content.content_type ===
      "reel";

    const metrics =
      isReel
        ? [
            ...STANDARD_METRICS,
            ...REEL_METRICS,
          ]
        : STANDARD_METRICS;

    const metricResults =
      await Promise.all(
        metrics.map(
          (metric) =>
            fetchMetric(
              selectedLink
                .external_media_id,
              metric,
              accessToken
            )
        )
      );

    const availableMetrics =
      Object.fromEntries(
        metricResults
          .filter(
            (item) =>
              item.supported
          )
          .map(
            (item) => [
              item.metric,
              item.value,
            ]
          )
      );

    const unavailableMetrics =
      metricResults
        .filter(
          (item) =>
            !item.supported
        )
        .map(
          (item) => ({
            metric:
              item.metric,
            error:
              item.error,
          })
        );

    return NextResponse.json(
      {
        success: true,
        source:
          "Instagram Insights API",
        live: true,
        content: {
          id:
            content.id,
          title:
            content.title,
          contentType:
            content.content_type,
          status:
            content.status,
        },
        instagram: {
          permalink:
            selectedLink
              .permalink,
          mediaType:
            selectedLink
              .media_type,
          publishedAt:
            selectedLink
              .published_at,
        },
        metrics:
          availableMetrics,
        unavailableMetrics,
        note:
          "These values are returned live by Instagram. Newly published media can legitimately show zero or delayed metrics until Instagram finishes processing insights.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Instagram insights test error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load Instagram insights.",
      },
      {
        status: 500,
      }
    );
  }
}
