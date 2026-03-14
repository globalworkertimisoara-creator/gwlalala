import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Shield, Users, FileText, Eye, Briefcase, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  type AllRoles,
  type RolePermissions,
  PERMISSIONS_BY_ROLE,
  getRoleName,
  isInternalStaff,
} from '@/config/permissions';
import { useDbRolePermissions, useTogglePermission } from '@/hooks/useRolePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

function PermissionIcon({
  allowed,
  clickable,
  onClick,
  loading,
}: {
  allowed: boolean;
  clickable?: boolean;
  onClick?: () => void;
  loading?: boolean;
}) {
  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />;
  }

  return (
    <button
      type="button"
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      className={cn(
        'flex items-center justify-center w-full',
        clickable && 'cursor-pointer hover:scale-110 transition-transform rounded p-1 hover:bg-muted/50',
        !clickable && 'cursor-default',
      )}
    >
      {allowed ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : (
        <XCircle className="h-5 w-5 text-destructive" />
      )}
    </button>
  );
}

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
  { section: 'Contracts', action: 'View contracts', key: 'viewContracts' },
  { section: 'Contracts', action: 'Create draft contracts', key: 'createDraftContracts' },
  { section: 'Contracts', action: 'Edit own draft contracts', key: 'editOwnDraftContracts' },
  { section: 'Contracts', action: 'Edit all contracts', key: 'editAllContracts' },
  { section: 'Contracts', action: 'Delete contracts', key: 'deleteContracts' },
  { section: 'Contracts', action: 'Upload contract documents', key: 'uploadContractDocuments' },
  { section: 'Contracts', action: 'Approve contracts', key: 'approveContracts' },
  { section: 'Contracts', action: 'Change contract status', key: 'changeContractStatus' },
];

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  admin: { label: 'Admin', icon: Shield, color: 'bg-purple-100 text-purple-700' },
  recruiter: { label: 'Recruiter', icon: Users, color: 'bg-blue-100 text-blue-700' },
  operations_manager: { label: 'Ops Manager', icon: Briefcase, color: 'bg-amber-100 text-amber-700' },
  documentation_staff: { label: 'Doc Staff', icon: FileText, color: 'bg-green-100 text-green-700' },
};

interface Props {
  filter?: 'internal' | 'agency' | 'all';
}

export default function RolesPermissionsOverview({ filter = 'all' }: Props) {
  const { isAdmin } = useAuth();
  const { data: dbPermissions, isLoading } = useDbRolePermissions();
  const togglePermission = useTogglePermission();

  // Merge DB overrides with defaults so new roles always have a fallback
  const permissionsMap = useMemo(() => {
    const base = { ...PERMISSIONS_BY_ROLE };
    if (dbPermissions) {
      for (const role of Object.keys(dbPermissions) as AllRoles[]) {
        base[role] = dbPermissions[role];
      }
    }
    return base;
  }, [dbPermissions]);

  const roles = useMemo(() => {
    const all = Object.keys(PERMISSIONS_BY_ROLE) as AllRoles[];
    if (filter === 'internal') return all.filter(isInternalStaff);
    if (filter === 'agency') return all.filter((r) => !isInternalStaff(r));
    return all;
  }, [filter]);

  const handleToggle = (role: AllRoles, key: keyof RolePermissions) => {
    if (!isAdmin) return;
    const current = permissionsMap[role][key];
    togglePermission.mutate({ role, permissionKey: key, newValue: !current });
  };

  let lastSection = '';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Permissions by Role
        </CardTitle>
        <CardDescription>
          {isAdmin
            ? 'Click any permission icon to toggle it on or off'
            : 'Overview of what each role can do across the platform'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Role legend */}
            <div className="flex flex-wrap gap-3 mb-6">
              {roles.map((role) => {
                const config = ROLE_CONFIG[role] || { label: getRoleName(role), icon: Eye, color: 'bg-muted text-muted-foreground' };
                const Icon = config.icon;
                return (
                  <div key={role} className="flex items-center gap-2">
                    <div className={`rounded-full p-1.5 ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{config.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="max-h-[600px] overflow-auto border rounded-md relative">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b sticky top-0 z-10 bg-background">
                  <tr className="border-b">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[240px]">Action</th>
                    {roles.map((role) => {
                      const config = ROLE_CONFIG[role] || { label: getRoleName(role) };
                      return (
                        <th key={role} className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                          {config.label}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
              <TableBody>
                {PERMISSION_ROWS.map((row) => {
                  const showSection = row.section !== lastSection;
                  lastSection = row.section;

                  return (
                    <React.Fragment key={row.key}>
                      {showSection && (
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableCell
                            colSpan={roles.length + 1}
                            className="font-semibold text-xs uppercase tracking-wider text-muted-foreground py-2"
                          >
                            {row.section}
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell className="font-medium text-sm">{row.action}</TableCell>
                        {roles.map((role) => {
                          const isToggling =
                            togglePermission.isPending &&
                            togglePermission.variables?.role === role &&
                            togglePermission.variables?.permissionKey === row.key;

                          return (
                            <TableCell key={role}>
                              <PermissionIcon
                                allowed={permissionsMap[role][row.key]}
                                clickable={isAdmin}
                                onClick={() => handleToggle(role, row.key)}
                                loading={isToggling}
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
