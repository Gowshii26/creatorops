import {
  FileText,
} from "lucide-react";

import {
  redirect,
} from "next/navigation";

import {
  getWorkspaceContext,
} from "@/lib/auth/workspace";

import ContentManagement from "@/components/content-management";

export default async function ContentPage() {
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
          <FileText
            size={21}
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Content
          </h1>

          <p className="mt-2 max-w-2xl text-slate-500">
            Create, assign, version
            and manage campaign
            content through the
            CreatorOps lifecycle.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <ContentManagement
          currentRole={
            workspace.data.role
          }
        />
      </div>
    </div>
  );
}