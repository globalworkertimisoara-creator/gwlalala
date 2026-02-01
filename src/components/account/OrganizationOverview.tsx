import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ROLES, getRoleLabel } from '@/types/database';
import { Users, Shield, Building2 } from 'lucide-react';

export function OrganizationOverview() {
  const internalRoles = ROLES.filter(r => r.isInternal);
  const externalRoles = ROLES.filter(r => !r.isInternal);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Organization Roles
        </CardTitle>
        <CardDescription>
          Overview of all roles available in the organization
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
            {internalRoles.map((role) => (
              <div
                key={role.value}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{role.label}</span>
                    <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                      Internal
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {role.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* External Roles */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium text-sm">External Roles</h4>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {externalRoles.map((role) => (
              <div
                key={role.value}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{role.label}</span>
                    <Badge variant="outline" className="text-[10px]">
                      External
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {role.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
