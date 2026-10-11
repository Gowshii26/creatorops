import {
  NextResponse,
} from "next/server";

import {
  getWorkspaceContext,
} from "@/lib/auth/workspace";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";

const allowedRoles = new Set([
  "admin",
  "manager",
  "creator",
]);

type LinkRequestBody = {
  contentId?: string;
  externalMediaId?: string;
  permalink?: string | null;
  mediaType?: string | null;
  caption?: string | null;
  publishedAt?: string | null;
};

type DeleteRequestBody = {
  externalMediaId?: string;
};

/*
 * ---------------------------------------------------------
 * GET
 *
 * Return Instagram → CreatorOps content links for the
 * current organization.
 * ---------------------------------------------------------
 */

export async function GET() {
  try {
    const workspaceResult =
      await getWorkspaceContext();

    if (!workspaceResult.data) {
      return NextResponse.json(
        {
          error:
            workspaceResult.error ||
            "Workspace access denied.",
        },
        {
          status:
            workspaceResult.status ||
            401,
        }
      );
    }

    const workspace =
      workspaceResult.data;

    if (
      !allowedRoles.has(
        workspace.role
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Instagram linking is not available for this role.",
        },
        {
          status: 403,
        }
      );
    }

    const admin =
      createAdminClient();

    const {
      data: links,
      error,
    } =
      await admin
        .from(
          "social_media_links"
        )
        .select(
          `
          id,
          organization_id,
          content_id,
          platform,
          external_media_id,
          permalink,
          media_type,
          caption,
          published_at,
          linked_by,
          created_at,
          updated_at
          `
        )
        .eq(
          "organization_id",
          workspace.organizationId
        )
        .eq(
          "platform",
          "instagram"
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

    if (error) {
      throw error;
    }

    /*
     * For creators, return only links
     * to content they are allowed to access.
     */

    if (
      workspace.role ===
      "creator"
    ) {
      const supabase =
        await createClient();

      const contentIds =
        Array.from(
          new Set(
            (
              links ?? []
            ).map(
              (link) =>
                link.content_id
            )
          )
        );

      if (
        contentIds.length ===
        0
      ) {
        return NextResponse.json({
          links: [],
        });
      }

      const {
        data:
          accessibleContent,
      } =
        await supabase
          .from(
            "content_items"
          )
          .select(
            "id"
          )
          .in(
            "id",
            contentIds
          );

      const accessibleIds =
        new Set(
          (
            accessibleContent ??
            []
          ).map(
            (item) =>
              item.id
          )
        );

      return NextResponse.json({
        links:
          (
            links ?? []
          ).filter(
            (link) =>
              accessibleIds.has(
                link.content_id
              )
          ),
      });
    }

    return NextResponse.json({
      links:
        links ?? [],
    });
  } catch (error) {
    console.error(
      "Instagram links GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load Instagram content links.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ---------------------------------------------------------
 * POST
 *
 * Link an Instagram media item to a CreatorOps content item.
 * ---------------------------------------------------------
 */

export async function POST(
  request: Request
) {
  try {
    const workspaceResult =
      await getWorkspaceContext();

    if (!workspaceResult.data) {
      return NextResponse.json(
        {
          error:
            workspaceResult.error ||
            "Workspace access denied.",
        },
        {
          status:
            workspaceResult.status ||
            401,
        }
      );
    }

    const workspace =
      workspaceResult.data;

    if (
      !allowedRoles.has(
        workspace.role
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Instagram linking is not available for this role.",
        },
        {
          status: 403,
        }
      );
    }

    const body =
      (await request.json()) as
        LinkRequestBody;

    const contentId =
      body.contentId?.trim() ||
      "";

    const externalMediaId =
      body.externalMediaId
        ?.trim() || "";

    if (!contentId) {
      return NextResponse.json(
        {
          error:
            "Content item is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!externalMediaId) {
      return NextResponse.json(
        {
          error:
            "Instagram media ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Use authenticated Supabase client
     * first so normal CreatorOps RLS
     * decides whether the user can access
     * this content item.
     */

    const supabase =
      await createClient();

    const {
      data: content,
      error:
        contentError,
    } =
      await supabase
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
          contentId
        )
        .maybeSingle();

    if (
      contentError ||
      !content
    ) {
      return NextResponse.json(
        {
          error:
            "Content item not found or access denied.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * A creator may link Instagram media
     * only to content assigned to them.
     */

    if (
      workspace.role ===
        "creator" &&
      content.creator_id !==
        workspace.userId
    ) {
      return NextResponse.json(
        {
          error:
            "You can link Instagram media only to content assigned to you.",
        },
        {
          status: 403,
        }
      );
    }

    const admin =
      createAdminClient();

    /*
     * Verify the campaign belongs to the
     * current organization.
     */

    const {
      data: campaign,
      error:
        campaignError,
    } =
      await admin
        .from(
          "campaigns"
        )
        .select(
          `
          id,
          organization_id
          `
        )
        .eq(
          "id",
          content.campaign_id
        )
        .maybeSingle();

    if (
      campaignError ||
      !campaign ||
      campaign.organization_id !==
        workspace.organizationId
    ) {
      return NextResponse.json(
        {
          error:
            "Campaign access denied.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * One Instagram post can map to one
     * CreatorOps content item inside an
     * organization.
     *
     * If the same Instagram post is linked
     * again, the relationship is updated
     * rather than duplicated.
     */

    const {
      data: link,
      error:
        linkError,
    } =
      await admin
        .from(
          "social_media_links"
        )
        .upsert(
          {
            organization_id:
              workspace.organizationId,

            content_id:
              content.id,

            platform:
              "instagram",

            external_media_id:
              externalMediaId,

            permalink:
              body.permalink ??
              null,

            media_type:
              body.mediaType ??
              null,

            caption:
              body.caption ??
              null,

            published_at:
              body.publishedAt ??
              null,

            linked_by:
              workspace.userId,

            updated_at:
              new Date()
                .toISOString(),
          },
          {
            onConflict:
              "organization_id,platform,external_media_id",
          }
        )
        .select(
          `
          id,
          organization_id,
          content_id,
          platform,
          external_media_id,
          permalink,
          media_type,
          caption,
          published_at,
          linked_by,
          created_at,
          updated_at
          `
        )
        .single();

    if (linkError) {
      throw linkError;
    }

    /*
     * Audit the external integration
     * relationship.
     */

    await admin
      .from(
        "audit_logs"
      )
      .insert({
        organization_id:
          workspace.organizationId,

        actor_id:
          workspace.userId,

        action:
          "instagram_media_linked",

        entity_type:
          "content_item",

        entity_id:
          content.id,

        metadata: {
          platform:
            "instagram",

          external_media_id:
            externalMediaId,

          content_title:
            content.title,

          permalink:
            body.permalink ??
            null,
        },
      });

    return NextResponse.json(
      {
        success: true,

        link,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Instagram links POST error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to link Instagram media.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ---------------------------------------------------------
 * DELETE
 *
 * Remove the relationship between an Instagram media item
 * and CreatorOps content.
 * ---------------------------------------------------------
 */

export async function DELETE(
  request: Request
) {
  try {
    const workspaceResult =
      await getWorkspaceContext();

    if (!workspaceResult.data) {
      return NextResponse.json(
        {
          error:
            workspaceResult.error ||
            "Workspace access denied.",
        },
        {
          status:
            workspaceResult.status ||
            401,
        }
      );
    }

    const workspace =
      workspaceResult.data;

    if (
      !allowedRoles.has(
        workspace.role
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Instagram unlinking is not available for this role.",
        },
        {
          status: 403,
        }
      );
    }

    const body =
      (await request.json()) as
        DeleteRequestBody;

    const externalMediaId =
      body.externalMediaId
        ?.trim() || "";

    if (!externalMediaId) {
      return NextResponse.json(
        {
          error:
            "Instagram media ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const admin =
      createAdminClient();

    /*
     * Load link first so we can validate
     * the linked content and create an
     * audit record.
     */

    const {
      data: existingLink,
      error:
        existingLinkError,
    } =
      await admin
        .from(
          "social_media_links"
        )
        .select(
          `
          id,
          content_id,
          external_media_id
          `
        )
        .eq(
          "organization_id",
          workspace.organizationId
        )
        .eq(
          "platform",
          "instagram"
        )
        .eq(
          "external_media_id",
          externalMediaId
        )
        .maybeSingle();

    if (existingLinkError) {
      throw existingLinkError;
    }

    if (!existingLink) {
      return NextResponse.json(
        {
          error:
            "Instagram link not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Validate that the user can access
     * the linked CreatorOps content item.
     */

    const supabase =
      await createClient();

    const {
      data: content,
      error:
        contentError,
    } =
      await supabase
        .from(
          "content_items"
        )
        .select(
          `
          id,
          creator_id,
          title
          `
        )
        .eq(
          "id",
          existingLink.content_id
        )
        .maybeSingle();

    if (
      contentError ||
      !content
    ) {
      return NextResponse.json(
        {
          error:
            "Linked content item not found or access denied.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      workspace.role ===
        "creator" &&
      content.creator_id !==
        workspace.userId
    ) {
      return NextResponse.json(
        {
          error:
            "You can unlink Instagram media only from content assigned to you.",
        },
        {
          status: 403,
        }
      );
    }

    const {
      error:
        deleteError,
    } =
      await admin
        .from(
          "social_media_links"
        )
        .delete()
        .eq(
          "id",
          existingLink.id
        )
        .eq(
          "organization_id",
          workspace.organizationId
        );

    if (deleteError) {
      throw deleteError;
    }

    await admin
      .from(
        "audit_logs"
      )
      .insert({
        organization_id:
          workspace.organizationId,

        actor_id:
          workspace.userId,

        action:
          "instagram_media_unlinked",

        entity_type:
          "content_item",

        entity_id:
          content.id,

        metadata: {
          platform:
            "instagram",

          external_media_id:
            externalMediaId,

          content_title:
            content.title,
        },
      });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Instagram links DELETE error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to unlink Instagram media.",
      },
      {
        status: 500,
      }
    );
  }
}