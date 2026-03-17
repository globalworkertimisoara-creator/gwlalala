import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Kanban,
  Settings,
  Globe,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Briefcase,
  LogOut,
  User,
  PanelLeftClose,
  Building2,
  FolderKanban,
  Receipt,
  Eye,
  BarChart3,
  FileText,
  FileDown,
  Shield,
  ClipboardList,
  TrendingUp,
  Wrench,
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
  requirePermission?: keyof RolePermissions;
}

interface NavGroup {
  label: string;
  icon: any;
  accentColor: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Recruitment',
    icon: ClipboardList,
    accentColor: 'text-blue-400',
    items: [
      { title: 'Projects', url: '/projects', icon: FolderKanban, requirePermission: 'viewAllProjects' },
      { title: 'Pipeline', url: '/pipeline', icon: Kanban, requirePermission: 'viewAllCandidates' },
      { title: 'Candidates', url: '/candidates', icon: Users, requirePermission: 'viewAllCandidates' },
      { title: 'Jobs', url: '/jobs', icon: Briefcase },
    ],
  },
  {
    label: 'Business',
    icon: Building2,
    accentColor: 'text-emerald-400',
    items: [
      { title: 'Contracts', url: '/contracts', icon: FileText },
      { title: 'Agency Workers', url: '/agency-workers', icon: Building2, requirePermission: 'viewAgencyWorkers' },
      { title: 'Reports', url: '/reports', icon: FileDown },
    ],
  },
  {
    label: 'Insights',
    icon: TrendingUp,
    accentColor: 'text-purple-400',
    items: [
      { title: 'Sales Analytics', url: '/sales-analytics', icon: BarChart3, requirePermission: 'viewSalesAnalytics' },
      { title: 'Analytics', url: '/analytics', icon: BarChart3, requirePermission: 'viewAllCandidates' },
      { title: 'Billing', url: '/billing', icon: Receipt, requirePermission: 'viewBilling' },
    ],
  },
  {
    label: 'Admin',
    icon: Wrench,
    accentColor: 'text-gray-400',
    items: [
      { title: 'Agency Contracts', url: '/admin/agency-contracts', icon: Shield, requirePermission: 'accessAdminPanel' },
      { title: 'Organization', url: '/organization', icon: Building2, requirePermission: 'viewAllUsers' },
      { title: 'Settings', url: '/settings', icon: Settings, requirePermission: 'modifySettings' },
    ],
  },
];

export function AppSidebar() {
  const { state, toggleSidebar, setOpen } = useSidebar();
  const { user, role, signOut, isRealAdmin, roleOverride, setRoleOverride } = useAuth();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const isCollapsed = state === 'collapsed';

  // Collapsed groups state - persisted in localStorage
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('sidebar-collapsed-groups');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Auto-fade state - persisted in localStorage
  const [autoFade, setAutoFade] = useState(() => {
    const saved = localStorage.getItem('sidebar-auto-fade');
    return saved === 'true';
  });

  // Persist collapsed groups
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed-groups', JSON.stringify(collapsedGroups));
  }, [collapsedGroups]);

  // Save auto-fade preference
  useEffect(() => {
    localStorage.setItem('sidebar-auto-fade', String(autoFade));
  }, [autoFade]);

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  // Check if any item in a group is currently active
  const isGroupActive = (group: NavGroup) => {
    return group.items.some(item => {
      if (item.url === '/') return location.pathname === '/';
      return location.pathname.startsWith(item.url);
    });
  };

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

  // Filter groups: only show groups that have at least one visible item
  const visibleGroups = navGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => !item.requirePermission || can(item.requirePermission)),
    }))
    .filter(group => group.items.length > 0);

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
        {/* Dashboard - standalone at top */}
        <SidebarGroup className="pb-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard">
                  <NavLink
                    to="/"
                    end
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                  >
                    <LayoutDashboard className="h-5 w-5 shrink-0" />
                    {!isCollapsed && <span>Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Grouped navigation */}
        {visibleGroups.map((group) => {
          const isGroupCollapsed = collapsedGroups[group.label] ?? false;
          const groupActive = isGroupActive(group);

          return (
            <SidebarGroup key={group.label} className="pb-0">
              <SidebarGroupContent>
                {/* When sidebar is collapsed (icon mode), show items as flat icons */}
                {isCollapsed ? (
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild tooltip={item.title}>
                          <NavLink
                            to={item.url}
                            end={item.url === '/'}
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                          >
                            <item.icon className="h-5 w-5 shrink-0" />
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                ) : (
                  <>
                    {/* Group header - clickable to expand/collapse */}
                    <button
                      onClick={() => toggleGroup(group.label)}
                      className="flex items-center gap-2 w-full px-3 py-2 mt-2 rounded-md text-xs font-medium tracking-wide text-sidebar-muted hover:text-sidebar-foreground transition-colors group"
                    >
                      <group.icon className={`h-4 w-4 shrink-0 ${group.accentColor}`} />
                      <span className="uppercase">{group.label}</span>
                      <ChevronDown
                        className={`h-3 w-3 ml-auto shrink-0 transition-transform duration-200 opacity-0 group-hover:opacity-100 ${
                          isGroupCollapsed ? '-rotate-90' : ''
                        } ${groupActive ? 'opacity-100' : ''}`}
                      />
                    </button>

                    {/* Group items with smooth collapse */}
                    <div
                      className={`overflow-hidden transition-all duration-200 ease-in-out ${
                        isGroupCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'
                      }`}
                    >
                      <SidebarMenu>
                        {group.items.map((item) => (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild tooltip={item.title}>
                              <NavLink
                                to={item.url}
                                end={item.url === '/'}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 pl-9 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
                                activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                              >
                                <item.icon className="h-4 w-4 shrink-0" />
                                <span>{item.title}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </div>
                  </>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
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
