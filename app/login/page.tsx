"use client";

import {
  type FormEvent,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  PenTool,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  createClient,
} from "@/lib/supabase/client";

type AppRole =
  | "admin"
  | "manager"
  | "creator"
  | "client";

type RoleOption = {
  role: AppRole;
  label: string;
  title: string;
  description: string;
  icon: typeof ShieldCheck;
  permissions: string[];
};

const roleOptions: RoleOption[] = [
  {
    role: "admin",
    label: "Administrator",
    title: "Administrator Login",
    description:
      "Manage CreatorOps users, clients, campaigns and workspace operations.",
    icon: ShieldCheck,
    permissions: [
      "User & role management",
      "Client & campaign management",
      "Administration & audit access",
    ],
  },

  {
    role: "manager",
    label: "Manager",
    title: "Manager Login",
    description:
      "Coordinate campaigns, review content and manage publishing workflows.",
    icon: BriefcaseBusiness,
    permissions: [
      "Campaign management",
      "Internal content review",
      "Scheduling & publishing",
    ],
  },

  {
    role: "creator",
    label: "Creator",
    title: "Creator Login",
    description:
      "Create campaign content, upload creative assets and submit work for review.",
    icon: PenTool,
    permissions: [
      "Create & edit content",
      "Upload media",
      "Submit content for review",
    ],
  },

  {
    role: "client",
    label: "Client",
    title: "Client Login",
    description:
      "Review assigned campaign content, approve work and request revisions.",
    icon: Building2,
    permissions: [
      "Assigned campaign access",
      "Client approvals",
      "Analytics & reporting",
    ],
  },
];

function roleLabel(
  role: string
) {
  const match =
    roleOptions.find(
      (item) =>
        item.role === role
    );

  return (
    match?.label ??
    role
  );
}

