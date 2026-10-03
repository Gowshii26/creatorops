import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/auth/workspace";

type CreateClientBody = {
  name?: string;
  industry?: string;
  contactName?: string;
  contactEmail?: string;
  description?: string;
};

function canManageClients(role: string) {
  return role === "admin" || role === "manager";
}

/*
 * GET /api/clients
 *
 * Returns clients belonging to the
 * current user's CreatorOps workspace.
 */
export async function GET(request: Request) {
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
          status: workspace.status,
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

    let query =
      supabase
        .from("clients")
        .select(
          `
          id,
          name,
          industry,
          contact_name,
          contact_email,
          description,
          is_active,
          created_at,
          updated_at
          `
        )
        .eq(
          "organization_id",
          workspace.data.organizationId
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
          "name",
          `%${search}%`
        );
    }

    const {
      data,
      error,
    } =
      await query;

    if (error) {
      console.error(
        "Supabase clients GET error:",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      clients:
        data ?? [],
    });
  } catch (error) {
    console.error(
      "Clients GET error:",
      error
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
}

/*
 * POST /api/clients
 *
 * Creates a new client.
 *
 * Only ADMIN and MANAGER users
 * may create clients.
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
          status: workspace.status,
        }
      );
    }

    if (
      !canManageClients(
        workspace.data.role
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Only Administrators and Managers can create clients.",
        },
        {
          status: 403,
        }
      );
    }

    const body =
      (await request.json()) as CreateClientBody;

    const name =
      body.name?.trim() ?? "";

    const industry =
      body.industry?.trim() ||
      null;

    const contactName =
      body.contactName?.trim() ||
      null;

    const contactEmail =
      body.contactEmail
        ?.trim()
        .toLowerCase() ||
      null;

    const description =
      body.description?.trim() ||
      null;

    if (name.length < 2) {
      return NextResponse.json(
        {
          error:
            "Client name must contain at least 2 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      contactEmail &&
      !contactEmail.includes("@")
    ) {
      return NextResponse.json(
        {
          error:
            "Enter a valid contact email.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      await createClient();

    const {
      data,
      error,
    } =
      await supabase
        .from("clients")
        .insert({
          organization_id:
            workspace.data.organizationId,

          name,

          industry,

          contact_name:
            contactName,

          contact_email:
            contactEmail,

          description,

          is_active: true,

          created_by:
            workspace.data.userId,
        })
        .select(
          `
          id,
          name,
          industry,
          contact_name,
          contact_email,
          description,
          is_active,
          created_at,
          updated_at
          `
        )
        .single();

    if (error) {
      console.error(
        "Supabase clients POST error:",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        client: data,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Clients POST error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to create client.",
      },
      {
        status: 500,
      }
    );
  }
}