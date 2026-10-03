"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  FileText,
  Filter,
  ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuditEvent = {
  id: string;
  organization_id: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata:
    | Record<
        string,
        unknown
      >
    | null;
  created_at: string;
  actor_name: string;
  actor_role: string | null;
};

type AuditSummary = {
  total: number;
  today: number;
  actors: number;
  actionTypes: number;
};

function formatValue(
  value:
    | string
    | null
) {
  if (!value) {
    return "—";
  }

  return value
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
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
      second: "2-digit",
    }
  ).format(date);
}

function formatRole(
  role: string | null
) {
  if (!role) {
    return "System";
  }

  if (
    role === "admin"
  ) {
    return "Administrator";
  }

  if (
    role === "manager"
  ) {
    return "Manager";
  }

  if (
    role === "creator"
  ) {
    return "Creator";
  }

  if (
    role === "client"
  ) {
    return "Client";
  }

  return formatValue(role);
}

function actionDescription(
  event: AuditEvent
) {
  const metadata =
    event.metadata ?? {};

  const fileName =
    typeof metadata.file_name ===
    "string"
      ? metadata.file_name
      : null;

  const reportName =
    typeof metadata.report_name ===
    "string"
      ? metadata.report_name
      : null;

  const title =
    typeof metadata.title ===
    "string"
      ? metadata.title
      : null;

  if (
    event.action ===
    "media_uploaded"
  ) {
    return fileName
      ? `Uploaded ${fileName}`
      : "Uploaded a media asset";
  }

  if (
    event.action ===
    "media_deleted"
  ) {
    return fileName
      ? `Deleted ${fileName}`
      : "Deleted a media asset";
  }

  if (
    event.action ===
    "report_generated"
  ) {
    return reportName
      ? `Generated ${reportName}`
      : "Generated a campaign report";
  }

  if (title) {
    return `${formatValue(
      event.action
    )}: ${title}`;
  }

  return formatValue(
    event.action
  );
}

