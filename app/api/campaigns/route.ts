import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/auth/workspace";

type CampaignStatus =
  | "planning"
  | "active"
  | "paused"
  | "completed"
  | "archived";

type CreateCampaignBody = {
  name?: string;
  description?: string;
  clientId?: string;
  managerId?: string | null;
  status?: CampaignStatus;
  startDate?: string | null;
  endDate?: string | null;
};

function canManageCampaigns(role: string) {
  return role === "admin" || role === "manager";
}

function validStatus(value: string): value is CampaignStatus {
  return [
    "planning",
    "active",
    "paused",
    "completed",
    "archived",
  ].includes(value);
}

/*
 * GET /api/campaigns
 */
export async function GET(request: Request) {
  try {
    const workspace = await getWorkspaceContext();

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

    /*
     * GET uses the authenticated client.
     * RLS continues controlling what this
     * user can see.
     */
    const supabase = await createClient();

    const url = new URL(request.url);

    const search =
      url.searchParams.get("search")?.trim() ?? "";

    const status =
      url.searchParams.get("status")?.trim() ?? "";

    const clientId =
      url.searchParams.get("clientId")?.trim() ?? "";

    let query = supabase
      .from("campaigns")
      .select(
        `
        id,
        organization_id,
        client_id,
        name,
        description,
        status,
        start_date,
        end_date,
        manager_id,
        created_by,
        created_at,
        updated_at
        `
      )
      .eq(
        "organization_id",
        workspace.data.organizationId
      )
      .order("created_at", {
        ascending: false,
      });

    if (search) {
      query = query.ilike(
        "name",
        `%${search}%`
      );
    }

    if (
      status &&
      validStatus(status)
    ) {
      query = query.eq(
        "status",
        status
      );
    }

    if (clientId) {
      query = query.eq(
        "client_id",
        clientId
      );
    }

    const {
      data: campaigns,
      error: campaignsError,
    } = await query;

    if (campaignsError) {
      throw campaignsError;
    }

    /*
     * Load clients visible to this user.
     */
    const {
      data: clients,
      error: clientsError,
    } = await supabase
      .from("clients")
      .select(
        `
        id,
        name,
        is_active
        `
      )
      .eq(
        "organization_id",
        workspace.data.organizationId
      )
      .order("name", {
        ascending: true,
      });

    if (clientsError) {
      throw clientsError;
    }

    /*
     * Admin / Manager users need the
     * available campaign manager list.
     */
    let managers: {
      id: string;
      fullName: string;
      role: string;
    }[] = [];

    if (
      canManageCampaigns(
        workspace.data.role
      )
    ) {
      const {
        data: memberships,
        error: membershipsError,
      } = await supabase
        .from("organization_members")
        .select(
          `
          profile_id,
          role
          `
        )
        .eq(
          "organization_id",
          workspace.data.organizationId
        )
        .eq(
          "is_active",
          true
        )
        .in(
          "role",
          [
            "admin",
            "manager",
          ]
        );

      if (membershipsError) {
        throw membershipsError;
      }

      const profileIds =
        (memberships ?? []).map(
          (membership) =>
            membership.profile_id
        );

      if (profileIds.length > 0) {
        const {
          data: profiles,
          error: profilesError,
        } = await supabase
          .from("profiles")
          .select(
            `
            id,
            full_name
            `
          )
          .in(
            "id",
            profileIds
          );

        if (profilesError) {
          throw profilesError;
        }

        const profileMap = new Map(
          (profiles ?? []).map(
            (profile) => [
              profile.id,
              profile.full_name,
            ]
          )
        );

        managers = (
          memberships ?? []
        ).map((membership) => ({
          id:
            membership.profile_id,

          fullName:
            profileMap.get(
              membership.profile_id
            ) ||
            "CreatorOps User",

          role:
            membership.role,
        }));
      }
    }

    const clientMap = new Map(
      (clients ?? []).map(
        (client) => [
          client.id,
          client.name,
        ]
      )
    );

    const managerMap = new Map(
      managers.map(
        (manager) => [
          manager.id,
          manager.fullName,
        ]
      )
    );

    const result = (
      campaigns ?? []
    ).map((campaign) => ({
      ...campaign,

      client_name:
        clientMap.get(
          campaign.client_id
        ) ||
        "Unknown Client",

      manager_name:
        campaign.manager_id
          ? managerMap.get(
              campaign.manager_id
            ) ||
            "Assigned User"
          : null,
    }));

    return NextResponse.json({
      campaigns: result,
      clients: clients ?? [],
      managers,
    });
  } catch (error) {
    console.error(
      "Campaigns GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load campaigns.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * POST /api/campaigns
 *
 * Auth is checked using the normal user
 * session first.
 *
 * The trusted server client performs
 * the actual mutation.
 */
export async function POST(request: Request) {
  try {
    const workspace = await getWorkspaceContext();

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
      !canManageCampaigns(
        workspace.data.role
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Only Administrators and Managers can create campaigns.",
        },
        {
          status: 403,
        }
      );
    }

    const body: CreateCampaignBody =
      await request.json();

    const name =
      body.name?.trim() ?? "";

    const description =
      body.description?.trim() ||
      null;

    const clientId =
      body.clientId?.trim() ?? "";

    const managerId =
      body.managerId?.trim() ||
      null;

    const status =
      body.status ??
      "planning";

    const startDate =
      body.startDate ||
      null;

    const endDate =
      body.endDate ||
      null;

    if (name.length < 2) {
      return NextResponse.json(
        {
          error:
            "Campaign name must contain at least 2 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (!clientId) {
      return NextResponse.json(
        {
          error:
            "Select a client.",
        },
        {
          status: 400,
        }
      );
    }

    if (!validStatus(status)) {
      return NextResponse.json(
        {
          error:
            "Invalid campaign status.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      startDate &&
      endDate &&
      endDate < startDate
    ) {
      return NextResponse.json(
        {
          error:
            "Campaign end date cannot be earlier than the start date.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * SERVER-ONLY CLIENT.
     *
     * Never use this inside a "use client"
     * component.
     */
    const admin =
      createAdminClient();

    /*
     * Validate selected client belongs
     * to this exact workspace.
     */
    const {
      data: client,
      error: clientError,
    } = await admin
      .from("clients")
      .select(
        `
        id,
        name
        `
      )
      .eq(
        "id",
        clientId
      )
      .eq(
        "organization_id",
        workspace.data.organizationId
      )
      .eq(
        "is_active",
        true
      )
      .maybeSingle();

    if (
      clientError ||
      !client
    ) {
      return NextResponse.json(
        {
          error:
            "Selected client is invalid.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Validate optional Manager.
     */
    let managerRole:
      | "admin"
      | "manager"
      | null = null;

    if (managerId) {
      const {
        data: managerMembership,
        error: managerError,
      } = await admin
        .from("organization_members")
        .select(
          `
          profile_id,
          role
          `
        )
        .eq(
          "organization_id",
          workspace.data.organizationId
        )
        .eq(
          "profile_id",
          managerId
        )
        .eq(
          "is_active",
          true
        )
        .in(
          "role",
          [
            "admin",
            "manager",
          ]
        )
        .maybeSingle();

      if (
        managerError ||
        !managerMembership
      ) {
        return NextResponse.json(
          {
            error:
              "Selected Manager is invalid.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        managerMembership.role ===
        "admin"
      ) {
        managerRole = "admin";
      } else {
        managerRole = "manager";
      }
    }

    /*
     * Create actual campaign.
     */
    const {
      data: campaign,
      error: insertError,
    } = await admin
      .from("campaigns")
      .insert({
        organization_id:
          workspace.data.organizationId,

        client_id:
          clientId,

        name,

        description,

        status,

        start_date:
          startDate,

        end_date:
          endDate,

        manager_id:
          managerId,

        created_by:
          workspace.data.userId,
      })
      .select(
        `
        id,
        organization_id,
        client_id,
        name,
        description,
        status,
        start_date,
        end_date,
        manager_id,
        created_by,
        created_at,
        updated_at
        `
      )
      .single();

    if (insertError) {
      console.error(
        "Campaign INSERT error:",
        insertError
      );

      return NextResponse.json(
        {
          error:
            insertError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Link the selected Manager
     * to the campaign.
     */
    if (
      managerId &&
      managerRole
    ) {
      const {
        error: memberError,
      } = await admin
        .from("campaign_members")
        .upsert(
          {
            campaign_id:
              campaign.id,

            profile_id:
              managerId,

            role:
              managerRole,
          },
          {
            onConflict:
              "campaign_id,profile_id",
          }
        );

      if (memberError) {
        console.warn(
          "Campaign member warning:",
          memberError.message
        );
      }
    }

    /*
     * Audit event.
     */
    const {
      error: auditError,
    } = await admin
      .from("audit_logs")
      .insert({
        organization_id:
          workspace.data.organizationId,

        actor_id:
          workspace.data.userId,

        action:
          "campaign.created",

        entity_type:
          "campaign",

        entity_id:
          campaign.id,

        metadata: {
          name:
            campaign.name,

          client_id:
            clientId,

          manager_id:
            managerId,

          status:
            campaign.status,
        },
      });

    if (auditError) {
      console.warn(
        "Campaign audit warning:",
        auditError.message
      );
    }

    return NextResponse.json(
      {
        campaign: {
          ...campaign,

          client_name:
            client.name,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Campaign POST error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to create campaign.",
      },
      {
        status: 500,
      }
    );
  }
}