import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ROLES, getRoleLabel } from '@/types/database';
import {
  type AllRoles,
  type RolePermissions,
  PERMISSIONS_BY_ROLE,
  getRoleName,
  isInternalStaff,
  isAgencyTeam,
  isEmployerTeam,
} from '@/config/permissions';
import { useDbRolePermissions, useTogglePermission } from '@/hooks/useRolePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Shield, Building2, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PermissionRow {
  section: string;
  action: string;
  key: keyof RolePermissions;
}

const PERMISSION_ROWS: PermissionRow[] = [
  { section: 'User Management', action: 'Create users', key: 'createUsers' },
  { section: 'User Management', action: 'View all users', key: 'viewAllUsers' },
  { section: 'User Management', action: 'Modify user roles', key: 'modifyUserRoles' },
  { section: 'Candidates', action: 'View all candidates', key: 'viewAllCandidates' },
  { section: 'Candidates', action: 'Create candidates', key: 'createCandidates' },
  { section: 'Candidates', action: 'Edit candidates', key: 'editCandidates' },
  { section: 'Candidates', action: 'Delete candidates', key: 'deleteCandidates' },
  { section: 'Candidates', action: 'Export candidates', key: 'exportCandidates' },
  { section: 'Jobs', action: 'View all jobs', key: 'viewAllJobs' },
  { section: 'Jobs', action: 'Create jobs', key: 'createJobs' },
  { section: 'Jobs', action: 'Edit jobs', key: 'editJobs' },
  { section: 'Jobs', action: 'Delete jobs', key: 'deleteJobs' },
  { section: 'Jobs', action: 'Link candidates to jobs', key: 'linkCandidatesToJobs' },
  { section: 'Projects', action: 'View all projects', key: 'viewAllProjects' },
  { section: 'Projects', action: 'Create projects', key: 'createProjects' },
  { section: 'Projects', action: 'Edit projects', key: 'editProjects' },
  { section: 'Projects', action: 'Delete projects', key: 'deleteProjects' },
  { section: 'Documents', action: 'View all documents', key: 'viewAllDocuments' },
  { section: 'Documents', action: 'Upload documents', key: 'uploadDocuments' },
  { section: 'Documents', action: 'Delete documents', key: 'deleteDocuments' },
  { section: 'Workflows', action: 'View all workflows', key: 'viewAllWorkflows' },
  { section: 'Workflows', action: 'Create workflows', key: 'createWorkflows' },
  { section: 'Workflows', action: 'Advance workflow phases', key: 'advanceWorkflowPhases' },
  { section: 'Workflows', action: 'Review & approve documents', key: 'reviewApproveDocuments' },
  { section: 'Agencies', action: 'View all agencies', key: 'viewAllAgencies' },
  { section: 'Agencies', action: 'Approve/reject agencies', key: 'approveRejectAgencies' },
  { section: 'Agencies', action: 'View agency profiles', key: 'viewAgencyProfiles' },
  { section: 'Agencies', action: 'Edit agency details', key: 'editAgencyDetails' },
  { section: 'Agencies', action: 'View agency workers', key: 'viewAgencyWorkers' },
  { section: 'Team Management', action: 'Invite team members', key: 'inviteTeamMembers' },
  { section: 'Team Management', action: 'Remove team members', key: 'removeTeamMembers' },
  { section: 'Team Management', action: 'Change team member roles', key: 'changeTeamMemberRoles' },
  { section: 'Team Management', action: 'View team activity log', key: 'viewTeamActivityLog' },
  { section: 'Notes & Activity', action: 'View all notes', key: 'viewAllNotes' },
  { section: 'Notes & Activity', action: 'Create notes', key: 'createNotes' },
  { section: 'Notes & Activity', action: 'Edit own notes', key: 'editOwnNotes' },
  { section: 'Notes & Activity', action: 'Delete any notes', key: 'deleteAnyNotes' },
  { section: 'System', action: 'Access admin panel', key: 'accessAdminPanel' },
  { section: 'System', action: 'View system logs', key: 'viewSystemLogs' },
  { section: 'System', action: 'Modify settings', key: 'modifySettings' },
  { section: 'System', action: 'Create registration codes', key: 'createRegistrationCodes' },
  { section: 'Billing', action: 'View billing', key: 'viewBilling' },
  { section: 'Billing', action: 'Manage billing', key: 'manageBilling' },
  { section: 'Billing', action: 'View invoices', key: 'viewInvoices' },
  { section: 'Billing', action: 'Manage payment methods', key: 'managePaymentMethods' },
  { section: 'Sales', action: 'View sales analytics', key: 'viewSalesAnalytics' },
  { section: 'Contracts', action: 'View contracts', key: 'viewContracts' },
  { section: 'Contracts', action: 'Create draft contracts', key: 'createDraftContracts' },
  { section: 'Contracts', action: 'Edit own draft contracts', key: 'editOwnDraftContracts' },
  { section: 'Contracts', action: 'Edit all contracts', key: 'editAllContracts' },
  { section: 'Contracts', action: 'Delete contracts', key: 'deleteContracts' },
  { section: 'Contracts', action: 'Upload contract documents', key: 'uploadContractDocuments' },
  { section: 'Contracts', action: 'Approve contracts', key: 'approveContracts' },
  { section: 'Contracts', action: 'Change contract status', key: 'changeContractStatus' },
  { section: 'Employer Portal', action: 'Invite employer team', key: 'inviteEmployerTeam' },
  { section: 'Employer Portal', action: 'Remove employer team', key: 'removeEmployerTeam' },
  { section: 'Employer Portal', action: 'Manage employer team', key: 'manageEmployerTeam' },
  { section: 'Employer Portal', action: 'View company profile', key: 'viewCompanyProfile' },
  { section: 'Employer Portal', action: 'Edit company profile', key: 'editCompanyProfile' },
  { section: 'Employer Portal', action: 'Upload company documents', key: 'uploadCompanyDocuments' },
  { section: 'Employer Portal', action: 'View assigned projects', key: 'viewAssignedProjects' },
  { section: 'Employer Portal', action: 'View all company projects', key: 'viewAllCompanyProjects' },
  { section: 'Employer Portal', action: 'View project candidates', key: 'viewProjectCandidates' },
  { section: 'Employer Portal', action: 'Export candidate lists', key: 'exportCandidateLists' },
  { section: 'Employer Portal', action: 'View candidate documents', key: 'viewCandidateDocuments' },
  { section: 'Employer Portal', action: 'Schedule interviews', key: 'scheduleInterviews' },
  { section: 'Employer Portal', action: 'View interviews', key: 'viewInterviews' },
  { section: 'Employer Portal', action: 'Provide feedback', key: 'provideFeedback' },
  { section: 'Employer Portal', action: 'Create offers', key: 'createOffers' },
  { section: 'Employer Portal', action: 'View offers', key: 'viewOffers' },
  { section: 'Employer Portal', action: 'Approve offers', key: 'approveOffers' },
];

