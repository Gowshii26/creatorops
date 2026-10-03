import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/auth/workspace";

type UpdateClientBody = {
  name?: string;
  industry?: string;
  contactName?: string;
  contactEmail?: string;
  description?: string;
  isActive?: boolean;
};

function canManageClients(role: string) {
  return role === "admin" || role === "manager";
}

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

    if (workspace.error) {
      return NextResponse.json(
        {
          error: workspace.error,
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
            "Only Administrators and Managers can edit clients.",
        },
        {
          status: 403,
        }
      );
    }

    const { id } =
      await context.params;

    const body =
      (await request.json()) as UpdateClientBody;

    const name =
      body.name?.trim() ?? "";

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

    const contactEmail =
      body.contactEmail
        ?.trim()
        .toLowerCase() || null;

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
        .update({
          name,

          industry:
            body.industry?.trim() ||
            null,

          contact_name:
            body.contactName?.trim() ||
            null,

          contact_email:
            contactEmail,

          description:
            body.description?.trim() ||
            null,

          is_active:
            body.isActive ?? true,
        })
        .eq("id", id)
        .eq(
          "organization_id",
          workspace.data.organizationId
        )
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
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        {
          error:
            "Client not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      client: data,
    });
  } catch (error) {
    console.error(
      "Client PATCH error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to update client.",
      },
      {
        status: 500,
      }
    );
  }
}

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

    if (workspace.error) {
      return NextResponse.json(
        {
          error: workspace.error,
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
            "Only Administrators and Managers can archive clients.",
        },
        {
          status: 403,
        }
      );
    }

    const { id } =
      await context.params;

    const supabase =
      await createClient();

    const {
      data,
      error,
    } =
      await supabase
        .from("clients")
        .update({
          is_active: false,
        })
        .eq("id", id)
        .eq(
          "organization_id",
          workspace.data.organizationId
        )
        .select(
          `
          id,
          name,
          is_active
          `
        )
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        {
          error:
            "Client not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      client: data,
    });
  } catch (error) {
    console.error(
      "Client DELETE error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to archive client.",
      },
      {
        status: 500,
      }
    );
  }
}