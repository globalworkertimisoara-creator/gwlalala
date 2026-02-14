/**
 * src/config/permissions.ts
 *
 * Role-based permissions configuration for GlobalWorker platform.
 * This file defines what each user role can and cannot do in the system.
 */

export type InternalRole = 'admin' | 'recruiter' | 'operations_manager' | 'documentation_staff';

export type AgencyRole = 'agency_owner' | 'agency_recruiter' | 'agency_document_staff' | 'agency_viewer';

export type AllRoles = InternalRole | AgencyRole;

// ─── Permission Categories ────────────────────────────────────────────────────

export interface RolePermissions {
  // User Management
  createUsers: boolean;
  viewAllUsers: boolean;
  modifyUserRoles: boolean;

  // Candidates
  viewAllCandidates: boolean;
  createCandidates: boolean;
  editCandidates: boolean;
  deleteCandidates: boolean;
  exportCandidates: boolean;

  // Jobs
  viewAllJobs: boolean;
  createJobs: boolean;
  editJobs: boolean;
  deleteJobs: boolean;
  linkCandidatesToJobs: boolean;

  // Projects
  viewAllProjects: boolean;
  createProjects: boolean;
  editProjects: boolean;
  deleteProjects: boolean;

  // Documents
  viewAllDocuments: boolean;
  uploadDocuments: boolean;
  deleteDocuments: boolean;

  // Workflow Management
  viewAllWorkflows: boolean;
  createWorkflows: boolean;
  advanceWorkflowPhases: boolean;
  reviewApproveDocuments: boolean;

  // Agencies
  viewAllAgencies: boolean;
  approveRejectAgencies: boolean;
  viewAgencyProfiles: boolean;
  editAgencyDetails: boolean;
  viewAgencyWorkers: boolean;

  // Team Management (for agencies)
  inviteTeamMembers: boolean;
  removeTeamMembers: boolean;
  changeTeamMemberRoles: boolean;
  viewTeamActivityLog: boolean;

  // Notes & Activity
  viewAllNotes: boolean;
  createNotes: boolean;
  editOwnNotes: boolean;
  deleteAnyNotes: boolean;

  // System
  accessAdminPanel: boolean;
  viewSystemLogs: boolean;
  modifySettings: boolean;
  createRegistrationCodes: boolean;

  // Billing (for agencies)
  viewInvoices: boolean;
  managePaymentMethods: boolean;
}

// ─── Internal Staff Permissions ───────────────────────────────────────────────

const ADMIN_PERMISSIONS: RolePermissions = {
  createUsers: true,
  viewAllUsers: true,
  modifyUserRoles: true,
  viewAllCandidates: true,
  createCandidates: true,
  editCandidates: true,
  deleteCandidates: true,
  exportCandidates: true,
  viewAllJobs: true,
  createJobs: true,
  editJobs: true,
  deleteJobs: true,
  linkCandidatesToJobs: true,
  viewAllProjects: true,
  createProjects: true,
  editProjects: true,
  deleteProjects: true,
  viewAllDocuments: true,
  uploadDocuments: true,
  deleteDocuments: true,
  viewAllWorkflows: true,
  createWorkflows: true,
  advanceWorkflowPhases: true,
  reviewApproveDocuments: true,
  viewAllAgencies: true,
  approveRejectAgencies: true,
  viewAgencyProfiles: true,
  editAgencyDetails: true,
  viewAgencyWorkers: true,
  inviteTeamMembers: false,
  removeTeamMembers: false,
  changeTeamMemberRoles: false,
  viewTeamActivityLog: false,
  viewAllNotes: true,
  createNotes: true,
  editOwnNotes: true,
  deleteAnyNotes: true,
  accessAdminPanel: true,
  viewSystemLogs: true,
  modifySettings: true,
  createRegistrationCodes: true,
  viewInvoices: false,
  managePaymentMethods: false,
};

