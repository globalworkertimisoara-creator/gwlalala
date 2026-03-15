import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { useContracts, useExpiringContracts } from '@/hooks/useContracts';
import type { Contract } from '@/types/contract';
import { ContractDetailDialog } from '@/components/contracts/ContractDetailDialog';
import { ContractDashboardCards } from '@/components/contracts/ContractDashboardCards';
import { ContractQuickActions } from '@/components/contracts/ContractQuickActions';
import { ContractFilters } from '@/components/contracts/ContractFilters';
import { ContractTable } from '@/components/contracts/ContractTable';
import { ContractAnalyticsPanel } from '@/components/contracts/ContractAnalyticsPanel';
import { CreateContractDialog } from '@/components/contracts/CreateContractDialog';
import { ContractTemplatesView } from '@/components/contracts/ContractTemplatesView';
import { format } from 'date-fns';

export default function Contracts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const highlightId = searchParams.get('highlight');

  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('contracts');
  
  const filters: any = {};
  if (typeFilter !== 'all') filters.contract_type = typeFilter;
  if (statusFilter !== 'all') filters.status = statusFilter;
  if (searchQuery.trim()) filters.search = searchQuery.trim();
  if (yearFilter !== 'all') filters.year = parseInt(yearFilter);

  const { data: contracts = [], isLoading } = useContracts(Object.keys(filters).length > 0 ? filters : undefined);
  const { data: expiring = [] } = useExpiringContracts(30);
  const { data: allContracts = [] } = useContracts();

  // Auto-open highlighted contract
  useEffect(() => {
    if (highlightId && contracts.length > 0 && !detailOpen) {
      const found = contracts.find(c => c.id === highlightId);
      if (found) {
        setSelectedContract(found);
        setDetailOpen(true);
      }
    }
  }, [highlightId, contracts]);

  const handleDetailClose = (open: boolean) => {
    setDetailOpen(open);
    if (!open && highlightId) {
      setSearchParams({}, { replace: true });
    }
  };

  const handleCardFilter = (filter: string) => {
    if (filter === 'expiring') {
      setStatusFilter('all');
      // Could be extended later
    } else if (filter !== 'all') {
      setStatusFilter(filter);
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(contracts.map(c => c.id)) : new Set());
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Back link */}
        {highlightId && (
          <Button variant="ghost" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground" onClick={() => navigate('/sales-analytics')}>
            <ArrowLeft className="h-4 w-4" /> Back to Sales Analytics
          </Button>
        )}

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Contract Management</h1>
          <p className="text-muted-foreground">Track agreements, renewals, and compliance across all parties</p>
        </div>

        {/* Tabs: Contracts / Templates */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="contracts" className="space-y-6 mt-4">
            {/* Dashboard Cards */}
            <ContractDashboardCards contracts={allContracts} expiring={expiring} onFilterChange={handleCardFilter} />

            {/* Quick Actions */}
            <ContractQuickActions
              onNewContract={() => setDialogOpen(true)}
              onShowAnalytics={() => setShowAnalytics(!showAnalytics)}
              onShowTemplates={() => setActiveTab('templates')}
              selectedCount={selectedIds.size}
            />

            {/* Analytics Panel (togglable) */}
            {showAnalytics && <ContractAnalyticsPanel contracts={allContracts} expiring={expiring} />}

            {/* Expiring Contracts Alert */}
            {expiring.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="h-5 w-5" />
                    <p className="font-medium">{expiring.length} contract{expiring.length > 1 ? 's' : ''} expiring within 30 days</p>
                  </div>
                  <div className="mt-2 space-y-1">
                    {expiring.slice(0, 3).map(c => (
                      <p key={c.id} className="text-sm text-amber-700">
                        {c.title} — expires {format(new Date(c.end_date!), 'MMM d, yyyy')}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filters */}
            <ContractFilters
              typeFilter={typeFilter}
              statusFilter={statusFilter}
              searchQuery={searchQuery}
              onTypeChange={setTypeFilter}
              onStatusChange={setStatusFilter}
              onSearchChange={setSearchQuery}
            />

            {/* Contracts Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Contracts</CardTitle>
              </CardHeader>
              <CardContent>
                <ContractTable
                  contracts={filteredContracts}
                  isLoading={isLoading}
                  highlightId={highlightId}
                  selectedIds={selectedIds}
                  onSelect={handleSelect}
                  onSelectAll={handleSelectAll}
                  onRowClick={(c) => { setSelectedContract(c); setDetailOpen(true); }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="mt-4">
            <ContractTemplatesView />
          </TabsContent>
        </Tabs>

        <CreateContractDialog open={dialogOpen} onOpenChange={setDialogOpen} />
        <ContractDetailDialog contract={selectedContract} open={detailOpen} onOpenChange={handleDetailClose} />
      </div>
    </AppLayout>
  );
}
