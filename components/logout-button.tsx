"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Loader2,
  LogOut,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  async function handleLogout() {
    setLoading(true);

    const supabase =
      createClient();

    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-black disabled:opacity-50"
    >
      {loading ? (
        <Loader2
          size={18}
          className="animate-spin"
        />
      ) : (
        <LogOut size={18} />
      )}

      {loading
        ? "Signing out..."
        : "Sign Out"}
    </button>
  );
}