import { useAuth } from '@/contexts/AuthContext';
import { getRoleLabel } from '@/types/database';
import { Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RoleOverrideBanner() {
  const { roleOverride, setRoleOverride, isRealAdmin } = useAuth();

  if (!isRealAdmin || !roleOverride) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 px-4 py-1.5 flex items-center justify-center gap-3 text-sm font-medium shadow-md" style={{ color: 'hsl(40, 80%, 10%)' }}>
      <Eye className="h-4 w-4" />
      <span>
        Viewing as <strong>{getRoleLabel(roleOverride)}</strong> — UI only, database permissions unchanged
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 hover:bg-amber-600"
        style={{ color: 'hsl(40, 80%, 10%)' }}
        onClick={() => setRoleOverride(null)}
      >
        <X className="h-3.5 w-3.5 mr-1" />
        Exit
      </Button>
    </div>
  );
}

export function useRoleOverridePadding() {
  const { roleOverride, isRealAdmin } = useAuth();
  return isRealAdmin && roleOverride ? 'pt-8' : '';
}