const RECRUITER_PERMISSIONS: RolePermissions = {
  createUsers: false,
  viewAllUsers: true,
  modifyUserRoles: false,
  viewAllCandidates: true,
  createCandidates: true,
  editCandidates: true,
  deleteCandidates: false,
  exportCandidates: true,
  viewAllJobs: true,
  createJobs: true,
  editJobs: true,
  deleteJobs: false,
  linkCandidatesToJobs: true,
  viewAllProjects: true,
  createProjects: true,
  editProjects: true,
  deleteProjects: false,
  viewAllDocuments: true,
  uploadDocuments: true,
  deleteDocuments: false,
  viewAllWorkflows: true,
  createWorkflows: false,
  advanceWorkflowPhases: false,
  reviewApproveDocuments: false,
  viewAllAgencies: true,
  approveRejectAgencies: false,
  viewAgencyProfiles: true,
  editAgencyDetails: false,
  viewAgencyWorkers: true,
  inviteTeamMembers: false,
  removeTeamMembers: false,
  changeTeamMemberRoles: false,
  viewTeamActivityLog: false,
  viewAllNotes: true,
  createNotes: true,
  editOwnNotes: true,
  deleteAnyNotes: false,
  accessAdminPanel: false,
  viewSystemLogs: false,
  modifySettings: false,
  createRegistrationCodes: false,
  viewInvoices: false,
  managePaymentMethods: false,
};

const OPERATIONS_MANAGER_PERMISSIONS: RolePermissions = {
  createUsers: false,
  viewAllUsers: true,
  modifyUserRoles: false,
  viewAllCandidates: true,
  createCandidates: true,
  editCandidates: true,
  deleteCandidates: false,
  exportCandidates: true,
  viewAllJobs: true,
  createJobs: true,
  editJobs: true,
  deleteJobs: false,
  linkCandidatesToJobs: true,
  viewAllProjects: true,
  createProjects: true,
  editProjects: true,
  deleteProjects: false,
  viewAllDocuments: true,
  uploadDocuments: true,
  deleteDocuments: true,
  viewAllWorkflows: true,
  createWorkflows: true,
  advanceWorkflowPhases: true,
  reviewApproveDocuments: true,
  viewAllAgencies: true,
  approveRejectAgencies: true,
  viewAgencyProfiles: true,
  editAgencyDetails: true,
  viewAgencyWorkers: false,
  inviteTeamMembers: false,
  removeTeamMembers: false,
  changeTeamMemberRoles: false,
  viewTeamActivityLog: false,
  viewAllNotes: true,
  createNotes: true,
  editOwnNotes: true,
  deleteAnyNotes: false,
  accessAdminPanel: false,
  viewSystemLogs: true,
  modifySettings: false,
  createRegistrationCodes: false,
  viewInvoices: false,
  managePaymentMethods: false,
};

const DOCUMENTATION_STAFF_PERMISSIONS: RolePermissions = {
  createUsers: false,
  viewAllUsers: true,
  modifyUserRoles: false,
  viewAllCandidates: true,
  createCandidates: false,
  editCandidates: false,
  deleteCandidates: false,
  exportCandidates: true,
  viewAllJobs: true,
  createJobs: false,
  editJobs: false,
  deleteJobs: false,
  linkCandidatesToJobs: false,
  viewAllProjects: true,
  createProjects: false,
  editProjects: false,
  deleteProjects: false,
  viewAllDocuments: true,
  uploadDocuments: true,
  deleteDocuments: true,
  viewAllWorkflows: true,
  createWorkflows: true,
  advanceWorkflowPhases: true,
  reviewApproveDocuments: true,
  viewAllAgencies: false,
  approveRejectAgencies: false,
  viewAgencyProfiles: false,
  editAgencyDetails: false,
  viewAgencyWorkers: false,
  inviteTeamMembers: false,
  removeTeamMembers: false,
  changeTeamMemberRoles: false,
  viewTeamActivityLog: false,
  viewAllNotes: true,
  createNotes: true,
  editOwnNotes: true,
  deleteAnyNotes: false,
  accessAdminPanel: false,
  viewSystemLogs: false,
  modifySettings: false,
  createRegistrationCodes: false,
  viewInvoices: false,
  managePaymentMethods: false,
};

