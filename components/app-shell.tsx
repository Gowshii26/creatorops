"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ElementType,
  type ReactNode,
} from "react";

import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  FileChartColumnIncreasing,
  FileText,
  History,
  Images,
  LayoutDashboard,
  Megaphone,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import LogoutButton from "@/components/logout-button";
import { createClient } from "@/lib/supabase/client";

type AppRole =
  | "admin"
  | "manager"
  | "creator"
  | "client";

type CurrentIdentity = {
  id: string;
  fullName: string;
  email: string;
  role: AppRole;
  organizationId: string;
  organizationName: string;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: ElementType;
  roles: AppRole[];
};

const navigation: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    roles: [
      "admin",
      "manager",
      "creator",
      "client",
    ],
  },

  {
    label: "Campaigns",
    href: "/campaigns",
    icon: Megaphone,
    roles: [
      "admin",
      "manager",
      "creator",
      "client",
    ],
  },

  {
    label: "Content",
    href: "/content",
    icon: FileText,
    roles: [
      "admin",
      "manager",
      "creator",
      "client",
    ],
  },

  {
    label: "Calendar",
    href: "/calendar",
    icon: CalendarDays,
    roles: [
      "admin",
      "manager",
      "creator",
    ],
  },

  {
    label: "Media Library",
    href: "/media",
    icon: Images,
    roles: [
      "admin",
      "manager",
      "creator",
      "client",
    ],
  },

  {
    label: "Approvals",
    href: "/approvals",
    icon: CheckCircle2,
    roles: [
      "admin",
      "manager",
      "creator",
      "client",
    ],
  },

  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
    roles: [
      "admin",
      "manager",
      "creator",
      "client",
    ],
  },

  {
    label: "Clients",
    href: "/clients",
    icon: Users,
    roles: [
      "admin",
      "manager",
    ],
  },

  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    roles: [
      "admin",
      "manager",
      "creator",
      "client",
    ],
  },

  {
    label: "Reports",
    href: "/reports",
    icon: FileChartColumnIncreasing,
    roles: [
      "admin",
      "manager",
      "client",
    ],
  },

  {
    label: "Audit Trail",
    href: "/audit",
    icon: History,
    roles: [
      "admin",
      "manager",
    ],
  },

  {
    label: "Administration",
    href: "/admin",
    icon: ShieldCheck,
    roles: [
      "admin",
    ],
  },
];

function normalizeRole(
  role: string | null
): AppRole | null {
  if (
    role === "admin"
  ) {
    return "admin";
  }

  if (
    role === "manager"
  ) {
    return "manager";
  }

  if (
    role === "creator"
  ) {
    return "creator";
  }

  if (
    role === "client"
  ) {
    return "client";
  }

  return null;
}

function formatRole(
  role: AppRole
) {
  if (
    role === "admin"
  ) {
    return "Administrator";
  }

  if (
    role === "manager"
  ) {
    return "Manager";
  }

  if (
    role === "creator"
  ) {
    return "Creator";
  }

  return "Client";
}

function getInitials(
  name: string,
  email: string
) {
  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    parts.length >= 2
  ) {
    return (
      parts[0][0] +
      parts[
        parts.length - 1
      ][0]
    ).toUpperCase();
  }

  if (
    parts.length === 1
  ) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return email
    .slice(0, 2)
    .toUpperCase();
}

