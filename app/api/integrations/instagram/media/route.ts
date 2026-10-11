import { NextResponse } from "next/server";

import { getWorkspaceContext } from "@/lib/auth/workspace";

export const runtime = "nodejs";

const allowedRoles = new Set([
  "admin",
  "manager",
  "creator",
]);

type InstagramMediaItem = {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  permalink?: string;
  thumbnail_url?: string;
  timestamp?: string;
};

type InstagramMediaResponse = {
  data?: InstagramMediaItem[];

  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };

    next?: string;
    previous?: string;
  };

  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

export async function GET() {
  try {
    /*
     * -----------------------------------------
     * 1. Authenticate CreatorOps user
     * -----------------------------------------
     */

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
            workspaceResult.status || 401,
        }
      );
    }

    const workspace =
      workspaceResult.data;

    /*
     * -----------------------------------------
     * 2. Restrict access
     * -----------------------------------------
     */

    if (
      !allowedRoles.has(
        workspace.role
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Instagram media access is not available for this role.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * -----------------------------------------
     * 3. Read token
     * -----------------------------------------
     */

    const accessToken =
      process.env.INSTAGRAM_ACCESS_TOKEN;

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

    /*
     * -----------------------------------------
     * 4. Request real Instagram media
     * -----------------------------------------
     */

    const url =
      new URL(
        "https://graph.instagram.com/me/media"
      );

    url.searchParams.set(
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

    url.searchParams.set(
      "limit",
      "25"
    );

    const response =
      await fetch(
        url.toString(),
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },

          cache: "no-store",
        }
      );

    const data =
      (await response.json()) as
        InstagramMediaResponse;

    /*
     * -----------------------------------------
     * 5. Handle Instagram errors
     * -----------------------------------------
     */

    if (!response.ok) {
      console.error(
        "Instagram media API error:",
        data
      );

      return NextResponse.json(
        {
          error:
            data.error?.message ||
            "Unable to retrieve Instagram media.",

          code:
            data.error?.code ??
            response.status,
        },
        {
          status:
            response.status,
        }
      );
    }

    /*
     * -----------------------------------------
     * 6. Return safe media information
     * -----------------------------------------
     */

    return NextResponse.json({
      connected: true,

      count:
        data.data?.length ?? 0,

      media:
        data.data ?? [],
    });
  } catch (error) {
    console.error(
      "Instagram media integration error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to retrieve Instagram media.",
      },
      {
        status: 500,
      }
    );
  }
}