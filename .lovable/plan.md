

# GlobalWorker Recruitment Tracker - Full Implementation Plan

## Overview

This plan transforms the existing mock recruitment app into a production-ready internal tool with:
- Supabase authentication with role-based access (Admin/Recruiter)
- PostgreSQL database with proper RLS policies
- File storage for candidate documents
- Real-time updates for pipeline changes
- 15-stage international placement pipeline with drag-and-drop Kanban
- Comprehensive candidate management with timeline, notes, and documents

---

## Phase 1: Backend Setup (Supabase)

### 1.1 Enable Lovable Cloud
Connect Supabase backend through Lovable Cloud for managed database, auth, and storage.

### 1.2 Database Schema

**Tables to create:**

```text
+-------------------+     +-------------------+     +------------------------+
|    candidates     |     |       jobs        |     |  candidate_job_links   |
+-------------------+     +-------------------+     +------------------------+
| id (uuid, PK)     |     | id (uuid, PK)     |     | id (uuid, PK)          |
| full_name         |     | title             |     | candidate_id (FK)      |
| email             |     | client_company    |     | job_id (FK)            |
| phone             |     | country           |     | submitted_date         |
| nationality       |     | salary_range      |     | current_status         |
| current_country   |     | required_skills   |     | created_at             |
| linkedin          |     | description       |     +------------------------+
| date_added        |     | status            |
| current_stage     |     | created_at        |     +-------------------+
| rejection_reason  |     | created_by (FK)   |     |   user_roles      |
| expected_start    |     +-------------------+     +-------------------+
| added_by (FK)     |                               | id (uuid, PK)     |
| created_at        |     +-------------------+     | user_id (FK)      |
| updated_at        |     |       notes       |     | role (enum)       |
+-------------------+     +-------------------+     +-------------------+
                          | id (uuid, PK)     |
+-------------------+     | candidate_id (FK) |     +-------------------+
|    documents      |     | content           |     |   stage_history   |
+-------------------+     | created_at        |     +-------------------+
| id (uuid, PK)     |     | created_by (FK)   |     | id (uuid, PK)     |
| candidate_id (FK) |     +-------------------+     | candidate_id (FK) |
| file_name         |                               | from_stage        |
| storage_path      |                               | to_stage          |
| doc_type          |                               | changed_by (FK)   |
| uploaded_at       |                               | note              |
| uploaded_by (FK)  |                               | changed_at        |
+-------------------+                               +-------------------+
```

**Enums:**
- `app_role`: admin, recruiter
- `recruitment_stage`: 15 stages as specified
- `job_status`: open, closed, filled
- `doc_type`: resume, passport, visa, contract, other
- `submission_status`: submitted, interviewing, offered, placed, rejected

### 1.3 Row-Level Security (RLS)

All tables will have RLS enabled with policies:
- Admin: Full access to all data
- Recruiter: Read all, create/update candidates and notes, cannot delete users or manage roles
- Security definer function `has_role(user_id, role)` to prevent infinite recursion

### 1.4 Storage Bucket

Create `candidate-documents` bucket for file uploads (resumes, passports, visas, contracts).

---

## Phase 2: Authentication

### 2.1 Auth Pages
- Login page (email/password)
- Protected route wrapper component
- Auth context with user session management

### 2.2 Role Management
- `user_roles` table with proper RLS
- First user signup becomes admin
- Admins can invite/manage recruiters

---

## Phase 3: Theme Update

Update color scheme to professional blue/white as requested:
- Primary: #2563eb (blue-600)
- Clean white cards
- Subtle blue accents
- Professional corporate aesthetic

---

## Phase 4: Type Definitions

### 4.1 Update Types
New TypeScript types for all database models:
- `Candidate` with all 15 stages
- `Job`, `Note`, `Document`, `CandidateJobLink`
- `StageHistory` for timeline entries
- `UserRole` for auth

### 4.2 Stage Configuration
```text
Stages (in order):
1. sourced              - Sourced / Identified
2. contacted            - Contacted / Initial Outreach
3. application_received - Application Received / Resume Collected
4. screening            - Screening / Pre-qualification
5. shortlisted          - Shortlisted
6. submitted_to_client  - Submitted to Client
7. client_feedback      - Client Feedback / Interview Scheduled
8. interview_completed  - Interview Completed
9. offer_extended       - Offer Extended
10. offer_accepted      - Offer Accepted / Negotiation
11. visa_processing     - Visa & Documentation Processing
12. medical_checks      - Medical / Background Checks
13. onboarding          - Onboarding / Pre-Departure
14. placed              - Placed / Started Assignment
15. closed_not_placed   - Closed - Not Placed (with rejection reason)
```

---

## Phase 5: Data Layer

### 5.1 React Query Hooks
- `useCandidates()` - list with filters
- `useCandidate(id)` - single candidate with notes/docs
- `useJobs()` - list jobs
- `useJob(id)` - single job with linked candidates
- `useStageHistory(candidateId)` - timeline entries
- `useNotes(candidateId)` - candidate notes
- Mutation hooks for all CRUD operations

