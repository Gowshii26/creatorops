"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bell,
  Check,
  CheckCheck,
  CircleAlert,
  Clock3,
  Loader2,
  Megaphone,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type NotificationRow = {
  id: string;
  recipient_id: string;
  type: string;
  title: string;
  message: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

function formatDate(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
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

function notificationIcon(
  type: string
) {
  if (
    type ===
    "changes_requested"
  ) {
    return (
      <CircleAlert
        size={18}
      />
    );
  }

  if (
    type ===
    "published"
  ) {
    return (
      <Megaphone
        size={18}
      />
    );
  }

  if (
    type ===
    "approval"
  ) {
    return (
      <Check
        size={18}
      />
    );
  }

  return (
    <Bell
      size={18}
    />
  );
}

function notificationColor(
  type: string
) {
  if (
    type ===
    "changes_requested"
  ) {
    return "bg-red-50 text-red-600";
  }

  if (
    type ===
    "approval"
  ) {
    return "bg-green-50 text-green-600";
  }

  if (
    type ===
    "published"
  ) {
    return "bg-purple-50 text-purple-600";
  }

  return "bg-blue-50 text-blue-600";
}

export default function NotificationCenter() {
  const [
    notifications,
    setNotifications,
  ] =
    useState<NotificationRow[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    updating,
    setUpdating,
  ] =
    useState(false);

  const [
    filter,
    setFilter,
  ] =
    useState<
      "all" | "unread"
    >("all");

  const [
    error,
    setError,
  ] =
    useState("");

  const loadNotifications =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const response =
            await fetch(
              "/api/notifications",
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
                "Unable to load notifications."
            );
          }

          setNotifications(
            data.notifications ??
              []
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load notifications."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.is_read
    ).length;

  const visibleNotifications =
    useMemo(() => {
      if (
        filter === "unread"
      ) {
        return notifications.filter(
          (notification) =>
            !notification.is_read
        );
      }

      return notifications;
    }, [
      notifications,
      filter,
    ]);

  async function markRead(
    notificationId: string
  ) {
    try {
      const response =
        await fetch(
          "/api/notifications",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                notificationId,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to update notification."
        );
      }

      setNotifications(
        (current) =>
          current.map(
            (notification) =>
              notification.id ===
              notificationId
                ? {
                    ...notification,
                    is_read:
                      true,
                    read_at:
                      new Date()
                        .toISOString(),
                  }
                : notification
          )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update notification."
      );
    }
  }

  async function markAllRead() {
    setUpdating(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/notifications",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                markAllRead:
                  true,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to mark notifications as read."
        );
      }

      const now =
        new Date()
          .toISOString();

      setNotifications(
        (current) =>
          current.map(
            (notification) => ({
              ...notification,
              is_read: true,
              read_at:
                notification.read_at ??
                now,
            })
          )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to mark notifications as read."
      );
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div>
      {/* SUMMARY */}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Notifications
          </p>

          <p className="mt-2 text-3xl font-bold">
            {
              notifications.length
            }
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Unread
          </p>

          <p className="mt-2 text-3xl font-bold">
            {unreadCount}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Read
          </p>

          <p className="mt-2 text-3xl font-bold">
            {notifications.length -
              unreadCount}
          </p>
        </div>
      </div>

      {/* CONTROLS */}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={
              filter === "all"
                ? "default"
                : "outline"
            }
            onClick={() =>
              setFilter("all")
            }
          >
            All
          </Button>

          <Button
            type="button"
            size="sm"
            variant={
              filter ===
              "unread"
                ? "default"
                : "outline"
            }
            onClick={() =>
              setFilter(
                "unread"
              )
            }
          >
            Unread
            {unreadCount >
              0 && (
              <span className="ml-2 rounded-full bg-white/20 px-1.5 text-xs">
                {
                  unreadCount
                }
              </span>
            )}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={
              loadNotifications
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

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={
              markAllRead
            }
            disabled={
              updating ||
              unreadCount === 0
            }
          >
            {updating ? (
              <Loader2
                size={14}
                className="mr-2 animate-spin"
              />
            ) : (
              <CheckCheck
                size={14}
                className="mr-2"
              />
            )}

            Mark All Read
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* LIST */}

      <section className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border bg-white p-16 text-sm text-slate-500">
            <Loader2
              size={18}
              className="animate-spin"
            />

            Loading notifications...
          </div>
        ) : visibleNotifications.length ===
          0 ? (
          <div className="rounded-2xl border bg-white p-16 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Bell
                size={20}
              />
            </div>

            <h2 className="mt-4 font-semibold">
              No notifications
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filter ===
              "unread"
                ? "You have no unread notifications."
                : "Workflow notifications will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleNotifications.map(
              (notification) => (
                <article
                  key={
                    notification.id
                  }
                  className={`rounded-2xl border p-5 shadow-sm ${
                    notification.is_read
                      ? "bg-white"
                      : "border-blue-200 bg-blue-50/30"
                  }`}
                >
                  <div className="flex gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${notificationColor(
                        notification.type
                      )}`}
                    >
                      {notificationIcon(
                        notification.type
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {
                                notification.title
                              }
                            </h3>

                            {!notification.is_read && (
                              <span className="h-2 w-2 rounded-full bg-blue-600" />
                            )}
                          </div>

                          {notification.message && (
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              {
                                notification.message
                              }
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-1 text-xs text-slate-400">
                          <Clock3
                            size={
                              13
                            }
                          />

                          {formatDate(
                            notification.created_at
                          )}
                        </div>
                      </div>

                      {!notification.is_read && (
                        <div className="mt-3">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              markRead(
                                notification.id
                              )
                            }
                          >
                            <Check
                              size={
                                14
                              }
                              className="mr-2"
                            />

                            Mark as Read
                          </Button>
                        </div>
                      )}
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