// ─── Agency Team Permissions ──────────────────────────────────────────────────

const AGENCY_OWNER_PERMISSIONS: RolePermissions = {
  createUsers: false,
  viewAllUsers: false,
  modifyUserRoles: false,
  viewAllCandidates: true,
  createCandidates: true,
  editCandidates: true,
  deleteCandidates: true,
  exportCandidates: true,
  viewAllJobs: false,
  createJobs: false,
  editJobs: false,
  deleteJobs: false,
  linkCandidatesToJobs: false,
  viewAllProjects: false,
  createProjects: false,
  editProjects: false,
  deleteProjects: false,
  viewAllDocuments: true,
  uploadDocuments: true,
  deleteDocuments: true,
  viewAllWorkflows: true,
  createWorkflows: false,
  advanceWorkflowPhases: false,
  reviewApproveDocuments: false,
  viewAllAgencies: false,
  approveRejectAgencies: false,
  viewAgencyProfiles: true,
  editAgencyDetails: true,
  viewAgencyWorkers: false,
  inviteTeamMembers: true,
  removeTeamMembers: true,
  changeTeamMemberRoles: true,
  viewTeamActivityLog: true,
  viewAllNotes: true,
  createNotes: true,
  editOwnNotes: true,
  deleteAnyNotes: false,
  accessAdminPanel: false,
  viewSystemLogs: false,
  modifySettings: false,
  createRegistrationCodes: false,
  viewInvoices: true,
  managePaymentMethods: true,
};

const AGENCY_RECRUITER_PERMISSIONS: RolePermissions = {
  createUsers: false,
  viewAllUsers: false,
  modifyUserRoles: false,
  viewAllCandidates: true,
  createCandidates: true,
  editCandidates: true,
  deleteCandidates: false,
  exportCandidates: false,
  viewAllJobs: false,
  createJobs: false,
  editJobs: false,
  deleteJobs: false,
  linkCandidatesToJobs: false,
  viewAllProjects: false,
  createProjects: false,
  editProjects: false,
  deleteProjects: false,
  viewAllDocuments: true,
  uploadDocuments: true,
  deleteDocuments: false,
  viewAllWorkflows: true,
  createWorkflows: false,
  advanceWorkflowPhases: false,
  reviewApproveDocuments: false,
  viewAllAgencies: false,
  approveRejectAgencies: false,
  viewAgencyProfiles: true,
  editAgencyDetails: false,
  viewAgencyWorkers: false,
  inviteTeamMembers: false,
  removeTeamMembers: false,
  changeTeamMemberRoles: false,
  viewTeamActivityLog: false,
  viewAllNotes: true,
  createNotes: true,
  editOwnNotes: true,
  deleteAnyNotes: false,
  accessAdminPanel: false,
  viewSystemLogs: false,
  modifySettings: false,
  createRegistrationCodes: false,
  viewInvoices: false,
  managePaymentMethods: false,
};

const AGENCY_DOCUMENT_STAFF_PERMISSIONS: RolePermissions = {
  createUsers: false,
  viewAllUsers: false,
  modifyUserRoles: false,
  viewAllCandidates: true,
  createCandidates: false,
  editCandidates: false,
  deleteCandidates: false,
  exportCandidates: false,
  viewAllJobs: false,
  createJobs: false,
  editJobs: false,
  deleteJobs: false,
  linkCandidatesToJobs: false,
  viewAllProjects: false,
  createProjects: false,
  editProjects: false,
  deleteProjects: false,
  viewAllDocuments: true,
  uploadDocuments: true,
  deleteDocuments: false,
  viewAllWorkflows: true,
  createWorkflows: false,
  advanceWorkflowPhases: false,
  reviewApproveDocuments: false,
  viewAllAgencies: false,
  approveRejectAgencies: false,
  viewAgencyProfiles: true,
  editAgencyDetails: false,
  viewAgencyWorkers: false,
  inviteTeamMembers: false,
  removeTeamMembers: false,
  changeTeamMemberRoles: false,
  viewTeamActivityLog: false,
  viewAllNotes: true,
  createNotes: true,
  editOwnNotes: true,
  deleteAnyNotes: false,
  accessAdminPanel: false,
  viewSystemLogs: false,
  modifySettings: false,
  createRegistrationCodes: false,
  viewInvoices: false,
  managePaymentMethods: false,
};

