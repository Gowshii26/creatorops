"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  BarChart3,
  Bookmark,
  ExternalLink,
  Eye,
  Heart,
  Loader2,
  MessageCircle,
  RefreshCw,
  Share2,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

type Summary = {
  views: number;
  reach: number;
  interactions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
  trackedContent: number;
};

type PerformanceDateRow = {
  date: string;
  views: number;
  reach: number;
  interactions: number;
  contentCount: number;
};

type ContentPerformanceRow = {
  id: string;
  title: string;
  platform: string;
  contentType: string;
  status: string;
  campaignName: string;
  clientName: string;
  permalink: string | null;
  publishedAt: string | null;
  mediaType: string | null;
  views: number;
  reach: number;
  interactions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
  avgWatchTimeMs: number;
  totalWatchTimeMs: number;
};

type UnavailableMetric = {
  contentId: string;
  title: string;
  metric: string;
  error: string;
};

type InstagramAnalyticsData = {
  success: boolean;
  source: string;
  live: boolean;
  refreshedAt: string;
  summary: Summary;
  performanceByPublishDate:
    PerformanceDateRow[];
  contentPerformance:
    ContentPerformanceRow[];
  unavailableMetrics:
    UnavailableMetric[];
};

function compactNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "en",
    {
      notation: "compact",
      maximumFractionDigits: 1,
    }
  ).format(value);
}

function fullNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "en"
  ).format(value);
}

