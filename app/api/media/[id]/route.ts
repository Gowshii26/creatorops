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

const BUCKET =
  "creatorops-media";

export async function DELETE(
  _request: Request,
  context: {
    params:
      Promise<{
        id: string;
      }>;
  }
) {
  try {
    const {
      id,
    } =
      await context.params;

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
            "Clients cannot delete media.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * RLS confirms the user can
     * access the metadata row.
     */
    const supabase =
      await createClient();

    const {
      data: asset,
      error: assetError,
    } =
      await supabase
        .from(
          "media_assets"
        )
        .select(
          `
          id,
          content_id,
          storage_path,
          file_name,
          uploaded_by
          `
        )
        .eq(
          "id",
          id
        )
        .maybeSingle();

    if (
      assetError ||
      !asset
    ) {
      return NextResponse.json(
        {
          error:
            "Media asset not found.",
        },
        {
          status: 404,
        }
      );
    }

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
          status
          `
        )
        .eq(
          "id",
          asset.content_id
        )
        .maybeSingle();

    if (
      contentError ||
      !content
    ) {
      return NextResponse.json(
        {
          error:
            "Content access denied.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      workspace.data.role ===
        "creator" &&
      content.creator_id !==
        workspace.data.userId
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot delete this asset.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      content.status ===
        "approved" ||
      content.status ===
        "scheduled" ||
      content.status ===
        "published"
    ) {
      return NextResponse.json(
        {
          error:
            "Approved or published media cannot be deleted.",
        },
        {
          status: 409,
        }
      );
    }

    const admin =
      createAdminClient();

    const {
      data: campaign,
    } =
      await admin
        .from(
          "campaigns"
        )
        .select(
          "organization_id"
        )
        .eq(
          "id",
          content.campaign_id
        )
        .maybeSingle();

    if (
      !campaign ||
      campaign.organization_id !==
        workspace.data
          .organizationId
    ) {
      return NextResponse.json(
        {
          error:
            "Workspace access denied.",
        },
        {
          status: 403,
        }
      );
    }

    const {
      error: storageError,
    } =
      await admin.storage
        .from(
          BUCKET
        )
        .remove([
          asset.storage_path,
        ]);

    if (storageError) {
      throw storageError;
    }

    const {
      error: deleteError,
    } =
      await admin
        .from(
          "media_assets"
        )
        .delete()
        .eq(
          "id",
          asset.id
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
          workspace.data
            .organizationId,

        actor_id:
          workspace.data.userId,

        action:
          "media_deleted",

        entity_type:
          "media_asset",

        entity_id:
          asset.id,

        metadata: {
          content_id:
            content.id,

          file_name:
            asset.file_name,
        },
      });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Media DELETE error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to delete media.",
      },
      {
        status: 500,
      }
    );
  }
}