function RolePermissionsPanel({
  role,
  permissions,
  isAdmin,
  onToggle,
  togglingKey,
}: {
  role: AllRoles;
  permissions: RolePermissions;
  isAdmin: boolean;
  onToggle: (key: keyof RolePermissions) => void;
  togglingKey: keyof RolePermissions | null;
}) {
  let lastSection = '';

  // Filter to only show relevant permissions (ones that are true or contextually relevant)
  const relevantRows = PERMISSION_ROWS;

  return (
    <div className="mt-3 border rounded-md overflow-hidden">
      <div className="max-h-[400px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-muted">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Permission</th>
              <th className="text-center px-4 py-2 font-medium text-muted-foreground w-20">Allowed</th>
            </tr>
          </thead>
          <tbody>
            {relevantRows.map((row) => {
              const showSection = row.section !== lastSection;
              lastSection = row.section;
              const isToggling = togglingKey === row.key;

              return (
                <tr key={row.key}>
                  <td className="px-4 py-1.5">
                    {showSection && (
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-0.5">
                        {row.section}
                      </span>
                    )}
                    <span className="text-sm">{row.action}</span>
                  </td>
                  <td className="text-center px-4 py-1.5">
                    {isToggling ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                    ) : (
                      <Checkbox
                        checked={permissions[row.key]}
                        disabled={!isAdmin}
                        onCheckedChange={() => onToggle(row.key)}
                        className="mx-auto"
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function OrganizationOverview() {
  const { isAdmin } = useAuth();
  const { data: dbPermissions, isLoading } = useDbRolePermissions();
  const togglePermission = useTogglePermission();
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  const permissionsMap = useMemo(() => {
    const base = { ...PERMISSIONS_BY_ROLE };
    if (dbPermissions) {
      for (const role of Object.keys(dbPermissions) as AllRoles[]) {
        base[role] = dbPermissions[role];
      }
    }
    return base;
  }, [dbPermissions]);

  const internalRoles = ROLES.filter(r => r.isInternal);
  const externalRoles = ROLES.filter(r => !r.isInternal);

  // Map AppRole to AllRoles for permissions lookup
  const getRolePermissionKey = (roleValue: string): AllRoles | null => {
    if (roleValue in permissionsMap) return roleValue as AllRoles;
    if (roleValue === 'agency') return 'agency_owner';
    if (roleValue === 'employer') return 'employer_admin';
    return null;
  };

  const handleToggle = (role: AllRoles, key: keyof RolePermissions) => {
    if (!isAdmin) return;
    const current = permissionsMap[role][key];
    togglePermission.mutate({ role, permissionKey: key, newValue: !current });
  };

  const togglingKey =
    togglePermission.isPending && togglePermission.variables
      ? togglePermission.variables.permissionKey
      : null;
  const togglingRole =
    togglePermission.isPending && togglePermission.variables
      ? togglePermission.variables.role
      : null;

  const renderRoleCard = (role: { value: string; label: string; description: string; isInternal: boolean }) => {
    const permKey = getRolePermissionKey(role.value);
    const isExpanded = expandedRole === role.value;
    const perms = permKey ? permissionsMap[permKey] : null;
    const displayedKeys = PERMISSION_ROWS.map(r => r.key);
    const enabledCount = perms ? displayedKeys.filter(k => perms[k]).length : 0;
    const totalCount = displayedKeys.length;

    return (
      <div key={role.value} className="rounded-lg border bg-card overflow-hidden">
        <button
          type="button"
          onClick={() => setExpandedRole(isExpanded ? null : role.value)}
          className="w-full flex items-start gap-3 p-3 hover:bg-accent/50 transition-colors text-left"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{role.label}</span>
              <Badge variant={role.isInternal ? 'secondary' : 'outline'} className="text-[10px]">
                {role.isInternal ? 'Internal' : 'External'}
              </Badge>
              {perms && (
                <Badge variant="outline" className="text-[10px] ml-auto">
                  {enabledCount}/{totalCount}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
          </div>
          {perms && (
            isExpanded
              ? <ChevronDown className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
              : <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
          )}
        </button>
        {isExpanded && perms && permKey && (
          <div className="px-3 pb-3">
            <RolePermissionsPanel
              role={permKey}
              permissions={perms}
              isAdmin={isAdmin}
              onToggle={(key) => handleToggle(permKey, key)}
              togglingKey={togglingRole === permKey ? togglingKey : null}
            />
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Organization Roles
        </CardTitle>
        <CardDescription>
          {isAdmin
            ? 'Click a role to view and edit its permissions'
            : 'Click a role to view its permissions'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Internal Roles */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-primary" />
            <h4 className="font-medium text-sm">Internal Staff Roles</h4>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {internalRoles.map(renderRoleCard)}
          </div>
        </div>

        {/* External Roles */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium text-sm">External Roles</h4>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {externalRoles.map(renderRoleCard)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
