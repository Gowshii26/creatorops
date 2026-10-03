"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  BadgeCheck,
  Building2,
  Check,
  Loader2,
  LockKeyhole,
  Mail,
  RefreshCw,
  Save,
  UserRound,
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

type ProfileData = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  organizationId: string;
  organizationName: string;
};

function formatRole(
  role: string
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

  if (
    role === "client"
  ) {
    return "Client";
  }

  return role;
}

export default function ProfileSettings() {
  const [
    profile,
    setProfile,
  ] =
    useState<ProfileData | null>(
      null
    );

  const [
    fullName,
    setFullName,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const loadProfile =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const response =
            await fetch(
              "/api/settings",
              {
                cache:
                  "no-store",
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.error ||
                "Unable to load profile."
            );
          }

          setProfile(
            data.profile
          );

          setFullName(
            data.profile
              .fullName
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load profile."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function saveProfile(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          "/api/settings",
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                fullName,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to update profile."
        );
      }

      setProfile(
        (current) =>
          current
            ? {
                ...current,

                fullName:
                  data.profile
                    .fullName,
              }
            : current
      );

      setSuccess(
        "Profile updated successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[350px] items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2
          size={18}
          className="animate-spin"
        />

        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error ||
          "Profile unavailable."}
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      {/* PROFILE */}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">
            Profile
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage your personal
            CreatorOps profile.
          </p>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <Check
              size={16}
            />

            {success}
          </div>
        )}

        <form
          onSubmit={
            saveProfile
          }
          className="mt-6 space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="full-name">
              Full Name
            </Label>

            <div className="relative">
              <UserRound
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <Input
                id="full-name"
                value={
                  fullName
                }
                onChange={(event) =>
                  setFullName(
                    event.target
                      .value
                  )
                }
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Email Address
            </Label>

            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <Input
                value={
                  profile.email
                }
                disabled
                className="pl-9"
              />
            </div>

            <p className="text-xs text-slate-400">
              Authentication email is
              managed by Supabase Auth.
            </p>
          </div>

          <Button
            type="submit"
            disabled={
              saving ||
              fullName.trim() ===
                profile.fullName
            }
          >
            {saving ? (
              <Loader2
                size={15}
                className="mr-2 animate-spin"
              />
            ) : (
              <Save
                size={15}
                className="mr-2"
              />
            )}

            {saving
              ? "Saving..."
              : "Save Profile"}
          </Button>
        </form>
      </section>

      {/* WORKSPACE */}

      <div className="space-y-6">
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Workspace
          </h2>

          <div className="mt-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                <Building2
                  size={18}
                />
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">
                  Organization
                </p>

                <p className="mt-1 font-semibold">
                  {
                    profile.organizationName
                  }
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                <BadgeCheck
                  size={18}
                />
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">
                  Role
                </p>

                <p className="mt-1 font-semibold">
                  {formatRole(
                    profile.role
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
              <LockKeyhole
                size={18}
              />
            </div>

            <div>
              <h2 className="font-semibold">
                Account Security
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Authentication and
                session security are
                handled through
                Supabase Auth.
              </p>
            </div>
          </div>
        </section>

        <Button
          type="button"
          variant="outline"
          onClick={
            loadProfile
          }
        >
          <RefreshCw
            size={14}
            className="mr-2"
          />

          Refresh Account
        </Button>
      </div>
    </div>
  );
}