

# Platform Scale-Up and Process Expansion Plan

## Overview
This plan addresses scalability for 50-100 concurrent users with hundreds of GB storage, then layers in the four missing process modules: task management, contract tracking, reporting/exports, and automated notifications.

---

## Phase 1: Scalability and Performance (First Priority)

### 1.1 Database Query Optimization
- Add database indexes on high-traffic columns:
  - `candidates(email)`, `candidates(current_stage)`, `candidates(created_at)`
  - `agency_workers(agency_id, current_stage)`, `agency_workers(email)`
  - `candidate_workflow(candidate_id)`, `candidate_workflow(project_id, current_phase)`
  - `jobs(status)`, `jobs(project_id)`
  - `documents(candidate_id)`, `workflow_documents(workflow_id)`
  - `stage_history(candidate_id, changed_at)`
  - `notifications(user_id, is_read)`
- Add composite indexes for common join patterns used in analytics views

### 1.2 React Query Tuning for Concurrent Users
- Configure global `QueryClient` with production-ready defaults:
  - `staleTime: 30000` (30s) to reduce redundant refetches
  - `gcTime: 300000` (5min) for garbage collection
  - `refetchOnWindowFocus: false` for heavy queries
  - `retry: 2` with exponential backoff
- Add pagination to all list views (candidates, workers, jobs, documents) using cursor-based or offset pagination with a default page size of 25
- Implement virtual scrolling for the pipeline board when candidate counts exceed 50 per column

### 1.3 Hybrid Storage Architecture
- **Cloud storage buckets** (current `candidate-documents` and `agency-documents`): continue for all document files (PDFs, images, certificates) - these stay under direct database control with RLS
- **Google Drive**: reserved for large video files (working demos, presentation videos) via the existing compression + upload pipeline
- Create a new `storage_metadata` table to track all files regardless of storage backend:

```text
storage_metadata
  id (uuid, PK)
  entity_type (text) -- 'candidate', 'agency_worker', 'project', 'contract'
  entity_id (uuid)
  file_name (text)
  file_size (bigint)
  mime_type (text)
  storage_backend (text) -- 'supabase' or 'google_drive'
  storage_path (text) -- bucket path or Drive file ID
  uploaded_by (uuid)
  created_at (timestamptz)
```

- Add RLS policies matching entity-type access rules
- Update `FileUploader` component to auto-route: videos over 10MB go to Google Drive, everything else to cloud storage

### 1.4 Connection and Concurrency Hardening
- Add database connection pooling awareness: ensure no long-running transactions in hooks
- Implement optimistic updates for frequently-used mutations (stage changes, note creation, document status updates) to reduce perceived latency
- Add request deduplication in React Query for identical concurrent requests
- Set up error boundaries at the route level to prevent one failing component from crashing the entire page

---

## Phase 2: Task Assignments and Deadlines

### 2.1 Database Schema
Create a `tasks` table:

```text
tasks
  id (uuid, PK)
  title (text, NOT NULL)
  description (text)
  task_type (text) -- 'document_review', 'candidate_follow_up', 'visa_check', 'general'
  priority (text) -- 'low', 'medium', 'high', 'urgent'
  status (text) -- 'todo', 'in_progress', 'done', 'cancelled'
  assigned_to (uuid) -- user_id
  assigned_role (app_role) -- optional role-based assignment
  due_date (timestamptz)
  completed_at (timestamptz)
  entity_type (text) -- 'candidate', 'job', 'project', 'workflow'
  entity_id (uuid) -- links to relevant record
  created_by (uuid)
  created_at (timestamptz)
  updated_at (timestamptz)
```

- RLS: staff can view all tasks; agencies see only tasks linked to their workers; employers see tasks for their projects

### 2.2 UI Components
- **Tasks sidebar panel**: slide-out panel accessible from any page showing "My Tasks" with due-date sorting
- **Task creation**: quick-add from candidate detail, job detail, and project detail pages (contextually pre-fills entity linkage)
- **Workload dashboard**: card view on the main dashboard showing task counts by assignee and overdue counts
- **Due date indicators**: color-coded badges (green = on track, amber = due soon, red = overdue)

---

## Phase 3: Contract Management

### 3.1 Database Schema
Create a `contracts` table:

