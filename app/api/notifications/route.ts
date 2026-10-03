import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/auth/workspace";

/*
 * GET /api/notifications
 *
 * Returns notifications belonging only
 * to the currently authenticated user.
 */
export async function GET() {
  try {
    const workspace =
      await getWorkspaceContext();

    if (!workspace.data) {
      return NextResponse.json(
        {
          error:
            workspace.error ||
            "Workspace access denied.",
        },
        {
          status: workspace.status,
        }
      );
    }

    const admin =
      createAdminClient();

    const {
      data: notifications,
      error,
    } =
      await admin
        .from("notifications")
        .select("*")
        .eq(
          "recipient_id",
          workspace.data.userId
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(100);

    if (error) {
      throw error;
    }

    const unreadCount =
      (
        notifications ??
        []
      ).filter(
        (notification) =>
          !notification.is_read
      ).length;

    return NextResponse.json({
      notifications:
        notifications ?? [],
      unreadCount,
    });
  } catch (error) {
    console.error(
      "Notifications GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load notifications.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * PATCH /api/notifications
 *
 * Body:
 * {
 *   notificationId: "uuid"
 * }
 *
 * OR:
 *
 * {
 *   markAllRead: true
 * }
 */
export async function PATCH(
  request: Request
) {
  try {
    const workspace =
      await getWorkspaceContext();

    if (!workspace.data) {
      return NextResponse.json(
        {
          error:
            workspace.error ||
            "Workspace access denied.",
        },
        {
          status: workspace.status,
        }
      );
    }

    const body =
      await request.json();

    const admin =
      createAdminClient();

    /*
     * MARK EVERYTHING AS READ
     */
    if (
      body.markAllRead === true
    ) {
      const {
        error,
      } =
        await admin
          .from("notifications")
          .update({
            is_read: true,
            read_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "recipient_id",
            workspace.data.userId
          )
          .eq(
            "is_read",
            false
          );

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
      });
    }

    /*
     * MARK ONE NOTIFICATION AS READ
     */
    const notificationId =
      typeof body.notificationId ===
      "string"
        ? body.notificationId
        : "";

    if (!notificationId) {
      return NextResponse.json(
        {
          error:
            "Notification ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: notification,
      error,
    } =
      await admin
        .from("notifications")
        .update({
          is_read: true,
          read_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          notificationId
        )
        .eq(
          "recipient_id",
          workspace.data.userId
        )
        .select("*")
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!notification) {
      return NextResponse.json(
        {
          error:
            "Notification not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error(
      "Notifications PATCH error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to update notification.",
      },
      {
        status: 500,
      }
    );
  }
}