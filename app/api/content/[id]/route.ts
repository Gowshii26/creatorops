import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/auth/workspace";

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

type UpdateContentBody = {
  title?: string;
  description?: string;
  caption?: string;
  hashtags?: string[];
  platform?: Platform;
  contentType?: ContentType;
  creatorId?: string | null;
  publishAt?: string | null;
};

function isManagerRole(
  role: string
) {
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
 * PATCH /api/content/:id
 */
export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
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
            "Client users cannot edit content.",
        },
        {
          status: 403,
        }
      );
    }

    const { id } =
      await context.params;

    const admin =
      createAdminClient();

    /*
     * Find content and ensure its
     * campaign belongs to our org.
     */
    const {
      data: existing,
      error: existingError,
    } =
      await admin
        .from("content_items")
        .select(
          `
          id,
          campaign_id,
          creator_id,
          current_version,
          status
          `
        )
        .eq(
          "id",
          id
        )
        .maybeSingle();

    if (
      existingError ||
      !existing
    ) {
      return NextResponse.json(
        {
          error:
            "Content not found.",
        },
        {
          status: 404,
        }
      );
    }

    const {
      data: campaign,
    } =
      await admin
        .from("campaigns")
        .select(
          "id, organization_id"
        )
        .eq(
          "id",
          existing.campaign_id
        )
        .eq(
          "organization_id",
          workspace.data.organizationId
        )
        .maybeSingle();

    if (!campaign) {
      return NextResponse.json(
        {
          error:
            "Content is outside your workspace.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Creator can only edit their
     * own assigned content.
     */
    if (
      workspace.data.role ===
        "creator" &&
      existing.creator_id !==
        workspace.data.userId
    ) {
      return NextResponse.json(
        {
          error:
            "You can only edit content assigned to you.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Once content has reached approval,
     * we don't edit it silently.
     */
    if (
      existing.status ===
        "approved" ||
      existing.status ===
        "scheduled" ||
      existing.status ===
        "published"
    ) {
      return NextResponse.json(
        {
          error:
            "Approved, scheduled or published content cannot be directly edited.",
        },
        {
          status: 400,
        }
      );
    }

    const body: UpdateContentBody =
      await request.json();

    const title =
      body.title?.trim() ??
      "";

    const platform =
      body.platform ??
      "instagram";

    const contentType =
      body.contentType ??
      "post";

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

    let creatorId =
      body.creatorId
        ?.trim() ||
      null;

    if (
      workspace.data.role ===
      "creator"
    ) {
      creatorId =
        workspace.data.userId;
    }

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

    const nextVersion =
      existing.current_version +
      1;

    const {
      data: contentItem,
      error: updateError,
    } =
      await admin
        .from(
          "content_items"
        )
        .update({
          title,

          description:
            body.description
              ?.trim() ||
            null,

          caption:
            body.caption
              ?.trim() ||
            null,

          hashtags,

          platform,

          content_type:
            contentType,

          creator_id:
            creatorId,

          publish_at:
            body.publishAt ||
            null,

          current_version:
            nextVersion,
        })
        .eq(
          "id",
          id
        )
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

    if (updateError) {
      throw updateError;
    }

    /*
     * Save revision history.
     */
    await admin
      .from(
        "content_versions"
      )
      .insert({
        content_id:
          contentItem.id,

        version_number:
          nextVersion,

        caption:
          contentItem.caption,

        notes:
          `Updated by ${workspace.data.role}`,

        created_by:
          workspace.data.userId,
      });

    if (creatorId) {
      await admin
        .from(
          "campaign_members"
        )
        .upsert(
          {
            campaign_id:
              existing.campaign_id,

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
    }

    await admin
      .from("audit_logs")
      .insert({
        organization_id:
          workspace.data.organizationId,

        actor_id:
          workspace.data.userId,

        action:
          "content.updated",

        entity_type:
          "content",

        entity_id:
          contentItem.id,

        metadata: {
          title:
            contentItem.title,

          version:
            nextVersion,
        },
      });

    return NextResponse.json({
      content:
        contentItem,
    });
  } catch (error) {
    console.error(
      "Content PATCH error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to update content.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * DELETE /api/content/:id
 *
 * Soft archive.
 */
export async function DELETE(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
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

    const { id } =
      await context.params;

    const admin =
      createAdminClient();

    const {
      data: existing,
    } =
      await admin
        .from(
          "content_items"
        )
        .select(
          `
          id,
          campaign_id,
          creator_id,
          title
          `
        )
        .eq(
          "id",
          id
        )
        .maybeSingle();

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Content not found.",
        },
        {
          status: 404,
        }
      );
    }

    const {
      data: campaign,
    } =
      await admin
        .from("campaigns")
        .select(
          "organization_id"
        )
        .eq(
          "id",
          existing.campaign_id
        )
        .eq(
          "organization_id",
          workspace.data.organizationId
        )
        .maybeSingle();

    if (!campaign) {
      return NextResponse.json(
        {
          error:
            "Content is outside your workspace.",
        },
        {
          status: 403,
        }
      );
    }

    const canArchive =
      isManagerRole(
        workspace.data.role
      ) ||
      (
        workspace.data.role ===
          "creator" &&
        existing.creator_id ===
          workspace.data.userId
      );

    if (!canArchive) {
      return NextResponse.json(
        {
          error:
            "You cannot archive this content.",
        },
        {
          status: 403,
        }
      );
    }

    const {
      data,
      error,
    } =
      await admin
        .from(
          "content_items"
        )
        .update({
          status:
            "archived",
        })
        .eq(
          "id",
          id
        )
        .select(
          "id, title, status"
        )
        .single();

    if (error) {
      throw error;
    }

    await admin
      .from("audit_logs")
      .insert({
        organization_id:
          workspace.data.organizationId,

        actor_id:
          workspace.data.userId,

        action:
          "content.archived",

        entity_type:
          "content",

        entity_id:
          id,

        metadata: {
          title:
            existing.title,
        },
      });

    return NextResponse.json({
      success: true,
      content: data,
    });
  } catch (error) {
    console.error(
      "Content DELETE error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to archive content.",
      },
      {
        status: 500,
      }
    );
  }
}