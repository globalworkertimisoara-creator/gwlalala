import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Loader2, UserPlus } from 'lucide-react';
import { useCreateAgencyWorker, useOpenJobs } from '@/hooks/useAgency';
import { CreateAgencyWorkerInput } from '@/types/agency';

const formSchema = z.object({
  job_id: z.string().min(1, 'Please select a job'),
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  nationality: z.string().min(2, 'Nationality is required'),
  current_country: z.string().optional(),
  date_of_birth: z.string().optional(),
  skills: z.string().optional(),
  experience_years: z.coerce.number().min(0).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SubmitWorkerDialogProps {
  agencyId: string;
  onSuccess?: (workerId: string) => void;
  trigger?: React.ReactNode;
}

export function SubmitWorkerDialog({ agencyId, onSuccess, trigger }: SubmitWorkerDialogProps) {
  const [open, setOpen] = useState(false);
  const { data: jobs, isLoading: jobsLoading } = useOpenJobs();
  const createWorker = useCreateAgencyWorker();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      job_id: '',
      full_name: '',
      email: '',
      phone: '',
      nationality: '',
      current_country: '',
      date_of_birth: '',
      skills: '',
      experience_years: undefined,
    },
  });

  const handleSubmit = async (data: FormData) => {
    const input: CreateAgencyWorkerInput & { agencyId: string } = {
      agencyId,
      job_id: data.job_id,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || undefined,
      nationality: data.nationality,
      current_country: data.current_country || undefined,
      date_of_birth: data.date_of_birth || undefined,
      skills: data.skills || undefined,
      experience_years: data.experience_years,
    };

    const result = await createWorker.mutateAsync(input);
    setOpen(false);
    form.reset();
    onSuccess?.(result.id);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Submit Worker
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Worker for Position</DialogTitle>
          <DialogDescription>
            Enter the worker details and select the job position they are applying for.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="job_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Position *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={jobsLoading ? "Loading jobs..." : "Select a job"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {jobs?.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.title} - {job.client_company} ({job.country})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Worker's full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="worker@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 12345 67890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nationality *</FormLabel>
                    <FormControl>
                      <Input placeholder="Indian" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="current_country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Country</FormLabel>
                    <FormControl>
                      <Input placeholder="India" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="experience_years"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Years of Experience</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} placeholder="5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skills</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="List relevant skills (e.g., Welding, Plumbing, Electrical work...)" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={createWorker.isPending}>
                {createWorker.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Worker'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
