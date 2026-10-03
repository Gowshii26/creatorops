import {
  Building2,
} from "lucide-react";

import {
  redirect,
} from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import ClientManagement from "@/components/client-management";

export default async function ClientsPage() {
  const supabase =
    await createClient();

  // ---------------------------------------------
  // 1. VERIFY AUTHENTICATED USER
  // ---------------------------------------------

  const {
    data: claimsData,
  } =
    await supabase.auth.getClaims();

  const userId =
    claimsData?.claims?.sub;

  if (
    !userId ||
    typeof userId !==
      "string"
  ) {
    redirect("/login");
  }

  // ---------------------------------------------
  // 2. GET WORKSPACE ROLE
  // ---------------------------------------------

  const {
    data: membership,
    error:
      membershipError,
  } =
    await supabase
      .from(
        "organization_members"
      )
      .select(
        "role"
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
    redirect(
      "/onboarding"
    );
  }

  // ---------------------------------------------
  // 3. ONLY ADMIN / MANAGER MAY MANAGE CLIENTS
  // ---------------------------------------------

  if (
    membership.role !==
      "admin" &&
    membership.role !==
      "manager"
  ) {
    redirect("/");
  }

  // ---------------------------------------------
  // 4. RENDER REAL CLIENT MANAGEMENT UI
  // ---------------------------------------------

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black text-white">
          <Building2
            size={21}
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Clients
          </h1>

          <p className="mt-2 max-w-2xl text-slate-500">
            Manage client
            organizations,
            contacts and
            relationships used
            across CreatorOps
            campaigns and content.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <ClientManagement />
      </div>
    </div>
  );
}