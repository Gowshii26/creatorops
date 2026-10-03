import {
  ClipboardCheck,
} from "lucide-react";

import {
  redirect,
} from "next/navigation";

import ApprovalQueue from "@/components/approval-queue";
import { getWorkspaceContext } from "@/lib/auth/workspace";

export default async function ApprovalsPage() {
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
          <ClipboardCheck
            size={21}
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Approvals
          </h1>

          <p className="mt-2 max-w-2xl text-slate-500">
            Review content requiring
            action and move creative
            work through the
            CreatorOps approval
            lifecycle.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <ApprovalQueue
          currentRole={
            workspace.data.role
          }
        />
      </div>
    </div>
  );
}