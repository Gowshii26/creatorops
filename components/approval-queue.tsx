"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Megaphone,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import ContentWorkflowActions from "@/components/content-workflow-actions";

type AppRole =
  | "admin"
  | "manager"
  | "creator"
  | "client";

type ContentStatus =
  | "draft"
  | "internal_review"
  | "changes_requested"
  | "client_review"
  | "approved"
  | "scheduled"
  | "published"
  | "archived";

type ContentRow = {
  id: string;
  campaign_id: string;
  title: string;
  description: string | null;
  caption: string | null;
  hashtags: string[];
  platform: string;
  content_type: string;
  status: ContentStatus;
  creator_id: string | null;
  publish_at: string | null;
  current_version: number;

  campaign_name: string;
  client_name: string;
  creator_name: string | null;
};

function formatStatus(
  status: ContentStatus
) {
  if (status === "internal_review") {
    return "Internal Review";
  }

  if (status === "client_review") {
    return "Client Review";
  }

  if (status === "changes_requested") {
    return "Changes Requested";
  }

  if (status === "approved") {
    return "Approved";
  }

  if (status === "scheduled") {
    return "Scheduled";
  }

  if (status === "published") {
    return "Published";
  }

  if (status === "draft") {
    return "Draft";
  }

  return "Archived";
}

function statusClass(
  status: ContentStatus
) {
  if (status === "internal_review") {
    return "bg-blue-100 text-blue-700";
  }

  if (status === "client_review") {
    return "bg-amber-100 text-amber-700";
  }

  if (status === "changes_requested") {
    return "bg-red-100 text-red-700";
  }

  if (status === "approved") {
    return "bg-green-100 text-green-700";
  }

  if (status === "scheduled") {
    return "bg-purple-100 text-purple-700";
  }

  if (status === "published") {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-slate-100 text-slate-700";
}

function formatValue(
  value: string
) {
  return value
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}

export default function ApprovalQueue({
  currentRole,
}: {
  currentRole: AppRole;
}) {
  const [
    content,
    setContent,
  ] =
    useState<ContentRow[]>([]);

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

  const [
    search,
    setSearch,
  ] =
    useState("");

  const loadContent =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const response =
            await fetch(
              "/api/content",
              {
                method: "GET",
                cache: "no-store",
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.error ||
                "Unable to load approval queue."
            );
          }

          setContent(
            data.content ?? []
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load approval queue."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  /*
   * Decide which items require action
   * from the currently signed-in role.
   */
  const actionItems =
    useMemo(() => {
      let relevant =
        content;

      if (
        currentRole ===
          "admin" ||
        currentRole ===
          "manager"
      ) {
        relevant =
          content.filter(
            (item) =>
              item.status ===
                "internal_review" ||
              item.status ===
                "approved" ||
              item.status ===
                "scheduled"
          );
      }

      if (
        currentRole ===
        "client"
      ) {
        relevant =
          content.filter(
            (item) =>
              item.status ===
              "client_review"
          );
      }

      if (
        currentRole ===
        "creator"
      ) {
        relevant =
          content.filter(
            (item) =>
              item.status ===
                "changes_requested" ||
              item.status ===
                "draft"
          );
      }

      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return relevant;
      }

      return relevant.filter(
        (item) =>
          item.title
            .toLowerCase()
            .includes(term) ||
          item.campaign_name
            .toLowerCase()
            .includes(term) ||
          item.client_name
            .toLowerCase()
            .includes(term)
      );
    }, [
      content,
      currentRole,
      search,
    ]);

  const waitingCount =
    actionItems.length;

  const internalCount =
    content.filter(
      (item) =>
        item.status ===
        "internal_review"
    ).length;

  const clientCount =
    content.filter(
      (item) =>
        item.status ===
        "client_review"
    ).length;

  const approvedCount =
    content.filter(
      (item) =>
        item.status ===
        "approved"
    ).length;

  return (
    <div>
      {/* SUMMARY */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Needs Your Action
          </p>

          <p className="mt-2 text-3xl font-bold">
            {waitingCount}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Internal Review
          </p>

          <p className="mt-2 text-3xl font-bold">
            {internalCount}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Client Review
          </p>

          <p className="mt-2 text-3xl font-bold">
            {clientCount}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Approved
          </p>

          <p className="mt-2 text-3xl font-bold">
            {approvedCount}
          </p>
        </div>
      </div>

      {/* TOOLBAR */}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <Input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search approvals..."
            className="pl-10"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={
            loadContent
          }
          disabled={
            loading
          }
        >
          {loading ? (
            <Loader2
              size={15}
              className="mr-2 animate-spin"
            />
          ) : (
            <RefreshCw
              size={15}
              className="mr-2"
            />
          )}

          Refresh
        </Button>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* QUEUE */}

      <section className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border bg-white p-16 text-sm text-slate-500">
            <Loader2
              size={18}
              className="animate-spin"
            />

            Loading approval queue...
          </div>
        ) : actionItems.length ===
          0 ? (
          <div className="rounded-2xl border bg-white p-16 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
              <CheckCircle2
                size={22}
              />
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              You're all caught up
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              There are no workflow
              items requiring your
              action.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {actionItems.map(
              (item) => (
                <article
                  key={
                    item.id
                  }
                  className="rounded-2xl border bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                            item.status
                          )}`}
                        >
                          {formatStatus(
                            item.status
                          )}
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                          {formatValue(
                            item.platform
                          )}
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                          {formatValue(
                            item.content_type
                          )}
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                          Version{" "}
                          {
                            item.current_version
                          }
                        </span>
                      </div>

                      <h2 className="mt-4 text-xl font-semibold">
                        {
                          item.title
                        }
                      </h2>

                      <div className="mt-3 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:gap-5">
                        <span className="flex items-center gap-2">
                          <Megaphone
                            size={15}
                          />

                          {
                            item.client_name
                          }{" "}
                          —{" "}
                          {
                            item.campaign_name
                          }
                        </span>

                        <span className="flex items-center gap-2">
                          <UserRound
                            size={15}
                          />

                          {item.creator_name ??
                            "Unassigned"}
                        </span>
                      </div>

                      {item.caption && (
                        <div className="mt-5 rounded-xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Caption
                          </p>

                          <p className="mt-2 text-sm leading-6 text-slate-700">
                            {
                              item.caption
                            }
                          </p>
                        </div>
                      )}

                      {item.description && (
                        <div className="mt-4 flex gap-3 text-sm text-slate-600">
                          <FileText
                            size={16}
                            className="mt-0.5 shrink-0"
                          />

                          <p>
                            {
                              item.description
                            }
                          </p>
                        </div>
                      )}

                      {item.publish_at && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                          <Clock3
                            size={15}
                          />

                          Planned publishing:{" "}
                          {new Date(
                            item.publish_at
                          ).toLocaleString()}
                        </div>
                      )}
                    </div>

                    <div className="w-full lg:w-80 lg:border-l lg:pl-6">
                      <ContentWorkflowActions
                        contentId={
                          item.id
                        }
                        status={
                          item.status
                        }
                        currentRole={
                          currentRole
                        }
                        onComplete={
                          loadContent
                        }
                      />
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}