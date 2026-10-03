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

const MAX_FILE_SIZE =
  4 * 1024 * 1024;

function cleanFileName(
  fileName: string
) {
  return fileName
    .replace(
      /[^a-zA-Z0-9._-]/g,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    );
}

function isAllowedFile(
  file: File
) {
  return (
    file.type.startsWith(
      "image/"
    ) ||
    file.type.startsWith(
      "video/"
    ) ||
    file.type ===
      "application/pdf"
  );
}

/*
 * GET /api/media
 *
 * Returns media metadata only for
 * content the current user can access.
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
          status:
            workspace.status,
        }
      );
    }

    /*
     * Authenticated client ensures
     * media_assets RLS is respected.
     */
    const supabase =
      await createClient();

    const {
      data: assets,
      error: assetsError,
    } =
      await supabase
        .from(
          "media_assets"
        )
        .select(
          `
          id,
          content_id,
          version_id,
          file_name,
          storage_path,
          mime_type,
          file_size,
          uploaded_by,
          created_at
          `
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

    if (assetsError) {
      throw assetsError;
    }

    const mediaAssets =
      assets ?? [];

    if (
      mediaAssets.length ===
      0
    ) {
      return NextResponse.json({
        media: [],
      });
    }

    const contentIds =
      Array.from(
        new Set(
          mediaAssets.map(
            (asset) =>
              asset.content_id
          )
        )
      );

    const {
      data: contentRows,
      error: contentError,
    } =
      await supabase
        .from(
          "content_items"
        )
        .select(
          `
          id,
          campaign_id,
          title,
          current_version
          `
        )
        .in(
          "id",
          contentIds
        );

    if (contentError) {
      throw contentError;
    }

    const content =
      contentRows ?? [];

    const campaignIds =
      Array.from(
        new Set(
          content.map(
            (item) =>
              item.campaign_id
          )
        )
      );

    const {
      data: campaigns,
    } =
      campaignIds.length >
      0
        ? await supabase
            .from(
              "campaigns"
            )
            .select(
              `
              id,
              client_id,
              name
              `
            )
            .in(
              "id",
              campaignIds
            )
        : {
            data: [],
          };

    const admin =
      createAdminClient();

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

    const {
      data: clients,
    } =
      clientIds.length > 0
        ? await admin
            .from(
              "clients"
            )
            .select(
              "id, name"
            )
            .in(
              "id",
              clientIds
            )
        : {
            data: [],
          };

    const uploaderIds =
      Array.from(
        new Set(
          mediaAssets
            .map(
              (asset) =>
                asset.uploaded_by
            )
            .filter(
              Boolean
            )
        )
      ) as string[];

    const {
      data: profiles,
    } =
      uploaderIds.length >
      0
        ? await admin
            .from(
              "profiles"
            )
            .select(
              "id, full_name"
            )
            .in(
              "id",
              uploaderIds
            )
        : {
            data: [],
          };

    const clientMap =
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

    const contentMap =
      new Map(
        content.map(
          (item) => [
            item.id,
            item,
          ]
        )
      );

    const profileMap =
      new Map(
        (
          profiles ?? []
        ).map(
          (profile) => [
            profile.id,
            profile.full_name,
          ]
        )
      );

    /*
     * Signed URLs expire after
     * one hour because the bucket
     * is private.
     */
    const decorated =
      await Promise.all(
        mediaAssets.map(
          async (asset) => {
            const item =
              contentMap.get(
                asset.content_id
              );

            const campaign =
              item
                ? campaignMap.get(
                    item.campaign_id
                  )
                : undefined;

            const {
              data:
                signedData,
            } =
              await admin.storage
                .from(
                  BUCKET
                )
                .createSignedUrl(
                  asset.storage_path,
                  3600
                );

            return {
              ...asset,

              signed_url:
                signedData
                  ?.signedUrl ??
                null,

              content_title:
                item?.title ??
                "Unknown Content",

              content_version:
                item?.current_version ??
                1,

              campaign_name:
                campaign?.name ??
                "Unknown Campaign",

              client_name:
                campaign
                  ?.clientName ??
                "Unknown Client",

              uploader_name:
                asset.uploaded_by
                  ? profileMap.get(
                      asset.uploaded_by
                    ) ||
                    "CreatorOps User"
                  : "CreatorOps User",
            };
          }
        )
      );

    return NextResponse.json({
      media:
        decorated,
    });
  } catch (error) {
    console.error(
      "Media GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load media library.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * POST /api/media
 *
 * multipart/form-data
 *
 * contentId
 * file
 */
export async function POST(
  request: Request
) {
  let uploadedPath:
    | string
    | null = null;

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
            "Clients cannot upload media.",
        },
        {
          status: 403,
        }
      );
    }

    const formData =
      await request.formData();

    const contentIdValue =
      formData.get(
        "contentId"
      );

    const fileValue =
      formData.get(
        "file"
      );

    const contentId =
      typeof contentIdValue ===
      "string"
        ? contentIdValue
        : "";

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

    if (
      !(fileValue instanceof File)
    ) {
      return NextResponse.json(
        {
          error:
            "A file is required.",
        },
        {
          status: 400,
        }
      );
    }

    const file =
      fileValue;

    if (
      file.size <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "The selected file is empty.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          error:
            "Maximum file size is 4 MB.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isAllowedFile(
        file
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Only images, videos and PDF files are supported.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Use authenticated RLS to ensure
     * this user can see this content.
     */
    const supabase =
      await createClient();

    const {
      data: content,
      error: contentError,
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
          status,
          current_version
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
     * Creator may upload only to
     * content assigned to them.
     */
    if (
      workspace.data.role ===
        "creator" &&
      content.creator_id !==
        workspace.data.userId
    ) {
      return NextResponse.json(
        {
          error:
            "You can upload media only to content assigned to you.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Freeze media after final approval.
     */
    if (
      content.status ===
        "approved" ||
      content.status ===
        "scheduled" ||
      content.status ===
        "published" ||
      content.status ===
        "archived"
    ) {
      return NextResponse.json(
        {
          error:
            "Media cannot be changed after final approval.",
        },
        {
          status: 409,
        }
      );
    }

    const admin =
      createAdminClient();

    /*
     * Verify tenant ownership.
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
          "id, organization_id"
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
        workspace.data
          .organizationId
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
     * Associate asset with the
     * current content version.
     */
    const {
      data:
        currentVersion,
    } =
      await admin
        .from(
          "content_versions"
        )
        .select(
          "id"
        )
        .eq(
          "content_id",
          content.id
        )
        .eq(
          "version_number",
          content.current_version
        )
        .limit(1)
        .maybeSingle();

    const safeName =
      cleanFileName(
        file.name
      );

    const uniqueName =
      `${crypto.randomUUID()}-${safeName}`;

    const storagePath =
      `${workspace.data.organizationId}/${content.id}/${uniqueName}`;

    uploadedPath =
      storagePath;

    const {
      error: uploadError,
    } =
      await admin.storage
        .from(
          BUCKET
        )
        .upload(
          storagePath,
          file,
          {
            contentType:
              file.type ||
              "application/octet-stream",

            upsert:
              false,
          }
        );

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: asset,
      error: assetError,
    } =
      await admin
        .from(
          "media_assets"
        )
        .insert({
          content_id:
            content.id,

          version_id:
            currentVersion?.id ??
            null,

          file_name:
            file.name,

          storage_path:
            storagePath,

          mime_type:
            file.type ||
            null,

          file_size:
            file.size,

          uploaded_by:
            workspace.data.userId,
        })
        .select(
          `
          id,
          content_id,
          version_id,
          file_name,
          storage_path,
          mime_type,
          file_size,
          uploaded_by,
          created_at
          `
        )
        .single();

    if (assetError) {
      /*
       * Avoid leaving an orphaned
       * file in Storage.
       */
      await admin.storage
        .from(
          BUCKET
        )
        .remove([
          storagePath,
        ]);

      throw assetError;
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
          "media_uploaded",

        entity_type:
          "media_asset",

        entity_id:
          asset.id,

        metadata: {
          content_id:
            content.id,

          file_name:
            file.name,

          file_size:
            file.size,
        },
      });

    const {
      data:
        signedData,
    } =
      await admin.storage
        .from(
          BUCKET
        )
        .createSignedUrl(
          storagePath,
          3600
        );

    return NextResponse.json(
      {
        success: true,

        asset: {
          ...asset,

          signed_url:
            signedData
              ?.signedUrl ??
            null,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Media POST error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to upload media.",
      },
      {
        status: 500,
      }
    );
  }
}