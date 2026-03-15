import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface ContractFiltersProps {
  typeFilter: string;
  statusFilter: string;
  searchQuery: string;
  yearFilter?: string;
  onTypeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onYearChange?: (value: string) => void;
}

export function ContractFilters({
  typeFilter, statusFilter, searchQuery, yearFilter,
  onTypeChange, onStatusChange, onSearchChange, onYearChange,
}: ContractFiltersProps) {
  const currentYear = new Date().getFullYear();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by number, title or client..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={onTypeChange}>
            <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="recruitment">Recruitment (REC)</SelectItem>
              <SelectItem value="partnership">Partnership (PAR)</SelectItem>
              <SelectItem value="consultancy">Consultancy (CON)</SelectItem>
              <SelectItem value="service">Service (SRV)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="signed">Signed</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
          {onYearChange && (
            <Select value={yearFilter || 'all'} onValueChange={onYearChange}>
              <SelectTrigger className="w-full sm:w-[130px]"><SelectValue placeholder="Year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
