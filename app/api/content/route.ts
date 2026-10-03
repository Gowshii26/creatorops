import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/auth/workspace";

type ContentStatus =
  | "draft"
  | "internal_review"
  | "changes_requested"
  | "client_review"
  | "approved"
  | "scheduled"
  | "published"
  | "archived";

type Platform =
  | "instagram"
  | "linkedin"
  | "tiktok"
  | "facebook"
  | "youtube"
  | "x"
  | "other";

type ContentType =
  | "post"
  | "reel"
  | "story"
  | "carousel"
  | "video"
  | "article"
  | "other";

type CreateContentBody = {
  campaignId?: string;
  title?: string;
  description?: string;
  caption?: string;
  hashtags?: string[];
  platform?: Platform;
  contentType?: ContentType;
  creatorId?: string | null;
  publishAt?: string | null;
};

function isManagerRole(role: string) {
  return (
    role === "admin" ||
    role === "manager"
  );
}

function validPlatform(
  value: string
): value is Platform {
  return [
    "instagram",
    "linkedin",
    "tiktok",
    "facebook",
    "youtube",
    "x",
    "other",
  ].includes(value);
}

function validContentType(
  value: string
): value is ContentType {
  return [
    "post",
    "reel",
    "story",
    "carousel",
    "video",
    "article",
    "other",
  ].includes(value);
}

/*
 * GET /api/content
 *
 * Returns:
 * - content items
 * - campaigns
 * - possible creators
 *
 * Supports:
 * ?search=pumpkin
 * ?status=draft
 * ?campaignId=<uuid>
 * ?platform=instagram
 */
