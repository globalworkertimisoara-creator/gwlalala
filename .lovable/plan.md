

# Enhanced Task Management: Manager View, Assignments, Entity Links, and Notification Integration

## What We Are Building

1. **Manager task view** on the dashboard: a dedicated "Team Tasks" tab (alongside "My Tasks") showing all tasks across the team, with filters by assignee, status, and priority. Toggleable between card list and a simple table view.

2. **Assign to user or role** when creating/editing tasks: add user picker (fetches from profiles table) and role picker to the task creation dialog. Managers/admins can assign; others only create self-assigned tasks.

3. **Entity quick links**: tasks with `entity_type` and `entity_id` show a clickable link badge (e.g., "Candidate: John Doe") that navigates to the relevant detail page.

4. **Notification integration via the existing daily-checks edge function**: extend it with:
   - **24h before due date** reminders (already exists, will verify)
   - **Daily digest for managers**: a single summary notification listing all overdue/stalled team tasks
   - **Escalation after X days overdue**: auto-escalate tasks overdue for a configurable threshold (default 3 days) by creating an escalation record and notifying the manager's superior

---

## Technical Plan

### 1. Enhance `DashboardTasks` Component
- Add a "My Tasks" / "Team Tasks" tab toggle (Team Tasks visible only when `can('viewAllUsers')` or role is manager/admin)
- **Team Tasks tab**: fetch all tasks (no `assigned_to` filter), display with an assignee name column
- Add a simple table view toggle (icon button) alongside the card view
- Add filters: assignee dropdown, priority dropdown
- Join `profiles` to show assignee names: update `useTasks` hook to select `*, assigned_profile:profiles!tasks_assigned_to_fkey(full_name)` or do a separate lookup

### 2. Update Task Creation Dialog
- Add "Assign to" field: a Select dropdown populated from `profiles` table (internal staff only)
- Add "Assign to role" field: Select from internal roles enum
- Add "Link to" fields: entity_type dropdown (candidate/project/job) + entity search/select
- Gate assignment fields behind `can('createUsers')` or manager-level check

### 3. Entity Quick Links in Task Items
- When `entity_type` and `entity_id` are set, render a small clickable badge
- Map entity_type to route: `candidate` → `/candidates/{id}`, `project` → `/projects/{id}`, `job` → `/jobs/{id}`
- Optionally fetch entity name for display (or just show type + truncated ID)

### 4. Extend `daily-checks` Edge Function
- **Manager daily digest**: query all overdue tasks, group by `assigned_role` or manager, insert one summary notification per manager
- **Auto-escalation**: query tasks overdue by 3+ days, check if already escalated (to avoid duplicates), create escalation records in the `escalations` table and notify the escalated-to role

### 5. Hook Updates (`useTasks.ts`)
- Add a `useTeamTasks` hook that fetches all tasks with profile join
- Add `useStaffProfiles` hook to fetch assignable users for the dropdown
- Update `CreateTaskInput` to include entity fields prominently in the form

### Files to Create/Modify
| File | Change |
|------|--------|
| `src/components/dashboard/DashboardTasks.tsx` | Add Team Tasks tab, table view toggle, assignee filter, entity links |
| `src/hooks/useTasks.ts` | Add `useTeamTasks`, update query to join profiles for assignee name |
| `src/hooks/useStaffProfiles.ts` | New hook to fetch internal staff for assignment dropdown |
| `supabase/functions/daily-checks/index.ts` | Add manager digest + auto-escalation logic |
| `src/pages/Tasks.tsx` | Keep as full-page fallback but also update with entity links and assignment UI |

