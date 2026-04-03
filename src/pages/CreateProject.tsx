import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, X } from 'lucide-react';
import { useCreateProject } from '@/hooks/useProjects';
import { useLinkContractToProject } from '@/hooks/useContracts';
import { useClients } from '@/hooks/useClients';
import { sanitizeTextInput } from '@/types/client';
import { useLinkClientToProject } from '@/hooks/useClientProjects';
import { PROJECT_STATUS_CONFIG, WORKFLOW_TYPE_CONFIG, WorkflowType } from '@/types/project';

const formSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  name: z.string().min(1, 'Project name is required'),
  employer_name: z.string().default(''),
  location: z.string().min(1, 'Location is required'),
  sales_person_name: z.string().optional(),
  status: z.enum(['draft', 'active', 'on_hold', 'completed', 'cancelled']).default('draft'),
  default_workflow_type: z.enum(['full_immigration', 'no_visa']).default('full_immigration'),
  contract_signed_at: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateProject() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contractId = searchParams.get('contractId') || undefined;

  const createProject = useCreateProject();
  const linkContract = useLinkContractToProject();
  const { data: clients = [] } = useClients();
  const linkClientToProject = useLinkClientToProject();
  const [countries, setCountries] = useState<string[]>([]);
  const [countryInput, setCountryInput] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_id: '',
      name: '',
      employer_name: '',
      location: '',
      sales_person_name: '',
      status: 'draft',
      default_workflow_type: 'full_immigration',
      contract_signed_at: '',
      notes: '',
    },
  });

  const addCountry = () => {
    if (countryInput.trim() && !countries.includes(countryInput.trim())) {
      setCountries([...countries, countryInput.trim()]);
      setCountryInput('');
    }
  };

  const removeCountry = (country: string) => {
    setCountries(countries.filter(c => c !== country));
  };

  const onSubmit = async (values: FormValues) => {
    const project = await createProject.mutateAsync({
      name: sanitizeTextInput(values.name),
      employer_name: sanitizeTextInput(values.employer_name),
      location: values.location ? sanitizeTextInput(values.location) : undefined,
      sales_person_name: values.sales_person_name ? sanitizeTextInput(values.sales_person_name) : undefined,
      status: values.status,
      default_workflow_type: values.default_workflow_type as WorkflowType,
      notes: values.notes ? sanitizeTextInput(values.notes) : undefined,
      countries_in_contract: countries.map(c => sanitizeTextInput(c)),
      contract_signed_at: values.contract_signed_at || undefined,
    });

    if (project?.id) {
      // Link client to project
      if (values.client_id) {
        await linkClientToProject.mutateAsync({
          clientId: values.client_id,
          projectId: project.id,
        });
      }

      // Auto-link contract if came from contract creation flow
      if (contractId) {
        await linkContract.mutateAsync({ contractId, projectId: project.id });
      }
    }

    navigate(`/projects/${project?.id || ''}`);
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div>
          <h1 className="text-2xl font-bold">Create New Project</h1>
          {contractId && (
            <p className="text-sm text-muted-foreground mt-1">
              This project will be automatically linked to the contract you just created.
            </p>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          const selected = clients.find(c => c.id === value);
                          if (selected) {
                            form.setValue('employer_name', selected.display_name);
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.length === 0 ? (
                            <SelectItem value="__empty" disabled>No clients found — create a client first</SelectItem>
                          ) : (
                            clients.map(client => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.display_name} ({client.client_type === 'company' ? 'Company' : 'Individual'})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Qatar Stadium Construction" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="employer_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employer Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Auto-filled from client selection"
                            {...field}
                            disabled={!!form.watch('client_id')}
                            className={form.watch('client_id') ? 'bg-muted' : ''}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          {form.watch('client_id') ? 'Auto-filled from selected client' : 'Select a client above to auto-fill'}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Doha, Qatar" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="sales_person_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sales Person</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Countries & Config */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <FormLabel>Countries in Contract</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add country..."
                      value={countryInput}
                      onChange={(e) => setCountryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCountry();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addCountry}>
                      Add
                    </Button>
                  </div>
                  {countries.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {countries.map(country => (
                        <Badge key={country} variant="secondary" className="gap-1">
                          {country}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => removeCountry(country)} />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(PROJECT_STATUS_CONFIG).map(([value, config]) => (
                              <SelectItem key={value} value={value}>{config.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="default_workflow_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Workflow Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(WORKFLOW_TYPE_CONFIG).map(([value, config]) => (
                              <SelectItem key={value} value={value}>{config.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {WORKFLOW_TYPE_CONFIG[field.value as WorkflowType]?.description}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="contract_signed_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Signed Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea placeholder="Additional project notes..." rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" disabled={createProject.isPending}>
                {createProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Project
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
}
