import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Shield, ChevronDown, ChevronRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  type AllRoles,
  type RolePermissions,
  PERMISSIONS_BY_ROLE,
  getRoleName,
  isInternalStaff,
} from '@/config/permissions';

// Group permissions into categories for cleaner display
const PERMISSION_GROUPS: { label: string; keys: (keyof RolePermissions)[] }[] = [
  {
    label: 'User Management',
    keys: ['createUsers', 'viewAllUsers', 'modifyUserRoles'],
  },
  {
    label: 'Candidates',
    keys: ['viewAllCandidates', 'createCandidates', 'editCandidates', 'deleteCandidates', 'exportCandidates'],
  },
  {
    label: 'Jobs',
    keys: ['viewAllJobs', 'createJobs', 'editJobs', 'deleteJobs', 'linkCandidatesToJobs'],
  },
  {
    label: 'Projects',
    keys: ['viewAllProjects', 'createProjects', 'editProjects', 'deleteProjects'],
  },
  {
    label: 'Documents',
    keys: ['viewAllDocuments', 'uploadDocuments', 'deleteDocuments'],
  },
  {
    label: 'Workflows',
    keys: ['viewAllWorkflows', 'createWorkflows', 'advanceWorkflowPhases', 'reviewApproveDocuments'],
  },
  {
    label: 'Agencies',
    keys: ['viewAllAgencies', 'approveRejectAgencies', 'viewAgencyProfiles', 'editAgencyDetails', 'viewAgencyWorkers'],
  },
  {
    label: 'Team Management',
    keys: ['inviteTeamMembers', 'removeTeamMembers', 'changeTeamMemberRoles', 'viewTeamActivityLog'],
  },
  {
    label: 'Notes & Activity',
    keys: ['viewAllNotes', 'createNotes', 'editOwnNotes', 'deleteAnyNotes'],
  },
  {
    label: 'System',
    keys: ['accessAdminPanel', 'viewSystemLogs', 'modifySettings', 'createRegistrationCodes'],
  },
  {
    label: 'Billing',
    keys: ['viewInvoices', 'managePaymentMethods'],
  },
];

/** Convert camelCase key to readable label */
function formatPermissionKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function PermIcon({ allowed }: { allowed: boolean }) {
  return allowed ? (
    <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
  ) : (
    <XCircle className="h-4 w-4 text-muted-foreground/40 mx-auto" />
  );
}

interface Props {
  /** Which set of roles to show — defaults to both */
  filter?: 'internal' | 'agency' | 'all';
}

export default function RolesPermissionsOverview({ filter = 'all' }: Props) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const roles = useMemo(() => {
    const all = Object.keys(PERMISSIONS_BY_ROLE) as AllRoles[];
    if (filter === 'internal') return all.filter(isInternalStaff);
    if (filter === 'agency') return all.filter((r) => !isInternalStaff(r));
    return all;
  }, [filter]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Roles &amp; Permissions Matrix
        </CardTitle>
        <CardDescription>
          Complete overview of what each role can do across the platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Role legend */}
        <div className="flex flex-wrap gap-2 mb-4">
          {roles.map((role) => (
            <Badge
              key={role}
              variant={isInternalStaff(role) ? 'default' : 'secondary'}
              className="text-xs"
            >
              {getRoleName(role)}
            </Badge>
          ))}
        </div>

        {/* Collapsible permission groups */}
        {PERMISSION_GROUPS.map((group) => {
          const isOpen = openGroups[group.label] ?? false;

          return (
            <Collapsible
              key={group.label}
              open={isOpen}
              onOpenChange={() => toggleGroup(group.label)}
            >
              <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors text-left font-medium text-sm">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                {group.label}
                <span className="text-muted-foreground font-normal ml-auto text-xs">
                  {group.keys.length} permissions
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="overflow-x-auto mt-1 rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[180px] text-xs">Permission</TableHead>
                        {roles.map((role) => (
                          <TableHead key={role} className="text-center text-xs whitespace-nowrap px-2">
                            {getRoleName(role).replace('Agency ', 'A. ')}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.keys.map((key) => (
                        <TableRow key={key}>
                          <TableCell className="text-xs font-medium">
                            {formatPermissionKey(key)}
                          </TableCell>
                          {roles.map((role) => (
                            <TableCell key={role} className="px-2">
                              <PermIcon allowed={PERMISSIONS_BY_ROLE[role][key]} />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
}
