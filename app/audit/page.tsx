import {
  ShieldCheck,
} from "lucide-react";

import {
  redirect,
} from "next/navigation";

import AuditTrail from "@/components/audit-trail";

import {
  getWorkspaceContext,
} from "@/lib/auth/workspace";

export default async function AuditPage() {
  const workspace =
    await getWorkspaceContext();

  if (!workspace.data) {
    if (
      workspace.status ===
      401
    ) {
      redirect(
        "/login"
      );
    }

    redirect(
      "/onboarding"
    );
  }

  /*
   * Audit Trail is intentionally
   * limited to operational roles.
   */
  if (
    workspace.data.role !==
      "admin" &&
    workspace.data.role !==
      "manager"
  ) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black text-white">
          <ShieldCheck
            size={21}
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Audit Trail
          </h1>

          <p className="mt-2 max-w-2xl text-slate-500">
            Review traceable
            CreatorOps activity
            across content,
            approvals, media,
            reports and workspace
            operations.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <AuditTrail />
      </div>
    </div>
  );
}