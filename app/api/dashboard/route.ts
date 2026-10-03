import { NextResponse } from "next/server";

import { getWorkspaceContext } from "@/lib/auth/workspace";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ContentStatus =
  | "draft"
  | "internal_review"
  | "changes_requested"
  | "client_review"
  | "approved"
  | "scheduled"
  | "published"
  | "archived";

function needsAction(
  role: string,
  status: ContentStatus
) {
  if (
    role === "admin" ||
    role === "manager"
  ) {
    return (
      status === "internal_review" ||
      status === "approved" ||
      status === "scheduled"
    );
  }

  if (role === "client") {
    return status === "client_review";
  }

  if (role === "creator") {
    return (
      status === "draft" ||
      status === "changes_requested"
    );
  }

  return false;
}

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

    /*
     * Use the authenticated Supabase client here.
     *
     * RLS decides which campaigns/content this
     * specific user is allowed to see.
     */
    const supabase =
      await createClient();

    const [
      campaignResult,
      contentResult,
    ] =
      await Promise.all([
        supabase
          .from("campaigns")
          .select(
            `
            id,
            client_id,
            name,
            status,
            start_date,
            end_date,
            created_at,
            updated_at
            `
          )
          .neq(
            "status",
            "archived"
          )
          .order(
            "updated_at",
            {
              ascending: false,
            }
          ),

        supabase
          .from("content_items")
          .select(
            `
            id,
            campaign_id,
            title,
            status,
            platform,
            content_type,
            publish_at,
            creator_id,
            current_version,
            created_at,
            updated_at
            `
          )
          .neq(
            "status",
            "archived"
          )
          .order(
            "updated_at",
            {
              ascending: false,
            }
          ),
      ]);

    if (campaignResult.error) {
      throw campaignResult.error;
    }

    if (contentResult.error) {
      throw contentResult.error;
    }

    const campaigns =
      campaignResult.data ?? [];

    const content =
      contentResult.data ?? [];

    /*
     * Client IDs are derived ONLY from campaigns
     * that RLS already allowed this user to see.
     */
    const clientIds =
      Array.from(
        new Set(
          campaigns.map(
            (campaign) =>
              campaign.client_id
          )
        )
      );

    const admin =
      createAdminClient();

    let clientMap =
      new Map<string, string>();

    if (clientIds.length > 0) {
      const {
        data: clients,
        error: clientError,
      } =
        await admin
          .from("clients")
          .select(
            "id, name"
          )
          .in(
            "id",
            clientIds
          );

      if (clientError) {
        console.warn(
          "Dashboard client lookup warning:",
          clientError.message
        );
      }

      clientMap =
        new Map(
          (
            clients ?? []
          ).map(
            (client) => [
              client.id,
              client.name,
            ]
          )
        );
    }

    /*
     * Notifications always belong to the
     * currently logged-in user only.
     */
    const {
      data: notificationRows,
      error: notificationError,
    } =
      await admin
        .from("notifications")
        .select(
          "id, is_read"
        )
        .eq(
          "recipient_id",
          workspace.data.userId
        );

    if (notificationError) {
      console.warn(
        "Dashboard notification warning:",
        notificationError.message
      );
    }

    const unreadNotifications =
      (
        notificationRows ?? []
      ).filter(
        (notification) =>
          !notification.is_read
      ).length;

    /*
     * Campaign lookup for readable names.
     */
    const campaignMap =
      new Map(
        campaigns.map(
          (campaign) => [
            campaign.id,
            {
              name:
                campaign.name,

              clientName:
                clientMap.get(
                  campaign.client_id
                ) ||
                "Unknown Client",
            },
          ]
        )
      );

    /*
     * Core dashboard metrics.
     */
    const activeCampaigns =
      campaigns.filter(
        (campaign) =>
          campaign.status ===
          "active"
      ).length;

    const publishedContent =
      content.filter(
        (item) =>
          item.status ===
          "published"
      ).length;

    const needsActionCount =
      content.filter(
        (item) =>
          needsAction(
            workspace.data.role,
            item.status as ContentStatus
          )
      ).length;

    const lifecycle = {
      draft: 0,
      internal_review: 0,
      changes_requested: 0,
      client_review: 0,
      approved: 0,
      scheduled: 0,
      published: 0,
    };

    for (const item of content) {
      if (
        item.status in lifecycle
      ) {
        const key =
          item.status as
            keyof typeof lifecycle;

        lifecycle[key] += 1;
      }
    }

    /*
     * Upcoming scheduled content.
     */
    const now =
      new Date();

    const upcoming =
      content
        .filter(
          (item) =>
            item.status ===
              "scheduled" &&
            item.publish_at &&
            new Date(
              item.publish_at
            ).getTime() >=
              now.getTime()
        )
        .sort(
          (a, b) =>
            new Date(
              a.publish_at!
            ).getTime() -
            new Date(
              b.publish_at!
            ).getTime()
        )
        .slice(
          0,
          5
        )
        .map(
          (item) => ({
            ...item,

            campaign_name:
              campaignMap.get(
                item.campaign_id
              )?.name ||
              "Unknown Campaign",

            client_name:
              campaignMap.get(
                item.campaign_id
              )?.clientName ||
              "Unknown Client",
          })
        );

    /*
     * Most recently modified content.
     */
    const recentContent =
      content
        .slice(
          0,
          6
        )
        .map(
          (item) => ({
            ...item,

            campaign_name:
              campaignMap.get(
                item.campaign_id
              )?.name ||
              "Unknown Campaign",

            client_name:
              campaignMap.get(
                item.campaign_id
              )?.clientName ||
              "Unknown Client",
          })
        );

    const recentCampaigns =
      campaigns
        .slice(
          0,
          5
        )
        .map(
          (campaign) => ({
            ...campaign,

            client_name:
              clientMap.get(
                campaign.client_id
              ) ||
              "Unknown Client",
          })
        );

    return NextResponse.json({
      role:
        workspace.data.role,

      metrics: {
        activeCampaigns,
        totalCampaigns:
          campaigns.length,
        totalContent:
          content.length,
        needsAction:
          needsActionCount,
        publishedContent,
        unreadNotifications,
      },

      lifecycle,

      upcoming,

      recentContent,

      recentCampaigns,
    });
  } catch (error) {
    console.error(
      "Dashboard GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load dashboard.",
      },
      {
        status: 500,
      }
    );
  }
}