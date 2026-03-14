import { Button } from '@/components/ui/button';
import { Plus, FileText, BarChart3, Bell, Download, Copy, RefreshCw, XCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface ContractQuickActionsProps {
  onNewContract: () => void;
  onShowAnalytics: () => void;
  onShowTemplates?: () => void;
  selectedCount?: number;
}

export function ContractQuickActions({ onNewContract, onShowAnalytics, onShowTemplates, selectedCount = 0 }: ContractQuickActionsProps) {
  const { toast } = useToast();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={onNewContract} className="gap-2">
        <Plus className="h-4 w-4" /> New Contract
      </Button>
      <Button variant="outline" className="gap-2" onClick={onShowAnalytics}>
        <BarChart3 className="h-4 w-4" /> Analytics
      </Button>
      <Button variant="outline" className="gap-2" onClick={onShowTemplates}>
        <FileText className="h-4 w-4" /> Templates
      </Button>
      <Button variant="outline" className="gap-2" onClick={() => toast({ title: 'Reminder settings coming soon' })}>
        <Bell className="h-4 w-4" /> Reminders
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => toast({ title: 'CSV export coming soon' })}>
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toast({ title: 'PDF export coming soon' })}>
            Export as PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {selectedCount > 0 && (
        <>
          <div className="h-6 w-px bg-border mx-1" />
          <span className="text-sm text-muted-foreground">{selectedCount} selected</span>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => toast({ title: 'Bulk renewal coming soon' })}>
            <RefreshCw className="h-3.5 w-3.5" /> Bulk Renew
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => toast({ title: 'Bulk duplicate coming soon' })}>
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-destructive" onClick={() => toast({ title: 'Bulk terminate coming soon' })}>
            <XCircle className="h-3.5 w-3.5" /> Terminate
          </Button>
        </>
      )}
    </div>
  );
}
