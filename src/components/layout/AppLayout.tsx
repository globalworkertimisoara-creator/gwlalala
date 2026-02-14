import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useRoleOverridePadding } from './RoleOverrideBanner';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const overridePadding = useRoleOverridePadding();
  
  return (
    <SidebarProvider>
      <div className={`flex min-h-screen w-full ${overridePadding}`}>
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
