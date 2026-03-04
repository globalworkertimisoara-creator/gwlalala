import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Users, FolderKanban, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  Notification,
} from '@/hooks/useNotifications';

function getNotificationRoute(notification: Notification): string | null {
  const { related_entity_type, related_entity_id, project_id } = notification;
  if (related_entity_type && related_entity_id) {
    switch (related_entity_type) {
      case 'candidate': return `/candidates/${related_entity_id}`;
      case 'project': return `/projects/${related_entity_id}`;
      case 'job': return `/jobs/${related_entity_id}`;
      case 'task': return '/tasks';
      case 'contract': return '/contracts';
    }
  }
  if (project_id) return `/projects/${project_id}`;
  return null;
}

function NotificationItem({
  notification,
  onMarkRead,
  onNavigate,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onNavigate: (route: string) => void;
}) {
  const getIcon = () => {
    if (notification.team_id) return <Users className="h-4 w-4 text-primary" />;
    if (notification.project_id) return <FolderKanban className="h-4 w-4 text-primary/70" />;
    return <User className="h-4 w-4 text-muted-foreground" />;
  };

  const getSource = () => {
    if (notification.team?.name) return `Team: ${notification.team.name}`;
    if (notification.project?.name) return `Project: ${notification.project.name}`;
    return 'Personal';
  };

  const route = getNotificationRoute(notification);

  const handleClick = () => {
    if (!notification.is_read) onMarkRead(notification.id);
    if (route) onNavigate(route);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-start gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors',
        !notification.is_read && 'bg-primary/5',
        route && 'cursor-pointer'
      )}
    >
      <div className="mt-1">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn('text-sm font-medium truncate', !notification.is_read && 'font-semibold')}>
            {notification.title}
          </p>
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={(e) => { e.stopPropagation(); onMarkRead(notification.id); }}
            >
              <Check className="h-3 w-3" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">{getSource()}</span>
        </div>
      </div>
    </div>
  );
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleNavigate = (route: string) => {
    setOpen(false);
    navigate(route);
  };

  const personalNotifications = notifications.filter(n => !n.team_id && !n.project_id);
  const teamNotifications = notifications.filter(n => n.team_id);
  const projectNotifications = notifications.filter(n => n.project_id);

  const handleMarkRead = (id: string) => {
    markRead.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={handleMarkAllRead}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-9 rounded-none border-b">
            <TabsTrigger value="all" className="text-xs">
              All
              {notifications.filter(n => !n.is_read).length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  {notifications.filter(n => !n.is_read).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="personal" className="text-xs">
              <User className="h-3 w-3 mr-1" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="team" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              Team
            </TabsTrigger>
            <TabsTrigger value="project" className="text-xs">
              <FolderKanban className="h-3 w-3 mr-1" />
              Project
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-80">
            <TabsContent value="all" className="m-0">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                notifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={handleMarkRead}
                    onNavigate={handleNavigate}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="personal" className="m-0">
              {personalNotifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No personal notifications
                </div>
              ) : (
                personalNotifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={handleMarkRead}
                    onNavigate={handleNavigate}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="team" className="m-0">
              {teamNotifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No team notifications
                </div>
              ) : (
                teamNotifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={handleMarkRead}
                    onNavigate={handleNavigate}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="project" className="m-0">
              {projectNotifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No project notifications
                </div>
              ) : (
                projectNotifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={handleMarkRead}
                  />
                ))
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