export default function LoginPage() {
  const router =
    useRouter();

  const supabase =
    useMemo(
      () => createClient(),
      []
    );

  const [
    selectedRole,
    setSelectedRole,
  ] =
    useState<AppRole | null>(
      null
    );

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const activeRole =
    roleOptions.find(
      (item) =>
        item.role ===
        selectedRole
    ) ?? null;

  function chooseRole(
    role: AppRole
  ) {
    setSelectedRole(role);
    setEmail("");
    setPassword("");
    setError("");
    setShowPassword(false);
  }

  function backToRoles() {
    setSelectedRole(null);
    setEmail("");
    setPassword("");
    setError("");
    setShowPassword(false);
  }

  async function handleLogin(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedRole) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      /*
       * Remove any stale user session
       * before a new role signs in.
       */
      await supabase.auth.signOut();

      const {
        data,
        error:
          loginError,
      } =
        await supabase.auth
          .signInWithPassword({
            email:
              email.trim(),
            password,
          });

      if (
        loginError ||
        !data.user
      ) {
        throw new Error(
          loginError?.message ||
            "Invalid email or password."
        );
      }

      /*
       * Verify the REAL CreatorOps
       * role from the database.
       *
       * Selecting Manager/Creator/etc
       * does not grant that permission.
       */
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
            `
            organization_id,
            role,
            is_active
            `
          )
          .eq(
            "profile_id",
            data.user.id
          )
          .eq(
            "is_active",
            true
          )
          .limit(1)
          .maybeSingle();

      if (
        membershipError
      ) {
        await supabase.auth
          .signOut();

        throw new Error(
          "Unable to verify your CreatorOps role."
        );
      }

      if (!membership) {
        await supabase.auth
          .signOut();

        throw new Error(
          "This account has not been assigned to a CreatorOps workspace. Please contact the Administrator."
        );
      }

      if (
        membership.role !==
        selectedRole
      ) {
        const actualRole =
          roleLabel(
            membership.role
          );

        await supabase.auth
          .signOut();

        throw new Error(
          `This account is registered as ${actualRole}. Please use the ${actualRole} login portal.`
        );
      }

      router.replace("/");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * =====================================================
   * ROLE SELECTION SCREEN
   * =====================================================
   */

  if (!selectedRole) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white">
              <Sparkles
                size={19}
              />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">
                CreatorOps
              </h1>

              <p className="text-xs text-slate-500">
                Marketing Content
                Operations
              </p>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-12">
            <div className="text-center">
              <div className="inline-flex rounded-full border bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                Secure Role-Based
                Access
              </div>

              <h2 className="mt-5 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                Welcome to CreatorOps
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-500">
                Select your assigned
                role to access the
                appropriate workspace.
                CreatorOps verifies
                your permissions after
                authentication.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {roleOptions.map(
                (item) => {
                  const Icon =
                    item.icon;

                  return (
                    <button
                      key={
                        item.role
                      }
                      type="button"
                      onClick={() =>
                        chooseRole(
                          item.role
                        )
                      }
                      className="group flex min-h-[285px] flex-col rounded-2xl border bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-slate-400 hover:shadow-lg"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white transition group-hover:scale-105">
                        <Icon
                          size={21}
                        />
                      </div>

                      <h3 className="mt-5 text-lg font-semibold">
                        {
                          item.label
                        }
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {
                          item.description
                        }
                      </p>

                      <div className="mt-5 space-y-2">
                        {item.permissions.map(
                          (
                            permission
                          ) => (
                            <div
                              key={
                                permission
                              }
                              className="flex items-center gap-2 text-xs text-slate-500"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />

                              {
                                permission
                              }
                            </div>
                          )
                        )}
                      </div>

                      <div className="mt-auto pt-5 text-sm font-semibold">
                        Sign in as{" "}
                        {
                          item.label
                        }{" "}
                        →
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <p className="text-center text-xs text-slate-400">
            CreatorOps • Secure
            cloud workspace
          </p>
        </div>
      </main>
    );
  }

  const ActiveIcon =
    activeRole?.icon ??
    ShieldCheck;

  /*
   * =====================================================
   * LOGIN FORM
   * =====================================================
   */

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* LEFT */}

        <section className="hidden bg-black p-12 text-white lg:flex lg:flex-col">
          <button
            type="button"
            onClick={
              backToRoles
            }
            className="flex items-center gap-3 text-left"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-black">
              <Sparkles
                size={19}
              />
            </div>

            <div>
              <p className="text-lg font-bold">
                CreatorOps
              </p>

              <p className="text-xs text-white/60">
                Marketing Content
                Operations
              </p>
            </div>
          </button>

          <div className="my-auto max-w-lg">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black">
              <ActiveIcon
                size={25}
              />
            </div>

            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
              {
                activeRole?.label
              }{" "}
              Workspace
            </p>

            <h1 className="mt-4 text-4xl font-bold">
              {
                activeRole?.title
              }
            </h1>

            <p className="mt-5 text-base leading-7 text-white/65">
              {
                activeRole
                  ?.description
              }
            </p>

            <div className="mt-8 space-y-3">
              {activeRole?.permissions.map(
                (
                  permission
                ) => (
                  <div
                    key={
                      permission
                    }
                    className="flex items-center gap-3 text-sm text-white/75"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />

                    {
                      permission
                    }
                  </div>
                )
              )}
            </div>
          </div>

          <p className="text-xs text-white/40">
            Role selection never
            grants permissions.
            CreatorOps verifies the
            role assigned to your
            account.
          </p>
        </section>

        {/* FORM */}

        <section className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <button
              type="button"
              onClick={
                backToRoles
              }
              className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-black"
            >
              <ArrowLeft
                size={16}
              />

              Choose another role
            </button>

            <div className="lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white">
                <ActiveIcon
                  size={21}
                />
              </div>
            </div>

            <p className="mt-6 text-sm font-semibold text-slate-500 lg:mt-0">
              {
                activeRole?.label
              }{" "}
              Portal
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              {
                activeRole?.title
              }
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Enter the credentials
              assigned to your
              CreatorOps account.
            </p>

            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                {error}
              </div>
            )}

            <form
              onSubmit={
                handleLogin
              }
              className="mt-8 space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address
                </Label>

                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(
                      event
                    ) =>
                      setEmail(
                        event.target
                          .value
                      )
                    }
                    autoComplete="email"
                    placeholder="name@example.com"
                    className="h-11 pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Password
                </Label>

                <div className="relative">
                  <LockKeyhole
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <Input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      password
                    }
                    onChange={(
                      event
                    ) =>
                      setPassword(
                        event.target
                          .value
                      )
                    }
                    autoComplete="current-password"
                    className="h-11 pl-10 pr-11"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) =>
                          !value
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-black"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff
                        size={17}
                      />
                    ) : (
                      <Eye
                        size={17}
                      />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="h-11 w-full"
                disabled={
                  loading
                }
              >
                {loading ? (
                  <>
                    <Loader2
                      size={16}
                      className="mr-2 animate-spin"
                    />

                    Verifying...
                  </>
                ) : (
                  <>
                    <ActiveIcon
                      size={16}
                      className="mr-2"
                    />

                    Sign in as{" "}
                    {
                      activeRole?.label
                    }
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 rounded-xl border bg-white p-4">
              <div className="flex gap-3">
                <ShieldCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-slate-500"
                />

                <p className="text-xs leading-5 text-slate-500">
                  The selected portal
                  must match the role
                  assigned to your
                  account in CreatorOps.
                </p>
              </div>
            </div>

            {selectedRole ===
            "admin" ? (
              <p className="mt-7 text-center text-sm text-slate-500">
                Creating a new
                workspace?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-black hover:underline"
                >
                  Register
                </Link>
              </p>
            ) : (
              <p className="mt-7 text-center text-sm text-slate-500">
                Need an account?
                Contact your
                CreatorOps
                Administrator.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}