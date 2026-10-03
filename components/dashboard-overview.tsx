"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Megaphone,
  RefreshCw,
  Send,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type Metrics = {
  activeCampaigns: number;
  totalCampaigns: number;
  totalContent: number;
  needsAction: number;
  publishedContent: number;
  unreadNotifications: number;
};

type Lifecycle = {
  draft: number;
  internal_review: number;
  changes_requested: number;
  client_review: number;
  approved: number;
  scheduled: number;
  published: number;
};

type ContentItem = {
  id: string;
  campaign_id: string;
  title: string;
  status: string;
  platform: string;
  content_type: string;
  publish_at: string | null;
  current_version: number;
  updated_at: string;
  campaign_name: string;
  client_name: string;
};

type Campaign = {
  id: string;
  name: string;
  status: string;
  client_name: string;
};

type DashboardData = {
  role: string;

  metrics: Metrics;

  lifecycle: Lifecycle;

  upcoming: ContentItem[];

  recentContent: ContentItem[];

  recentCampaigns: Campaign[];
};

function formatValue(
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

function statusClass(
  status: string
) {
  if (
    status === "published" ||
    status === "approved"
  ) {
    return "bg-green-100 text-green-700";
  }

  if (
    status ===
    "changes_requested"
  ) {
    return "bg-red-100 text-red-700";
  }

  if (
    status ===
    "client_review"
  ) {
    return "bg-amber-100 text-amber-700";
  }

  if (
    status ===
      "internal_review" ||
    status === "active"
  ) {
    return "bg-blue-100 text-blue-700";
  }

  if (
    status === "scheduled"
  ) {
    return "bg-purple-100 text-purple-700";
  }

  return "bg-slate-100 text-slate-700";
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "No date";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "No date";
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

export default function DashboardOverview() {
  const [
    data,
    setData,
  ] =
    useState<DashboardData | null>(
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

  const loadDashboard =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const response =
            await fetch(
              "/api/dashboard",
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
                "Unable to load dashboard."
            );
          }

          setData(result);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load dashboard."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2
          size={18}
          className="animate-spin"
        />

        Loading workspace data...
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
          "Unable to load dashboard."}
      </div>
    );
  }

  const lifecycleItems = [
    {
      label:
        "Draft",
      value:
        data.lifecycle.draft,
    },
    {
      label:
        "Internal Review",
      value:
        data.lifecycle
          .internal_review,
    },
    {
      label:
        "Changes Requested",
      value:
        data.lifecycle
          .changes_requested,
    },
    {
      label:
        "Client Review",
      value:
        data.lifecycle
          .client_review,
    },
    {
      label:
        "Approved",
      value:
        data.lifecycle.approved,
    },
    {
      label:
        "Scheduled",
      value:
        data.lifecycle.scheduled,
    },
    {
      label:
        "Published",
      value:
        data.lifecycle.published,
    },
  ];

  const maxLifecycle =
    Math.max(
      1,
      ...lifecycleItems.map(
        (item) =>
          item.value
      )
    );

  return (
    <div>
      {/* TOP TOOLBAR */}

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={
            loadDashboard
          }
        >
          <RefreshCw
            size={14}
            className="mr-2"
          />

          Refresh
        </Button>
      </div>

      {/* METRICS */}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Link
          href="/campaigns"
          className="rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Active Campaigns
            </p>

            <Megaphone
              size={18}
              className="text-slate-400"
            />
          </div>

          <p className="mt-3 text-3xl font-bold">
            {
              data.metrics
                .activeCampaigns
            }
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {
              data.metrics
                .totalCampaigns
            }{" "}
            total campaigns
          </p>
        </Link>

        <Link
          href="/content"
          className="rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Content Items
            </p>

            <FileText
              size={18}
              className="text-slate-400"
            />
          </div>

          <p className="mt-3 text-3xl font-bold">
            {
              data.metrics
                .totalContent
            }
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Accessible to you
          </p>
        </Link>

        <Link
          href="/approvals"
          className="rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Needs Your Action
            </p>

            <Clock3
              size={18}
              className="text-slate-400"
            />
          </div>

          <p className="mt-3 text-3xl font-bold">
            {
              data.metrics
                .needsAction
            }
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Workflow queue
          </p>
        </Link>

        <Link
          href="/content"
          className="rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Published
            </p>

            <CheckCircle2
              size={18}
              className="text-slate-400"
            />
          </div>

          <p className="mt-3 text-3xl font-bold">
            {
              data.metrics
                .publishedContent
            }
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Completed content
          </p>
        </Link>

        <Link
          href="/notifications"
          className="rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Notifications
            </p>

            <Bell
              size={18}
              className="text-slate-400"
            />
          </div>

          <p className="mt-3 text-3xl font-bold">
            {
              data.metrics
                .unreadNotifications
            }
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Unread updates
          </p>
        </Link>
      </div>

      {/* CONTENT PIPELINE + UPCOMING */}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        {/* PIPELINE */}

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold">
              Content Pipeline
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current content
              distribution across
              the approval lifecycle.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {lifecycleItems.map(
              (item) => {
                const width =
                  item.value === 0
                    ? 0
                    : Math.max(
                        5,
                        (
                          item.value /
                          maxLifecycle
                        ) *
                          100
                      );

                return (
                  <div
                    key={
                      item.label
                    }
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">
                        {
                          item.label
                        }
                      </span>

                      <span className="font-semibold">
                        {
                          item.value
                        }
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-black transition-all"
                        style={{
                          width:
                            `${width}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </section>

        {/* UPCOMING */}

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Upcoming Publishing
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Scheduled content
                coming up next.
              </p>
            </div>

            <CalendarClock
              size={20}
              className="text-slate-400"
            />
          </div>

          {data.upcoming.length ===
          0 ? (
            <div className="mt-8 rounded-xl bg-slate-50 p-6 text-center">
              <p className="text-sm font-medium">
                Nothing scheduled
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Scheduled content
                will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {data.upcoming.map(
                (item) => (
                  <div
                    key={
                      item.id
                    }
                    className="rounded-xl border p-4"
                  >
                    <p className="font-medium">
                      {
                        item.title
                      }
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {
                        item.client_name
                      }{" "}
                      —{" "}
                      {
                        item.campaign_name
                      }
                    </p>

                    <p className="mt-3 flex items-center gap-2 text-xs font-medium text-purple-700">
                      <Clock3
                        size={13}
                      />

                      {formatDate(
                        item.publish_at
                      )}
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>

      {/* RECENT CONTENT + CAMPAIGNS */}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* RECENT CONTENT */}

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Recent Content
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest activity in
                your accessible
                content.
              </p>
            </div>

            <Link
              href="/content"
              className="text-sm font-medium hover:underline"
            >
              View all
            </Link>
          </div>

          {data.recentContent
            .length === 0 ? (
            <div className="mt-6 rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
              No content yet.
            </div>
          ) : (
            <div className="mt-5 divide-y">
              {data.recentContent.map(
                (item) => (
                  <div
                    key={
                      item.id
                    }
                    className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {
                          item.title
                        }
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {
                          item.client_name
                        }{" "}
                        •{" "}
                        {
                          item.campaign_name
                        }
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                        {formatValue(
                          item.platform
                        )}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                          item.status
                        )}`}
                      >
                        {formatValue(
                          item.status
                        )}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* RECENT CAMPAIGNS */}

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Campaigns
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Recently updated
                campaigns.
              </p>
            </div>

            <Link
              href="/campaigns"
              className="text-sm font-medium hover:underline"
            >
              View all
            </Link>
          </div>

          {data.recentCampaigns
            .length === 0 ? (
            <div className="mt-6 rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
              No campaigns yet.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {data.recentCampaigns.map(
                (
                  campaign
                ) => (
                  <div
                    key={
                      campaign.id
                    }
                    className="rounded-xl border p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {
                            campaign.name
                          }
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {
                            campaign.client_name
                          }
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                          campaign.status
                        )}`}
                      >
                        {formatValue(
                          campaign.status
                        )}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>

      {/* QUICK ACTIONS */}

      <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          Quick Actions
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Jump directly to the main
          CreatorOps workflow areas.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/content"
            className="inline-flex h-9 items-center justify-center rounded-md border bg-white px-4 text-sm font-medium shadow-xs transition hover:bg-slate-50"
          >
            <FileText
              size={15}
              className="mr-2"
            />

            View Content
          </Link>

          <Link
            href="/approvals"
            className="inline-flex h-9 items-center justify-center rounded-md border bg-white px-4 text-sm font-medium shadow-xs transition hover:bg-slate-50"
          >
            <Send
              size={15}
              className="mr-2"
            />

            Approval Queue
          </Link>

          <Link
            href="/analytics"
            className="inline-flex h-9 items-center justify-center rounded-md border bg-white px-4 text-sm font-medium shadow-xs transition hover:bg-slate-50"
          >
            <TrendingUp
              size={15}
              className="mr-2"
            />

            Analytics
          </Link>
        </div>
      </section>
    </div>
  );
}