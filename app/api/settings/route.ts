import { NextResponse } from "next/server";

import { getWorkspaceContext } from "@/lib/auth/workspace";
import { createClient } from "@/lib/supabase/server";

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

    const supabase =
      await createClient();

    const {
      data: userData,
      error: userError,
    } =
      await supabase.auth.getUser();

    if (
      userError ||
      !userData.user
    ) {
      return NextResponse.json(
        {
          error:
            "Authentication failed.",
        },
        {
          status: 401,
        }
      );
    }

    const user =
      userData.user;

    const [
      profileResult,
      organizationResult,
    ] =
      await Promise.all([
        supabase
          .from("profiles")
          .select(
            `
            id,
            full_name
            `
          )
          .eq(
            "id",
            user.id
          )
          .maybeSingle(),

        supabase
          .from("organizations")
          .select(
            `
            id,
            name
            `
          )
          .eq(
            "id",
            workspace.data
              .organizationId
          )
          .maybeSingle(),
      ]);

    if (
      profileResult.error
    ) {
      throw profileResult.error;
    }

    if (
      organizationResult.error
    ) {
      throw organizationResult.error;
    }

    return NextResponse.json({
      profile: {
        id:
          user.id,

        fullName:
          profileResult.data
            ?.full_name ||
          user.user_metadata
            ?.full_name ||
          user.email ||
          "CreatorOps User",

        email:
          user.email || "",

        role:
          workspace.data.role,

        organizationId:
          workspace.data
            .organizationId,

        organizationName:
          organizationResult.data
            ?.name ||
          "CreatorOps Workspace",
      },
    });
  } catch (error) {
    console.error(
      "Settings GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load profile.",
      },
      {
        status: 500,
      }
    );
  }
}

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
          status:
            workspace.status,
        }
      );
    }

    const body =
      await request.json();

    const fullName =
      typeof body.fullName ===
      "string"
        ? body.fullName.trim()
        : "";

    if (
      fullName.length < 2
    ) {
      return NextResponse.json(
        {
          error:
            "Name must contain at least 2 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      fullName.length > 100
    ) {
      return NextResponse.json(
        {
          error:
            "Name is too long.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      await createClient();

    const {
      data: userData,
      error: userError,
    } =
      await supabase.auth.getUser();

    if (
      userError ||
      !userData.user
    ) {
      return NextResponse.json(
        {
          error:
            "Authentication failed.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      error: profileError,
    } =
      await supabase
        .from("profiles")
        .update({
          full_name:
            fullName,
        })
        .eq(
          "id",
          workspace.data.userId
        );

    if (
      profileError
    ) {
      throw profileError;
    }

    /*
     * Keep Supabase Auth metadata
     * synchronized with profiles.
     */
    const {
      error: authError,
    } =
      await supabase.auth.updateUser({
        data: {
          full_name:
            fullName,
        },
      });

    if (
      authError
    ) {
      console.warn(
        "Auth metadata warning:",
        authError.message
      );
    }

    return NextResponse.json({
      success: true,

      profile: {
        fullName,
      },
    });
  } catch (error) {
    console.error(
      "Settings PATCH error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to update profile.",
      },
      {
        status: 500,
      }
    );
  }
}