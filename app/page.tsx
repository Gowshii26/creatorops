import {
  LayoutDashboard,
} from "lucide-react";

import {
  redirect,
} from "next/navigation";

import DashboardOverview from "@/components/dashboard-overview";
import { getWorkspaceContext } from "@/lib/auth/workspace";

export default async function DashboardPage() {
  const workspace =
    await getWorkspaceContext();

  if (!workspace.data) {
    if (
      workspace.status ===
      401
    ) {
      redirect("/login");
    }

    redirect("/onboarding");
  }

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black text-white">
          <LayoutDashboard
            size={21}
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard
          </h1>

          <p className="mt-2 max-w-2xl text-slate-500">
            Live workspace overview
            for campaigns, content,
            approvals, publishing and
            notifications.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <DashboardOverview />
      </div>
    </div>
  );
}