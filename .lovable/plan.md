
# Contract Uploads, Sales Linkage, and Sales Commission Analytics

## What We're Building

Three interconnected features:
1. **Contract Document Uploads** -- Attach multiple files (PDFs, amendments, annexes) to each contract
2. **Sales Person Linkage** -- Link contracts to sales team members and cascade project status changes to commission tracking
3. **Sales Analytics Dashboard** -- A dedicated page where each salesperson sees their own commission data; admins/sales managers see everyone's

---

## 1. Contract Document Uploads

### Database Changes
- Create a `contract_documents` table to support multiple files per contract:

```text
contract_documents
  id (uuid, PK)
  contract_id (uuid, FK -> contracts.id ON DELETE CASCADE)
  file_name (text)
  file_type (text) -- 'main_contract', 'amendment', 'annex', 'addendum', 'other'
  storage_path (text)
  file_size (bigint)
  uploaded_by (uuid)
  created_at (timestamptz)
```

- RLS: Staff can CRUD; agencies/employers can SELECT their own contracts' documents (mirroring `contracts` access)
- Use existing `candidate-documents` bucket or create a new `contract-documents` storage bucket with appropriate RLS

### UI Changes (Contracts page)
- Add a file upload section in the Create Contract dialog and a new Contract Detail view
- Each contract row becomes clickable, opening a detail panel/page showing: metadata, linked project, attached files, and upload button
- Use the existing `FileUploader` pattern (drag-and-drop with `react-dropzone`)

---

## 2. Sales Person Linkage and Commission Tracking

### Database Changes
- Add `sales_person_id` column to `contracts` table (nullable uuid, references the user who is the salesperson)
- Create a `sales_commissions` table:

```text
sales_commissions
  id (uuid, PK)
  contract_id (uuid, FK -> contracts.id)
  project_id (uuid, FK -> projects.id, nullable)
  sales_person_id (uuid, NOT NULL)
  commission_amount (numeric, NOT NULL)
  currency (text, default 'EUR')
  status (text) -- 'pending', 'earned', 'partial', 'frozen', 'forfeited'
  original_amount (numeric) -- preserves the initial amount before adjustments
  adjustment_reason (text) -- why it was changed
  created_by (uuid)
  created_at (timestamptz)
  updated_at (timestamptz)
```

- RLS policies:
  - Salesperson can SELECT only their own commissions (`sales_person_id = auth.uid()`)
  - Sales managers can SELECT commissions for people they manage (or all, based on role)
  - Admins can full CRUD
  - Staff (non-sales) cannot see commissions

### Commission Status Rules (driven by project status changes)
- **Project active** -> Commission status = 'pending' or 'earned'
- **Project on_hold** -> Commission status = 'frozen' (amount preserved but not payable)
- **Project cancelled** -> Commission status = 'partial' (admin enters reduced amount) or 'forfeited'
- **Project completed** -> Commission status = 'earned'

These transitions will be managed via application logic when project status is updated (in `useUpdateProject` hook), not via database triggers, to keep control with the admin who can manually override.

### UI for Commission Entry
- When creating/editing a contract, a new "Sales Person" dropdown populated from staff with `sales_manager` role
- A "Commission" section on the contract detail where admins manually enter the commission amount
- When project status changes, a confirmation dialog shows the commission impact and lets admin choose the action

---

## 3. Sales Analytics Dashboard

### New Page: `/sales-analytics`
- Accessible to: salesperson (sees only their own), sales_manager (sees their team), admin (sees all)
- Nav item added to sidebar with `requirePermission: 'viewSalesAnalytics'` (new permission)

### Dashboard Content
- **Overview Cards**: Total contracts, total commission earned, pending commission, frozen/forfeited amounts
- **Commission by Project**: Table showing each project, its status, contract value, commission amount, and commission status
- **Status Breakdown Chart**: Pie/bar chart of commissions by status (earned vs pending vs frozen vs forfeited)
- **Timeline**: Monthly commission earned over time (bar chart)
- **Project Status Impact**: Visual showing how many commissions were affected by cancellations/holds

### Database View (security_invoker = true)
- `v_sales_commission_summary`: Aggregates commission data per salesperson with project status context

