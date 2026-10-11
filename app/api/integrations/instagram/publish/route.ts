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

const BUCKET =
  "creatorops-media";

const GRAPH_VERSION =
  process.env
    .INSTAGRAM_GRAPH_API_VERSION
    ?.trim() ||
  "v26.0";

const GRAPH_BASE =
  `https://graph.instagram.com/${GRAPH_VERSION}`;

const allowedRoles =
  new Set([
    "admin",
    "manager",
  ]);

type PublishBody = {
  contentId?: string;
};

type MetaErrorResponse = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

type InstagramProfileResponse =
  MetaErrorResponse & {
    id?: string;
    username?: string;
  };

type ContainerResponse =
  MetaErrorResponse & {
    id?: string;
  };

type ContainerStatusResponse =
  MetaErrorResponse & {
    id?: string;
    status_code?: string;
    status?: string;
  };

type PublishResponse =
  MetaErrorResponse & {
    id?: string;
  };

type PublishedMediaResponse =
  MetaErrorResponse & {
    id?: string;
    caption?: string;
    media_type?: string;
    media_url?: string;
    permalink?: string;
    thumbnail_url?: string;
    timestamp?: string;
  };

function metaErrorMessage(
  data: MetaErrorResponse,
  fallback: string
) {
  if (
    data.error?.message
  ) {
    return data.error.message;
  }

  return fallback;
}

function sleep(
  milliseconds: number
) {
  return new Promise<void>(
    (resolve) => {
      setTimeout(
        resolve,
        milliseconds
      );
    }
  );
}

function buildCaption(
  caption: string | null,
  hashtags: string[] | null
) {
  const cleanCaption =
    caption?.trim() || "";

  const cleanHashtags =
    (
      hashtags ?? []
    )
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
      .map(
        (tag) =>
          `#${tag}`
      )
      .join(" ");

  if (
    cleanCaption &&
    cleanHashtags
  ) {
    return `${cleanCaption}\n\n${cleanHashtags}`;
  }

  return (
    cleanCaption ||
    cleanHashtags
  );
}

/*
 * POST /api/integrations/instagram/publish
 *
 * Supports:
 * - Instagram Post + JPEG image
 * - Instagram Reel + video asset
 */
