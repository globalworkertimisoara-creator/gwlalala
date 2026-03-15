/**
 * src/types/contract.ts
 * 
 * Contract types with automatic numbering support
 */

export type ContractType = 'recruitment' | 'partnership' | 'consultancy' | 'service';
export type ContractPrefix = 'REC' | 'PAR' | 'CON' | 'SRV';
export type ContractStatus = 'draft' | 'sent' | 'signed' | 'active' | 'expired' | 'terminated';
export type PartyType = 'employer' | 'agency' | 'worker';

export interface Contract {
  id: string;
  
  // Contract Numbering (NEW)
  contract_prefix: ContractPrefix | null;
  sequence_number: number | null;
  contract_date: string | null; // ISO date format
  contract_number: string | null; // Generated: "REC-5/15.03.2026"
  number_modified_by: string | null;
  number_modified_at: string | null;
  number_modification_reason: string | null;
  
  // Contract Details
  contract_type: ContractType;
  party_type: PartyType;
  party_id: string;
  title: string;
  status: ContractStatus;
  
  // Dates
  start_date: string | null;
  end_date: string | null;
  renewal_date: string | null;
  auto_renew: boolean;
  
  // Financial
  total_value: number | null;
  currency: string;
  
  // Documents
  storage_path: string | null;
  signed_by_party_at: string | null;
  signed_by_staff_at: string | null;
  
  // Relationships
  sales_person_id: string | null;
  project_id: string | null;
  job_id: string | null;
  
  // Metadata
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractWithDetails extends Contract {
  sales_person_name: string | null;
  client_name: string | null;
  project_name: string | null;
  candidate_name: string | null;
}

export interface ContractSequence {
  id: string;
  contract_prefix: ContractPrefix;
  year: number;
  last_sequence_number: number;
  created_at: string;
  updated_at: string;
}

export interface NextContractNumber {
  prefix: ContractPrefix;
  sequence_number: number;
  contract_date: string;
  contract_number: string;
}

export interface ContractNumberAuditLog {
  id: string;
  contract_id: string;
  action: 'number_created' | 'number_changed' | 'date_changed';
  old_contract_number: string | null;
  new_contract_number: string | null;
  old_sequence_number: number | null;
  new_sequence_number: number | null;
  old_contract_date: string | null;
  new_contract_date: string | null;
  reason: string | null;
  changed_by: string;
  changed_at: string;
}

export interface CreateContractInput {
  // Contract Numbering (auto-generated or manual)
  contract_prefix?: ContractPrefix;
  sequence_number?: number;
  contract_date?: string; // Defaults to current date
  
  // Contract Details
  contract_type: ContractType;
  party_type: PartyType;
  party_id: string;
  title: string;
  
  // Optional fields
  start_date?: string;
  end_date?: string;
  renewal_date?: string;
  auto_renew?: boolean;
  total_value?: number;
  currency?: string;
  storage_path?: string;
  notes?: string;
  sales_person_id?: string;
  project_id?: string;
  job_id?: string;
}

export interface UpdateContractNumberInput {
  contract_id: string;
  sequence_number: number;
  contract_date: string;
  reason?: string;
}

export interface ContractFilters {
  contract_type?: ContractType;
  status?: ContractStatus;
  party_type?: PartyType;
  sales_person_id?: string;
  year?: number;
  search?: string; // Search by contract number or client name
}

// Helper function to get prefix from contract type
export function getContractPrefix(contractType: ContractType): ContractPrefix {
  const prefixMap: Record<ContractType, ContractPrefix> = {
    recruitment: 'REC',
    partnership: 'PAR',
    consultancy: 'CON',
    service: 'SRV',
  };
  return prefixMap[contractType];
}

// Helper function to format contract date
export function formatContractDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

// Helper function to parse contract date (DD.MM.YYYY -> ISO)
export function parseContractDate(dateStr: string): string {
  const [day, month, year] = dateStr.split('.');
  return `${year}-${month}-${day}`;
}
