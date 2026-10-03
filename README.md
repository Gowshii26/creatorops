# CreatorOps

## Content Planning & Approval SaaS

CreatorOps is a cloud-based Marketing Content Operations platform designed to centralize the complete content lifecycle — from client and campaign setup to content creation, approval, scheduling, publishing, analytics, and reporting.

The platform replaces fragmented workflows involving spreadsheets, email, messaging applications, file drives, and separate analytics tools with a single role-based workspace.

---

## Live Application

**Production Deployment**

https://creatorops-gowshika-m-s-projects.vercel.app

**GitHub Repository**

https://github.com/Gowshii26/creatorops

---

# 1. Project Overview

Marketing teams often manage content using multiple disconnected tools:

- Spreadsheets for content calendars
- Cloud drives for media storage
- Email and messaging applications for feedback
- Separate tools for publishing
- Separate dashboards for campaign analytics

This fragmented workflow creates several problems:

- Scattered information
- Manual status tracking
- Unstructured feedback
- Approval bottlenecks
- Limited client visibility
- Poor accountability
- No unified audit history
- Analytics disconnected from content planning

CreatorOps solves this problem by providing one centralized SaaS platform for managing the complete marketing content lifecycle.

---

# 2. Problem Statement

Modern marketing teams frequently depend on multiple disconnected tools to manage content.

A typical workflow may involve:

1. Content ideas captured in chat or email
2. Tasks tracked in spreadsheets
3. Media stored separately in cloud drives
4. Feedback exchanged through WhatsApp or email
5. Client approvals collected manually
6. Revisions performed without a clear history
7. Publishing managed through separate platforms
8. Analytics reviewed in a different system

This creates a fragmented workflow where teams lack a single source of truth.

CreatorOps addresses this by connecting planning, production, review, approval, publishing, analytics, and reporting into one continuous system.

---

# 3. Proposed Solution

CreatorOps provides a centralized cloud-based workspace for marketing teams, agencies, creators, managers, and clients.

The platform integrates the following areas:

- User and Role Management
- Client Management
- Campaign Management
- Content Management
- Content Calendar
- Media Library
- Approval Workflow
- Publishing Status Tracking
- Notifications
- Analytics
- Reports
- Audit Trail

The objective is to provide one transparent workflow from campaign planning through final publication and performance analysis.

---

# 4. Core Workflow

CreatorOps implements a structured content approval lifecycle.