### 5.2 Real-time Subscriptions
Subscribe to `candidates` and `stage_history` tables for live updates when stages change.

---

## Phase 6: Dashboard (Home)

### 6.1 Stat Cards
- Total Candidates
- Candidates per stage (mini breakdown)
- Placed this month
- Open jobs count
- Warning: Candidates in visa/onboarding >30 days

### 6.2 Charts
- Pipeline funnel or bar chart (distribution by stage)
- Recent activity feed (last stage moves + notes)

---

## Phase 7: Kanban Pipeline

### 7.1 Board Layout
- 15 scrollable columns (horizontal scroll)
- Collapsible stage groups for better navigation
- Color-coded column headers

### 7.2 Candidate Cards
- Name + nationality flag emoji
- Assigned job title/client
- Days in current stage
- Last update timestamp
- Click to open detail view

### 7.3 Drag-and-Drop
- Use a drag-and-drop library for moving candidates
- Stage change saves to database
- Auto-creates timeline entry
- Optional note/reason modal on certain stage transitions

---

## Phase 8: Candidates Table/List

### 8.1 Table Features
- Columns: Name, Email, Nationality, Stage, Job, Recruiter, Days in Stage, Last Updated
- Search by name/email/nationality/keyword
- Filters: stage, job, country, recruiter
- Sortable columns
- Export to CSV button

### 8.2 Actions
- Click row to open detail
- Quick stage change dropdown
- Bulk actions (if needed later)

---

## Phase 9: Candidate Detail Page

### 9.1 Header Section
- Edit basic info (name, email, phone, nationality, country, LinkedIn)
- Current stage badge
- Next/Previous stage buttons (with confirmation modal + optional note)

### 9.2 Timeline Section
- Chronological list of:
  - Stage changes (with user initials)
  - Notes added
- Visual timeline with dates

### 9.3 Notes Section
- Add new note form
- List existing notes with author and timestamp

### 9.4 Documents Section
- Upload files (categorized: resume, passport, visa, contract, other)
- List documents with download links
- Delete capability (admin only)

### 9.5 Linked Jobs Section
- Show jobs candidate is linked to
- Submission status per job
- Link to new jobs

---

## Phase 10: Jobs Section

### 10.1 Jobs List
- Table: Title, Client, Country, Status, Candidates Count
- Search and filter
- Create new job button

### 10.2 Job Detail Page
- Edit job info
- Linked candidates with their stages
- Change job status

### 10.3 Job CRUD
- Create/Edit job form (title, client, country, salary, skills, description)
- Delete job (admin only)

---

## Phase 11: Navigation & Layout

### 11.1 Sidebar Updates
Add new navigation items:
- Dashboard
- Pipeline (Kanban)
- Candidates (Table)
- Jobs
- Settings

### 11.2 Top Bar
- Global search bar
- User avatar with dropdown (profile, logout)
- Role indicator

---

## Phase 12: Seed Data

Create seed script with:
- 10 sample candidates (spread across stages)
- 5 sample jobs
- Sample notes and stage history entries
- Document placeholders

---

## Technical Approach

### Files to Create

| Area | Files |
|------|-------|
| Types | `src/types/database.ts` (all new types) |
| Auth | `src/contexts/AuthContext.tsx`, `src/pages/Auth.tsx`, `src/components/ProtectedRoute.tsx` |
| Hooks | `src/hooks/useCandidates.ts`, `src/hooks/useJobs.ts`, `src/hooks/useNotes.ts`, `src/hooks/useDocuments.ts` |
| Pages | `src/pages/Jobs.tsx`, `src/pages/JobDetail.tsx`, `src/pages/CandidateDetail.tsx` |
| Components | Various components for Kanban, forms, modals, timeline, document upload |
| Utilities | `src/lib/supabase.ts`, `src/lib/nationality-flags.ts` |

### Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Update to blue/white professional theme |
| `tailwind.config.ts` | Update stage colors for 15 stages |
| `src/App.tsx` | Add auth provider, new routes |
| `src/components/layout/AppSidebar.tsx` | Add Jobs nav, user menu |
| `src/pages/Index.tsx` | Real dashboard with Supabase data |
| `src/pages/Pipeline.tsx` | 15-stage Kanban with drag-drop |
| `src/pages/Candidates.tsx` | Enhanced filters, CSV export |

### Dependencies to Add
- Drag-and-drop library (like `@dnd-kit/core`)
- CSV export utility
- Flag emoji helper

---

## Implementation Order

1. Enable Lovable Cloud Supabase
2. Create database schema (migrations)
3. Set up RLS policies
4. Create storage bucket
5. Update theme to blue/white
6. Build auth flow (login, context, protected routes)
7. Create data hooks with React Query
8. Build Dashboard with real stats
9. Build 15-stage Kanban with drag-drop
10. Build Candidates table with filters/export
11. Build Candidate detail page with timeline, notes, docs
12. Build Jobs section
13. Add seed data
14. Test full flow

---

## Notes

- All stage changes automatically log to `stage_history` table
- Real-time subscriptions will update Kanban and dashboard when data changes
- Mobile-responsive design throughout
- Toast notifications for all user actions

