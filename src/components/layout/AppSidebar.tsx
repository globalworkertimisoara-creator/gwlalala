import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Kanban, 
  Settings, 
  Globe,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  LogOut,
  User,
  PanelLeftClose,
  Building2,
  FolderKanban,
  Receipt,
  Eye,
  BarChart3,
  CheckSquare,
  FileText,
  FileDown,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { TasksSidebar } from '@/components/tasks/TasksSidebar';
import type { RolePermissions } from '@/config/permissions';
import { ROLES, type AppRole } from '@/types/database';

const AGENCY_ROLE_OPTIONS = [
  { value: 'agency_owner', label: 'Agency Owner' },
  { value: 'agency_recruiter', label: 'Agency Recruiter' },
  { value: 'agency_document_staff', label: 'Agency Document Staff' },
  { value: 'agency_viewer', label: 'Agency Viewer' },
] as const;

interface NavItem {
  title: string;
  url: string;
  icon: any;
  /** If set, the item is only shown when the user has this permission */
  requirePermission?: keyof RolePermissions;
}

const navItems: NavItem[] = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Projects', url: '/projects', icon: FolderKanban, requirePermission: 'viewAllProjects' },
  { title: 'Pipeline', url: '/pipeline', icon: Kanban, requirePermission: 'viewAllCandidates' },
  { title: 'Candidates', url: '/candidates', icon: Users, requirePermission: 'viewAllCandidates' },
  { title: 'Jobs', url: '/jobs', icon: Briefcase },
  { title: 'Agency Workers', url: '/agency-workers', icon: Building2, requirePermission: 'viewAgencyWorkers' },
  { title: 'Tasks', url: '/tasks', icon: CheckSquare },
  { title: 'Contracts', url: '/contracts', icon: FileText },
  { title: 'Reports', url: '/reports', icon: FileDown },
  { title: 'Sales Analytics', url: '/sales-analytics', icon: BarChart3, requirePermission: 'viewSalesAnalytics' },
  { title: 'Billing', url: '/billing', icon: Receipt, requirePermission: 'viewBilling' },
  { title: 'Analytics', url: '/analytics', icon: BarChart3, requirePermission: 'viewAllCandidates' },
  { title: 'Organization', url: '/organization', icon: Building2, requirePermission: 'viewAllUsers' },
  { title: 'Settings', url: '/settings', icon: Settings, requirePermission: 'modifySettings' },
];

export function AppSidebar() {
  const { state, toggleSidebar, setOpen } = useSidebar();
  const { user, role, signOut, isRealAdmin, roleOverride, setRoleOverride } = useAuth();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const isCollapsed = state === 'collapsed';
  
  // Auto-fade state - persisted in localStorage
  const [autoFade, setAutoFade] = useState(() => {
    const saved = localStorage.getItem('sidebar-auto-fade');
    return saved === 'true';
  });

  // Save auto-fade preference
  useEffect(() => {
    localStorage.setItem('sidebar-auto-fade', String(autoFade));
  }, [autoFade]);

  // Handle mouse enter/leave for auto-fade
  const handleMouseEnter = () => {
    if (autoFade) {
      setOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (autoFade) {
      setOpen(false);
    }
  };

  const userInitials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-sidebar-border"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
              <Globe className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-sidebar-foreground">GlobalWorker</span>
                <span className="text-xs text-sidebar-muted">Recruitment</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-1">
              <TasksSidebar />
              <NotificationCenter />
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems
                .filter((item) => !item.requirePermission || can(item.requirePermission))
                .map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/'}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 space-y-2">
        {/* Auto-fade Toggle */}
        <div className={`flex items-center gap-2 px-3 py-2 ${isCollapsed ? 'justify-center' : ''}`}>
          {isCollapsed ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-muted hover:text-sidebar-foreground"
              onClick={() => setAutoFade(!autoFade)}
              title={autoFade ? 'Auto-fade on' : 'Auto-fade off'}
            >
              <PanelLeftClose className={`h-4 w-4 ${autoFade ? 'text-sidebar-primary' : ''}`} />
            </Button>
          ) : (
            <>
              <Switch
                id="auto-fade"
                checked={autoFade}
                onCheckedChange={setAutoFade}
                className="data-[state=checked]:bg-sidebar-primary"
              />
              <Label 
                htmlFor="auto-fade" 
                className="text-xs text-sidebar-muted cursor-pointer"
              >
                Auto-fade
              </Label>
            </>
          )}
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-auto py-2 px-3 text-sidebar-foreground hover:bg-sidebar-accent ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium truncate max-w-[120px]">
                    {user?.user_metadata?.full_name || user?.email}
                  </span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-sidebar-accent text-sidebar-muted">
                    {role || 'User'}
                  </Badge>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            {isRealAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-amber-600 focus:text-amber-700">
                    <Eye className="mr-2 h-4 w-4" />
                    View as Internal Role
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {roleOverride && (
                      <>
                        <DropdownMenuItem onClick={() => setRoleOverride(null)} className="text-destructive focus:text-destructive">
                          Reset to Admin
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {ROLES.filter(r => r.value !== 'admin' && r.value !== 'agency').map(r => (
                      <DropdownMenuItem
                        key={r.value}
                        onClick={() => setRoleOverride(r.value)}
                        className={roleOverride === r.value ? 'bg-accent font-medium' : ''}
                      >
                        {r.label}
                        {roleOverride === r.value && <span className="ml-auto text-xs">✓</span>}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem onClick={() => navigate('/agency')} className="text-amber-600 focus:text-amber-700">
                  <Building2 className="mr-2 h-4 w-4" />
                  View as Agency
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/employer')} className="text-amber-600 focus:text-amber-700">
                  <Building2 className="mr-2 h-4 w-4" />
                  View as Employer
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Collapse Toggle - only show when auto-fade is off */}
        {!autoFade && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="w-full h-9 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