export async function GET(
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
          status:
            workspace.status,
        }
      );
    }

    const supabase =
      await createClient();

    const url =
      new URL(request.url);

    const search =
      url.searchParams
        .get("search")
        ?.trim() ?? "";

    const status =
      url.searchParams
        .get("status")
        ?.trim() ?? "";

    const campaignId =
      url.searchParams
        .get("campaignId")
        ?.trim() ?? "";

    const platform =
      url.searchParams
        .get("platform")
        ?.trim() ?? "";

    /*
     * RLS automatically limits content
     * to campaigns this user may access.
     */
    let query =
      supabase
        .from("content_items")
        .select(
          `
          id,
          campaign_id,
          title,
          description,
          caption,
          hashtags,
          platform,
          content_type,
          status,
          creator_id,
          publish_at,
          current_version,
          created_by,
          created_at,
          updated_at
          `
        )
        .neq(
          "status",
          "archived"
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

    if (search) {
      query =
        query.ilike(
          "title",
          `%${search}%`
        );
    }

    if (status) {
      query =
        query.eq(
          "status",
          status
        );
    }

    if (campaignId) {
      query =
        query.eq(
          "campaign_id",
          campaignId
        );
    }

    if (platform) {
      query =
        query.eq(
          "platform",
          platform
        );
    }

    const {
      data: contentItems,
      error: contentError,
    } =
      await query;

    if (contentError) {
      throw contentError;
    }

    /*
     * Campaigns accessible to this user.
     */
    const {
      data: campaigns,
      error: campaignError,
    } =
      await supabase
        .from("campaigns")
        .select(
          `
          id,
          name,
          client_id,
          status
          `
        )
        .neq(
          "status",
          "archived"
        )
        .order(
          "name",
          {
            ascending: true,
          }
        );

    if (campaignError) {
      throw campaignError;
    }

    /*
     * Get client names for campaigns.
     */
    const clientIds =
      Array.from(
        new Set(
          (
            campaigns ?? []
          ).map(
            (campaign) =>
              campaign.client_id
          )
        )
      );

    let clientMap =
      new Map<string, string>();

    if (
      clientIds.length > 0
    ) {
      const {
        data: clients,
      } =
        await supabase
          .from("clients")
          .select(
            "id, name"
          )
          .in(
            "id",
            clientIds
          );

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
     * Creator options.
     */
    let creators: {
      id: string;
      fullName: string;
    }[] = [];

    if (
      isManagerRole(
        workspace.data.role
      )
    ) {
      const admin =
        createAdminClient();

      const {
        data: memberships,
      } =
        await admin
          .from(
            "organization_members"
          )
          .select(
            `
            profile_id,
            role,
            is_active
            `
          )
          .eq(
            "organization_id",
            workspace.data.organizationId
          )
          .eq(
            "is_active",
            true
          )
          .eq(
            "role",
            "creator"
          );

      const creatorIds =
        (
          memberships ?? []
        ).map(
          (membership) =>
            membership.profile_id
        );

      if (
        creatorIds.length > 0
      ) {
        const {
          data: profiles,
        } =
          await admin
            .from("profiles")
            .select(
              "id, full_name"
            )
            .in(
              "id",
              creatorIds
            );

        creators =
          (
            profiles ?? []
          ).map(
            (profile) => ({
              id:
                profile.id,

              fullName:
                profile.full_name ||
                "CreatorOps User",
            })
          );
      }
    } else if (
      workspace.data.role ===
      "creator"
    ) {
      const {
        data: profile,
      } =
        await supabase
          .from("profiles")
          .select(
            "id, full_name"
          )
          .eq(
            "id",
            workspace.data.userId
          )
          .maybeSingle();

      if (profile) {
        creators = [
          {
            id:
              profile.id,

            fullName:
              profile.full_name ||
              "CreatorOps User",
          },
        ];
      }
    }

    /*
     * Campaign names for display.
     */
    const campaignMap =
      new Map(
        (
          campaigns ?? []
        ).map(
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
     * Creator names for display.
     */
    const creatorNameMap =
      new Map(
        creators.map(
          (creator) => [
            creator.id,
            creator.fullName,
          ]
        )
      );

    const result =
      (
        contentItems ?? []
      ).map(
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

          creator_name:
            item.creator_id
              ? creatorNameMap.get(
                  item.creator_id
                ) ||
                "Assigned Creator"
              : null,
        })
      );

    const campaignOptions =
      (
        campaigns ?? []
      ).map(
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
      content:
        result,

      campaigns:
        campaignOptions,

      creators,
    });
  } catch (error) {
    console.error(
      "Content GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load content.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * POST /api/content
 */
export async function POST(
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
          status:
            workspace.status,
        }
      );
    }

    if (
      workspace.data.role ===
      "client"
    ) {
      return NextResponse.json(
        {
          error:
            "Client users cannot create content.",
        },
        {
          status: 403,
        }
      );
    }

    const body: CreateContentBody =
      await request.json();

    const title =
      body.title?.trim() ??
      "";

    const campaignId =
      body.campaignId
        ?.trim() ?? "";

    const description =
      body.description
        ?.trim() ||
      null;

    const caption =
      body.caption
        ?.trim() ||
      null;

    const platform =
      body.platform ??
      "instagram";

    const contentType =
      body.contentType ??
      "post";

    const publishAt =
      body.publishAt ||
      null;

    const hashtags =
      Array.isArray(
        body.hashtags
      )
        ? body.hashtags
            .map(
              (tag) =>
                tag
                  .trim()
                  .replace(
                    /^#/,
                    ""
                  )
            )
            .filter(Boolean)
        : [];

    if (
      title.length < 2
    ) {
      return NextResponse.json(
        {
          error:
            "Content title must contain at least 2 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (!campaignId) {
      return NextResponse.json(
        {
          error:
            "Select a campaign.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !validPlatform(
        platform
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid platform.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !validContentType(
        contentType
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid content type.",
        },
        {
          status: 400,
        }
      );
    }

    const admin =
      createAdminClient();

    /*
     * Verify campaign belongs to
     * this organization.
     */
    const {
      data: campaign,
      error: campaignError,
    } =
      await admin
        .from("campaigns")
        .select(
          `
          id,
          organization_id,
          name
          `
        )
        .eq(
          "id",
          campaignId
        )
        .eq(
          "organization_id",
          workspace.data.organizationId
        )
        .neq(
          "status",
          "archived"
        )
        .maybeSingle();

    if (
      campaignError ||
      !campaign
    ) {
      return NextResponse.json(
        {
          error:
            "Selected campaign is invalid.",
        },
        {
          status: 400,
        }
      );
    }

    let creatorId =
      body.creatorId
        ?.trim() ||
      null;

    /*
     * CREATOR:
     * Must create content for themselves.
     * Must also be assigned to campaign.
     */
    if (
      workspace.data.role ===
      "creator"
    ) {
      creatorId =
        workspace.data.userId;

      const {
        data:
          campaignMembership,
      } =
        await admin
          .from(
            "campaign_members"
          )
          .select(
            "id"
          )
          .eq(
            "campaign_id",
            campaignId
          )
          .eq(
            "profile_id",
            workspace.data.userId
          )
          .maybeSingle();

      if (
        !campaignMembership
      ) {
        return NextResponse.json(
          {
            error:
              "You are not assigned to this campaign.",
          },
          {
            status: 403,
          }
        );
      }
    }

    /*
     * ADMIN/MANAGER:
     * Validate selected creator.
     */
    if (
      creatorId &&
      isManagerRole(
        workspace.data.role
      )
    ) {
      const {
        data:
          creatorMembership,
      } =
        await admin
          .from(
            "organization_members"
          )
          .select(
            "profile_id"
          )
          .eq(
            "organization_id",
            workspace.data.organizationId
          )
          .eq(
            "profile_id",
            creatorId
          )
          .eq(
            "role",
            "creator"
          )
          .eq(
            "is_active",
            true
          )
          .maybeSingle();

      if (
        !creatorMembership
      ) {
        return NextResponse.json(
          {
            error:
              "Selected Creator is invalid.",
          },
          {
            status: 400,
          }
        );
      }
    }

    const {
      data: contentItem,
      error: insertError,
    } =
      await admin
        .from(
          "content_items"
        )
        .insert({
          campaign_id:
            campaignId,

          title,

          description,

          caption,

          hashtags,

          platform,

          content_type:
            contentType,

          status:
            "draft",

          creator_id:
            creatorId,

          publish_at:
            publishAt,

          current_version:
            1,

          created_by:
            workspace.data.userId,
        })
        .select(
          `
          id,
          campaign_id,
          title,
          description,
          caption,
          hashtags,
          platform,
          content_type,
          status,
          creator_id,
          publish_at,
          current_version,
          created_by,
          created_at,
          updated_at
          `
        )
        .single();

    if (insertError) {
      console.error(
        "Content INSERT error:",
        insertError
      );

      return NextResponse.json(
        {
          error:
            insertError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Initial Version 1 snapshot.
     */
    const {
      error: versionError,
    } =
      await admin
        .from(
          "content_versions"
        )
        .insert({
          content_id:
            contentItem.id,

          version_number:
            1,

          caption,

          notes:
            "Initial content version",

          created_by:
            workspace.data.userId,
        });

    if (versionError) {
      console.warn(
        "Initial version warning:",
        versionError.message
      );
    }

    /*
     * If a creator is assigned,
     * make sure they belong to
     * campaign_members.
     */
    if (creatorId) {
      const {
        error: memberError,
      } =
        await admin
          .from(
            "campaign_members"
          )
          .upsert(
            {
              campaign_id:
                campaignId,

              profile_id:
                creatorId,

              role:
                "creator",
            },
            {
              onConflict:
                "campaign_id,profile_id",
            }
          );

      if (memberError) {
        console.warn(
          "Creator campaign assignment warning:",
          memberError.message
        );
      }
    }

    await admin
      .from("audit_logs")
      .insert({
        organization_id:
          workspace.data.organizationId,

        actor_id:
          workspace.data.userId,

        action:
          "content.created",

        entity_type:
          "content",

        entity_id:
          contentItem.id,

        metadata: {
          title,
          campaign_id:
            campaignId,
          platform,
          content_type:
            contentType,
        },
      });

    return NextResponse.json(
      {
        content:
          contentItem,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Content POST error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to create content.",
      },
      {
        status: 500,
      }
    );
  }
}