```text
contracts
  id (uuid, PK)
  contract_type (text) -- 'employer_agreement', 'agency_agreement', 'worker_contract', 'service_agreement'
  party_type (text) -- 'employer', 'agency', 'worker'
  party_id (uuid) -- company_id, agency_id, or candidate_id
  title (text)
  status (text) -- 'draft', 'sent', 'signed', 'active', 'expired', 'terminated'
  start_date (date)
  end_date (date)
  renewal_date (date)
  auto_renew (boolean, default false)
  total_value (numeric)
  currency (text, default 'EUR')
  storage_path (text) -- link to uploaded contract PDF
  signed_by_party_at (timestamptz)
  signed_by_staff_at (timestamptz)
  notes (text)
  created_by (uuid)
  created_at (timestamptz)
  updated_at (timestamptz)
```

### 3.2 UI
- **Contracts page** (`/contracts`): table with filters by type, status, and party
- **Contract detail view**: shows terms, linked documents, renewal timeline, and change history
- **Expiry dashboard widget**: cards showing contracts expiring in 30/60/90 days
- **Link contracts to projects/jobs**: contract reference on project and job detail pages

---

## Phase 4: Reporting and Exports

### 4.1 Export Engine
- Create a backend function `generate-report` that accepts report type and filters, queries data, and returns CSV/Excel
- Report types:
  - **Candidate pipeline report**: all candidates with current stage, days in stage, assigned job/project
  - **Agency performance report**: submissions, placements, success rates per agency
  - **Project status report**: fill rates, workflow progress, timeline adherence
  - **Compliance report**: document expiry dates, missing documents, workflow blockers
  - **Billing summary**: payments by agency, outstanding amounts, milestone tracking

### 4.2 UI
- **Export button** on every analytics page and list view (candidates, jobs, projects)
- **Report builder page** (`/reports`): select report type, date range, filters, and format (CSV or PDF)
- **Scheduled reports**: allow admins to set up weekly/monthly auto-generated reports (stored in cloud storage, notification on completion)

---

## Phase 5: Automated Notifications and Alerts

### 5.1 Notification Triggers (Database Triggers + Cron)
- **Document expiry alerts**: daily cron checks for documents (passports, visas, contracts) expiring within 30/14/7 days
- **Stalled workflow alerts**: cron checks for workflows stuck in a phase for more than N days (configurable per phase)
- **Task deadline reminders**: cron sends notifications 24h before task due dates
- **Stage change notifications**: database trigger on `candidates` and `agency_workers` stage changes notifies assigned staff
- **Contract renewal reminders**: cron checks contracts expiring within 60/30/7 days

### 5.2 Notification Channels
- **In-app notifications**: extend existing notification system with new event types
- **Email notifications**: create a backend function using a transactional email service for critical alerts (document expiry, overdue tasks)
- User preferences table to control which notifications they receive and via which channel

### 5.3 Cron Infrastructure
- Enable `pg_cron` and `pg_net` extensions
- Schedule a single "daily-checks" backend function that runs all expiry/deadline checks at 6 AM UTC
- Schedule a "hourly-alerts" function for time-sensitive items (task deadlines, workflow stalls)

---

## Implementation Order

```text
Week 1-2: Phase 1 (Scalability)
  - Database indexes + query optimization
  - React Query tuning + pagination
  - Storage metadata table + hybrid routing
  - Error boundaries + optimistic updates

Week 3: Phase 2 (Tasks)
  - Tasks table + RLS
  - Task UI components
  - Integration with existing entity pages

Week 4: Phase 3 (Contracts)
  - Contracts table + RLS
  - Contracts page + detail views
  - Link to projects/agencies

Week 5: Phase 4 (Reporting)
  - Report generation backend function
  - Export buttons on existing pages
  - Report builder page

Week 6: Phase 5 (Automated Notifications)
  - Cron infrastructure
  - Expiry/deadline check functions
  - Email notification backend function
  - User notification preferences
```

---

## Technical Considerations

- All new tables will have RLS enabled with policies matching the existing access patterns (staff see all, agencies see their own, employers see their projects)
- All timestamps use `timestamptz` for timezone safety
- New pages follow the existing `AppLayout` pattern for internal staff and tab-based navigation for agency/employer portals
- Database migrations will be incremental - no destructive changes to existing tables
- The hybrid storage approach keeps the existing Google Drive integration intact while routing smaller files through cloud storage for better RLS integration

