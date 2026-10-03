import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/auth/workspace";

type CampaignStatus =
  | "planning"
  | "active"
  | "paused"
  | "completed"
  | "archived";

type UpdateCampaignBody = {
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

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
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
          status:
            workspace.status,
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
            "Only Administrators and Managers can update campaigns.",
        },
        {
          status: 403,
        }
      );
    }

    const { id } =
      await context.params;

    const body: UpdateCampaignBody =
      await request.json();

    const name =
      body.name?.trim() ?? "";

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

    const admin =
      createAdminClient();

    /*
     * Make sure campaign really belongs
     * to the logged-in Administrator /
     * Manager's organization.
     */
    const {
      data: existingCampaign,
      error: existingError,
    } = await admin
      .from("campaigns")
      .select(
        `
        id,
        organization_id
        `
      )
      .eq(
        "id",
        id
      )
      .eq(
        "organization_id",
        workspace.data.organizationId
      )
      .maybeSingle();

    if (
      existingError ||
      !existingCampaign
    ) {
      return NextResponse.json(
        {
          error:
            "Campaign not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Validate client.
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

    const {
      data: campaign,
      error: updateError,
    } = await admin
      .from("campaigns")
      .update({
        name,

        description:
          body.description?.trim() ||
          null,

        client_id:
          clientId,

        manager_id:
          managerId,

        status,

        start_date:
          startDate,

        end_date:
          endDate,
      })
      .eq(
        "id",
        id
      )
      .eq(
        "organization_id",
        workspace.data.organizationId
      )
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
      .maybeSingle();

    if (updateError) {
      throw updateError;
    }

    if (!campaign) {
      return NextResponse.json(
        {
          error:
            "Campaign not found.",
        },
        {
          status: 404,
        }
      );
    }

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

    await admin
      .from("audit_logs")
      .insert({
        organization_id:
          workspace.data.organizationId,

        actor_id:
          workspace.data.userId,

        action:
          "campaign.updated",

        entity_type:
          "campaign",

        entity_id:
          campaign.id,

        metadata: {
          name:
            campaign.name,

          status:
            campaign.status,
        },
      });

    return NextResponse.json({
      campaign: {
        ...campaign,

        client_name:
          client.name,
      },
    });
  } catch (error) {
    console.error(
      "Campaign PATCH error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to update campaign.",
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
    const workspace = await getWorkspaceContext();

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
      !canManageCampaigns(
        workspace.data.role
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Only Administrators and Managers can archive campaigns.",
        },
        {
          status: 403,
        }
      );
    }

    const { id } =
      await context.params;

    const admin =
      createAdminClient();

    const {
      data: campaign,
      error,
    } = await admin
      .from("campaigns")
      .update({
        status: "archived",
      })
      .eq(
        "id",
        id
      )
      .eq(
        "organization_id",
        workspace.data.organizationId
      )
      .select(
        `
        id,
        name,
        status
        `
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!campaign) {
      return NextResponse.json(
        {
          error:
            "Campaign not found.",
        },
        {
          status: 404,
        }
      );
    }

    await admin
      .from("audit_logs")
      .insert({
        organization_id:
          workspace.data.organizationId,

        actor_id:
          workspace.data.userId,

        action:
          "campaign.archived",

        entity_type:
          "campaign",

        entity_id:
          campaign.id,

        metadata: {
          name:
            campaign.name,
        },
      });

    return NextResponse.json({
      success: true,
      campaign,
    });
  } catch (error) {
    console.error(
      "Campaign DELETE error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to archive campaign.",
      },
      {
        status: 500,
      }
    );
  }
}