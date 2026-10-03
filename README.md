# CreatorOps

**Content planning and approval SaaS for modern marketing teams.**

CreatorOps is a cloud-based Marketing Content Operations platform that centralizes the full content lifecycle: client and campaign setup, content creation, internal and client approval, scheduling, publishing, analytics, and reporting. It replaces scattered spreadsheets, email threads, chat apps, file drives, and separate analytics tools with one role-based workspace.

> Plan → Create → Review → Approve → Publish → Analyze

**Live demo:** https://creatorops-gowshika-m-s-projects.vercel.app
**Repository:** https://github.com/Gowshii26/creatorops

---

## Table of Contents

- [Why CreatorOps](#why-creatorops)
- [Features](#features)
- [Approval Workflow](#approval-workflow)
- [User Roles](#user-roles)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Data Model](#data-model)
- [Security](#security)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Demo Walkthrough](#demo-walkthrough)
- [Testing](#testing)
- [Roadmap](#roadmap)

---

## Why CreatorOps

Marketing teams typically juggle disconnected tools: spreadsheets for calendars, drives for media, WhatsApp or email for feedback, separate platforms for publishing, and another dashboard for analytics. The result is scattered information, manual status tracking, unstructured feedback, approval bottlenecks, limited client visibility, and no audit history.

CreatorOps gives teams a single source of truth with a controlled, traceable workflow from first draft to performance report.

## Features

| Area | What it does |
|---|---|
| **Dashboard** | Active campaigns, content status, pending approvals, upcoming and published content, recent activity |
| **Client management** | Create, update, and archive clients; link campaigns; assign client users |
| **Campaign management** | Campaign status, dates, team assignments, content items, performance info |
| **Content management** | Title, platform, content type, caption, description, creator, publish date/time, workflow status |
| **Approval workflow** | Internal review, client review, change requests, approvals, all gated by role |
| **Content calendar** | Visual view of scheduled content, campaign timelines, and scheduling workload |
| **Media library** | Upload creative assets to Supabase Storage and link them to content items |
| **Notifications** | Events for submission, client send-off, changes requested, approval, scheduling, publishing |
| **Analytics** | Reach, engagements, engagement rate, and clicks per campaign and content item |
| **Reports** | Campaign reports exported as PDF, with report history stored |
| **Audit trail** | Records user actions, workflow transitions, content and admin activity, report generation |
| **Administration** | Admins manage users, roles, and client assignments |

## Approval Workflow

```text
Draft → Internal Review → Client Review → Approved → Scheduled → Published

Client Review → Changes Requested → Creator Revision → Internal Review
```

Supported states: `draft`, `internal_review`, `client_review`, `changes_requested`, `approved`, `scheduled`, `published`, `archived`.

## User Roles

CreatorOps uses Role-Based Access Control with four roles.

| Role | Responsibilities |
|---|---|
| **Admin** | Organization-level access: users, roles, clients, campaigns, content, approvals, analytics, reports, audit history |
| **Manager** | Manage clients and campaigns, review content internally, send to clients, schedule, mark as published, view analytics and reports |
| **Creator** | View assigned campaigns, create and edit content, upload media, submit for internal review. Cannot approve or publish their own content |
| **Client** | View assigned campaigns and submitted content, approve or request changes, view analytics and reports. Cannot access other clients' data |

Choosing a login portal does not grant that role. After authentication, the real role is read from the database (`organization_members`) and the matching workspace is shown.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React, TypeScript, Tailwind CSS, shadcn/ui, Lucide React, Recharts |
| Backend / API | Next.js App Router and Route Handlers |
| Database | PostgreSQL on Supabase |
| Auth | Supabase Auth |
| Authorization | RBAC and PostgreSQL Row Level Security |
| Storage | Supabase Storage |
| Reporting | jsPDF, jspdf-autotable |
| Hosting | Vercel |
| Source control | Git, GitHub |

## Architecture

```text
┌──────────────────────────────────────┐
│                USERS                 │
│   Admin | Manager | Creator | Client │
└──────────────────┬───────────────────┘
                   │ HTTPS
                   ▼
┌──────────────────────────────────────┐
│               VERCEL                 │
│  Next.js app · React UI · API routes │
└──────────────────┬───────────────────┘
        ┌──────────┼──────────┐
        ▼          ▼          ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │ Supabase │ │ Postgres │ │ Supabase │
  │   Auth   │ │ Data+RLS │ │ Storage  │
  └──────────┘ └──────────┘ └──────────┘
```

## Data Model

Primary tables: `profiles`, `organizations`, `organization_members`, `clients`, `client_members`, `campaigns`, `campaign_members`, `content_items`, `content_versions`, `media_assets`, `comments`, `approvals`, `notifications`, `content_metrics`, `audit_logs`, `generated_reports`.

```text
profiles → organization_members → organizations
                                      ├── clients → campaigns → content_items
                                      │                            ├── approvals
                                      │                            ├── comments
                                      │                            └── media_assets
                                      └── audit_logs
```

**Multi-tenancy:** users belong to an organization through `organization_members` (role and membership status).
**Client isolation:** client users are additionally linked to a single client account through `client_members`, so they only see that client's campaigns and content.

## Security

- **Least privilege:** users only get the access their role needs.
- **Client isolation:** client users cannot reach unrelated clients or campaigns.
- **Server-side authorization:** sensitive operations are validated on the server, not just in the UI.
- **Row Level Security:** database policies cover organization membership, campaign and content access, client access, and admin operations, so direct queries are still restricted.
- **Secret management:** server secrets live in environment variables and are never exposed to frontend code.

## Getting Started

### Prerequisites

- Node.js and npm
- Git
- A Supabase project

### Installation

```bash
git clone https://github.com/Gowshii26/creatorops.git
cd creatorops
npm install
```

### Environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SECRET_KEY=your_supabase_secret_key
```

> **Important:** never commit `.env.local`. `SUPABASE_SECRET_KEY` must only be used on the server.

### Run locally

```bash
npm run dev
```

Open http://localhost:3000.

### Production build

```bash
npm run build
```

## Deployment

CreatorOps is deployed on Vercel with automatic deploys from GitHub.

```text
Local dev → Git commit → GitHub → Vercel Git integration → Build → Deploy
```

1. Import the repository into Vercel.
2. Add the three environment variables above in the Vercel project settings.
3. In Supabase **Authentication → URL Configuration**, set:
   - Site URL: `https://creatorops-gowshika-m-s-projects.vercel.app`
   - Redirect URLs: `http://localhost:3000/auth/callback` and `https://creatorops-gowshika-m-s-projects.vercel.app/auth/callback`
4. Push to `main` to trigger a new production deployment.

## Project Structure

```text
creatorops/
├── app/
│   ├── api/            # admin, analytics, campaigns, clients, content,
│   │                   # dashboard, media, notifications, reports
│   ├── admin/ analytics/ approvals/ audit/ calendar/ campaigns/
│   ├── clients/ content/ login/ media/ notifications/
│   └── onboarding/ reports/ settings/
├── components/         # app-shell, approval-queue, campaign-management,
│                       # client-management, content-management, ...
├── lib/
│   ├── auth/
│   └── supabase/
├── public/
├── package.json
└── README.md
```

## Demo Walkthrough

The demo uses client **Lunara Cosmetics**, campaign **Glow Season Launch 2026**, and a **Vitamin C Serum Reel** for Instagram.

| Step | Actor | Action |
|---|---|---|
| 1 | Admin (Gowshii) | Review users, clients; create the campaign |
| 2 | Creator (Penny) | Create content, upload media, submit for internal review |
| 3 | Manager (Priya) | Review internally, send to client |
| 4 | Client (Lenord) | Review and approve |
| 5 | Manager (Priya) | Schedule, then mark as published |
| 6 | Any permitted role | Explore calendar, dashboard, analytics, generate a PDF report, view the audit trail |

## Testing

Verified locally and after production deployment:

- Authentication and role-specific login
- Admin, manager, creator, and client access rules, including client isolation
- Campaign and content creation and updates
- Media uploads
- Approval workflow, scheduling, and publishing
- Analytics, PDF report generation, audit history
- Logout and production build (`npm run build`)

## Roadmap

- Direct social media publishing APIs
- AI-assisted caption generation and content recommendations
- Automatic performance data ingestion and advanced analytics dashboards
- Real-time collaboration, mentions, and email notifications
- Content version comparison and file annotations
- Automatic thumbnail generation and advanced search
- Subscription plans and billing
- Custom roles and permissions
- Webhooks and external marketing platform integrations
- Mobile app

---

**CreatorOps** · A cloud-based content planning and approval platform for modern marketing teams.
