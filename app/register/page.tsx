"use client";

import {
  useState,
  type FormEvent,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { data, error } =
      await supabase.auth.signUp({
        email,
        password,

        options: {
          data: {
            full_name: fullName,
          },

          emailRedirectTo:
            `${window.location.origin}/auth/callback`,
        },
      });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Email confirmation disabled
    if (data.session) {
      router.replace("/");
      router.refresh();
      return;
    }

    // Email confirmation enabled
    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2
              size={30}
              className="text-green-600"
            />
          </div>

          <h1 className="mt-5 text-2xl font-bold">
            Check your email
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            A confirmation link was sent to{" "}
            <span className="font-medium text-slate-800">
              {email}
            </span>
            .
          </p>

          <Link href="/login">
            <Button className="mt-6 w-full">
              Return to Login
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-slate-50">
      {/* BRAND */}
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
          <h1 className="text-5xl font-bold leading-tight">
            Build better content workflows.
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-400">
            Bring campaigns, content, approvals and performance
            into one collaborative workspace.
          </p>
        </div>

        <p className="text-sm text-slate-500">
          Secure · Collaborative · Cloud-native
        </p>
      </section>

      {/* REGISTER FORM */}
      <section className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div>
            <h2 className="text-3xl font-bold">
              Create your account
            </h2>

            <p className="mt-2 text-slate-500">
              Get started with CreatorOps.
            </p>
          </div>

          <form
            onSubmit={handleRegister}
            className="mt-8 space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="full-name">
                Full Name
              </Label>

              <div className="relative">
                <UserRound
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <Input
                  id="full-name"
                  placeholder="Your name"
                  className="pl-10"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email
              </Label>

              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  className="pl-10"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
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
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  className="pl-10"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  minLength={8}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">
                Confirm Password
              </Label>

              <Input
                id="confirm-password"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                minLength={8}
                required
              />
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
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={17} />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-black hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}