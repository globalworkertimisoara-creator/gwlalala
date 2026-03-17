import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, ArrowLeft, Plus, BarChart3, FileText, Download, Group } from 'lucide-react';
import { useContracts, useExpiringContracts } from '@/hooks/useContracts';
import type { Contract } from '@/types/contract';
import { ContractDetailPanel } from '@/components/contracts/ContractDetailPanel';
import { ContractFilters } from '@/components/contracts/ContractFilters';
import { ContractTable } from '@/components/contracts/ContractTable';
import { ContractAnalyticsPanel } from '@/components/contracts/ContractAnalyticsPanel';
import { ContractTemplatesView } from '@/components/contracts/ContractTemplatesView';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function Contracts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const highlightId = searchParams.get('highlight');

  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('contracts');
  const [groupBy, setGroupBy] = useState('none');

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
    if (highlightId && contracts.length > 0 && !selectedContract) {
      const found = contracts.find(c => c.id === highlightId);
      if (found) setSelectedContract(found);
    }
  }, [highlightId, contracts]);

  // Keep selected contract updated when data refreshes
  useEffect(() => {
    if (selectedContract) {
      const updated = contracts.find(c => c.id === selectedContract.id);
      if (updated) setSelectedContract(updated);
    }
  }, [contracts]);

  const handleClosePanel = () => {
    setSelectedContract(null);
    if (highlightId) setSearchParams({}, { replace: true });
  };

  const handleCardFilter = (filter: string) => {
    if (filter === 'expiring') {
      setStatusFilter('all');
    } else if (filter !== 'all') {
      setStatusFilter(filter);
    } else {
      setStatusFilter('all');
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

  // Computed stats
  const stats = useMemo(() => {
    const active = allContracts.filter(c => c.status === 'active').length;
    const pending = allContracts.filter(c => c.status === 'sent').length;
    const draft = allContracts.filter(c => c.status === 'draft').length;
    const totalValue = allContracts
      .filter(c => ['active', 'signed'].includes(c.status))
      .reduce((sum, c) => sum + (c.total_value || 0), 0);
    return { total: allContracts.length, active, expiring: expiring.length, pending, draft, totalValue };
  }, [allContracts, expiring]);

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 space-y-4 shrink-0">
          {highlightId && (
            <Button variant="ghost" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground" onClick={() => navigate('/sales-analytics')}>
              <ArrowLeft className="h-4 w-4" /> Back to Sales Analytics
            </Button>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Contract Management</h1>
              <p className="text-sm text-muted-foreground">Track agreements, renewals, and compliance</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowAnalytics(!showAnalytics)}>
                <BarChart3 className="h-4 w-4" /> Analytics
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast({ title: 'Export coming soon' })}>
                <Download className="h-4 w-4" /> Export
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => navigate('/contracts/new')}>
                <Plus className="h-4 w-4" /> New Contract
              </Button>
            </div>
          </div>

          {/* Compact Stat Bar */}
          <div className="flex items-center gap-1 text-xs flex-wrap">
            <StatChip label="Total" value={stats.total} onClick={() => handleCardFilter('all')} />
            <span className="text-muted-foreground">·</span>
            <StatChip label="Active" value={stats.active} color="text-emerald-700 bg-emerald-50" onClick={() => handleCardFilter('active')} />
            <span className="text-muted-foreground">·</span>
            <StatChip label="Expiring" value={stats.expiring} color={stats.expiring > 0 ? 'text-amber-700 bg-amber-50' : undefined} onClick={() => handleCardFilter('expiring')} />
            <span className="text-muted-foreground">·</span>
            <StatChip label="Pending" value={stats.pending} color="text-blue-700 bg-blue-50" onClick={() => handleCardFilter('sent')} />
            <span className="text-muted-foreground">·</span>
            <StatChip label="Draft" value={stats.draft} onClick={() => handleCardFilter('draft')} />
            <span className="text-muted-foreground">·</span>
            <StatChip label="Value" value={`€${(stats.totalValue / 1000).toFixed(0)}k`} color="text-primary bg-primary/5" />
            {selectedIds.size > 0 && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-xs font-medium text-primary">{selectedIds.size} selected</span>
              </>
            )}
          </div>

          {/* Expiring alert */}
          {expiring.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span className="font-medium">{expiring.length} contract{expiring.length > 1 ? 's' : ''} expiring within 30 days</span>
              <span className="text-amber-600 ml-1">
                {expiring.slice(0, 2).map(c => c.title).join(', ')}{expiring.length > 2 ? ` +${expiring.length - 2} more` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Tabs: Contracts / Templates */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 shrink-0">
            <TabsList>
              <TabsTrigger value="contracts">Contracts</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="contracts" className="flex-1 flex flex-col min-h-0 mt-0 px-6 pt-4">
            {/* Analytics Panel (togglable) */}
            {showAnalytics && (
              <div className="mb-4 shrink-0">
                <ContractAnalyticsPanel contracts={allContracts} expiring={expiring} />
              </div>
            )}

            {/* Filters + Group */}
            <div className="flex items-end gap-3 mb-3 shrink-0">
              <div className="flex-1">
                <ContractFilters
                  typeFilter={typeFilter}
                  statusFilter={statusFilter}
                  searchQuery={searchQuery}
                  yearFilter={yearFilter}
                  onTypeChange={setTypeFilter}
                  onStatusChange={setStatusFilter}
                  onSearchChange={setSearchQuery}
                  onYearChange={setYearFilter}
                />
              </div>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger className="h-10 w-[140px] shrink-0">
                  <Group className="h-4 w-4 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Group by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No grouping</SelectItem>
                  <SelectItem value="status">By Status</SelectItem>
                  <SelectItem value="type">By Type</SelectItem>
                  <SelectItem value="party">By Party</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Main content: table + optional detail panel */}
            <div className="flex-1 flex gap-0 min-h-0 overflow-hidden rounded-lg border bg-card">
              {/* Table area */}
              <div className={`flex-1 min-w-0 overflow-auto p-3 ${selectedContract ? 'max-w-[65%]' : ''}`}>
                <ContractTable
                  contracts={contracts}
                  isLoading={isLoading}
                  highlightId={highlightId}
                  selectedIds={selectedIds}
                  selectedContractId={selectedContract?.id}
                  onSelect={handleSelect}
                  onSelectAll={handleSelectAll}
                  onRowClick={(c) => setSelectedContract(c)}
                  groupBy={groupBy}
                />
              </div>

              {/* Detail sidebar panel */}
              {selectedContract && (
                <div className="w-[35%] min-w-[320px] max-w-[420px] shrink-0 overflow-hidden">
                  <ContractDetailPanel
                    key={selectedContract.id}
                    contract={selectedContract}
                    onClose={handleClosePanel}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="mt-0 px-6 pt-4">
            <ContractTemplatesView />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function StatChip({ label, value, color, onClick }: { label: string; value: string | number; color?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors hover:ring-1 hover:ring-primary/30 ${color || 'text-muted-foreground bg-muted/50'}`}
    >
      <span className="font-medium">{value}</span>
      <span className="opacity-70">{label}</span>
    </button>
  );
}