function labelValue(
  value: string
) {
  return value
    .split("_")
    .map(
      (part) =>
        part
          .charAt(0)
          .toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}

function formatDate(
  value: string
) {
  if (
    !value ||
    value === "Unknown"
  ) {
    return value ||
      "Unknown";
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
    return value;
  }

  return new Intl.DateTimeFormat(
    "en",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function formatDateTime(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function formatWatchTime(
  milliseconds: number
) {
  if (
    !milliseconds ||
    milliseconds <= 0
  ) {
    return "0s";
  }

  const seconds =
    milliseconds /
    1000;

  if (seconds < 60) {
    return `${seconds.toFixed(
      seconds >= 10
        ? 0
        : 1
    )}s`;
  }

  const minutes =
    Math.floor(
      seconds / 60
    );

  const remainingSeconds =
    Math.round(
      seconds % 60
    );

  return `${minutes}m ${remainingSeconds}s`;
}

export default function AnalyticsDashboard() {
  const [
    data,
    setData,
  ] =
    useState<InstagramAnalyticsData | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const loadAnalytics =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const response =
            await fetch(
              "/api/integrations/instagram/insights",
              {
                cache:
                  "no-store",
              }
            );

          const result =
            await response.json();

          if (
            !response.ok
          ) {
            throw new Error(
              result.error ||
                "Unable to load Instagram analytics."
            );
          }

          setData(result);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load Instagram analytics."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const maxViews =
    useMemo(
      () =>
        Math.max(
          1,
          ...(
            data
              ?.performanceByPublishDate ??
            []
          ).map(
            (row) =>
              row.views
          )
        ),
      [data]
    );

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2
          size={18}
          className="animate-spin"
        />

        Loading live Instagram
        analytics...
      </div>
    );
  }

  if (
    error ||
    !data
  ) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error ||
          "Unable to load Instagram analytics."}
      </div>
    );
  }

  return (
    <div>
      {/* SOURCE + REFRESH */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Live Instagram Insights
          </span>

          <span className="text-xs text-slate-400">
            Refreshed{" "}
            {formatDateTime(
              data.refreshedAt
            )}
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={
            loadAnalytics
          }
        >
          <RefreshCw
            size={14}
            className="mr-2"
          />

          Refresh from Instagram
        </Button>
      </div>

      {/* KPI CARDS */}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Views
            </p>

            <Eye
              size={18}
              className="text-slate-400"
            />
          </div>

          <p className="mt-3 text-3xl font-bold">
            {compactNumber(
              data.summary.views
            )}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {fullNumber(
              data.summary.views
            )}{" "}
            total
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Reach
            </p>

            <BarChart3
              size={18}
              className="text-slate-400"
            />
          </div>

          <p className="mt-3 text-3xl font-bold">
            {compactNumber(
              data.summary.reach
            )}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Accounts reached
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Interactions
            </p>

            <Activity
              size={18}
              className="text-slate-400"
            />
          </div>

          <p className="mt-3 text-3xl font-bold">
            {compactNumber(
              data.summary
                .interactions
            )}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Instagram total
            interactions
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Engagement Rate
            </p>

            <Heart
              size={18}
              className="text-slate-400"
            />
          </div>

          <p className="mt-3 text-3xl font-bold">
            {data.summary
              .engagementRate
              .toFixed(1)}
            %
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Interactions ÷ reach
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Likes
            </p>

            <Heart
              size={18}
              className="text-slate-400"
            />
          </div>

          <p className="mt-3 text-3xl font-bold">
            {compactNumber(
              data.summary.likes
            )}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {fullNumber(
              data.summary.likes
            )}{" "}
            total
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Tracked Content
            </p>

            <BarChart3
              size={18}
              className="text-slate-400"
            />
          </div>

          <p className="mt-3 text-3xl font-bold">
            {
              data.summary
                .trackedContent
            }
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Linked Instagram
            items
          </p>
        </div>
      </div>

      {/* ENGAGEMENT BREAKDOWN */}

      <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">
            Engagement Breakdown
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Live interaction
            totals returned by the
            Instagram Insights API.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <MessageCircle
                size={16}
              />
              Comments
            </div>

            <p className="mt-2 text-2xl font-bold">
              {fullNumber(
                data.summary
                  .comments
              )}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Share2
                size={16}
              />
              Shares
            </div>

            <p className="mt-2 text-2xl font-bold">
              {fullNumber(
                data.summary.shares
              )}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Bookmark
                size={16}
              />
              Saves
            </div>

            <p className="mt-2 text-2xl font-bold">
              {fullNumber(
                data.summary.saves
              )}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Heart
                size={16}
              />
              Likes
            </div>

            <p className="mt-2 text-2xl font-bold">
              {fullNumber(
                data.summary.likes
              )}
            </p>
          </div>
        </div>
      </section>

      {/* PUBLISH DATE PERFORMANCE */}

      <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">
            Performance by
            Publish Date
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current lifetime
            Instagram results grouped
            by the date each tracked
            content item was published.
          </p>
        </div>

        {data
          .performanceByPublishDate
          .length === 0 ? (
          <div className="mt-8 rounded-xl bg-slate-50 p-10 text-center text-sm text-slate-500">
            No linked Instagram
            performance data yet.
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto">
            <div className="flex min-w-[650px] items-end gap-4">
              {data
                .performanceByPublishDate
                .map(
                  (row) => {
                    const height =
                      Math.max(
                        8,
                        (
                          row.views /
                          maxViews
                        ) *
                          180
                      );

                    return (
                      <div
                        key={
                          row.date
                        }
                        className="flex min-w-0 flex-1 flex-col items-center"
                      >
                        <p className="mb-2 text-xs font-semibold">
                          {compactNumber(
                            row.views
                          )}
                        </p>

                        <div className="flex h-[190px] w-full items-end justify-center rounded-xl bg-slate-50 px-3">
                          <div
                            className="w-full max-w-12 rounded-t-lg bg-black"
                            style={{
                              height:
                                `${height}px`,
                            }}
                          />
                        </div>

                        <p className="mt-3 text-xs font-medium">
                          {formatDate(
                            row.date
                          )}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                          {compactNumber(
                            row.reach
                          )}{" "}
                          reach
                        </p>

                        <p className="text-[11px] text-slate-400">
                          {compactNumber(
                            row.interactions
                          )}{" "}
                          interactions
                        </p>
                      </div>
                    );
                  }
                )}
            </div>
          </div>
        )}
      </section>

      {/* CONTENT PERFORMANCE */}

      <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">
            Instagram Content
            Performance
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Real metrics tied
            directly to published
            CreatorOps content.
          </p>
        </div>

        {data
          .contentPerformance
          .length === 0 ? (
          <div className="mt-8 rounded-xl bg-slate-50 p-10 text-center text-sm text-slate-500">
            Publish and link
            Instagram content to see
            live performance here.
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[1350px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wider text-slate-400">
                  <th className="pb-3 font-semibold">
                    Content
                  </th>

                  <th className="pb-3 font-semibold">
                    Type
                  </th>

                  <th className="pb-3 text-right font-semibold">
                    Views
                  </th>

                  <th className="pb-3 text-right font-semibold">
                    Reach
                  </th>

                  <th className="pb-3 text-right font-semibold">
                    Interactions
                  </th>

                  <th className="pb-3 text-right font-semibold">
                    Rate
                  </th>

                  <th className="pb-3 text-right font-semibold">
                    Likes
                  </th>

                  <th className="pb-3 text-right font-semibold">
                    Comments
                  </th>

                  <th className="pb-3 text-right font-semibold">
                    Shares
                  </th>

                  <th className="pb-3 text-right font-semibold">
                    Saves
                  </th>

                  <th className="pb-3 text-right font-semibold">
                    Avg Watch
                  </th>

                  <th className="pb-3 text-right font-semibold">
                    Instagram
                  </th>
                </tr>
              </thead>

              <tbody>
                {data
                  .contentPerformance
                  .map(
                    (item) => (
                      <tr
                        key={
                          item.id
                        }
                        className="border-b last:border-0"
                      >
                        <td className="py-4">
                          <p className="font-medium">
                            {
                              item.title
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {
                              item.clientName
                            }{" "}
                            —{" "}
                            {
                              item.campaignName
                            }
                          </p>

                          {item.publishedAt && (
                            <p className="mt-1 text-[11px] text-slate-400">
                              Published{" "}
                              {formatDateTime(
                                item.publishedAt
                              )}
                            </p>
                          )}
                        </td>

                        <td className="py-4">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs">
                            {labelValue(
                              item.contentType
                            )}
                          </span>
                        </td>

                        <td className="py-4 text-right font-medium">
                          {fullNumber(
                            item.views
                          )}
                        </td>

                        <td className="py-4 text-right font-medium">
                          {fullNumber(
                            item.reach
                          )}
                        </td>

                        <td className="py-4 text-right font-medium">
                          {fullNumber(
                            item.interactions
                          )}
                        </td>

                        <td className="py-4 text-right font-medium">
                          {item
                            .engagementRate
                            .toFixed(
                              1
                            )}
                          %
                        </td>

                        <td className="py-4 text-right">
                          {fullNumber(
                            item.likes
                          )}
                        </td>

                        <td className="py-4 text-right">
                          {fullNumber(
                            item.comments
                          )}
                        </td>

                        <td className="py-4 text-right">
                          {fullNumber(
                            item.shares
                          )}
                        </td>

                        <td className="py-4 text-right">
                          {fullNumber(
                            item.saves
                          )}
                        </td>

                        <td className="py-4 text-right">
                          {item
                            .contentType ===
                          "reel"
                            ? formatWatchTime(
                                item.avgWatchTimeMs
                              )
                            : "—"}
                        </td>

                        <td className="py-4 text-right">
                          {item.permalink ? (
                            <a
                              href={
                                item.permalink
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-medium underline underline-offset-4"
                            >
                              Open
                              <ExternalLink
                                size={13}
                              />
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    )
                  )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {data
        .unavailableMetrics
        .length > 0 && (
        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-medium text-amber-900">
            Some Instagram metrics
            were unavailable
          </p>

          <p className="mt-1 text-sm text-amber-800">
            CreatorOps kept the
            available live metrics
            instead of failing the
            whole dashboard.
          </p>
        </section>
      )}

      <p className="mt-5 text-xs text-slate-400">
        Source: {data.source}.
        Values are fetched live
        from Instagram and may take
        time to populate for newly
        published content.
      </p>
    </div>
  );
}
