import {
  NextResponse,
} from "next/server";

import {
  getWorkspaceContext,
} from "@/lib/auth/workspace";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

type AppRole =
  | "admin"
  | "manager"
  | "creator"
  | "client";

function validRole(
  value: unknown
): value is AppRole {
  return (
    value === "admin" ||
    value === "manager" ||
    value === "creator" ||
    value === "client"
  );
}

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

    if (
      workspace.data.role !==
      "admin"
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
      data: memberships,
      error:
        membershipsError,
    } =
      await admin
        .from(
          "organization_members"
        )
        .select(
          `
          profile_id,
          role,
          is_active
          `
        )
        .eq(
          "organization_id",
          workspace.data
            .organizationId
        )
        .order(
          "role",
          {
            ascending: true,
          }
        );

    if (
      membershipsError
    ) {
      throw membershipsError;
    }

    const profileIds =
      (
        memberships ?? []
      ).map(
        (membership) =>
          membership.profile_id
      );

    const {
      data: profiles,
      error: profilesError,
    } =
      profileIds.length > 0
        ? await admin
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
            )
        : {
            data: [],
            error: null,
          };

    if (
      profilesError
    ) {
      throw profilesError;
    }

    const {
      data:
        clientMemberships,
      error:
        clientMembershipError,
    } =
      profileIds.length > 0
        ? await admin
            .from(
              "client_members"
            )
            .select(
              `
              profile_id,
              client_id
              `
            )
            .in(
              "profile_id",
              profileIds
            )
        : {
            data: [],
            error: null,
          };

    if (
      clientMembershipError
    ) {
      throw clientMembershipError;
    }

    const {
      data: clients,
      error: clientsError,
    } =
      await admin
        .from("clients")
        .select(
          `
          id,
          name
          `
        )
        .eq(
          "organization_id",
          workspace.data
            .organizationId
        )
        .order(
          "name",
          {
            ascending: true,
          }
        );

    if (
      clientsError
    ) {
      throw clientsError;
    }

    /*
     * Get Supabase Auth emails.
     */
    const {
      data: authUsersData,
      error:
        authUsersError,
    } =
      await admin.auth.admin
        .listUsers({
          page: 1,
          perPage: 1000,
        });

    if (
      authUsersError
    ) {
      throw authUsersError;
    }

    const profileMap =
      new Map(
        (
          profiles ?? []
        ).map(
          (profile) => [
            profile.id,
            profile,
          ]
        )
      );

    const authMap =
      new Map(
        (
          authUsersData.users ??
          []
        ).map(
          (user) => [
            user.id,
            user,
          ]
        )
      );

    const clientMembershipMap =
      new Map(
        (
          clientMemberships ??
          []
        ).map(
          (membership) => [
            membership.profile_id,
            membership.client_id,
          ]
        )
      );

    const clientMap =
      new Map(
        (
          clients ?? []
        ).map(
          (client) => [
            client.id,
            client.name,
          ]
        )
      );

    const users =
      (
        memberships ?? []
      ).map(
        (membership) => {
          const profile =
            profileMap.get(
              membership.profile_id
            );

          const authUser =
            authMap.get(
              membership.profile_id
            );

          const clientId =
            clientMembershipMap.get(
              membership.profile_id
            ) ?? null;

          return {
            id:
              membership.profile_id,

            profile_id:
              membership.profile_id,

            full_name:
              profile?.full_name ||
              authUser
                ?.user_metadata
                ?.full_name ||
              authUser?.email ||
              "CreatorOps User",

            fullName:
              profile?.full_name ||
              authUser
                ?.user_metadata
                ?.full_name ||
              authUser?.email ||
              "CreatorOps User",

            email:
              authUser?.email ||
              "",

            role:
              membership.role,

            is_active:
              membership.is_active,

            isActive:
              membership.is_active,

            client_id:
              clientId,

            clientId,

            client_name:
              clientId
                ? clientMap.get(
                    clientId
                  ) ?? null
                : null,

            clientName:
              clientId
                ? clientMap.get(
                    clientId
                  ) ?? null
                : null,
          };
        }
      );

    return NextResponse.json({
      users,

      clients:
        clients ?? [],
    });
  } catch (error) {
    console.error(
      "Admin users GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load users.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request
) {
  let createdUserId:
    | string
    | null = null;

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

    if (
      workspace.data.role !==
      "admin"
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

    const body =
      await request.json();

    /*
     * Accept both camelCase and
     * snake_case so the existing
     * Admin UI remains compatible.
     */
    const fullName =
      typeof body.fullName ===
      "string"
        ? body.fullName.trim()
        : typeof body.full_name ===
            "string"
          ? body.full_name.trim()
          : "";

    const email =
      typeof body.email ===
      "string"
        ? body.email
            .trim()
            .toLowerCase()
        : "";

    const password =
      typeof body.password ===
      "string"
        ? body.password
        : "";

    const role =
      body.role;

    const clientId =
      typeof body.clientId ===
      "string"
        ? body.clientId
        : typeof body.client_id ===
            "string"
          ? body.client_id
          : null;

    if (
      fullName.length < 2
    ) {
      return NextResponse.json(
        {
          error:
            "Full name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          error:
            "Email is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      password.length < 8
    ) {
      return NextResponse.json(
        {
          error:
            "Password must contain at least 8 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !validRole(role)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid role.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      role === "client" &&
      !clientId
    ) {
      return NextResponse.json(
        {
          error:
            "A Client account must be assigned to a client.",
        },
        {
          status: 400,
        }
      );
    }

    const admin =
      createAdminClient();

    /*
     * Verify client belongs to the
     * same CreatorOps organization.
     */
    if (
      role === "client" &&
      clientId
    ) {
      const {
        data: client,
        error:
          clientError,
      } =
        await admin
          .from("clients")
          .select(
            `
            id,
            organization_id
            `
          )
          .eq(
            "id",
            clientId
          )
          .eq(
            "organization_id",
            workspace.data
              .organizationId
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
    }

    /*
     * Create the Supabase Auth user.
     *
     * email_confirm:true means:
     *
     * NO verification email is needed.
     * NO real inbox is required.
     *
     * This is appropriate here because
     * the account is created directly
     * by an authenticated workspace
     * Administrator.
     */
    const {
      data: authData,
      error: authError,
    } =
      await admin.auth.admin
        .createUser({
          email,
          password,

          email_confirm:
            true,

          user_metadata: {
            full_name:
              fullName,
          },
        });

    if (
      authError ||
      !authData.user
    ) {
      return NextResponse.json(
        {
          error:
            authError?.message ||
            "Unable to create user.",
        },
        {
          status: 400,
        }
      );
    }

    createdUserId =
      authData.user.id;

    /*
     * The project's auth trigger may
     * already create the profile row.
     * Upsert makes this safe either way.
     */
    const {
      error: profileError,
    } =
      await admin
        .from("profiles")
        .upsert(
          {
            id:
              createdUserId,

            full_name:
              fullName,
          },
          {
            onConflict:
              "id",
          }
        );

    if (
      profileError
    ) {
      throw profileError;
    }

    const {
      error:
        membershipError,
    } =
      await admin
        .from(
          "organization_members"
        )
        .insert({
          organization_id:
            workspace.data
              .organizationId,

          profile_id:
            createdUserId,

          role,

          is_active:
            true,
        });

    if (
      membershipError
    ) {
      throw membershipError;
    }

    /*
     * Link client-role accounts to
     * their assigned client company.
     */
    if (
      role === "client" &&
      clientId
    ) {
      const {
        error:
          clientMemberError,
      } =
        await admin
          .from(
            "client_members"
          )
          .insert({
            client_id:
              clientId,

            profile_id:
              createdUserId,
          });

      if (
        clientMemberError
      ) {
        throw clientMemberError;
      }
    }

    /*
     * Record administration action.
     */
    await admin
      .from("audit_logs")
      .insert({
        organization_id:
          workspace.data
            .organizationId,

        actor_id:
          workspace.data
            .userId,

        action:
          "user_created",

        entity_type:
          "profile",

        entity_id:
          createdUserId,

        metadata: {
          full_name:
            fullName,

          email,

          role,

          client_id:
            role === "client"
              ? clientId
              : null,
        },
      });

    return NextResponse.json(
      {
        success: true,

        user: {
          id:
            createdUserId,

          full_name:
            fullName,

          fullName,

          email,

          role,

          is_active:
            true,

          isActive:
            true,

          client_id:
            role === "client"
              ? clientId
              : null,

          clientId:
            role === "client"
              ? clientId
              : null,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Admin users POST error:",
      error
    );

    /*
     * If the Auth account was created
     * but a database step failed,
     * remove it so no orphaned demo
     * account remains.
     */
    if (createdUserId) {
      try {
        const admin =
          createAdminClient();

        await admin.auth.admin
          .deleteUser(
            createdUserId
          );
      } catch (
        cleanupError
      ) {
        console.error(
          "User cleanup error:",
          cleanupError
        );
      }
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create user.",
      },
      {
        status: 500,
      }
    );
  }
}