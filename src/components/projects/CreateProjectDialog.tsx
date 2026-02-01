import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCreateProject } from '@/hooks/useProjects';
import { ProjectStatus, PROJECT_STATUS_CONFIG } from '@/types/project';

const formSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  employer_name: z.string().min(1, 'Employer name is required'),
  location: z.string().min(1, 'Location is required'),
  sales_person_name: z.string().optional(),
  status: z.enum(['draft', 'active', 'on_hold', 'completed', 'cancelled']).default('draft'),
  contract_signed_at: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const [countries, setCountries] = useState<string[]>([]);
  const [countryInput, setCountryInput] = useState('');
  const createProject = useCreateProject();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      employer_name: '',
      location: '',
      sales_person_name: '',
      status: 'draft',
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
    await createProject.mutateAsync({
      name: values.name,
      employer_name: values.employer_name,
      location: values.location,
      sales_person_name: values.sales_person_name,
      status: values.status,
      notes: values.notes,
      countries_in_contract: countries,
      contract_signed_at: values.contract_signed_at || undefined,
    });
    setOpen(false);
    form.reset();
    setCountries([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Qatar Stadium Construction" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="employer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., ABC Construction Ltd" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Doha, Qatar" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeCountry(country)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
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

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(PROJECT_STATUS_CONFIG).map(([value, config]) => (
                        <SelectItem key={value} value={value}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional project notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createProject.isPending}>
                {createProject.isPending ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
