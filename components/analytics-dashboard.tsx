"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BarChart3,
  Eye,
  Loader2,
  MousePointerClick,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type Summary = {
  reach: number;
  engagements: number;
  clicks: number;
  engagementRate: number;
  trackedContent: number;
};

type TrendRow = {
  date: string;
  reach: number;
  engagements: number;
  clicks: number;
};

type TopContentRow = {
  id: string;
  title: string;
  platform: string;
  contentType: string;
  status: string;
  campaignName: string;
  clientName: string;
  reach: number;
  engagements: number;
  clicks: number;
  engagementRate: number;
};

type AnalyticsData = {
  summary: Summary;
  trend: TrendRow[];
  topContent: TopContentRow[];
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
    }
  ).format(date);
}

export default function AnalyticsDashboard() {
  const [
    data,
    setData,
  ] =
    useState<AnalyticsData | null>(
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
              "/api/analytics",
              {
                cache:
                  "no-store",
              }
            );

          const result =
            await response.json();

          if (!response.ok) {
            throw new Error(
              result.error ||
                "Unable to load analytics."
            );
          }

          setData(result);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load analytics."
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

  const maxReach =
    useMemo(
      () =>
        Math.max(
          1,
          ...(
            data?.trend ??
            []
          ).map(
            (row) =>
              row.reach
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

        Loading analytics...
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
          "Unable to load analytics."}
      </div>
    );
  }

  return (
    <div>
      {/* REFRESH */}

      <div className="flex justify-end">
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

          Refresh
        </Button>
      </div>

      {/* KPI CARDS */}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Reach
            </p>

            <Eye
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
            {fullNumber(
              data.summary.reach
            )}{" "}
            total
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Engagements
            </p>

            <Sparkles
              size={18}
              className="text-slate-400"
            />
          </div>

          <p className="mt-3 text-3xl font-bold">
            {compactNumber(
              data.summary
                .engagements
            )}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Likes, comments and
            interactions
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Engagement Rate
            </p>

            <TrendingUp
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
            Engagements ÷ reach
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Clicks
            </p>

            <MousePointerClick
              size={18}
              className="text-slate-400"
            />
          </div>

          <p className="mt-3 text-3xl font-bold">
            {compactNumber(
              data.summary.clicks
            )}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {fullNumber(
              data.summary.clicks
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
            Items with metrics
          </p>
        </div>
      </div>

      {/* TREND */}

      <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">
            Performance Trend
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Daily reach,
            engagements and clicks
            across accessible
            content.
          </p>
        </div>

        {data.trend.length ===
        0 ? (
          <div className="mt-8 rounded-xl bg-slate-50 p-10 text-center text-sm text-slate-500">
            No performance data
            available yet.
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto">
            <div className="flex min-w-[650px] items-end gap-4">
              {data.trend.map(
                (row) => {
                  const height =
                    Math.max(
                      8,
                      (
                        row.reach /
                        maxReach
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
                          row.reach
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
                          row.engagements
                        )}{" "}
                        engagements
                      </p>

                      <p className="text-[11px] text-slate-400">
                        {compactNumber(
                          row.clicks
                        )}{" "}
                        clicks
                      </p>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}
      </section>

      {/* TOP CONTENT */}

      <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">
            Content Performance
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Performance metrics
            tied directly to
            CreatorOps content and
            campaigns.
          </p>
        </div>

        {data.topContent.length ===
        0 ? (
          <div className="mt-8 rounded-xl bg-slate-50 p-10 text-center text-sm text-slate-500">
            No content metrics
            found.
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wider text-slate-400">
                  <th className="pb-3 font-semibold">
                    Content
                  </th>

                  <th className="pb-3 font-semibold">
                    Platform
                  </th>

                  <th className="pb-3 text-right font-semibold">
                    Reach
                  </th>

                  <th className="pb-3 text-right font-semibold">
                    Engagements
                  </th>

                  <th className="pb-3 text-right font-semibold">
                    Rate
                  </th>

                  <th className="pb-3 text-right font-semibold">
                    Clicks
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.topContent.map(
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
                      </td>

                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs">
                            {labelValue(
                              item.platform
                            )}
                          </span>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs">
                            {labelValue(
                              item.contentType
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 text-right font-medium">
                        {fullNumber(
                          item.reach
                        )}
                      </td>

                      <td className="py-4 text-right font-medium">
                        {fullNumber(
                          item.engagements
                        )}
                      </td>

                      <td className="py-4 text-right font-medium">
                        {item.engagementRate.toFixed(
                          1
                        )}
                        %
                      </td>

                      <td className="py-4 text-right font-medium">
                        {fullNumber(
                          item.clicks
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
    </div>
  );
}