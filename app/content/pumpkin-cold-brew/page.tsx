"use client";

import Link from "next/link";
import { useState } from "react";

import {
  ArrowLeft,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  FileText,
  History,
  MessageSquare,
  Send,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Role = "Manager" | "Reviewer" | "Client";

export default function ContentWorkspace() {
  const [role, setRole] = useState<Role>("Manager");
  const [status, setStatus] = useState("Client Review");
  const [message, setMessage] = useState("");

  function approveContent() {
    setStatus("Approved");
    setMessage("Content approved successfully.");
  }

  function requestChanges() {
    setStatus("Changes Requested");
    setMessage("Changes requested. The creator has been notified.");
  }

  function sendToClient() {
    setStatus("Client Review");
    setMessage("Content sent to the client for approval.");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <Link
            href="/campaigns/autumn-launch"
            className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-black"
          >
            <ArrowLeft size={16} />
            Back to Autumn Launch
          </Link>

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <p className="font-medium text-indigo-600">
                  Urban Brew
                </p>

                <span className="text-slate-300">/</span>

                <p className="text-sm text-slate-500">
                  Autumn Launch 2026
                </p>
              </div>

              <h1 className="text-3xl font-bold">
                Pumpkin Cold Brew Reel
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <StatusBadge status={status} />

                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <Camera size={15} />
                  Instagram Reel
                </div>

                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <CalendarDays size={15} />
                  4 Sep 2026
                </div>
              </div>
            </div>

            {/* DEMO PERSONA SWITCHER */}
            <div className="rounded-xl border bg-slate-50 p-2">
              <p className="mb-2 px-2 text-xs font-medium text-slate-500">
                Demo as
              </p>

              <div className="flex gap-1">
                {(["Manager", "Reviewer", "Client"] as Role[]).map(
                  (item) => (
                    <Button
                      key={item}
                      size="sm"
                      variant={role === item ? "default" : "ghost"}
                      onClick={() => {
                        setRole(item);
                        setMessage("");
                      }}
                    >
                      {item}
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {/* MESSAGE */}
        {message && (
          <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <CheckCircle2 size={18} />
            {message}
          </div>
        )}

        {/* PERSONA INFO */}
        <div className="flex items-center justify-between rounded-xl border bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <UserRound size={19} />
            </div>

            <div>
              <p className="text-sm font-semibold">
                Viewing as {role}
              </p>

              <p className="text-xs text-slate-500">
                {role === "Manager" &&
                  "Manage campaign progress and monitor approvals."}

                {role === "Reviewer" &&
                  "Review creative work before sending it to the client."}

                {role === "Client" &&
                  "Review assigned content and provide final approval."}
              </p>
            </div>
          </div>

          <Badge variant="secondary">
            Demo Mode
          </Badge>
        </div>

        {/* MAIN WORKSPACE */}
        <section className="grid gap-6 xl:grid-cols-[1fr_1.15fr_0.9fr]">
          {/* CREATIVE PREVIEW */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Creative Preview
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="mx-auto max-w-[360px] overflow-hidden rounded-[28px] border bg-white shadow-sm">
                {/* MOCK INSTAGRAM HEADER */}
                <div className="flex items-center gap-3 border-b p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                    UB
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      urbanbrew
                    </p>

                    <p className="text-[11px] text-slate-500">
                      Sponsored
                    </p>
                  </div>
                </div>

                {/* DEMO CREATIVE */}
                <div className="flex aspect-[4/5] items-center justify-center bg-gradient-to-br from-orange-100 via-amber-50 to-orange-200 p-8">
                  <div className="text-center">
                    <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/80 shadow">
                      <span className="text-5xl">
                        ☕
                      </span>
                    </div>

                    <p className="text-sm font-semibold uppercase tracking-widest text-orange-900">
                      Urban Brew
                    </p>

                    <h2 className="mt-3 text-3xl font-black leading-tight text-orange-950">
                      Pumpkin
                      <br />
                      Cold Brew
                    </h2>

                    <p className="mt-4 text-sm text-orange-900">
                      Autumn has arrived.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 p-4">
                  <p className="text-sm font-semibold">
                    ♡ 2,842 likes
                  </p>

                  <p className="text-sm leading-5">
                    <span className="font-semibold">
                      urbanbrew
                    </span>{" "}
                    Autumn just got colder 🍂☕
                  </p>

                  <p className="text-xs text-slate-400">
                    View all 128 comments
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CONTENT DETAILS */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Content Details
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <DetailRow
                label="Status"
                value={<StatusBadge status={status} />}
              />

              <DetailRow
                label="Creator"
                value="Sarah Chen"
              />

              <DetailRow
                label="Reviewer"
                value="James Morgan"
              />

              <DetailRow
                label="Publish Date"
                value="4 September 2026 · 6:30 PM"
              />

              <DetailRow
                label="Platform"
                value="Instagram Reel"
              />

              <div className="border-t pt-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Caption
                </p>

                <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  Autumn just got colder 🍂☕
                  <br />
                  <br />
                  Meet our new Pumpkin Cold Brew — smooth cold brew,
                  pumpkin spice and autumn flavour in every sip.
                  <br />
                  <br />
                  Available from 4 September.
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Hashtags
                </p>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    #UrbanBrew
                  </Badge>

                  <Badge variant="secondary">
                    #PumpkinColdBrew
                  </Badge>

                  <Badge variant="secondary">
                    #AutumnDrinks
                  </Badge>

                  <Badge variant="secondary">
                    #Coffee
                  </Badge>
                </div>
              </div>

              {/* ACTION AREA */}
              <div className="border-t pt-5">
                <p className="mb-3 text-sm font-semibold">
                  Available Actions
                </p>

                {role === "Manager" && (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-500">
                      Managers can monitor the approval workflow and campaign
                      status.
                    </p>

                    {status === "Approved" && (
                      <Button className="w-full">
                        Schedule Content
                      </Button>
                    )}
                  </div>
                )}

                {role === "Reviewer" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      variant="outline"
                      onClick={requestChanges}
                    >
                      Request Changes
                    </Button>

                    <Button onClick={sendToClient}>
                      <Send className="mr-2 h-4 w-4" />
                      Send to Client
                    </Button>
                  </div>
                )}

                {role === "Client" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      variant="outline"
                      onClick={requestChanges}
                    >
                      Request Changes
                    </Button>

                    <Button onClick={approveContent}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ACTIVITY */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <History size={18} />
                  Activity
                </CardTitle>
              </CardHeader>

              <CardContent>
                <ActivityItem
                  initials="SC"
                  name="Sarah Chen"
                  text="created the first draft"
                  time="Today · 9:30 AM"
                />

                <ActivityItem
                  initials="JM"
                  name="James Morgan"
                  text="requested changes"
                  time="Today · 10:42 AM"
                />

                <ActivityItem
                  initials="SC"
                  name="Sarah Chen"
                  text="uploaded Version 2"
                  time="Today · 11:03 AM"
                />

                <ActivityItem
                  initials="JM"
                  name="James Morgan"
                  text="approved internally"
                  time="Today · 11:18 AM"
                />

                <ActivityItem
                  initials="JM"
                  name="James Morgan"
                  text="sent content to Urban Brew"
                  time="Today · 11:19 AM"
                  last
                />
              </CardContent>
            </Card>

            {/* VERSIONS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText size={18} />
                  Versions
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <Version
                  version="Version 2"
                  user="Sarah Chen"
                  time="11:03 AM"
                  current
                />

                <Version
                  version="Version 1"
                  user="Sarah Chen"
                  time="9:30 AM"
                />
              </CardContent>
            </Card>

            {/* COMMENTS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare size={18} />
                  Comments
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold">
                    James Morgan
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Could we make the product more prominent in the creative?
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    10:42 AM
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold">
                    Sarah Chen
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Updated in Version 2. I&apos;ve increased the product
                    prominence and adjusted the headline.
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    11:03 AM
                  </p>
                </div>

                {role !== "Client" && (
                  <div className="flex gap-2">
                    <input
                      placeholder="Add a comment..."
                      className="h-10 flex-1 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black"
                    />

                    <Button size="icon">
                      <Send size={16} />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* AUDIT TRAIL */}
        <Card>
          <CardHeader>
            <CardTitle>
              Approval Timeline
            </CardTitle>

            <p className="text-sm text-slate-500">
              Complete traceability from creation to final approval.
            </p>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <TimelineStep
                time="09:30"
                title="Draft Created"
                person="Sarah Chen"
                complete
              />

              <TimelineStep
                time="10:42"
                title="Changes Requested"
                person="James Morgan"
                complete
              />

              <TimelineStep
                time="11:03"
                title="Version 2"
                person="Sarah Chen"
                complete
              />

              <TimelineStep
                time="11:18"
                title="Internal Approval"
                person="James Morgan"
                complete
              />

              <TimelineStep
                time={status === "Approved" ? "Now" : "Pending"}
                title="Client Approval"
                person={
                  status === "Approved"
                    ? "Olivia Carter"
                    : "Urban Brew"
                }
                complete={status === "Approved"}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-4">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-right text-sm font-semibold">
        {value}
      </span>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  if (status === "Approved") {
    return (
      <Badge className="bg-green-600 hover:bg-green-600">
        Approved
      </Badge>
    );
  }

  if (status === "Changes Requested") {
    return (
      <Badge variant="destructive">
        Changes Requested
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      {status}
    </Badge>
  );
}

function ActivityItem({
  initials,
  name,
  text,
  time,
  last = false,
}: {
  initials: string;
  name: string;
  text: string;
  time: string;
  last?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold">
          {initials}
        </div>

        {!last && (
          <div className="h-12 w-px bg-slate-200" />
        )}
      </div>

      <div>
        <p className="text-sm">
          <span className="font-semibold">
            {name}
          </span>{" "}
          <span className="text-slate-500">
            {text}
          </span>
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {time}
        </p>
      </div>
    </div>
  );
}

function Version({
  version,
  user,
  time,
  current = false,
}: {
  version: string;
  user: string;
  time: string;
  current?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border p-3">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">
            {version}
          </p>

          {current && (
            <Badge variant="secondary">
              Current
            </Badge>
          )}
        </div>

        <p className="mt-1 text-xs text-slate-500">
          {user} · {time}
        </p>
      </div>

      <Button
        variant="ghost"
        size="sm"
      >
        View
      </Button>
    </div>
  );
}

function TimelineStep({
  time,
  title,
  person,
  complete = false,
}: {
  time: string;
  title: string;
  person: string;
  complete?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        complete
          ? "bg-green-50"
          : "bg-slate-50"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <Clock3 size={16} />

        {complete && (
          <CheckCircle2
            size={17}
            className="text-green-600"
          />
        )}
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {time}
      </p>

      <p className="mt-2 font-semibold">
        {title}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {person}
      </p>
    </div>
  );
}