const AGENCY_VIEWER_PERMISSIONS: RolePermissions = {
  createUsers: false,
  viewAllUsers: false,
  modifyUserRoles: false,
  viewAllCandidates: true,
  createCandidates: false,
  editCandidates: false,
  deleteCandidates: false,
  exportCandidates: false,
  viewAllJobs: false,
  createJobs: false,
  editJobs: false,
  deleteJobs: false,
  linkCandidatesToJobs: false,
  viewAllProjects: false,
  createProjects: false,
  editProjects: false,
  deleteProjects: false,
  viewAllDocuments: true,
  uploadDocuments: false,
  deleteDocuments: false,
  viewAllWorkflows: true,
  createWorkflows: false,
  advanceWorkflowPhases: false,
  reviewApproveDocuments: false,
  viewAllAgencies: false,
  approveRejectAgencies: false,
  viewAgencyProfiles: true,
  editAgencyDetails: false,
  viewAgencyWorkers: false,
  inviteTeamMembers: false,
  removeTeamMembers: false,
  changeTeamMemberRoles: false,
  viewTeamActivityLog: false,
  viewAllNotes: true,
  createNotes: false,
  editOwnNotes: false,
  deleteAnyNotes: false,
  accessAdminPanel: false,
  viewSystemLogs: false,
  modifySettings: false,
  createRegistrationCodes: false,
  viewInvoices: false,
  managePaymentMethods: false,
};

// ─── Permissions Map ──────────────────────────────────────────────────────────

export const PERMISSIONS_BY_ROLE: Record<AllRoles, RolePermissions> = {
  admin: ADMIN_PERMISSIONS,
  recruiter: RECRUITER_PERMISSIONS,
  operations_manager: OPERATIONS_MANAGER_PERMISSIONS,
  documentation_staff: DOCUMENTATION_STAFF_PERMISSIONS,
  agency_owner: AGENCY_OWNER_PERMISSIONS,
  agency_recruiter: AGENCY_RECRUITER_PERMISSIONS,
  agency_document_staff: AGENCY_DOCUMENT_STAFF_PERMISSIONS,
  agency_viewer: AGENCY_VIEWER_PERMISSIONS,
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Get permissions for a specific role
 */
export function getPermissions(role: AllRoles): RolePermissions {
  return PERMISSIONS_BY_ROLE[role];
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  role: AllRoles,
  permission: keyof RolePermissions
): boolean {
  return PERMISSIONS_BY_ROLE[role][permission];
}

/**
 * Check if any of multiple roles has a specific permission
 */
export function hasAnyPermission(
  roles: AllRoles[],
  permission: keyof RolePermissions
): boolean {
  return roles.some((role) => hasPermission(role, permission));
}

/**
 * Get human-readable role name
 */
export function getRoleName(role: AllRoles): string {
  const names: Record<AllRoles, string> = {
    admin: 'Administrator',
    recruiter: 'Recruiter',
    operations_manager: 'Operations Manager',
    documentation_staff: 'Documentation Staff',
    agency_owner: 'Agency Owner',
    agency_recruiter: 'Agency Recruiter',
    agency_document_staff: 'Agency Document Staff',
    agency_viewer: 'Agency Viewer',
  };
  return names[role];
}

/**
 * Check if role is internal staff
 */
export function isInternalStaff(role: AllRoles): boolean {
  return ['admin', 'recruiter', 'operations_manager', 'documentation_staff'].includes(role);
}

/**
 * Check if role is agency team member
 */
export function isAgencyTeam(role: AllRoles): boolean {
  return ['agency_owner', 'agency_recruiter', 'agency_document_staff', 'agency_viewer'].includes(role);
}
