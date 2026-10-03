import { createClient } from "@/lib/supabase/server";

export type AppRole =
  | "admin"
  | "manager"
  | "creator"
  | "client";

export type WorkspaceContext = {
  userId: string;
  organizationId: string;
  role: AppRole;
};

type WorkspaceContextResult =
  | {
      data: WorkspaceContext;
      error: null;
      status: 200;
    }
  | {
      data: null;
      error: string;
      status: number;
    };

function normalizeRole(
  role: string | null
): AppRole | null {
  if (role === "admin") {
    return "admin";
  }

  if (role === "manager") {
    return "manager";
  }

  if (role === "creator") {
    return "creator";
  }

  if (role === "client") {
    return "client";
  }

  return null;
}

export async function getWorkspaceContext(): Promise<WorkspaceContextResult> {
  const supabase =
    await createClient();

  // ---------------------------------------------
  // 1. VERIFY AUTHENTICATED USER
  // ---------------------------------------------

  const {
    data: claimsData,
    error: claimsError,
  } =
    await supabase.auth.getClaims();

  if (claimsError) {
    return {
      data: null,
      error:
        "Authentication failed.",
      status: 401,
    };
  }

  const userId =
    claimsData?.claims?.sub;

  if (
    !userId ||
    typeof userId !== "string"
  ) {
    return {
      data: null,
      error:
        "You must be signed in.",
      status: 401,
    };
  }

  // ---------------------------------------------
  // 2. GET ACTIVE WORKSPACE MEMBERSHIP
  // ---------------------------------------------

  const {
    data: membership,
    error: membershipError,
  } =
    await supabase
      .from(
        "organization_members"
      )
      .select(
        "organization_id, role"
      )
      .eq(
        "profile_id",
        userId
      )
      .eq(
        "is_active",
        true
      )
      .limit(1)
      .maybeSingle();

  if (
    membershipError ||
    !membership
  ) {
    return {
      data: null,
      error:
        "Workspace membership not found.",
      status: 403,
    };
  }

  // ---------------------------------------------
  // 3. NORMALIZE ROLE
  // ---------------------------------------------

  const role =
    normalizeRole(
      membership.role
    );

  if (!role) {
    return {
      data: null,
      error:
        "Invalid workspace role.",
      status: 403,
    };
  }

  // ---------------------------------------------
  // 4. RETURN WORKSPACE CONTEXT
  // ---------------------------------------------

  return {
    data: {
      userId,

      organizationId:
        membership.organization_id,

      role,
    },

    error: null,

    status: 200,
  };
}