"use client";

import {
  useState,
  type FormEvent,
} from "react";

import {
  CheckCircle2,
  Clock3,
  Loader2,
  MessageSquareWarning,
  Send,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";

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

type WorkflowAction =
  | "submit"
  | "send_client"
  | "request_changes"
  | "approve"
  | "schedule"
  | "publish";

type Props = {
  contentId: string;
  status: ContentStatus;
  currentRole: AppRole;
  onComplete: () => Promise<void> | void;
};

export default function ContentWorkflowActions({
  contentId,
  status,
  currentRole,
  onComplete,
}: Props) {
  const [
    loadingAction,
    setLoadingAction,
  ] =
    useState<WorkflowAction | null>(
      null
    );

  const [
    showChangesBox,
    setShowChangesBox,
  ] =
    useState(false);

  const [
    changeComment,
    setChangeComment,
  ] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const isManager =
    currentRole === "admin" ||
    currentRole === "manager";

  async function runAction(
    action: WorkflowAction,
    comment?: string
  ) {
    setError("");
    setSuccess("");
    setLoadingAction(action);

    try {
      const response =
        await fetch(
          `/api/content/${contentId}/workflow`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                action,
                comment:
                  comment || null,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Workflow action failed."
        );
      }

      setSuccess(
        getSuccessMessage(action)
      );

      setShowChangesBox(false);
      setChangeComment("");

      await onComplete();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Workflow action failed.";

      setError(message);
    } finally {
      setLoadingAction(null);
    }
  }

  function getSuccessMessage(
    action: WorkflowAction
  ) {
    if (action === "submit") {
      return "Submitted for internal review.";
    }

    if (
      action === "send_client"
    ) {
      return "Sent to the client for review.";
    }

    if (
      action ===
      "request_changes"
    ) {
      return "Changes requested.";
    }

    if (action === "approve") {
      return "Content approved.";
    }

    if (action === "schedule") {
      return "Content scheduled.";
    }

    return "Content marked as published.";
  }

  async function handleChanges(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const comment =
      changeComment.trim();

    if (!comment) {
      setError(
        "Enter the changes you want the creator to make."
      );

      return;
    }

    await runAction(
      "request_changes",
      comment
    );
  }

  const showSubmit =
    (
      currentRole ===
        "creator" ||
      isManager
    ) &&
    (
      status === "draft" ||
      status ===
        "changes_requested"
    );

  const showInternalReview =
    isManager &&
    status ===
      "internal_review";

  const showClientReview =
    currentRole === "client" &&
    status ===
      "client_review";

  const showSchedule =
    isManager &&
    status === "approved";

  const showPublish =
    isManager &&
    status === "scheduled";

  const hasActions =
    showSubmit ||
    showInternalReview ||
    showClientReview ||
    showSchedule ||
    showPublish;

  if (!hasActions) {
    return null;
  }

  return (
    <div className="mt-5 border-t pt-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Workflow Actions
      </p>

      <div className="flex flex-wrap gap-2">
        {/* DRAFT / CHANGES REQUESTED */}

        {showSubmit && (
          <Button
            type="button"
            size="sm"
            onClick={() =>
              runAction("submit")
            }
            disabled={
              loadingAction !== null
            }
          >
            {loadingAction ===
            "submit" ? (
              <Loader2
                size={14}
                className="mr-2 animate-spin"
              />
            ) : (
              <Send
                size={14}
                className="mr-2"
              />
            )}

            Submit for Review
          </Button>
        )}

        {/* INTERNAL REVIEW */}

        {showInternalReview && (
          <>
            <Button
              type="button"
              size="sm"
              onClick={() =>
                runAction(
                  "send_client"
                )
              }
              disabled={
                loadingAction !==
                null
              }
            >
              {loadingAction ===
              "send_client" ? (
                <Loader2
                  size={14}
                  className="mr-2 animate-spin"
                />
              ) : (
                <Send
                  size={14}
                  className="mr-2"
                />
              )}

              Send to Client
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setError("");
                setSuccess("");
                setShowChangesBox(
                  true
                );
              }}
              disabled={
                loadingAction !==
                null
              }
            >
              <MessageSquareWarning
                size={14}
                className="mr-2"
              />

              Request Changes
            </Button>
          </>
        )}

        {/* CLIENT REVIEW */}

        {showClientReview && (
          <>
            <Button
              type="button"
              size="sm"
              onClick={() =>
                runAction(
                  "approve"
                )
              }
              disabled={
                loadingAction !==
                null
              }
            >
              {loadingAction ===
              "approve" ? (
                <Loader2
                  size={14}
                  className="mr-2 animate-spin"
                />
              ) : (
                <CheckCircle2
                  size={14}
                  className="mr-2"
                />
              )}

              Approve
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setError("");
                setSuccess("");
                setShowChangesBox(
                  true
                );
              }}
              disabled={
                loadingAction !==
                null
              }
            >
              <MessageSquareWarning
                size={14}
                className="mr-2"
              />

              Request Changes
            </Button>
          </>
        )}

        {/* APPROVED */}

        {showSchedule && (
          <Button
            type="button"
            size="sm"
            onClick={() =>
              runAction("schedule")
            }
            disabled={
              loadingAction !== null
            }
          >
            {loadingAction ===
            "schedule" ? (
              <Loader2
                size={14}
                className="mr-2 animate-spin"
              />
            ) : (
              <Clock3
                size={14}
                className="mr-2"
              />
            )}

            Schedule
          </Button>
        )}

        {/* SCHEDULED */}

        {showPublish && (
          <Button
            type="button"
            size="sm"
            onClick={() =>
              runAction("publish")
            }
            disabled={
              loadingAction !== null
            }
          >
            {loadingAction ===
            "publish" ? (
              <Loader2
                size={14}
                className="mr-2 animate-spin"
              />
            ) : (
              <Upload
                size={14}
                className="mr-2"
              />
            )}

            Mark Published
          </Button>
        )}
      </div>

      {/* REQUEST CHANGES BOX */}

      {showChangesBox && (
        <form
          onSubmit={handleChanges}
          className="mt-4 rounded-xl border bg-slate-50 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">
                Request Changes
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Explain exactly what
                needs to be changed.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowChangesBox(
                  false
                );
                setChangeComment("");
                setError("");
              }}
              className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-black"
            >
              <X size={16} />
            </button>
          </div>

          <textarea
            value={changeComment}
            onChange={(event) =>
              setChangeComment(
                event.target.value
              )
            }
            rows={3}
            placeholder="For example: Please shorten the opening shot and make the product name more prominent."
            className="mt-3 flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            required
          />

          <div className="mt-3 flex gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={
                loadingAction !== null
              }
            >
              {loadingAction ===
              "request_changes" ? (
                <Loader2
                  size={14}
                  className="mr-2 animate-spin"
                />
              ) : (
                <MessageSquareWarning
                  size={14}
                  className="mr-2"
                />
              )}

              Send Changes
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setShowChangesBox(
                  false
                );
                setChangeComment("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          {success}
        </div>
      )}
    </div>
  );
}