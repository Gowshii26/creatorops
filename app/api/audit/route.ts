import { NextResponse } from "next/server";

import { getWorkspaceContext } from "@/lib/auth/workspace";
import { createAdminClient } from "@/lib/supabase/admin";

type AuditRow = {
  id: string;
  organization_id: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

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

    /*
     * Audit Trail is intended for
     * operational oversight.
     */
    if (
      workspace.data.role !==
        "admin" &&
      workspace.data.role !==
        "manager"
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to view the audit trail.",
        },
        {
          status: 403,
        }
      );
    }

    const admin =
      createAdminClient();

    /*
     * Fetch recent events for this
     * organization only.
     */
    const {
      data: rows,
      error: auditError,
    } =
      await admin
        .from("audit_logs")
        .select(
          `
          id,
          organization_id,
          actor_id,
          action,
          entity_type,
          entity_id,
          metadata,
          created_at
          `
        )
        .eq(
          "organization_id",
          workspace.data
            .organizationId
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(250);

    if (auditError) {
      throw auditError;
    }

    const auditRows =
      (rows ?? []) as AuditRow[];

    /*
     * Resolve actor names.
     */
    const actorIds =
      Array.from(
        new Set(
          auditRows
            .map(
              (row) =>
                row.actor_id
            )
            .filter(
              (
                id
              ): id is string =>
                Boolean(id)
            )
        )
      );

    const {
      data: profiles,
      error: profileError,
    } =
      actorIds.length > 0
        ? await admin
            .from(
              "profiles"
            )
            .select(
              `
              id,
              full_name
              `
            )
            .in(
              "id",
              actorIds
            )
        : {
            data: [],
            error: null,
          };

    if (profileError) {
      console.warn(
        "Audit profile lookup warning:",
        profileError.message
      );
    }

    const profileMap =
      new Map(
        (
          profiles ?? []
        ).map(
          (profile) => [
            profile.id,
            profile.full_name ||
              "CreatorOps User",
          ]
        )
      );

    /*
     * Resolve actor roles.
     */
    const {
      data: memberships,
      error:
        membershipError,
    } =
      actorIds.length > 0
        ? await admin
            .from(
              "organization_members"
            )
            .select(
              `
              profile_id,
              role
              `
            )
            .eq(
              "organization_id",
              workspace.data
                .organizationId
            )
            .in(
              "profile_id",
              actorIds
            )
        : {
            data: [],
            error: null,
          };

    if (
      membershipError
    ) {
      console.warn(
        "Audit membership lookup warning:",
        membershipError.message
      );
    }

    const roleMap =
      new Map(
        (
          memberships ?? []
        ).map(
          (membership) => [
            membership.profile_id,
            membership.role,
          ]
        )
      );

    /*
     * Decorate each audit event.
     *
     * We intentionally keep metadata
     * flexible because different actions
     * record different information.
     */
    const audit =
      auditRows.map(
        (row) => ({
          ...row,

          actor_name:
            row.actor_id
              ? profileMap.get(
                  row.actor_id
                ) ||
                "CreatorOps User"
              : "System",

          actor_role:
            row.actor_id
              ? roleMap.get(
                  row.actor_id
                ) ||
                null
              : null,
        })
      );

    const today =
      new Date();

    const todayKey =
      [
        today.getFullYear(),
        String(
          today.getMonth() +
            1
        ).padStart(
          2,
          "0"
        ),
        String(
          today.getDate()
        ).padStart(
          2,
          "0"
        ),
      ].join("-");

    const todayEvents =
      audit.filter(
        (event) => {
          const date =
            new Date(
              event.created_at
            );

          if (
            Number.isNaN(
              date.getTime()
            )
          ) {
            return false;
          }

          const eventKey =
            [
              date.getFullYear(),
              String(
                date.getMonth() +
                  1
              ).padStart(
                2,
                "0"
              ),
              String(
                date.getDate()
              ).padStart(
                2,
                "0"
              ),
            ].join("-");

          return (
            eventKey ===
            todayKey
          );
        }
      ).length;

    const uniqueActors =
      new Set(
        audit
          .map(
            (event) =>
              event.actor_id
          )
          .filter(Boolean)
      ).size;

    const uniqueActions =
      new Set(
        audit.map(
          (event) =>
            event.action
        )
      ).size;

    return NextResponse.json({
      audit,

      summary: {
        total:
          audit.length,

        today:
          todayEvents,

        actors:
          uniqueActors,

        actionTypes:
          uniqueActions,
      },
    });
  } catch (error) {
    console.error(
      "Audit GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load audit trail.",
      },
      {
        status: 500,
      }
    );
  }
}