export default function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const supabase =
    useMemo(
      () => createClient(),
      []
    );

  const [
    identity,
    setIdentity,
  ] =
    useState<
      CurrentIdentity | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const barePage =
    pathname.startsWith(
      "/login"
    ) ||
    pathname.startsWith(
      "/register"
    ) ||
    pathname.startsWith(
      "/auth"
    ) ||
    pathname.startsWith(
      "/onboarding"
    );

  useEffect(() => {
    if (barePage) {
      setLoading(false);
      return;
    }

    let cancelled =
      false;

    async function loadIdentity() {
      setLoading(true);

      const {
        data: userData,
        error: userError,
      } =
        await supabase.auth
          .getUser();

      if (
        userError ||
        !userData.user
      ) {
        if (!cancelled) {
          setIdentity(null);
          setLoading(false);

          router.replace(
            "/login"
          );
        }

        return;
      }

      const user =
        userData.user;

      const [
        profileResult,
        membershipResult,
      ] =
        await Promise.all([
          supabase
            .from("profiles")
            .select(
              "full_name"
            )
            .eq(
              "id",
              user.id
            )
            .maybeSingle(),

          supabase
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
              user.id
            )
            .eq(
              "is_active",
              true
            )
            .limit(1)
            .maybeSingle(),
        ]);

      if (
        membershipResult.error
      ) {
        console.error(
          "Membership error:",
          membershipResult.error
        );
      }

      /*
       * A user with no membership
       * is NOT sent to onboarding.
       *
       * Onboarding is only for
       * initial workspace creation.
       */
      if (
        !membershipResult.data
      ) {
        await supabase.auth
          .signOut();

        if (!cancelled) {
          setIdentity(null);
          setLoading(false);

          router.replace(
            "/login"
          );
        }

        return;
      }

      const role =
        normalizeRole(
          membershipResult.data
            .role
        );

      if (!role) {
        await supabase.auth
          .signOut();

        if (!cancelled) {
          setIdentity(null);
          setLoading(false);

          router.replace(
            "/login"
          );
        }

        return;
      }

      const {
        data: organization,
        error:
          organizationError,
      } =
        await supabase
          .from(
            "organizations"
          )
          .select(
            "id, name"
          )
          .eq(
            "id",
            membershipResult.data
              .organization_id
          )
          .maybeSingle();

      if (
        organizationError ||
        !organization
      ) {
        console.error(
          "Organization error:",
          organizationError
        );

        await supabase.auth
          .signOut();

        if (!cancelled) {
          setIdentity(null);
          setLoading(false);

          router.replace(
            "/login"
          );
        }

        return;
      }

      const currentIdentity:
        CurrentIdentity = {
        id:
          user.id,

        fullName:
          profileResult.data
            ?.full_name ||
          user.user_metadata
            ?.full_name ||
          user.email ||
          "CreatorOps User",

        email:
          user.email ||
          "",

        role,

        organizationId:
          organization.id,

        organizationName:
          organization.name,
      };

      if (!cancelled) {
        setIdentity(
          currentIdentity
        );

        setLoading(false);
      }
    }

    loadIdentity();

    return () => {
      cancelled = true;
    };
  }, [
    barePage,
    router,
    supabase,
  ]);

  if (barePage) {
    return (
      <>
        {children}
      </>
    );
  }

  if (
    loading ||
    !identity
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white">
            <Sparkles
              size={20}
              className="animate-pulse"
            />
          </div>

          <p className="mt-4 text-sm font-medium text-slate-700">
            Loading CreatorOps...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Preparing your
            workspace
          </p>
        </div>
      </div>
    );
  }

  const visibleNavigation =
    navigation.filter(
      (item) =>
        item.roles.includes(
          identity.role
        )
    );

  const initials =
    getInitials(
      identity.fullName,
      identity.email
    );

  function isActive(
    href: string
  ) {
    if (
      href === "/"
    ) {
      return (
        pathname === "/"
      );
    }

    return (
      pathname === href ||
      pathname.startsWith(
        `${href}/`
      )
    );
  }

  const settingsActive =
    pathname ===
      "/settings" ||
    pathname.startsWith(
      "/settings/"
    );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* DESKTOP */}

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r bg-white lg:flex">
        <div className="border-b px-6 py-6">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
              <Sparkles
                size={18}
              />
            </div>

            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight">
                CreatorOps
              </h1>

              <p className="mt-0.5 truncate text-xs text-slate-500">
                {
                  identity.organizationName
                }
              </p>
            </div>
          </Link>
        </div>

        <div className="px-4 pt-5">
          <div className="rounded-xl border bg-slate-50 px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Current workspace
            </p>

            <p className="mt-1 truncate text-sm font-semibold">
              {
                identity.organizationName
              }
            </p>

            <div className="mt-2 inline-flex rounded-full bg-black px-2.5 py-1 text-[11px] font-semibold text-white">
              {
                formatRole(
                  identity.role
                )
              }
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          <nav className="space-y-1">
            {visibleNavigation.map(
              (item) => {
                const Icon =
                  item.icon;

                const active =
                  isActive(
                    item.href
                  );

                return (
                  <Link
                    key={
                      item.label
                    }
                    href={
                      item.href
                    }
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-black text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-black"
                    }`}
                  >
                    <Icon
                      size={18}
                    />

                    {
                      item.label
                    }
                  </Link>
                );
              }
            )}
          </nav>
        </div>

        <div className="border-t p-3">
          <Link
            href="/settings"
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              settingsActive
                ? "bg-black text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-black"
            }`}
          >
            <Settings
              size={18}
            />

            Settings
          </Link>

          <LogoutButton />

          <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-100 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {
                  identity.fullName
                }
              </p>

              <p className="truncate text-xs text-slate-500">
                {
                  formatRole(
                    identity.role
                  )
                }
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER */}

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-5 lg:hidden">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
            <Sparkles
              size={15}
            />
          </div>

          CreatorOps
        </Link>

        <div className="rounded-full bg-black px-3 py-1.5 text-xs font-medium text-white">
          {
            formatRole(
              identity.role
            )
          }
        </div>
      </header>

      {/* MOBILE NAV */}

      <div className="border-b bg-white px-4 py-2 lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {visibleNavigation.map(
            (item) => {
              const Icon =
                item.icon;

              const active =
                isActive(
                  item.href
                );

              return (
                <Link
                  key={
                    item.label
                  }
                  href={
                    item.href
                  }
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                    active
                      ? "bg-black text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Icon
                    size={14}
                  />

                  {
                    item.label
                  }
                </Link>
              );
            }
          )}

          <Link
            href="/settings"
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
              settingsActive
                ? "bg-black text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <Settings
              size={14}
            />

            Settings
          </Link>
        </div>
      </div>

      <main className="lg:pl-64">
        {children}
      </main>
    </div>
  );
}