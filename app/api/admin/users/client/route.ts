import {
  NextResponse,
} from "next/server";

import {
  getWorkspaceContext,
} from "@/lib/auth/workspace";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

export async function GET() {
  try {
    const context =
      await getWorkspaceContext();

    if (!context.data) {
      return NextResponse.json(
        {
          error:
            context.error ||
            "Workspace access denied.",
        },
        {
          status:
            context.status || 401,
        }
      );
    }

    const workspace =
      context.data;

    if (
      workspace.role !== "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "Administrator access required.",
        },
        {
          status: 403,
        }
      );
    }

    const admin =
      createAdminClient();

    const {
      data: clients,
      error: clientsError,
    } =
      await admin
        .from("clients")
        .select(
          `
          id,
          name,
          organization_id,
          created_at
          `
        )
        .eq(
          "organization_id",
          workspace.organizationId
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

    if (clientsError) {
      console.error(
        "Admin client list error:",
        clientsError
      );

      return NextResponse.json(
        {
          error:
            "Unable to load clients.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      clients:
        clients ?? [],
    });
  } catch (error) {
    console.error(
      "Admin users client GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load clients.",
      },
      {
        status: 500,
      }
    );
  }
}