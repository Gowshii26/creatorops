import {
  Building2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import AdminUserManagement from "@/components/admin-user-management";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

export default async function AdminPage() {
  const supabase =
    await createClient();

  const {
    data: claimsData,
  } =
    await supabase.auth.getClaims();

  const userId =
    claimsData?.claims?.sub;

  if (
    !userId ||
    typeof userId !== "string"
  ) {
    redirect("/login");
  }

  const {
    data: membership,
  } =
    await supabase
      .from(
        "organization_members"
      )
      .select(
        "role, organization_id"
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
    !membership ||
    membership.role !==
      "admin"
  ) {
    redirect("/");
  }

  const {
    data: organization,
  } =
    await supabase
      .from("organizations")
      .select(
        "name, slug"
      )
      .eq(
        "id",
        membership.organization_id
      )
      .maybeSingle();

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-8">
      {/* HEADER */}

      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck
            size={22}
          />

          <Badge>
            Administrator
          </Badge>
        </div>

        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Administration
        </h1>

        <p className="mt-2 max-w-2xl text-slate-500">
          Manage authenticated
          users and role-based
          access for{" "}
          <span className="font-medium text-slate-700">
            {organization?.name ??
              "CreatorOps"}
          </span>
          .
        </p>
      </div>

      {/* REAL USER MANAGEMENT */}

      <AdminUserManagement />

      {/* SECURITY INFORMATION */}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <Building2
                size={19}
              />
            </div>

            <CardTitle className="pt-2">
              Workspace
            </CardTitle>

            <CardDescription>
              Multi-tenant
              organization boundary.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <p className="text-sm font-semibold">
              {organization?.name ??
                "CreatorOps"}
            </p>

            {organization?.slug && (
              <p className="mt-1 text-xs text-slate-500">
                {
                  organization.slug
                }
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <LockKeyhole
                size={19}
              />
            </div>

            <CardTitle className="pt-2">
              Security
            </CardTitle>

            <CardDescription>
              Authentication,
              server-side
              authorization and
              database RLS.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="outline">
              Supabase Auth
            </Badge>

            <Badge variant="outline">
              PostgreSQL RLS
            </Badge>

            <Badge variant="outline">
              Server Admin API
            </Badge>

            <Badge variant="outline">
              Audit Logging
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}