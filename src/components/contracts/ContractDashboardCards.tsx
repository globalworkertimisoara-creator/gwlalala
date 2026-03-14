import { Card, CardContent } from '@/components/ui/card';
import { FileText, AlertTriangle, PenLine, DollarSign, XCircle, FileEdit } from 'lucide-react';
import type { Contract } from '@/hooks/useContracts';

interface ContractDashboardCardsProps {
  contracts: Contract[];
  expiring: Contract[];
  onFilterChange?: (status: string) => void;
}

export function ContractDashboardCards({ contracts, expiring, onFilterChange }: ContractDashboardCardsProps) {
  const active = contracts.filter(c => c.status === 'active').length;
  const pendingSignatures = contracts.filter(c => c.status === 'sent').length;
  const totalValue = contracts
    .filter(c => ['active', 'signed'].includes(c.status))
    .reduce((sum, c) => sum + (c.total_value || 0), 0);
  const expired = contracts.filter(c => c.status === 'expired').length;
  const drafts = contracts.filter(c => c.status === 'draft').length;

  const cards = [
    {
      label: 'Active Contracts',
      value: active,
      icon: FileText,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      filter: 'active',
    },
    {
      label: 'Expiring Soon',
      value: expiring.length,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      filter: 'expiring',
      alert: expiring.length > 0,
    },
    {
      label: 'Pending Signatures',
      value: pendingSignatures,
      icon: PenLine,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      filter: 'sent',
    },
    {
      label: 'Total Contract Value',
      value: `€${totalValue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-primary',
      bg: 'bg-primary/5',
      filter: 'all',
    },
    {
      label: 'Expired / Overdue',
      value: expired,
      icon: XCircle,
      color: 'text-destructive',
      bg: 'bg-destructive/5',
      filter: 'expired',
      alert: expired > 0,
    },
    {
      label: 'Draft Contracts',
      value: drafts,
      icon: FileEdit,
      color: 'text-muted-foreground',
      bg: 'bg-muted/50',
      filter: 'draft',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card
          key={card.label}
          className={`cursor-pointer hover:shadow-md transition-shadow ${card.alert ? 'ring-1 ring-amber-300' : ''}`}
          onClick={() => onFilterChange?.(card.filter)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-md ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
