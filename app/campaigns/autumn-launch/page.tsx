import Link from "next/link";
import CreateContentDialog from "@/components/create-content-dialog";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Camera,
Globe2,
  MoreHorizontal,
  Plus, 
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const contentItems = [
  {
    id: "pumpkin-cold-brew",
    title: "Pumpkin Cold Brew Reel",
    platform: "Instagram",
    owner: "Sarah Chen",
    date: "04 Sep",
    status: "Client Review",
  },
  {
    id: "autumn-menu",
    title: "Autumn Menu Carousel",
    platform: "Instagram",
    owner: "Sarah Chen",
    date: "06 Sep",
    status: "Approved",
  },
  {
    id: "student-offer",
    title: "Student Discount Story",
    platform: "Instagram",
    owner: "James Morgan",
    date: "08 Sep",
    status: "Draft",
  },
  {
    id: "founder-story",
    title: "Founder Story",
    platform: "LinkedIn",
    owner: "Sarah Chen",
    date: "11 Sep",
    status: "Scheduled",
  },
  {
    id: "weekend-promo",
    title: "Weekend Coffee Offer",
    platform: "Instagram",
    owner: "James Morgan",
    date: "13 Sep",
    status: "Changes Requested",
  },
];

export default function AutumnLaunchPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* TOP HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <Link
            href="/campaigns"
            className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-black"
          >
            <ArrowLeft size={16} />
            Back to campaigns
          </Link>

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <p className="font-medium text-indigo-600">
                  Urban Brew
                </p>

                <Badge variant="secondary">
                  Active
                </Badge>
              </div>

              <h1 className="text-3xl font-bold tracking-tight">
                Autumn Launch 2026
              </h1>

              <p className="mt-2 max-w-2xl text-slate-500">
                Seasonal campaign promoting Urban Brew&apos;s new autumn
                drinks range across social media channels.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline">
                <MoreHorizontal size={17} />
              </Button>

              <CreateContentDialog />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-7 px-6 py-8">

        {/* CAMPAIGN DETAILS */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard
            icon={<CalendarDays size={19} />}
            label="Campaign Dates"
            value="1 – 30 Sep 2026"
          />

          <InfoCard
            icon={<Users size={19} />}
            label="Team"
            value="4 members"
          />

          <InfoCard
            icon={<FileText size={19} />}
            label="Content Pieces"
            value="18 total"
          />

          <InfoCard
            icon={<CheckCircle2 size={19} />}
            label="Completion"
            value="78%"
          />
        </section>

        {/* MAIN CAMPAIGN OVERVIEW */}
        <section className="grid gap-5 xl:grid-cols-[2fr_1fr]">

          {/* PROGRESS */}
          <Card>
            <CardHeader>
              <CardTitle>
                Campaign Overview
              </CardTitle>

              <p className="text-sm text-slate-500">
                Delivery progress across the Autumn Launch campaign.
              </p>
            </CardHeader>

            <CardContent>
              <div className="mb-7">
                <div className="mb-2 flex justify-between">
                  <span className="text-sm text-slate-500">
                    Overall progress
                  </span>

                  <span className="font-semibold">
                    78%
                  </span>
                </div>

                <Progress
                  value={78}
                  className="h-3"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">

                <StatusBox
                  value="3"
                  label="Draft"
                />

                <StatusBox
                  value="2"
                  label="In Review"
                />

                <StatusBox
                  value="4"
                  label="Approved"
                />

                <StatusBox
                  value="3"
                  label="Scheduled"
                />

                <StatusBox
                  value="6"
                  label="Published"
                />

                <StatusBox
                  value="1"
                  label="Changes Requested"
                />

              </div>
            </CardContent>
          </Card>

          {/* HEALTH */}
          <Card>
            <CardHeader>
              <CardTitle>
                Campaign Health
              </CardTitle>

              <p className="text-sm text-slate-500">
                Delivery risk summary
              </p>
            </CardHeader>

            <CardContent>
              <div className="flex flex-col items-center">

                <div className="flex h-32 w-32 items-center justify-center rounded-full border-[12px] border-indigo-100">
                  <div className="text-center">

                    <p className="text-4xl font-bold">
                      82
                    </p>

                    <p className="text-xs text-slate-500">
                      / 100
                    </p>

                  </div>
                </div>

                <Badge className="mt-4">
                  Healthy
                </Badge>

              </div>

              <div className="mt-6 space-y-3 border-t pt-5">

                <HealthRow
                  label="Approvals pending"
                  value="2"
                />

                <HealthRow
                  label="Overdue items"
                  value="1"
                />

                <HealthRow
                  label="Upcoming deadlines"
                  value="3"
                />

              </div>

              <div className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                Pumpkin Cold Brew Reel needs client approval before its
                publishing deadline.
              </div>
            </CardContent>
          </Card>

        </section>

        {/* TEAM + CHANNELS */}
        <section className="grid gap-5 lg:grid-cols-2">

          <Card>
            <CardHeader>
              <CardTitle>
                Campaign Team
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">

              <TeamMember
                initials="AM"
                name="Alex Morgan"
                role="Campaign Manager"
              />

              <TeamMember
                initials="SC"
                name="Sarah Chen"
                role="Content Creator"
              />

              <TeamMember
                initials="JM"
                name="James Morgan"
                role="Reviewer"
              />

              <TeamMember
                initials="OC"
                name="Olivia Carter"
                role="Client"
              />

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Campaign Channels
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">

              <Channel
               icon={<Camera size={20} />}
                name="Instagram"
                content="12 pieces"
              />

              <Channel
                icon={<Globe2 size={20} />}
                name="LinkedIn"
                content="6 pieces"
              />

            </CardContent>
          </Card>

        </section>

        {/* CONTENT TABLE */}
        <Card>
          <CardHeader>
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

              <div>
                <CardTitle>
                  Campaign Content
                </CardTitle>

                <p className="mt-1 text-sm text-slate-500">
                  Track creation, approvals and publishing status.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                >
                  All
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                >
                  Draft
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                >
                  Review
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                >
                  Approved
                </Button>
              </div>

            </div>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">

              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-sm text-slate-500">

                    <th className="pb-3 font-medium">
                      Content
                    </th>

                    <th className="pb-3 font-medium">
                      Platform
                    </th>

                    <th className="pb-3 font-medium">
                      Owner
                    </th>

                    <th className="pb-3 font-medium">
                      Publish Date
                    </th>

                    <th className="pb-3 font-medium">
                      Status
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {contentItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b last:border-0"
                    >

                      <td className="py-4 pr-4">

                        {item.id === "pumpkin-cold-brew" ? (
                          <Link
                            href="/content/pumpkin-cold-brew"
                            className="font-semibold hover:text-indigo-600"
                          >
                            {item.title}
                          </Link>
                        ) : (
                          <span className="font-semibold">
                            {item.title}
                          </span>
                        )}

                      </td>

                      <td className="py-4 pr-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">

                         {item.platform === "Instagram" ? (
  <Camera size={16} />
) : (
  <Globe2 size={16} />
)}

                          {item.platform}

                        </div>
                      </td>

                      <td className="py-4 pr-4 text-sm text-slate-600">
                        {item.owner}
                      </td>

                      <td className="py-4 pr-4 text-sm text-slate-600">
                        {item.date}
                      </td>

                      <td className="py-4">
                        <StatusBadge
                          status={item.status}
                        />
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          </CardContent>
        </Card>

        {/* UPCOMING DEADLINES */}
        <Card>
          <CardHeader>
            <CardTitle>
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-3 md:grid-cols-3">

            <Deadline
              icon={<Clock3 size={18} />}
              date="04 Sep"
              title="Pumpkin Cold Brew Reel"
              status="Awaiting Client"
            />

            <Deadline
              icon={<CalendarDays size={18} />}
              date="06 Sep"
              title="Autumn Menu Carousel"
              status="Approved"
            />

            <Deadline
              icon={<CalendarDays size={18} />}
              date="08 Sep"
              title="Student Discount Story"
              status="Draft"
            />

          </CardContent>
        </Card>

      </div>
    </main>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
          {icon}
        </div>

        <div>
          <p className="text-xs text-slate-500">
            {label}
          </p>

          <p className="font-semibold">
            {value}
          </p>
        </div>

      </CardContent>
    </Card>
  );
}

