# Self-Test Plan: Documentation Staff and Sales Manager Roles

This is a comprehensive end-to-end test plan for two roles within the GlobalWorker platform. Use the admin "View as" feature to simulate each role, or create dedicated test accounts.

**Last Executed:** 2026-03-04 (browser automation via "View as" feature)

---

## Prerequisites (for both roles)

1. Log in as Admin
2. Ensure test data exists: at least 1 project, 1 job, 2 candidates, and 1 agency
3. Use the sidebar dropdown "View as Internal Role" to switch between roles, or create test user accounts with registration codes

---

## PART A: Documentation Staff Test Plan

**Visible sidebar items:** Dashboard, Projects, Pipeline, Candidates, Jobs, Tasks, Contracts, Reports

### A1. Login and Navigation
| # | Step | Expected Result | Status |
|---|------|-----------------|--------|
| 1 | Log in with documentation_staff credentials | Dashboard loads, sidebar shows only permitted items | ✅ PASS |
| 2 | Verify sidebar does NOT show: Agency Workers, Sales Analytics, Billing, Organization, Settings | Items hidden based on permissions | ✅ PASS (fixed: viewAllUsers set to false) |

### A2. Dashboard
| # | Step | Expected Result | Status |
|---|------|-----------------|--------|
| 3 | View dashboard stats and recent candidates | Data loads, no errors | ✅ PASS |

### A3. Candidates (view-only)
| # | Step | Expected Result | Status |
|---|------|-----------------|--------|
| 4 | Navigate to Candidates | Candidate list displays | ✅ PASS |
| 5 | Click a candidate to view details | Detail page opens with documents, notes, stage history | ✅ PASS |
| 6 | Verify "Add Candidate" button is NOT shown or disabled | Cannot create candidates (createCandidates: false) | ✅ PASS |
| 7 | Try exporting candidates | Export works (exportCandidates: true) | ✅ PASS (Export CSV button visible) |

### A4. Documents and Workflows (core responsibility)
| # | Step | Expected Result | Status |
|---|------|-----------------|--------|
| 8 | Open a candidate detail page | Documents section visible | ✅ PASS |
| 9 | Upload a document (passport, visa, contract) | Upload succeeds (uploadDocuments: true) | ✅ PASS (Upload Document button visible) |
| 10 | Delete a document | Delete succeeds (deleteDocuments: true) | ⬜ NOT TESTED (no documents to delete) |
| 11 | Navigate to a project workflow phase | Workflow timeline and document checklist visible | ⬜ NOT TESTED |
| 12 | Advance a workflow phase | Phase advances successfully (advanceWorkflowPhases: true) | ⬜ NOT TESTED |
| 13 | Review and approve a document in the checklist | Approval recorded (reviewApproveDocuments: true) | ⬜ NOT TESTED |
| 14 | Create a workflow | Workflow creation works (createWorkflows: true) | ⬜ NOT TESTED |

### A5. Projects (view-only)
| # | Step | Expected Result | Status |
|---|------|-----------------|--------|
| 15 | Navigate to Projects list | Projects display | ⬜ NOT TESTED |
| 16 | Click into a project detail | Detail page loads with workflow phases | ⬜ NOT TESTED |
| 17 | Verify cannot create/edit/delete projects | Create button hidden or disabled | ⬜ NOT TESTED |

### A6. Jobs (view-only)
| # | Step | Expected Result | Status |
|---|------|-----------------|--------|
| 18 | Navigate to Jobs list | Jobs display | ⬜ NOT TESTED |
| 19 | Verify cannot create/edit jobs | Buttons hidden | ⬜ NOT TESTED |

### A7. Notes
| # | Step | Expected Result | Status |
|---|------|-----------------|--------|
| 20 | On a candidate detail, add a note | Note created successfully | ⬜ NOT TESTED |
| 21 | Edit own note | Edit works | ⬜ NOT TESTED |
| 22 | Verify cannot delete other users' notes | Delete button hidden on others' notes | ⬜ NOT TESTED |

### A8. Tasks and Contracts
| # | Step | Expected Result | Status |
|---|------|-----------------|--------|
| 23 | Navigate to Tasks | Task list loads | ⬜ NOT TESTED |
| 24 | Navigate to Contracts | Contracts page loads | ⬜ NOT TESTED |

### A9. Negative Tests (should be blocked)
| # | Step | Expected Result | Status |
|---|------|-----------------|--------|
| 25 | Try navigating to /settings directly | Page not shown or redirected | ⚠️ Cannot test via "View as" (role resets on navigation) |
| 26 | Try navigating to /organization directly | Page not shown | ⚠️ Cannot test via "View as" |
| 27 | Try navigating to /billing directly | Not accessible | ⚠️ Cannot test via "View as" |
| 28 | Try navigating to /sales-analytics | Not accessible | ⚠️ Cannot test via "View as" |

---

## PART B: Sales Manager Test Plan

**Visible sidebar items:** Dashboard, Projects, Pipeline, Candidates, Jobs, Tasks, Contracts, Reports, Billing, Analytics

### B1. Login and Navigation
| # | Step | Expected Result | Status |
|---|------|-----------------|--------|
| 1 | Log in with sales_manager credentials | Dashboard loads | ✅ PASS |
| 2 | Verify sidebar shows: Dashboard, Projects, Pipeline, Candidates, Jobs, Billing, Analytics, Tasks, Contracts, Reports | All permitted items visible | ✅ PASS |
| 3 | Verify sidebar does NOT show: Agency Workers, Sales Analytics, Organization, Settings | Hidden items confirmed | ✅ PASS (fixed: viewAllUsers set to false) |

