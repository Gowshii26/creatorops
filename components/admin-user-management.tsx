"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  CheckCircle2,
  Loader2,
  Plus,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AppRole =
  | "admin"
  | "manager"
  | "creator"
  | "client";

type WorkspaceUser = {
  id: string;
  fullName: string;
  email: string;
  role: AppRole;
  active: boolean;
  joinedAt: string;
};

type ClientOption = {
  id: string;
  name: string;
};

function formatRole(
  role: AppRole
) {
  if (role === "admin") {
    return "Administrator";
  }

  if (role === "manager") {
    return "Manager";
  }

  if (role === "creator") {
    return "Creator";
  }

  return "Client";
}

export default function AdminUserManagement() {
  const [users, setUsers] =
    useState<WorkspaceUser[]>([]);

  const [clients, setClients] =
    useState<ClientOption[]>([]);

  const [
    loadingUsers,
    setLoadingUsers,
  ] =
    useState(true);

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [role, setRole] =
    useState<AppRole>(
      "manager"
    );

  const [
    clientId,
    setClientId,
  ] =
    useState("");

  const [error, setError] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const loadUsers =
    useCallback(
      async () => {
        setLoadingUsers(true);
        setError("");

        try {
          const response =
            await fetch(
              "/api/admin/users",
              {
                method: "GET",

                headers: {
                  Accept:
                    "application/json",
                },

                cache:
                  "no-store",
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.error ||
                "Unable to load users."
            );
          }

          setUsers(
            data.users ?? []
          );

          setClients(
            data.clients ?? []
          );
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Unable to load users.";

          setError(message);
        } finally {
          setLoadingUsers(false);
        }
      },
      []
    );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleCreateUser(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      role === "client" &&
      !clientId
    ) {
      setError(
        "Create/select a client company before creating a Client user."
      );

      return;
    }

    setSubmitting(true);

    try {
      const response =
        await fetch(
          "/api/admin/users",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                fullName,
                email,
                password,
                role,

                clientId:
                  role ===
                  "client"
                    ? clientId
                    : null,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to create user."
        );
      }

      setSuccess(
        `${fullName} was created successfully as ${formatRole(role)}.`
      );

      setFullName("");
      setEmail("");
      setPassword("");
      setRole("manager");
      setClientId("");

      await loadUsers();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to create user.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[420px_1fr]">
      {/* CREATE USER */}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white">
            <Plus size={18} />
          </div>

          <div>
            <h2 className="font-semibold">
              Add Workspace User
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Create a real Supabase
              account and assign its
              CreatorOps role.
            </p>
          </div>
        </div>

        <form
          onSubmit={
            handleCreateUser
          }
          className="mt-6 space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="fullName">
              Full Name
            </Label>

            <Input
              id="fullName"
              value={fullName}
              onChange={(event) =>
                setFullName(
                  event.target.value
                )
              }
              placeholder="e.g. Sarah Chen"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email
            </Label>

            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="sarah@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Temporary Password
            </Label>

            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Minimum 8 characters"
              minLength={8}
              required
            />

            <p className="text-xs leading-5 text-slate-400">
              Give this password to
              the user privately. We
              will add self-service
              password changing later.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">
              Role
            </Label>

            <select
              id="role"
              value={role}
              onChange={(event) => {
                const value =
                  event.target
                    .value as AppRole;

                setRole(value);

                if (
                  value !==
                  "client"
                ) {
                  setClientId(
                    ""
                  );
                }
              }}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="admin">
                Administrator
              </option>

              <option value="manager">
                Manager
              </option>

              <option value="creator">
                Creator
              </option>

              <option value="client">
                Client
              </option>
            </select>
          </div>

          {role ===
            "client" && (
            <div className="space-y-2">
              <Label htmlFor="client">
                Client Company
              </Label>

              {clients.length >
              0 ? (
                <select
                  id="client"
                  value={
                    clientId
                  }
                  onChange={(
                    event
                  ) =>
                    setClientId(
                      event
                        .target
                        .value
                    )
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  required
                >
                  <option value="">
                    Select client
                  </option>

                  {clients.map(
                    (
                      client
                    ) => (
                      <option
                        key={
                          client.id
                        }
                        value={
                          client.id
                        }
                      >
                        {
                          client.name
                        }
                      </option>
                    )
                  )}
                </select>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  No database
                  clients exist
                  yet. We&apos;ll
                  create Urban Brew
                  in the next CRUD
                  step.
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="flex gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle2
                size={17}
                className="mt-0.5 shrink-0"
              />

              <span>
                {success}
              </span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={
              submitting ||
              (
                role ===
                  "client" &&
                clients.length ===
                  0
              )
            }
          >
            {submitting ? (
              <>
                <Loader2
                  size={16}
                  className="mr-2 animate-spin"
                />

                Creating User...
              </>
            ) : (
              <>
                <Plus
                  size={16}
                  className="mr-2"
                />

                Create User
              </>
            )}
          </Button>
        </form>
      </section>

      {/* USER LIST */}

      <section className="rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b p-6">
          <div>
            <h2 className="font-semibold">
              Workspace Users
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Real authenticated
              members of this
              organization.
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
            <Users
              size={19}
            />
          </div>
        </div>

        {loadingUsers ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500">
            <Loader2
              size={18}
              className="animate-spin"
            />

            Loading users...
          </div>
        ) : users.length ===
          0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            No workspace
            members found.
          </div>
        ) : (
          <div className="divide-y">
            {users.map(
              (user) => (
                <div
                  key={user.id}
                  className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                      <UserRound
                        size={
                          17
                        }
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {
                          user.fullName
                        }
                      </p>

                      <p className="truncate text-xs text-slate-500">
                        {
                          user.email
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium">
                      {user.role ===
                        "admin" && (
                        <ShieldCheck
                          size={
                            12
                          }
                        />
                      )}

                      {
                        formatRole(
                          user.role
                        )
                      }
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        user.active
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {user.active
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}