function StatusBox({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border bg-slate-50 p-4">

      <p className="text-2xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-sm text-slate-500">
        {label}
      </p>

    </div>
  );
}

function HealthRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">

      <span className="text-slate-500">
        {label}
      </span>

      <span className="font-semibold">
        {value}
      </span>

    </div>
  );
}

function TeamMember({
  initials,
  name,
  role,
}: {
  initials: string;
  name: string;
  role: string;
}) {
  return (
    <div className="flex items-center gap-3">

      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-xs font-bold">
        {initials}
      </div>

      <div>
        <p className="font-medium">
          {name}
        </p>

        <p className="text-sm text-slate-500">
          {role}
        </p>
      </div>

    </div>
  );
}

function Channel({
  icon,
  name,
  content,
}: {
  icon: React.ReactNode;
  name: string;
  content: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border p-4">

      <div className="flex items-center gap-3">

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
          {icon}
        </div>

        <p className="font-medium">
          {name}
        </p>

      </div>

      <span className="text-sm text-slate-500">
        {content}
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
    return <Badge>Approved</Badge>;
  }

  if (status === "Changes Requested") {
    return (
      <Badge variant="destructive">
        Changes Requested
      </Badge>
    );
  }

  if (status === "Client Review") {
    return (
      <Badge variant="secondary">
        Client Review
      </Badge>
    );
  }

  if (status === "Scheduled") {
    return (
      <Badge variant="outline">
        Scheduled
      </Badge>
    );
  }

  return (
    <Badge variant="outline">
      {status}
    </Badge>
  );
}

function Deadline({
  icon,
  date,
  title,
  status,
}: {
  icon: React.ReactNode;
  date: string;
  title: string;
  status: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border p-4">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
        {icon}
      </div>

      <div>
        <p className="text-xs font-medium text-indigo-600">
          {date}
        </p>

        <p className="mt-1 font-semibold">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {status}
        </p>
      </div>

    </div>
  );
}