function actionStyles(
  action: string
) {
  if (
    action.includes(
      "deleted"
    ) ||
    action.includes(
      "archived"
    )
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (
    action.includes(
      "approved"
    ) ||
    action.includes(
      "published"
    )
  ) {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (
    action.includes(
      "uploaded"
    ) ||
    action.includes(
      "created"
    )
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (
    action.includes(
      "report"
    )
  ) {
    return "border-purple-200 bg-purple-50 text-purple-700";
  }

  if (
    action.includes(
      "changes"
    )
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function EntityIcon({
  type,
}: {
  type: string | null;
}) {
  if (
    type ===
    "media_asset"
  ) {
    return (
      <ImageIcon
        size={17}
      />
    );
  }

  if (
    type ===
      "content" ||
    type ===
      "content_item" ||
    type ===
      "campaign"
  ) {
    return (
      <FileText
        size={17}
      />
    );
  }

  return (
    <Activity
      size={17}
    />
  );
}

function metadataEntries(
  metadata:
    | Record<
        string,
        unknown
      >
    | null
) {
  if (!metadata) {
    return [];
  }

  return Object.entries(
    metadata
  ).filter(
    ([, value]) =>
      value !== null &&
      value !==
        undefined &&
      typeof value !==
        "object"
  );
}

export default function AuditTrail() {
  const [
    audit,
    setAudit,
  ] =
    useState<
      AuditEvent[]
    >([]);

  const [
    summary,
    setSummary,
  ] =
    useState<AuditSummary>({
      total: 0,
      today: 0,
      actors: 0,
      actionTypes: 0,
    });

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

  const [
    actionFilter,
    setActionFilter,
  ] =
    useState("all");

  const [
    entityFilter,
    setEntityFilter,
  ] =
    useState("all");

  const [
    expanded,
    setExpanded,
  ] =
    useState<
      string | null
    >(null);

  const loadAudit =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const response =
            await fetch(
              "/api/audit",
              {
                cache:
                  "no-store",
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.error ||
                "Unable to load audit trail."
            );
          }

          setAudit(
            data.audit ?? []
          );

          setSummary(
            data.summary ?? {
              total: 0,
              today: 0,
              actors: 0,
              actionTypes: 0,
            }
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load audit trail."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    loadAudit();
  }, [loadAudit]);

  const actionOptions =
    useMemo(
      () =>
        Array.from(
          new Set(
            audit.map(
              (event) =>
                event.action
            )
          )
        ).sort(),
      [audit]
    );

  const entityOptions =
    useMemo(
      () =>
        Array.from(
          new Set(
            audit
              .map(
                (event) =>
                  event.entity_type
              )
              .filter(
                (
                  value
                ): value is string =>
                  Boolean(value)
              )
          )
        ).sort(),
      [audit]
    );

  const visibleAudit =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      return audit.filter(
        (event) => {
          const description =
            actionDescription(
              event
            ).toLowerCase();

          const matchesSearch =
            !term ||
            event.actor_name
              .toLowerCase()
              .includes(term) ||
            event.action
              .toLowerCase()
              .includes(term) ||
            description.includes(
              term
            ) ||
            (
              event.entity_type ??
              ""
            )
              .toLowerCase()
              .includes(term) ||
            (
              event.entity_id ??
              ""
            )
              .toLowerCase()
              .includes(term);

          const matchesAction =
            actionFilter ===
              "all" ||
            event.action ===
              actionFilter;

          const matchesEntity =
            entityFilter ===
              "all" ||
            event.entity_type ===
              entityFilter;

          return (
            matchesSearch &&
            matchesAction &&
            matchesEntity
          );
        }
      );
    }, [
      audit,
      search,
      actionFilter,
      entityFilter,
    ]);

  return (
    <div>
      {/* SUMMARY */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Audit Events
          </p>

          <p className="mt-2 text-3xl font-bold">
            {
              summary.total
            }
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Today
          </p>

          <p className="mt-2 text-3xl font-bold">
            {
              summary.today
            }
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Active Actors
          </p>

          <p className="mt-2 text-3xl font-bold">
            {
              summary.actors
            }
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Action Types
          </p>

          <p className="mt-2 text-3xl font-bold">
            {
              summary.actionTypes
            }
          </p>
        </div>
      </div>

      {/* FILTERS */}

      <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row">
          <div className="relative w-full max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <Input
              value={
                search
              }
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search audit events..."
              className="pl-9"
            />
          </div>

          <div className="relative">
            <Filter
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
              value={
                actionFilter
              }
              onChange={(event) =>
                setActionFilter(
                  event.target.value
                )
              }
              className="h-9 rounded-md border border-input bg-white pl-9 pr-3 text-sm"
            >
              <option value="all">
                All actions
              </option>

              {actionOptions.map(
                (action) => (
                  <option
                    key={
                      action
                    }
                    value={
                      action
                    }
                  >
                    {formatValue(
                      action
                    )}
                  </option>
                )
              )}
            </select>
          </div>

          <select
            value={
              entityFilter
            }
            onChange={(event) =>
              setEntityFilter(
                event.target.value
              )
            }
            className="h-9 rounded-md border border-input bg-white px-3 text-sm"
          >
            <option value="all">
              All entities
            </option>

            {entityOptions.map(
              (entity) => (
                <option
                  key={
                    entity
                  }
                  value={
                    entity
                  }
                >
                  {formatValue(
                    entity
                  )}
                </option>
              )
            )}
          </select>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={
            loadAudit
          }
          disabled={
            loading
          }
        >
          <RefreshCw
            size={14}
            className={
              loading
                ? "mr-2 animate-spin"
                : "mr-2"
            }
          />

          Refresh
        </Button>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* EVENTS */}

      <section className="mt-6">
        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center gap-2 rounded-2xl border bg-white text-sm text-slate-500">
            <Loader2
              size={18}
              className="animate-spin"
            />

            Loading audit trail...
          </div>
        ) : visibleAudit.length ===
          0 ? (
          <div className="rounded-2xl border bg-white p-16 text-center shadow-sm">
            <ShieldCheck
              size={28}
              className="mx-auto text-slate-400"
            />

            <h3 className="mt-4 font-semibold">
              No audit events found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              CreatorOps activity
              will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="divide-y">
              {visibleAudit.map(
                (event) => {
                  const metadata =
                    metadataEntries(
                      event.metadata
                    );

                  const isExpanded =
                    expanded ===
                    event.id;

                  return (
                    <div
                      key={
                        event.id
                      }
                      className="p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                            <EntityIcon
                              type={
                                event.entity_type
                              }
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${actionStyles(
                                  event.action
                                )}`}
                              >
                                {formatValue(
                                  event.action
                                )}
                              </span>

                              {event.entity_type && (
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                                  {formatValue(
                                    event.entity_type
                                  )}
                                </span>
                              )}
                            </div>

                            <p className="mt-3 font-medium text-slate-900">
                              {actionDescription(
                                event
                              )}
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                              <span className="flex items-center gap-1.5">
                                <UserRound
                                  size={
                                    13
                                  }
                                />

                                {
                                  event.actor_name
                                }
                              </span>

                              <span>
                                {formatRole(
                                  event.actor_role
                                )}
                              </span>

                              <span>
                                {formatDateTime(
                                  event.created_at
                                )}
                              </span>
                            </div>

                            {event.entity_id && (
                              <p className="mt-2 truncate font-mono text-[11px] text-slate-400">
                                ID:{" "}
                                {
                                  event.entity_id
                                }
                              </p>
                            )}
                          </div>
                        </div>

                        {metadata.length >
                          0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setExpanded(
                                isExpanded
                                  ? null
                                  : event.id
                              )
                            }
                          >
                            {isExpanded
                              ? "Hide Details"
                              : "View Details"}
                          </Button>
                        )}
                      </div>

                      {isExpanded &&
                        metadata.length >
                          0 && (
                          <div className="mt-4 rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                              Event Metadata
                            </p>

                            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                              {metadata.map(
                                ([
                                  key,
                                  value,
                                ]) => (
                                  <div
                                    key={
                                      key
                                    }
                                  >
                                    <dt className="text-xs text-slate-400">
                                      {formatValue(
                                        key
                                      )}
                                    </dt>

                                    <dd className="mt-1 break-all text-sm font-medium text-slate-700">
                                      {String(
                                        value
                                      )}
                                    </dd>
                                  </div>
                                )
                              )}
                            </dl>
                          </div>
                        )}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}
      </section>

      <p className="mt-4 text-xs text-slate-400">
        Showing the latest{" "}
        {
          visibleAudit.length
        }{" "}
        matching events. CreatorOps
        retains the underlying audit
        records in PostgreSQL.
      </p>
    </div>
  );
}