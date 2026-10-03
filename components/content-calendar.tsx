"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type ContentStatus =
  | "draft"
  | "internal_review"
  | "changes_requested"
  | "client_review"
  | "approved"
  | "scheduled"
  | "published"
  | "archived";

type ContentItem = {
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

type CampaignOption = {
  id: string;
  name: string;
  client_name: string;
};

type CalendarDay = {
  date: Date;
  inCurrentMonth: boolean;
};

const weekdayNames = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

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

function statusClasses(
  status: ContentStatus
) {
  if (status === "published") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "scheduled") {
    return "border-purple-200 bg-purple-50 text-purple-700";
  }

  if (status === "approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "client_review") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "internal_review") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "changes_requested") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function sameDay(
  first: Date,
  second: Date
) {
  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate()
  );
}

function buildCalendarDays(
  month: Date
): CalendarDay[] {
  const year =
    month.getFullYear();

  const monthIndex =
    month.getMonth();

  const firstDay =
    new Date(
      year,
      monthIndex,
      1
    );

  const lastDay =
    new Date(
      year,
      monthIndex + 1,
      0
    );

  const startOffset =
    firstDay.getDay();

  const totalCurrentDays =
    lastDay.getDate();

  const cells: CalendarDay[] =
    [];

  /*
   * Previous month's trailing days.
   */
  for (
    let index =
      startOffset - 1;
    index >= 0;
    index--
  ) {
    const date =
      new Date(
        year,
        monthIndex,
        -index
      );

    cells.push({
      date,
      inCurrentMonth:
        false,
    });
  }

  /*
   * Current month.
   */
  for (
    let day = 1;
    day <= totalCurrentDays;
    day++
  ) {
    cells.push({
      date:
        new Date(
          year,
          monthIndex,
          day
        ),

      inCurrentMonth:
        true,
    });
  }

  /*
   * Fill to a full 6-week calendar.
   */
  while (
    cells.length < 42
  ) {
    const lastCell =
      cells[
        cells.length - 1
      ];

    const nextDate =
      new Date(
        lastCell.date
      );

    nextDate.setDate(
      nextDate.getDate() +
        1
    );

    cells.push({
      date:
        nextDate,

      inCurrentMonth:
        false,
    });
  }

  return cells;
}

