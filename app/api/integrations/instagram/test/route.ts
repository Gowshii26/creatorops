import { NextResponse } from "next/server";

import { getWorkspaceContext } from "@/lib/auth/workspace";

export const runtime = "nodejs";

const allowedRoles = new Set([
  "admin",
  "manager",
  "creator",
]);

type InstagramProfile = {
  id?: string;
  user_id?: string;
  username?: string;
  name?: string;
  account_type?: string;
  media_count?: number;

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
     * 2. Restrict integration access
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
            "Instagram integration is not available for this role.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * -----------------------------------------
     * 3. Read server-side token
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
     * 4. Request real Instagram profile
     * -----------------------------------------
     */

    const url =
      new URL(
        "https://graph.instagram.com/me"
      );

    url.searchParams.set(
      "fields",
      [
        "id",
        "username",
        "name",
        "account_type",
        "media_count",
      ].join(",")
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
        InstagramProfile;

    /*
     * -----------------------------------------
     * 5. Surface Instagram API errors
     * -----------------------------------------
     */

    if (!response.ok) {
      console.error(
        "Instagram API error:",
        data
      );

      return NextResponse.json(
        {
          error:
            data.error?.message ||
            "Instagram API request failed.",

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
     * 6. Return safe profile information
     * -----------------------------------------
     */

    return NextResponse.json({
      connected: true,

      account: {
        id:
          data.id ||
          data.user_id ||
          null,

        username:
          data.username || null,

        name:
          data.name || null,

        accountType:
          data.account_type || null,

        mediaCount:
          data.media_count ?? null,
      },
    });
  } catch (error) {
    console.error(
      "Instagram integration test error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to connect to Instagram.",
      },
      {
        status: 500,
      }
    );
  }
}