import {
  BarChart3,
} from "lucide-react";

import {
  redirect,
} from "next/navigation";

import AnalyticsDashboard from "@/components/analytics-dashboard";
import { getWorkspaceContext } from "@/lib/auth/workspace";

export default async function AnalyticsPage() {
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
          <BarChart3
            size={21}
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Analytics
          </h1>

          <p className="mt-2 max-w-2xl text-slate-500">
            Measure content and
            campaign performance
            using metrics connected
            directly to the
            CreatorOps publishing
            workflow.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <AnalyticsDashboard />
      </div>
    </div>
  );
}