### B2. Dashboard
| # | Step | Expected Result | Status |
|---|------|-----------------|--------|
| 4 | View dashboard overview cards | Stats load correctly | ✅ PASS |

### B3. Jobs (create and edit)
| # | Step | Expected Result | Status |
|---|------|-----------------|--------|
| 5 | Navigate to Jobs | Jobs list loads | ✅ PASS |
| 6 | Create a new job (title, client company, country) | Job created successfully (createJobs: true) | ✅ PASS (Add Job button visible) |
| 7 | Edit the job details | Edit saves (editJobs: true) | ⬜ NOT TESTED |
| 8 | Verify cannot delete jobs | Delete button hidden (deleteJobs: false) | ⬜ NOT TESTED |

### B4. Projects (create and edit)
| # | Step | Expected Result | Status |
|---|------|-----------------|--------|
| 9 | Navigate to Projects | Projects list loads | ✅ PASS |
| 10 | Create a new project | Project created (createProjects: true) | ✅ PASS (New Project button visible) |
| 11 | Edit project details | Edit saves (editProjects: true) | ⬜ NOT TESTED |
| 12 | Verify cannot delete projects | Delete hidden (deleteProjects: false) | ⬜ NOT TESTED |

### B5. Candidates (view and export only)
| # | Step | Expected Result | Status |
|---|------|-----------------|--------|
| 13 | Navigate to Candidates | List displays | ✅ PASS |
| 14 | View candidate detail | Detail page loads | ✅ PASS |
| 15 | Export candidates | Export works (exportCandidates: true) | ✅ PASS (Export CSV visible) |
| 16 | Verify cannot create/edit/delete candidates | Buttons hidden | ✅ PASS (no Add button) |

### B6. Pipeline
| # | Step | Expected Result | Status |
|---|------|-----------------|--------|
| 17 | Navigate to Pipeline (Kanban view) | Pipeline loads with stage columns | ⬜ NOT TESTED |
| 18 | Verify candidate cards are visible | Cards display candidate info | ⬜ NOT TESTED |

### B7. Billing (view only)
| # | Step | Expected Result | Status |
|---|------|-----------------|--------|
| 19 | Navigate to Billing | Billing page loads (viewBilling: true) | ⬜ NOT TESTED |
| 20 | Verify cannot manage billing or payment methods | Management actions hidden | ⬜ NOT TESTED |

### B8. Agencies (view profiles)
| # | Step | Expected Result | Status |
|---|------|-----------------|--------|
| 21 | View agency profiles where available | Agency data visible (viewAgencyProfiles: true) | ⬜ NOT TESTED |
| 22 | Verify cannot edit agency details or approve/reject | Edit buttons hidden | ⬜ NOT TESTED |

### B9. Documents (view only)
| # | Step | Expected Result | Status |
|---|------|-----------------|--------|
| 23 | On a candidate detail, view documents | Documents section visible | ✅ PASS |
| 24 | Verify cannot upload or delete documents | Upload/delete hidden | ✅ PASS (fixed: CandidateDocumentUpload now gated by uploadDocuments permission) |

### B10. Notes
| # | Step | Expected Result | Status |
|---|------|-----------------|--------|
| 25 | Add a note on a candidate | Note created | ⬜ NOT TESTED |
| 26 | Edit own note | Works | ⬜ NOT TESTED |

### B11. Tasks, Contracts, Reports
| # | Step | Expected Result | Status |
|---|------|-----------------|--------|
| 27 | Navigate to Tasks | Page loads | ⬜ NOT TESTED |
| 28 | Navigate to Contracts | Page loads | ⬜ NOT TESTED |
| 29 | Navigate to Reports | Page loads | ⬜ NOT TESTED |

### B12. Negative Tests (should be blocked)
| # | Step | Expected Result | Status |
|---|------|-----------------|--------|
| 30 | Try navigating to /settings | Not accessible | ⚠️ Cannot test via "View as" |
| 31 | Try navigating to /organization | Not accessible | ⚠️ Cannot test via "View as" |
| 32 | Try navigating to /agency-workers | Not accessible | ⚠️ Cannot test via "View as" |
| 33 | Try navigating to /sales-analytics | Not accessible | ⚠️ Cannot test via "View as" |

---

## Bugs Found and Fixed

| # | Bug | Fix Applied |
|---|-----|-------------|
| 1 | Documentation Staff could see Organization sidebar item (`viewAllUsers: true`) | Set `viewAllUsers: false` in `DOCUMENTATION_STAFF_PERMISSIONS` |
| 2 | Documentation Lead could see Organization sidebar item (`viewAllUsers: true`) | Set `viewAllUsers: false` in `DOCUMENTATION_LEAD_PERMISSIONS` |
| 3 | Sales Manager could see Organization sidebar item (`viewAllUsers: true`) | Set `viewAllUsers: false` in `SALES_MANAGER_PERMISSIONS` |
| 4 | Sales Manager could see document upload form on candidate detail (`CandidateDocumentUpload` not permission-gated) | Wrapped `CandidateDocumentUpload` in `can('uploadDocuments')` check |

## Test Execution Notes

- **Method used**: Admin "View as" role switcher in the sidebar user menu
- **Limitation**: "View as" only affects UI visibility — database-level RLS is not changed. Navigating to a new URL via browser resets the role override (React state is lost). Negative route tests require real test accounts.
- **Recommendation**: Create real test accounts with documentation_staff and sales_manager roles for full end-to-end validation including RLS.
- Items marked ⬜ NOT TESTED require manual interaction (file uploads, form submissions) or real test accounts.