function formatPublishTime(
  value: string
) {
  const date =
    new Date(value);

  return new Intl.DateTimeFormat(
    "en",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

export default function ContentCalendar() {
  const [
    content,
    setContent,
  ] =
    useState<ContentItem[]>(
      []
    );

  const [
    campaigns,
    setCampaigns,
  ] =
    useState<CampaignOption[]>(
      []
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

  const [
    platformFilter,
    setPlatformFilter,
  ] =
    useState("all");

  const [
    campaignFilter,
    setCampaignFilter,
  ] =
    useState("all");

  const [
    currentMonth,
    setCurrentMonth,
  ] =
    useState(
      () => {
        const now =
          new Date();

        return new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        );
      }
    );

  const loadCalendar =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const response =
            await fetch(
              "/api/content",
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
                "Unable to load calendar."
            );
          }

          setContent(
            data.content ?? []
          );

          setCampaigns(
            data.campaigns ??
              []
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load calendar."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  const filteredContent =
    useMemo(() => {
      return content.filter(
        (item) => {
          const matchesPlatform =
            platformFilter ===
              "all" ||
            item.platform ===
              platformFilter;

          const matchesCampaign =
            campaignFilter ===
              "all" ||
            item.campaign_id ===
              campaignFilter;

          return (
            matchesPlatform &&
            matchesCampaign
          );
        }
      );
    }, [
      content,
      platformFilter,
      campaignFilter,
    ]);

  const scheduledContent =
    useMemo(
      () =>
        filteredContent.filter(
          (item) =>
            Boolean(
              item.publish_at
            )
        ),
      [filteredContent]
    );

  const unscheduledContent =
    useMemo(
      () =>
        filteredContent.filter(
          (item) =>
            !item.publish_at
        ),
      [filteredContent]
    );

  const calendarDays =
    useMemo(
      () =>
        buildCalendarDays(
          currentMonth
        ),
      [currentMonth]
    );

  const today =
    new Date();

  const monthLabel =
    new Intl.DateTimeFormat(
      "en",
      {
        month: "long",
        year: "numeric",
      }
    ).format(currentMonth);

  function previousMonth() {
    setCurrentMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() -
            1,
          1
        )
    );
  }

  function nextMonth() {
    setCurrentMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() +
            1,
          1
        )
    );
  }

  function goToday() {
    const now =
      new Date();

    setCurrentMonth(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      )
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[450px] items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2
          size={18}
          className="animate-spin"
        />

        Loading calendar...
      </div>
    );
  }

  return (
    <div>
      {/* TOOLBAR */}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={
              previousMonth
            }
          >
            <ChevronLeft
              size={15}
            />
          </Button>

          <div className="min-w-[180px] text-center">
            <p className="font-semibold">
              {monthLabel}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={
              nextMonth
            }
          >
            <ChevronRight
              size={15}
            />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={
              goToday
            }
          >
            Today
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={
              platformFilter
            }
            onChange={(event) =>
              setPlatformFilter(
                event.target.value
              )
            }
            className="h-9 rounded-md border border-input bg-white px-3 text-sm"
          >
            <option value="all">
              All platforms
            </option>

            <option value="instagram">
              Instagram
            </option>

            <option value="linkedin">
              LinkedIn
            </option>

            <option value="tiktok">
              TikTok
            </option>

            <option value="facebook">
              Facebook
            </option>

            <option value="youtube">
              YouTube
            </option>

            <option value="x">
              X
            </option>

            <option value="other">
              Other
            </option>
          </select>

          <select
            value={
              campaignFilter
            }
            onChange={(event) =>
              setCampaignFilter(
                event.target.value
              )
            }
            className="h-9 rounded-md border border-input bg-white px-3 text-sm"
          >
            <option value="all">
              All campaigns
            </option>

            {campaigns.map(
              (campaign) => (
                <option
                  key={
                    campaign.id
                  }
                  value={
                    campaign.id
                  }
                >
                  {
                    campaign.name
                  }
                </option>
              )
            )}
          </select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={
              loadCalendar
            }
          >
            <RefreshCw
              size={14}
              className="mr-2"
            />

            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* CALENDAR */}

      <section className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
        {/* WEEKDAY HEADER */}

        <div className="grid grid-cols-7 border-b bg-slate-50">
          {weekdayNames.map(
            (day) => (
              <div
                key={day}
                className="border-r px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 last:border-r-0"
              >
                {day}
              </div>
            )
          )}
        </div>

        {/* MONTH GRID */}

        <div className="grid grid-cols-7">
          {calendarDays.map(
            (
              calendarDay,
              index
            ) => {
              const dayItems =
                scheduledContent
                  .filter(
                    (item) =>
                      item.publish_at &&
                      sameDay(
                        new Date(
                          item.publish_at
                        ),
                        calendarDay.date
                      )
                  )
                  .sort(
                    (a, b) =>
                      new Date(
                        a.publish_at!
                      ).getTime() -
                      new Date(
                        b.publish_at!
                      ).getTime()
                  );

              const isToday =
                sameDay(
                  calendarDay.date,
                  today
                );

              return (
                <div
                  key={
                    `${calendarDay.date.toISOString()}-${index}`
                  }
                  className={`min-h-[145px] border-b border-r p-2 ${
                    !calendarDay.inCurrentMonth
                      ? "bg-slate-50/70"
                      : "bg-white"
                  }`}
                >
                  <div className="flex justify-end">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                        isToday
                          ? "bg-black text-white"
                          : calendarDay.inCurrentMonth
                            ? "text-slate-700"
                            : "text-slate-300"
                      }`}
                    >
                      {
                        calendarDay.date.getDate()
                      }
                    </span>
                  </div>

                  <div className="mt-1 space-y-1.5">
                    {dayItems
                      .slice(
                        0,
                        3
                      )
                      .map(
                        (item) => (
                          <div
                            key={
                              item.id
                            }
                            className={`rounded-lg border px-2 py-1.5 text-[11px] ${statusClasses(
                              item.status
                            )}`}
                            title={`${item.title} — ${item.client_name}`}
                          >
                            <p className="truncate font-semibold">
                              {
                                item.title
                              }
                            </p>

                            <p className="mt-0.5 flex items-center gap-1 opacity-80">
                              <Clock3
                                size={
                                  10
                                }
                              />

                              {formatPublishTime(
                                item.publish_at!
                              )}
                            </p>
                          </div>
                        )
                      )}

                    {dayItems.length >
                      3 && (
                      <p className="px-1 text-[11px] font-medium text-slate-500">
                        +
                        {dayItems.length -
                          3}{" "}
                        more
                      </p>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </section>

      {/* LEGEND */}

      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        {[
          [
            "Draft",
            "draft",
          ],
          [
            "Internal Review",
            "internal_review",
          ],
          [
            "Changes Requested",
            "changes_requested",
          ],
          [
            "Client Review",
            "client_review",
          ],
          [
            "Approved",
            "approved",
          ],
          [
            "Scheduled",
            "scheduled",
          ],
          [
            "Published",
            "published",
          ],
        ].map(
          ([
            label,
            status,
          ]) => (
            <span
              key={
                status
              }
              className={`rounded-full border px-2.5 py-1 ${statusClasses(
                status as ContentStatus
              )}`}
            >
              {label}
            </span>
          )
        )}
      </div>

      {/* UNSCHEDULED CONTENT */}

      <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              Unscheduled Content
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Content without a
              planned publish date.
            </p>
          </div>

          <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold">
            {
              unscheduledContent.length
            }
          </div>
        </div>

        {unscheduledContent.length ===
        0 ? (
          <div className="mt-6 rounded-xl bg-slate-50 p-8 text-center">
            <CalendarDays
              size={20}
              className="mx-auto text-slate-400"
            />

            <p className="mt-3 text-sm font-medium">
              Everything has a
              publishing date
            </p>
          </div>
        ) : (
          <div className="mt-5 divide-y">
            {unscheduledContent.map(
              (item) => (
                <div
                  key={
                    item.id
                  }
                  className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
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
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs">
                      {formatValue(
                        item.platform
                      )}
                    </span>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs ${statusClasses(
                        item.status
                      )}`}
                    >
                      {formatValue(
                        item.status
                      )}
                    </span>

                    <Link
                      href="/content"
                      className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium transition hover:bg-slate-50"
                    >
                      <FileText
                        size={13}
                        className="mr-1.5"
                      />

                      Manage
                    </Link>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}