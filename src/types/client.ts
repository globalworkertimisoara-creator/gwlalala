export type ClientType = 'company' | 'individual';
export type ClientStatus = 'lead' | 'active' | 'on_hold' | 'inactive' | 'churned';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled' | 'void';

export interface Client {
  id: string;
  client_type: ClientType;
  status: ClientStatus;
  company_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  country: string | null;
  postal_code: string | null;
  id_document_type: string | null;
  id_document_number: string | null;
  id_document_expiry: string | null;
  billing_name: string | null;
  billing_address: string | null;
  billing_email: string | null;
  tax_id: string | null;
  source: string | null;
  assigned_to: string | null;
  notes: string | null;
  tags: string[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // CRM fields
  payment_terms?: string;
  currency?: string;
  vat_number?: string;
  vat_verified?: boolean;
  preferred_communication?: string;
  priority_level?: string;
  risk_score?: number;
  risk_notes?: string;
  credit_limit?: number;
  sla_terms?: string;
  payment_score?: number;
}

export interface ClientWithMetrics extends Client {
  display_name: string;
  company_name?: string;
  project_count: number;
  contract_count: number;
  total_invoiced: number;
  total_paid: number;
  outstanding_amount: number;
}

export interface ClientNote {
  id: string;
  client_id: string;
  content: string;
  created_by: string | null;
  created_at: string;
}

export interface ClientActivityLog {
  id: string;
  client_id: string;
  action: string;
  details: Record<string, any> | null;
  performed_by: string | null;
  created_at: string;
}

export interface ClientDocument {
  id: string;
  client_id: string;
  name: string;
  doc_type: string;
  storage_path: string;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface ClientInvoice {
  id: string;
  client_id: string;
  invoice_number: string | null;
  contract_id: string | null;
  project_id: string | null;
  description: string | null;
  line_items: { description: string; quantity: number; unit_price: number; amount: number }[] | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: InvoiceStatus;
  issue_date: string | null;
  due_date: string | null;
  paid_date: string | null;
  paid_amount: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientProject {
  id: string;
  client_id: string;
  project_id: string;
  role: string;
  created_at: string;
}

export const CLIENT_STATUS_CONFIG: Record<ClientStatus, { label: string; color: string }> = {
  lead: { label: 'Lead', color: 'bg-blue-100 text-blue-800' },
  active: { label: 'Active', color: 'bg-green-100 text-green-800' },
  on_hold: { label: 'On Hold', color: 'bg-yellow-100 text-yellow-800' },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
  churned: { label: 'Churned', color: 'bg-red-100 text-red-800' },
};

export const CLIENT_TYPE_CONFIG: Record<ClientType, { label: string; color: string }> = {
  company: { label: 'Company', color: 'bg-purple-100 text-purple-800' },
  individual: { label: 'Individual', color: 'bg-indigo-100 text-indigo-800' },
};

export function getClientDisplayName(client: Client, companyName?: string): string {
  if (client.client_type === 'company' && companyName) return companyName;
  if (client.client_type === 'individual') return `${client.first_name || ''} ${client.last_name || ''}`.trim();
  return 'Unknown Client';
}

// Strip HTML tags from text inputs to prevent stored XSS
export function sanitizeTextInput(value: string): string {
  return value.replace(/<[^>]*>/g, '').trim();
}

// Valid status transitions — prevents arbitrary status jumps
export const VALID_STATUS_TRANSITIONS: Record<ClientStatus, ClientStatus[]> = {
  lead: ['active', 'inactive'],
  active: ['on_hold', 'inactive', 'churned'],
  on_hold: ['active', 'inactive', 'churned'],
  inactive: ['active', 'lead'],
  churned: ['lead'],
};

export function isValidStatusTransition(from: ClientStatus, to: ClientStatus): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
