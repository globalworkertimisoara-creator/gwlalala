

# Self-Test Plan: Documentation Staff and Sales Manager Roles

This is a comprehensive end-to-end test plan for two roles within the GlobalWorker platform. Use the admin "View as" feature to simulate each role, or create dedicated test accounts.

---

## Prerequisites (for both roles)

1. Log in as Admin
2. Ensure test data exists: at least 1 project, 1 job, 2 candidates, and 1 agency
3. Use the sidebar dropdown "View as Internal Role" to switch between roles, or create test user accounts with registration codes

---

## PART A: Documentation Staff Test Plan

**Visible sidebar items:** Dashboard, Projects, Pipeline, Candidates, Jobs, Tasks, Contracts, Reports

### A1. Login and Navigation
| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Log in with documentation_staff credentials | Dashboard loads, sidebar shows only permitted items |
| 2 | Verify sidebar does NOT show: Agency Workers, Sales Analytics, Billing, Organization, Settings | Items hidden based on permissions |

### A2. Dashboard
| # | Step | Expected Result |
|---|------|-----------------|
| 3 | View dashboard stats and recent candidates | Data loads, no errors |

### A3. Candidates (view-only)
| # | Step | Expected Result |
|---|------|-----------------|
| 4 | Navigate to Candidates | Candidate list displays |
| 5 | Click a candidate to view details | Detail page opens with documents, notes, stage history |
| 6 | Verify "Add Candidate" button is NOT shown or disabled | Cannot create candidates (createCandidates: false) |
| 7 | Try exporting candidates | Export works (exportCandidates: true) |

### A4. Documents and Workflows (core responsibility)
| # | Step | Expected Result |
|---|------|-----------------|
| 8 | Open a candidate detail page | Documents section visible |
| 9 | Upload a document (passport, visa, contract) | Upload succeeds (uploadDocuments: true) |
| 10 | Delete a document | Delete succeeds (deleteDocuments: true) |
| 11 | Navigate to a project workflow phase | Workflow timeline and document checklist visible |
| 12 | Advance a workflow phase | Phase advances successfully (advanceWorkflowPhases: true) |
| 13 | Review and approve a document in the checklist | Approval recorded (reviewApproveDocuments: true) |
| 14 | Create a workflow | Workflow creation works (createWorkflows: true) |

### A5. Projects (view-only)
| # | Step | Expected Result |
|---|------|-----------------|
| 15 | Navigate to Projects list | Projects display |
| 16 | Click into a project detail | Detail page loads with workflow phases |
| 17 | Verify cannot create/edit/delete projects | Create button hidden or disabled |

### A6. Jobs (view-only)
| # | Step | Expected Result |
|---|------|-----------------|
| 18 | Navigate to Jobs list | Jobs display |
| 19 | Verify cannot create/edit jobs | Buttons hidden |

### A7. Notes
| # | Step | Expected Result |
|---|------|-----------------|
| 20 | On a candidate detail, add a note | Note created successfully |
| 21 | Edit own note | Edit works |
| 22 | Verify cannot delete other users' notes | Delete button hidden on others' notes |

### A8. Tasks and Contracts
| # | Step | Expected Result |
|---|------|-----------------|
| 23 | Navigate to Tasks | Task list loads |
| 24 | Navigate to Contracts | Contracts page loads |

### A9. Negative Tests (should be blocked)
| # | Step | Expected Result |
|---|------|-----------------|
| 25 | Try navigating to /settings directly | Page not shown or redirected |
| 26 | Try navigating to /organization directly | Page not shown |
| 27 | Try navigating to /billing directly | Not accessible |
| 28 | Try navigating to /sales-analytics | Not accessible |

---

## PART B: Sales Manager Test Plan

**Visible sidebar items:** Dashboard, Projects, Pipeline, Candidates, Jobs, Tasks, Contracts, Reports, Billing, Analytics

### B1. Login and Navigation
| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Log in with sales_manager credentials | Dashboard loads |
| 2 | Verify sidebar shows: Dashboard, Projects, Pipeline, Candidates, Jobs, Billing, Analytics, Tasks, Contracts, Reports | All permitted items visible |
| 3 | Verify sidebar does NOT show: Agency Workers, Sales Analytics, Organization, Settings | Hidden items confirmed |

### B2. Dashboard
| # | Step | Expected Result |
|---|------|-----------------|
| 4 | View dashboard overview cards | Stats load correctly |

### B3. Jobs (create and edit)
| # | Step | Expected Result |
|---|------|-----------------|
| 5 | Navigate to Jobs | Jobs list loads |
| 6 | Create a new job (title, client company, country) | Job created successfully (createJobs: true) |
| 7 | Edit the job details | Edit saves (editJobs: true) |
| 8 | Verify cannot delete jobs | Delete button hidden (deleteJobs: false) |

### B4. Projects (create and edit)
| # | Step | Expected Result |
|---|------|-----------------|
| 9 | Navigate to Projects | Projects list loads |
| 10 | Create a new project | Project created (createProjects: true) |
| 11 | Edit project details | Edit saves (editProjects: true) |
| 12 | Verify cannot delete projects | Delete hidden (deleteProjects: false) |

### B5. Candidates (view and export only)
| # | Step | Expected Result |
|---|------|-----------------|
| 13 | Navigate to Candidates | List displays |
| 14 | View candidate detail | Detail page loads |
| 15 | Export candidates | Export works (exportCandidates: true) |
| 16 | Verify cannot create/edit/delete candidates | Buttons hidden |

### B6. Pipeline
| # | Step | Expected Result |
|---|------|-----------------|
| 17 | Navigate to Pipeline (Kanban view) | Pipeline loads with stage columns |
| 18 | Verify candidate cards are visible | Cards display candidate info |

### B7. Billing (view only)
| # | Step | Expected Result |
|---|------|-----------------|
| 19 | Navigate to Billing | Billing page loads (viewBilling: true) |
| 20 | Verify cannot manage billing or payment methods | Management actions hidden |

### B8. Agencies (view profiles)
| # | Step | Expected Result |
|---|------|-----------------|
| 21 | View agency profiles where available | Agency data visible (viewAgencyProfiles: true) |
| 22 | Verify cannot edit agency details or approve/reject | Edit buttons hidden |

### B9. Documents (view only)
| # | Step | Expected Result |
|---|------|-----------------|
| 23 | On a candidate detail, view documents | Documents section visible |
| 24 | Verify cannot upload or delete documents | Upload/delete hidden |

### B10. Notes
| # | Step | Expected Result |
|---|------|-----------------|
| 25 | Add a note on a candidate | Note created |
| 26 | Edit own note | Works |

### B11. Tasks, Contracts, Reports
| # | Step | Expected Result |
|---|------|-----------------|
| 27 | Navigate to Tasks | Page loads |
| 28 | Navigate to Contracts | Page loads |
| 29 | Navigate to Reports | Page loads |

### B12. Negative Tests (should be blocked)
| # | Step | Expected Result |
|---|------|-----------------|
| 30 | Try navigating to /settings | Not accessible |
| 31 | Try navigating to /organization | Not accessible |
| 32 | Try navigating to /agency-workers | Not accessible |
| 33 | Try navigating to /sales-analytics | Not accessible (viewSalesAnalytics: false for sales_manager) |

---

## Test Execution Notes

- **Quick method**: Log in as Admin and use the "View as" role switcher in the sidebar user menu. Note: this only affects UI visibility -- database-level RLS is not changed.
- **Full method**: Create real test accounts with each role to validate both UI and database-level access.
- Mark each test step as PASS / FAIL / BLOCKED and note any unexpected behavior.

