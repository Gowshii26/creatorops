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

function canManageClients(
  role: string
) {
  return (
    role === "admin" ||
    role === "manager"
  );
}

/*
 * GET /api/clients
 *
 * Query examples:
 *
 * /api/clients
 * /api/clients?search=urban
 */
export async function GET(
  request: Request
) {
  try {
    const context =
      await getWorkspaceContext();

    if (context.error) {
      return NextResponse.json(
        {
          error:
            context.error,
        },
        {
          status:
            context.status,
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
          context.data.organizationId
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
      throw error;
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
 */
export async function POST(
  request: Request
) {
  try {
    const context =
      await getWorkspaceContext();

    if (context.error) {
      return NextResponse.json(
        {
          error:
            context.error,
        },
        {
          status:
            context.status,
        }
      );
    }

    if (
      !canManageClients(
        context.data.role
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
      body.name?.trim() ??
      "";

    const industry =
      body.industry
        ?.trim() ||
      null;

    const contactName =
      body.contactName
        ?.trim() ||
      null;

    const contactEmail =
      body.contactEmail
        ?.trim()
        .toLowerCase() ||
      null;

    const description =
      body.description
        ?.trim() ||
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
            context.data
              .organizationId,

          name,
          industry,
          contact_name:
            contactName,
          contact_email:
            contactEmail,
          description,

          created_by:
            context.data.userId,

          is_active:
            true,
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
      throw error;
    }

    /*
     * Audit logging is done through
     * the server-side authenticated
     * Supabase connection.
     */
    const {
      error: auditError,
    } =
      await supabase
        .from("audit_logs")
        .insert({
          organization_id:
            context.data
              .organizationId,

          actor_id:
            context.data.userId,

          action:
            "client.created",

          entity_type:
            "client",

          entity_id:
            data.id,

          metadata: {
            name:
              data.name,
          },
        });

    /*
     * Our existing RLS allows audit
     * reading but not client-side
     * insertion, so don't fail the
     * client creation if audit
     * insertion is rejected.
     *
     * We can move audit writes to a
     * security-definer function later.
     */
    if (auditError) {
      console.warn(
        "Audit log was not created:",
        auditError.message
      );
    }

    return NextResponse.json(
      {
        client:
          data,
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