---

## FMEA (Failure Modes and Effects Analysis)

| # | Failure Mode | Severity | Likelihood | Effect | Mitigation |
|---|---|---|---|---|---|
| 1 | Salesperson sees other people's commissions | High | Medium | Data privacy breach | RLS policy restricts SELECT to `sales_person_id = auth.uid()` plus admin/manager override function |
| 2 | Project status changes but commission not updated | Medium | High | Stale commission data, inaccurate reports | Application-level logic in `useUpdateProject` hook triggers commission status review; admin confirmation dialog |
| 3 | Commission amount set to 0 or negative | Medium | Low | Incorrect financial data | Frontend validation (amount > 0); database constraint (`commission_amount >= 0`) |
| 4 | Contract deleted but commission records orphaned | High | Low | Phantom commission entries | FK with `ON DELETE CASCADE` on `sales_commissions.contract_id` |
| 5 | File upload fails silently | Medium | Medium | User thinks file was saved | Use existing toast/error pattern; verify storage response before inserting `contract_documents` row |
| 6 | Sales manager role not assigned, dashboard empty | Low | Medium | Confusion | Show clear empty state with explanation; permission check prevents access for wrong roles |
| 7 | `sales_person_id` references a user who is later deleted | Medium | Low | Broken foreign key | Use `ON DELETE SET NULL` so commission records survive but show "Deleted User" in UI |
| 8 | RLS on `sales_commissions` causes recursive calls | High | Medium | Query timeouts | Use `SECURITY DEFINER` helper function `is_salesperson()` to avoid recursive RLS |
| 9 | Large file uploads to contract-documents bucket fail | Medium | Medium | User can't attach contracts | Set bucket size limit to 20MB; show progress indicator; use chunked upload for large files |
| 10 | Multiple status changes in quick succession cause race conditions | Medium | Low | Commission ends up in wrong state | Use `updated_at` optimistic locking; last write wins with admin confirmation |

### Revisions Based on FMEA
- Added `original_amount` field to preserve commission history before adjustments (from #2)
- Added `ON DELETE CASCADE` for contract documents and `ON DELETE SET NULL` for sales person references (from #4, #7)
- Will use a `SECURITY DEFINER` function `is_sales_person_or_manager()` for RLS to prevent recursion (from #8)
- Frontend will validate commission amounts > 0 and show confirmation dialogs on project status changes (from #3, #2)

---

## Implementation Sequence

### Step 1: Database Migration
- Create `contract_documents` table with RLS
- Create `contract-documents` storage bucket with RLS
- Add `sales_person_id` to `contracts` table
- Create `sales_commissions` table with RLS
- Create `is_sales_person_or_manager()` helper function
- Add `viewSalesAnalytics` to permissions config
- Create `v_sales_commission_summary` view

### Step 2: Contract Upload Feature
- Build `ContractDocumentUpload` component (reusing `react-dropzone` pattern)
- Add contract detail view/dialog with file list and upload
- Create `useContractDocuments` hook for CRUD operations
- Make contract table rows clickable to open detail

### Step 3: Sales Commission Module
- Create `useSalesCommissions` hook
- Add sales person selector to contract create/edit form
- Add commission entry section on contract detail
- Integrate project status change with commission status updates in `useUpdateProject`
- Add confirmation dialog for status-impact on commissions

### Step 4: Sales Analytics Page
- Create `/sales-analytics` page with overview cards, charts, and tables
- Add `useSalesAnalytics` hook querying the view
- Wire up RLS-scoped data (salesperson sees own, admin sees all)
- Add navigation item to sidebar

---

## Technical Notes
- All new tables use `security_invoker = true` for views
- The `sales_commissions` RLS uses a new `SECURITY DEFINER` function to check if the requesting user is the salesperson, a sales_manager, or an admin
- Commission amounts are manually entered per the user's requirement -- no automatic percentage calculation
- The `contract_documents` table is separate from `storage_metadata` to maintain clear contract-specific semantics while `storage_metadata` handles the hybrid routing logic
- New permission `viewSalesAnalytics` will be added to `RolePermissions` interface and granted to `admin`, `sales_manager` roles only
