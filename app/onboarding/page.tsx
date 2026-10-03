"use client";

import {
  useState,
  type FormEvent,
} from "react";

import { useRouter } from "next/navigation";

import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OnboardingPage() {
  const router = useRouter();

  const [name, setName] =
    useState("CreatorOps Demo Agency");

  const [slug, setSlug] =
    useState("creatorops-demo");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  function updateName(value: string) {
    setName(value);

    const generatedSlug = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setSlug(generatedSlug);
  }

  async function handleCreate(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const supabase =
      createClient();

    const {
      error: rpcError,
    } = await supabase.rpc(
      "create_workspace",
      {
        workspace_name: name,
        workspace_slug: slug,
      }
    );

    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);

    setTimeout(() => {
      router.replace("/");
      router.refresh();
    }, 1000);
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-2xl border bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2
              size={30}
              className="text-green-600"
            />
          </div>

          <h1 className="mt-5 text-2xl font-bold">
            Workspace created
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Your CreatorOps workspace is ready.
            You&apos;ve been assigned the Administrator role.
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2
              size={15}
              className="animate-spin"
            />

            Opening CreatorOps...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-slate-50">
      {/* LEFT */}
      <section className="hidden w-1/2 flex-col justify-between bg-black p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-black">
            <Sparkles size={20} />
          </div>

          <div>
            <p className="text-xl font-bold">
              CreatorOps
            </p>

            <p className="text-sm text-slate-400">
              Content Operations
            </p>
          </div>
        </div>

        <div className="max-w-lg">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-400">
            Workspace setup
          </p>

          <h1 className="mt-5 text-5xl font-bold leading-tight">
            Create your content operations workspace.
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-400">
            Your workspace keeps users, clients,
            campaigns and content securely separated
            from other organizations.
          </p>
        </div>

        <p className="text-sm text-slate-500">
          Multi-tenant SaaS architecture
        </p>
      </section>

      {/* FORM */}
      <section className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white">
            <Building2 size={21} />
          </div>

          <h2 className="mt-6 text-3xl font-bold">
            Create your workspace
          </h2>

          <p className="mt-2 text-slate-500">
            This will become your organization inside CreatorOps.
          </p>

          <form
            onSubmit={handleCreate}
            className="mt-8 space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="workspace-name">
                Workspace Name
              </Label>

              <Input
                id="workspace-name"
                value={name}
                onChange={(event) =>
                  updateName(
                    event.target.value
                  )
                }
                placeholder="e.g. Nova Creative Agency"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workspace-slug">
                Workspace URL
              </Label>

              <div className="flex overflow-hidden rounded-md border bg-white">
                <div className="flex items-center border-r bg-slate-50 px-3 text-sm text-slate-500">
                  creatorops /
                </div>

                <input
                  id="workspace-slug"
                  value={slug}
                  onChange={(event) =>
                    setSlug(
                      event.target.value
                        .toLowerCase()
                        .replace(
                          /[^a-z0-9-]/g,
                          ""
                        )
                    )
                  }
                  className="h-9 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                  placeholder="my-agency"
                  required
                />
              </div>

              <p className="text-xs text-slate-400">
                Lowercase letters, numbers and hyphens only.
              </p>
            </div>

            <div className="rounded-xl border bg-slate-50 p-4">
              <p className="text-sm font-semibold">
                Your initial role
              </p>

              <p className="mt-1 text-sm text-slate-500">
                The workspace creator automatically becomes an
                Administrator.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="h-11 w-full gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />

                  Creating workspace...
                </>
              ) : (
                <>
                  Create Workspace
                  <ArrowRight size={17} />
                </>
              )}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}