```text
Draft
  ↓
Internal Review
  ↓
Client Review
  ↓
Approved
  ↓
Scheduled
  ↓
Published

If changes are required:
Client Review
  ↓
Changes Requested
  ↓
Creator Revision
  ↓
Internal Review

This provides a controlled and traceable workflow instead of relying on informal communication.
5. User Roles
CreatorOps implements Role-Based Access Control with four primary roles.
Administrator
Administrators have organization-level access.
Main capabilities:
- Manage users
- Assign roles
- Manage clients
- Manage campaigns
- Manage content
- Access approval workflows
- View analytics
- Generate reports
- View audit history
- Access administration tools
Demo identity:
Name: Gowshii
Role: Administrator

Manager
Managers coordinate campaign execution and approval workflows.
Main capabilities:
- Manage clients
- Manage campaigns
- Review content internally
- Send content to clients
- Schedule approved content
- Mark content as published
- View analytics
- Generate reports
- View audit activity
Demo identity:
Name: Priya
Role: Manager

Creator
Creators are responsible for preparing campaign content.
Main capabilities:
- View assigned campaigns
- Create content
- Edit content
- Upload media assets
- Submit content for internal review
- View workflow status
- View notifications
Creators cannot approve or publish their own content.
Demo identity:
Name: Penny
Role: Creator

Client
Clients receive controlled access to content associated with their assigned client account.
Main capabilities:
- View assigned campaigns
- View submitted content
- Approve content
- Request changes
- View relevant media
- View campaign analytics
- Access reports
Clients cannot access unrelated clients or campaigns.
Demo identity:
Name: Lenord
Role: Client
Client: Lunara Cosmetics

6. Demo Scenario
The project demonstration uses the following example workflow.
Client:
Lunara Cosmetics

Campaign:
Glow Season Launch 2026

Administrator:
Gowshii

Manager:
Priya

Creator:
Penny

Client Reviewer:
Lenord

Example content:
Title:
Vitamin C Serum Reel

Platform:
Instagram

Content Type:
Reel

Workflow demonstrated:
Penny
Draft
   ↓
Submit for Review

Priya
Internal Review
   ↓
Send to Client

Lenord
Client Review
   ↓
Approve

Priya
Approved
   ↓
Schedule
   ↓
Published

7. Main Features
Dashboard
The dashboard provides a workspace-level overview including:
- Active campaigns
- Content status
- Pending approvals
- Upcoming content
- Published content
- Recent activity
Client Management
Administrators and Managers can:
- Create clients
- Update client information
- Archive clients
- Associate campaigns with clients
- Assign client users
Client users only receive access to their assigned organization.
Campaign Management
Campaigns provide the main organizational layer for marketing activity.
Campaign data can include:
- Campaign name
- Client
- Campaign status
- Start date
- End date
- Team assignments
- Content items
- Performance information
Content Management
Content items can include:
- Title
- Campaign
- Platform
- Content type
- Caption
- Description
- Creator
- Publish date
- Publish time
- Workflow status
Approval Workflow
CreatorOps provides structured internal and client review.
Supported workflow states include:
draft
internal_review
client_review
changes_requested
approved
scheduled
published
archived

Workflow permissions depend on the authenticated user's role.
Content Calendar
The content calendar provides a visual representation of scheduled marketing content.
It helps teams understand:
- Publishing dates
- Upcoming content
- Campaign timelines
- Content status
- Scheduling workload
Media Library
Creative assets can be uploaded and linked to campaign content.
Media storage is handled through Supabase Storage.
This provides centralized cloud-based asset storage instead of relying on unrelated external drives.
Notifications
CreatorOps includes notifications for important workflow events.
Examples include:
- Content submitted for review
- Content sent to client
- Changes requested
- Content approved
- Content scheduled
- Content published
Analytics
CreatorOps connects campaign performance information to campaign and content workflows.
Example performance metrics include:
- Reach
- Engagements
- Engagement Rate
- Clicks
This helps connect content planning with post-publication results.
Reports
CreatorOps supports campaign performance reporting.
Reports can contain:
- Campaign information
- Content information
- Performance metrics
- Engagement statistics
- Reporting history
Reports can be exported as PDF documents.
Audit Trail
Important actions are recorded for traceability and accountability.
The audit trail can contain events related to:
- User actions
- Workflow changes
- Content activity
- Administrative actions
- Report generation
- Other important system operations
Administration
Administrators can manage users within the CreatorOps workspace.
Available roles include:
admin
manager
creator
client

Client users can additionally be assigned to a specific client organization.
8. Technology Stack
Frontend
- Next.js 16
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide React
- Recharts
Backend / API
- Next.js App Router
- Next.js Route Handlers
- TypeScript
Database
- PostgreSQL
- Supabase
Authentication
- Supabase Auth
Authorization
- Role-Based Access Control
- PostgreSQL Row Level Security
Storage
- Supabase Storage
Reporting
- jsPDF
- jspdf-autotable
Hosting
- Vercel
Version Control
- Git
- GitHub
9. Cloud Architecture
CreatorOps follows a cloud-native architecture.
┌──────────────────────────────────────┐
│                USERS                 │
│                                      │
│ Admin | Manager | Creator | Client   │
└──────────────────┬───────────────────┘
                   │
                   │ HTTPS
                   ▼
┌──────────────────────────────────────┐
│               VERCEL                 │
│                                      │
│ Next.js Application                  │
│ React User Interface                 │
│ Next.js API Route Handlers           │
└──────────────────┬───────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
┌────────────┐ ┌────────────┐ ┌──────────────┐
│ Supabase   │ │ PostgreSQL │ │ Supabase     │
│ Auth       │ │ Database   │ │ Storage      │
│            │ │            │ │              │
│ Login      │ │ Business   │ │ Media Assets │
│ Sessions   │ │ Data + RLS │ │              │
└────────────┘ └────────────┘ └──────────────┘

10. Database Design
CreatorOps uses PostgreSQL through Supabase.
The primary database tables include:
profiles
organizations
organization_members
clients
client_members
campaigns
campaign_members
content_items
content_versions
media_assets
comments
approvals
notifications
content_metrics
audit_logs
generated_reports

11. Database Relationships
A simplified relationship structure is:
profiles
   │
   ▼
organization_members
   │
   ▼
organizations
   │
   ├──────────────► clients
   │                   │
   │                   ▼
   │               campaigns
   │                   │
   │                   ▼
   │              content_items
   │                   │
   │      ┌────────────┼────────────┐
   │      │            │            │
   │      ▼            ▼            ▼
   │   approvals   comments   media_assets
   │
   └──────────────► audit_logs

12. Multi-Tenant Workspace Model
CreatorOps is organized around workspaces or organizations.
Users are connected to an organization through:
organization_members

The membership stores information such as:
- Organization
- User role
- Membership status
Example:
User
  ↓
Organization Membership
  ↓
Organization
  ↓
Clients
  ↓
Campaigns
  ↓
Content

This provides logical separation between workspaces.
13. Client Isolation
Client users require an additional relationship through:
client_members

This connects a user with a specific client account.
Example:
Lenord
   ↓
client_members
   ↓
Lunara Cosmetics
   ↓
Glow Season Launch 2026

This prevents client users from receiving unrestricted access to other client accounts.
14. Authentication
CreatorOps uses Supabase Authentication.
Authentication provides:
- Secure password login
- Authenticated sessions
- User identity management
- Session persistence
- Server-side authentication checks
The application provides four login portals:
Administrator Login
Manager Login
Creator Login
Client Login

Selecting a portal does not automatically provide that role.
After authentication, CreatorOps verifies the user's real role using the database.
15. Role-Based Access Control
CreatorOps uses four main roles:
admin
manager
creator
client

The user's role is stored in:
organization_members

Example:
User logs in
      ↓
Supabase Auth verifies credentials
      ↓
CreatorOps retrieves organization membership
      ↓
Actual database role is checked
      ↓
Correct role-specific workspace is displayed

This prevents users from gaining additional permissions by simply selecting another login portal.
16. Row Level Security
Supabase PostgreSQL Row Level Security is used to enforce access rules at the database layer.
Security helper logic controls operations such as:
- Organization membership
- Campaign access
- Campaign management
- Content access
- Content editing
- Client access
- Administrative access
This provides security beyond the frontend interface.
Even if a user attempts to directly access protected data, database policies restrict unauthorized queries.
17. Media Storage
Media assets are stored using Supabase Storage.
CreatorOps uses a media storage bucket for campaign assets.
Example media workflow:
Creator
   ↓
Upload Asset
   ↓
Supabase Storage
   ↓
media_assets database record
   ↓
Associated Content Item

This keeps creative assets linked with the content workflow.
18. PDF Reporting
CreatorOps supports downloadable campaign reports.
The reporting module uses:
jsPDF
jspdf-autotable

Generated reports can contain campaign information and analytics data.
Report generation information is also stored for later reference.
19. Environment Variables
CreatorOps requires the following environment variables.
Create a .env.local file in the project root.
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL

NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY

SUPABASE_SECRET_KEY=YOUR_SUPABASE_SECRET_KEY

Important:
Do not commit .env.local to GitHub.

The secret Supabase key must only be used on the server side.
20. Local Installation
Requirements
Install:
- Node.js
- npm
- Git
Clone the repository:
git clone https://github.com/Gowshii26/creatorops.git

Open the project:
cd creatorops

Install dependencies:
npm install

Create:
.env.local

Add the required Supabase environment variables.
Then start the development server:
npm run dev

Open:
http://localhost:3000

21. Production Build
To test the production build locally:
npm run build

If the build succeeds, the application is ready for deployment.
22. Vercel Deployment
CreatorOps is deployed using Vercel.
Deployment process:
Local Development
      ↓
Git Commit
      ↓
GitHub Repository
      ↓
Vercel Git Integration
      ↓
Production Build
      ↓
Vercel Deployment

The required environment variables are configured in Vercel:
NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

SUPABASE_SECRET_KEY

Production application:
https://creatorops-gowshika-m-s-projects.vercel.app
23. Supabase Authentication URLs
Local callback:
http://localhost:3000/auth/callback

Production callback:
https://creatorops-gowshika-m-s-projects.vercel.app/auth/callback

Production Site URL:
https://creatorops-gowshika-m-s-projects.vercel.app

24. Project Structure
A simplified project structure is shown below.
creatorops/
│
├── app/
│   ├── api/
│   │   ├── admin/
│   │   ├── analytics/
│   │   ├── campaigns/
│   │   ├── clients/
│   │   ├── content/
│   │   ├── dashboard/
│   │   ├── media/
│   │   ├── notifications/
│   │   └── reports/
│   │
│   ├── admin/
│   ├── analytics/
│   ├── approvals/
│   ├── audit/
│   ├── calendar/
│   ├── campaigns/
│   ├── clients/
│   ├── content/
│   ├── login/
│   ├── media/
│   ├── notifications/
│   ├── onboarding/
│   ├── reports/
│   └── settings/
│
├── components/
│   ├── app-shell.tsx
│   ├── approval-queue.tsx
│   ├── campaign-management.tsx
│   ├── client-management.tsx
│   ├── content-management.tsx
│   ├── content-workflow-actions.tsx
│   └── ...
│
├── lib/
│   ├── auth/
│   └── supabase/
│
├── public/
│
├── .gitignore
├── package.json
└── README.md

25. Functional Requirements
User Management
- User authentication
- Role-based authorization
- Profile management
- Organization membership
- Client-specific user assignment
Client Management
- Create clients
- Edit clients
- Archive clients
- Associate users with clients
Campaign Management
- Create campaigns
- Edit campaigns
- Track campaign status
- Associate campaigns with clients
- Assign campaign members
Content Management
- Create content
- Edit content
- Upload media
- Assign creators
- Set publishing information
- Track workflow status
Approval Management
- Submit content for internal review
- Send content to client
- Request changes
- Approve content
- Record approval decisions
Publishing
- Schedule approved content
- Mark content as published
- Display scheduled content in calendar
Analytics
- Campaign-level metrics
- Engagement data
- Click data
- Reach information
Reporting
- Generate campaign reports
- Export PDF reports
- Maintain report history
Audit
- Store important user actions
- Store workflow transitions
- Provide traceable system history
26. Non-Functional Requirements
Security
CreatorOps uses:
- Secure authentication
- Role-Based Access Control
- Row Level Security
- Server-side authorization
- Private environment variables
Scalability
The cloud architecture can support additional:
- Organizations
- Clients
- Campaigns
- Users
- Content
- Media assets
Reliability
The structured database and workflow help reduce accidental loss of campaign information.
Maintainability
The application is divided into modular components, API routes, and reusable services.
Accessibility
The interface uses clear navigation, role-specific workspaces, and responsive layouts.
Performance
Vercel provides cloud hosting and optimized Next.js delivery.
27. Security Principles
CreatorOps follows several important security principles.
Least Privilege
Users only receive access required for their role.
Client Isolation
Clients only receive access to their assigned client data.
Server-Side Authorization
Sensitive administrative operations are validated on the server.
Database-Level Protection
PostgreSQL Row Level Security provides another authorization layer.
Secret Management
Server secrets are stored using environment variables and are not exposed in frontend code.
28. Demo Flow
A complete CreatorOps demonstration can follow this sequence:
1. Administrator Login
2. Show user roles
3. Show client
4. Create campaign
5. Logout

6. Creator Login
7. Create content
8. Upload media
9. Submit for internal review
10. Logout

11. Manager Login
12. Review content
13. Send to client
14. Logout

15. Client Login
16. Review content
17. Approve content
18. Logout

19. Manager Login
20. Schedule content
21. Mark as published

22. Show Calendar
23. Show Dashboard
24. Show Analytics
25. Generate PDF Report
26. Show Audit Trail

29. Testing
CreatorOps was tested locally and after production deployment.
Areas tested include:
- Authentication
- Role-specific login
- Administrator access
- Manager access
- Creator access
- Client access
- Client isolation
- Campaign creation
- Content creation
- Content updates
- Media uploads
- Approval workflow
- Scheduling
- Publishing
- Analytics
- Reports
- PDF generation
- Audit history
- Logout
- Production deployment
A production build was also verified using:
npm run build

30. Deployment Validation
After deployment, the following production checks were performed:
Administrator login works
Manager login works
Creator login works
Client login works

Correct role is displayed
Dashboard loads
Campaigns load
Clients load
Content loads
Approval workflow loads
Supabase database connection works
Supabase authentication works
Role restrictions remain active
Logout works

31. Key Benefits
CreatorOps provides several benefits to marketing teams.
Centralized Workflow
Planning, content, approval, publishing, and analytics exist in one system.
Improved Accountability
Every important workflow transition can be tracked.
Faster Approvals
Managers and clients use structured approval actions instead of fragmented messages.
Client Visibility
Clients can directly review assigned campaign content.
Improved Security
RBAC and Row Level Security protect client and organization information.
Better Reporting
Campaign performance can be exported into stakeholder-ready reports.
Cloud Accessibility
The platform can be accessed through a browser without installing desktop software.
32. Future Enhancements
Future versions of CreatorOps could include:
- Direct social media publishing APIs
- AI-assisted caption generation
- AI content recommendations
- Automatic campaign performance ingestion
- Advanced analytics dashboards
- Real-time collaboration
- Mention notifications
- Email notifications
- Content version comparison
- File annotations
- Automatic thumbnail generation
- Advanced search
- Mobile application
- Organization subscription plans
- Billing integration
- Additional workspace roles
- Custom role permissions
- Webhook integrations
- External marketing platform integrations
33. Development Workflow
The project uses Git and GitHub for source control.
Typical development workflow:
git add .
git commit -m "Describe changes"
git push

Vercel automatically detects new commits on the main branch and triggers a new deployment.
34. Cloud Services Used
CreatorOps demonstrates the use of multiple cloud services.
Vercel
Used for:
- Next.js hosting
- Application deployment
- Server-side execution
- Environment variable management
- Production domain
Supabase
Used for:
- PostgreSQL database
- Authentication
- Row Level Security
- Storage
- User sessions
- Backend data services
GitHub
Used for:
- Source control
- Repository hosting
- Version history
- Vercel deployment integration
35. SaaS Characteristics
CreatorOps demonstrates several Software as a Service characteristics:
- Browser-based access
- Cloud-hosted infrastructure
- Centralized data
- Role-based access
- Multi-user collaboration
- Organization-based workspaces
- Scalable cloud services
- No local installation required for end users
- Continuous deployment through GitHub and Vercel
36. Project Outcome
CreatorOps successfully demonstrates how a fragmented marketing content workflow can be transformed into a centralized cloud-based SaaS application.
The project combines:
Client Management
+
Campaign Management
+
Content Creation
+
Media Management
+
Approval Workflows
+
Scheduling
+
Publishing Status
+
Analytics
+
Reporting
+
Auditability

into one integrated platform.
The final application demonstrates secure authentication, role-based access, cloud data storage, workflow automation, client-specific visibility, analytics, reporting, and production cloud deployment.

Plan → Create → Review → Approve → Publish → Analyze
A cloud-based Content Planning and Approval SaaS platform for modern marketing teams.