export async function POST(
  request: Request
) {
  try {
    const workspaceResult =
      await getWorkspaceContext();

    if (
      !workspaceResult.data
    ) {
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
            "Only Admin or Manager can publish content to Instagram.",
        },
        {
          status: 403,
        }
      );
    }

    const body =
      (await request.json()) as
        PublishBody;

    const contentId =
      body.contentId?.trim() ||
      "";

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

    const accessToken =
      process.env
        .INSTAGRAM_ACCESS_TOKEN
        ?.trim();

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "Instagram access token is not configured.",
        },
        {
          status: 500,
        }
      );
    }

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
          title,
          caption,
          hashtags,
          platform,
          content_type,
          status,
          publish_at,
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

    if (
      content.platform !==
      "instagram"
    ) {
      return NextResponse.json(
        {
          error:
            "This content item is not configured for Instagram.",
        },
        {
          status: 409,
        }
      );
    }

    const isImagePost =
      content.content_type ===
      "post";

    const isReel =
      content.content_type ===
      "reel";

    if (
      !isImagePost &&
      !isReel
    ) {
      return NextResponse.json(
        {
          error:
            "Instagram publishing currently supports image posts and Reels only.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      content.status !==
        "approved" &&
      content.status !==
        "scheduled"
    ) {
      return NextResponse.json(
        {
          error:
            "Instagram content must be Approved or Scheduled before it can be published.",
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
      error: campaignError,
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

    const {
      data: currentVersion,
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

    let assetQuery =
      admin
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
          created_at
          `
        )
        .eq(
          "content_id",
          content.id
        );

    if (
      currentVersion?.id
    ) {
      assetQuery =
        assetQuery.eq(
          "version_id",
          currentVersion.id
        );
    }

    if (isReel) {
      assetQuery =
        assetQuery.like(
          "mime_type",
          "video/%"
        );
    } else {
      assetQuery =
        assetQuery.eq(
          "mime_type",
          "image/jpeg"
        );
    }

    const {
      data: assets,
      error: assetError,
    } =
      await assetQuery
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(1);

    if (assetError) {
      throw assetError;
    }

    const asset =
      assets?.[0];

    if (!asset) {
      return NextResponse.json(
        {
          error: isReel
            ? "No video is attached to the current content version. Upload an MP4 or MOV video first."
            : "No JPEG image is attached to the current content version. Upload a .jpg or .jpeg image first.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      isReel &&
      asset.mime_type !==
        "video/mp4" &&
      asset.mime_type !==
        "video/quicktime"
    ) {
      return NextResponse.json(
        {
          error:
            "Instagram Reels require an MP4 or MOV video. Upload an MP4/MOV file and try again.",
        },
        {
          status: 409,
        }
      );
    }

    const {
      data: signedData,
      error: signedError,
    } =
      await admin.storage
        .from(
          BUCKET
        )
        .createSignedUrl(
          asset.storage_path,
          3600
        );

    if (
      signedError ||
      !signedData?.signedUrl
    ) {
      return NextResponse.json(
        {
          error:
            "Unable to generate the temporary media URL required by Instagram.",
        },
        {
          status: 500,
        }
      );
    }

    const mediaUrl =
      signedData.signedUrl;

    const profileUrl =
      new URL(
        `${GRAPH_BASE}/me`
      );

    profileUrl.searchParams.set(
      "fields",
      "id,username"
    );

    profileUrl.searchParams.set(
      "access_token",
      accessToken
    );

    const profileResponse =
      await fetch(
        profileUrl.toString(),
        {
          method: "GET",
          cache: "no-store",
        }
      );

    const profileData =
      (await profileResponse.json()) as
        InstagramProfileResponse;

    if (
      !profileResponse.ok ||
      !profileData.id
    ) {
      return NextResponse.json(
        {
          error:
            metaErrorMessage(
              profileData,
              "Unable to identify the connected Instagram account."
            ),
        },
        {
          status:
            profileResponse.status ||
            502,
        }
      );
    }

    const instagramUserId =
      profileData.id;

    const instagramCaption =
      buildCaption(
        content.caption,
        Array.isArray(
          content.hashtags
        )
          ? content.hashtags
          : []
      );

    const containerBody =
      new URLSearchParams();

    if (isReel) {
      containerBody.set(
        "media_type",
        "REELS"
      );

      containerBody.set(
        "video_url",
        mediaUrl
      );

      containerBody.set(
        "share_to_feed",
        "true"
      );
    } else {
      containerBody.set(
        "image_url",
        mediaUrl
      );
    }

    if (
      instagramCaption
    ) {
      containerBody.set(
        "caption",
        instagramCaption
      );
    }

    containerBody.set(
      "access_token",
      accessToken
    );

    const containerResponse =
      await fetch(
        `${GRAPH_BASE}/${instagramUserId}/media`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },

          body:
            containerBody.toString(),

          cache: "no-store",
        }
      );

    const containerData =
      (await containerResponse.json()) as
        ContainerResponse;

    if (
      !containerResponse.ok ||
      !containerData.id
    ) {
      return NextResponse.json(
        {
          error:
            metaErrorMessage(
              containerData,
              isReel
                ? "Instagram could not create the Reel container."
                : "Instagram could not create the image container."
            ),
        },
        {
          status:
            containerResponse.status ||
            502,
        }
      );
    }

    const creationId =
      containerData.id;

    let containerReady =
      false;

    let lastContainerStatus =
      "";

    const maxAttempts =
      isReel ? 18 : 8;

    const delayMs =
      isReel ? 3000 : 1000;

    for (
      let attempt = 0;
      attempt < maxAttempts;
      attempt += 1
    ) {
      const statusUrl =
        new URL(
          `${GRAPH_BASE}/${creationId}`
        );

      statusUrl.searchParams.set(
        "fields",
        "status_code,status"
      );

      statusUrl.searchParams.set(
        "access_token",
        accessToken
      );

      const statusResponse =
        await fetch(
          statusUrl.toString(),
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const statusData =
        (await statusResponse.json()) as
          ContainerStatusResponse;

      if (
        !statusResponse.ok
      ) {
        return NextResponse.json(
          {
            error:
              metaErrorMessage(
                statusData,
                "Unable to check Instagram media processing status."
              ),
          },
          {
            status:
              statusResponse.status ||
              502,
          }
        );
      }

      lastContainerStatus =
        statusData.status_code ||
        statusData.status ||
        "";

      if (
        statusData.status_code ===
        "FINISHED"
      ) {
        containerReady =
          true;

        break;
      }

      if (
        statusData.status_code ===
          "ERROR" ||
        statusData.status_code ===
          "EXPIRED"
      ) {
        return NextResponse.json(
          {
            error:
              statusData.status ||
              `Instagram media processing failed with status ${statusData.status_code}.`,
          },
          {
            status: 502,
          }
        );
      }

      await sleep(delayMs);
    }

    if (!containerReady) {
      return NextResponse.json(
        {
          error:
            `Instagram ${
              isReel
                ? "Reel"
                : "image"
            } is still processing. Last status: ${
              lastContainerStatus ||
              "UNKNOWN"
            }. Try again shortly.`,
        },
        {
          status: 409,
        }
      );
    }

    const publishBody =
      new URLSearchParams();

    publishBody.set(
      "creation_id",
      creationId
    );

    publishBody.set(
      "access_token",
      accessToken
    );

    const publishResponse =
      await fetch(
        `${GRAPH_BASE}/${instagramUserId}/media_publish`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },

          body:
            publishBody.toString(),

          cache: "no-store",
        }
      );

    const publishData =
      (await publishResponse.json()) as
        PublishResponse;

    if (
      !publishResponse.ok ||
      !publishData.id
    ) {
      return NextResponse.json(
        {
          error:
            metaErrorMessage(
              publishData,
              isReel
                ? "Instagram could not publish the Reel."
                : "Instagram could not publish the image."
            ),
        },
        {
          status:
            publishResponse.status ||
            502,
        }
      );
    }

    const instagramMediaId =
      publishData.id;

    const publishedUrl =
      new URL(
        `${GRAPH_BASE}/${instagramMediaId}`
      );

    publishedUrl.searchParams.set(
      "fields",
      [
        "id",
        "caption",
        "media_type",
        "media_url",
        "permalink",
        "thumbnail_url",
        "timestamp",
      ].join(",")
    );

    publishedUrl.searchParams.set(
      "access_token",
      accessToken
    );

    const publishedResponse =
      await fetch(
        publishedUrl.toString(),
        {
          method: "GET",
          cache: "no-store",
        }
      );

    const publishedData =
      (await publishedResponse.json()) as
        PublishedMediaResponse;

    const publishedAt =
      publishedResponse.ok &&
      publishedData.timestamp
        ? publishedData.timestamp
        : new Date()
            .toISOString();

    const permalink =
      publishedResponse.ok
        ? publishedData.permalink ??
          null
        : null;

    const mediaType =
      publishedResponse.ok
        ? publishedData.media_type ??
          (isReel
            ? "VIDEO"
            : "IMAGE")
        : isReel
          ? "VIDEO"
          : "IMAGE";

    const {
      error: linkError,
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
              instagramMediaId,

            permalink,

            media_type:
              mediaType,

            caption:
              instagramCaption ||
              null,

            published_at:
              publishedAt,

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
        );

    if (linkError) {
      console.error(
        "Instagram social link save error:",
        linkError
      );
    }

    const now =
      new Date()
        .toISOString();

    const {
      error: updateError,
    } =
      await admin
        .from(
          "content_items"
        )
        .update({
          status:
            "published",

          publish_at:
            publishedAt,

          updated_at:
            now,
        })
        .eq(
          "id",
          content.id
        );

    if (updateError) {
      console.error(
        "CreatorOps publish status update error:",
        updateError
      );
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
          isReel
            ? "instagram_reel_published"
            : "instagram_published",

        entity_type:
          "content_item",

        entity_id:
          content.id,

        metadata: {
          content_title:
            content.title,

          content_type:
            content.content_type,

          instagram_user_id:
            instagramUserId,

          instagram_username:
            profileData.username ??
            null,

          instagram_media_id:
            instagramMediaId,

          permalink,

          source_asset_id:
            asset.id,

          source_file_name:
            asset.file_name,

          source_mime_type:
            asset.mime_type,

          creation_id:
            creationId,
        },
      });

    return NextResponse.json(
      {
        success: true,

        message: isReel
          ? "Reel published to Instagram successfully."
          : "Content published to Instagram successfully.",

        instagram: {
          accountId:
            instagramUserId,

          username:
            profileData.username ??
            null,

          mediaId:
            instagramMediaId,

          permalink,

          mediaType,

          timestamp:
            publishedAt,
        },

        content: {
          id:
            content.id,

          title:
            content.title,

          contentType:
            content.content_type,

          status:
            "published",
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Instagram publish error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to publish content to Instagram.",
      },
      {
        status: 500,
      }
    );
  }
}
