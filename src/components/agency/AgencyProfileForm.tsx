import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Building2 } from 'lucide-react';
import { AgencyProfile, CreateAgencyProfileInput } from '@/types/agency';

const formSchema = z.object({
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
  country: z.string().min(2, 'Country is required'),
  contact_person: z.string().min(2, 'Contact person name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  recruitment_license: z.string().optional(),
  certifications: z.string().optional(),
  years_in_business: z.coerce.number().min(0).optional(),
  worker_capacity: z.coerce.number().min(0).optional(),
  specializations: z.string().optional(),
  countries_recruiting_from: z.string().optional(),
  industries_focus: z.string().optional(),
  has_testing_facilities: z.boolean().default(false),
  testing_facilities_locations: z.string().optional(),
  office_locations: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AgencyProfileFormProps {
  existingProfile?: AgencyProfile | null;
  onSubmit: (data: CreateAgencyProfileInput) => Promise<void>;
  isLoading?: boolean;
}

export function AgencyProfileForm({ existingProfile, onSubmit, isLoading }: AgencyProfileFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_name: existingProfile?.company_name || '',
      country: existingProfile?.country || '',
      contact_person: existingProfile?.contact_person || '',
      email: existingProfile?.email || '',
      phone: existingProfile?.phone || '',
      address: existingProfile?.address || '',
      recruitment_license: existingProfile?.recruitment_license || '',
      certifications: existingProfile?.certifications || '',
      years_in_business: existingProfile?.years_in_business || undefined,
      worker_capacity: existingProfile?.worker_capacity || undefined,
      specializations: existingProfile?.specializations || '',
      countries_recruiting_from: existingProfile?.countries_recruiting_from || '',
      industries_focus: existingProfile?.industries_focus || '',
      has_testing_facilities: existingProfile?.has_testing_facilities || false,
      testing_facilities_locations: existingProfile?.testing_facilities_locations || '',
      office_locations: existingProfile?.office_locations || '',
    },
  });

  const handleSubmit = async (data: FormData) => {
    await onSubmit(data as CreateAgencyProfileInput);
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl">
          {existingProfile ? 'Update Agency Profile' : 'Set Up Your Agency Profile'}
        </CardTitle>
        <CardDescription>
          {existingProfile 
            ? 'Update your company information and capabilities'
            : 'Complete your agency profile to start submitting workers for open positions'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Company Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Company Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Agency Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country *</FormLabel>
                      <FormControl>
                        <Input placeholder="India" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Full address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="contact_person"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
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
                        <Input type="email" placeholder="contact@agency.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              </div>
            </div>

            {/* Licenses & Certifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Licenses & Certifications</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="recruitment_license"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recruitment License</FormLabel>
                      <FormControl>
                        <Input placeholder="License number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="years_in_business"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years in Business</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="certifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certifications</FormLabel>
                    <FormControl>
                      <Textarea placeholder="List your certifications..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Capacity & Specialization */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Capacity & Specialization</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="worker_capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Worker Capacity (per month)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="countries_recruiting_from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Countries Recruiting From</FormLabel>
                      <FormControl>
                        <Input placeholder="India, Nepal, Bangladesh" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="specializations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specializations</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Construction, Healthcare, Hospitality..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="industries_focus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industries Focus</FormLabel>
                    <FormControl>
                      <Textarea placeholder="What industries do you primarily recruit for?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Testing Facilities */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Testing Facilities</h3>
              <FormField
                control={form.control}
                name="has_testing_facilities"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>We have testing facilities</FormLabel>
                      <FormDescription>
                        Do you have facilities to test worker skills?
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              {form.watch('has_testing_facilities') && (
                <FormField
                  control={form.control}
                  name="testing_facilities_locations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Testing Facilities Locations</FormLabel>
                      <FormControl>
                        <Textarea placeholder="List cities and countries where you have testing facilities..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Office Locations */}
            <FormField
              control={form.control}
              name="office_locations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Office Locations</FormLabel>
                  <FormControl>
                    <Textarea placeholder="List your office locations in different countries..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {existingProfile ? 'Updating...' : 'Creating Profile...'}
                </>
              ) : (
                existingProfile ? 'Update Profile' : 'Create Profile'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
