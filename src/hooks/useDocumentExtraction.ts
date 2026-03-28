import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ExtractedData {
  // Personal info
  full_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  current_country?: string;
  parents_names?: string;
  gender?: string;
  marital_status?: string;
  current_city?: string;
  whatsapp?: string;
  
  // Passport specific
  passport_number?: string;
  passport_expiry?: string;
  passport_issue_date?: string;
  passport_issued_by?: string;
  national_id_number?: string;
  
  // CV/Resume specific
  skills?: string;
  experience_years?: number;
  linkedin?: string;
  
  // Medical
  medical_status?: string;
  medical_date?: string;
  
  // Visa / Residence permit
  visa_type?: string;
  visa_expiry?: string;
  residence_permit_number?: string;
  residence_permit_expiry?: string;
  
  // Structured CV data
  education?: Array<{
    education_level: string;
    field_of_study?: string;
    institution_name?: string;
    graduation_year?: number;
    degree_obtained?: string;
  }>;
  work_experience?: Array<{
    job_title: string;
    company_name?: string;
    country?: string;
    start_date?: string;
    end_date?: string;
    job_description?: string;
  }>;
  languages?: Array<{
    language_name: string;
    proficiency_level: string;
  }>;
  skills_list?: Array<{
    skill_name: string;
    years_experience?: number;
  }>;
  references?: Array<{
    reference_name: string;
    position_title?: string;
    phone?: string;
    email?: string;
    relationship?: string;
  }>;
  driver_license?: {
    has_license: boolean;
    license_type?: string;
    years_experience?: number;
  };
  salary_expectations?: {
    current_salary?: string;
    expected_salary?: string;
    currency?: string;
    negotiable?: boolean;
  };
  availability?: {
    available_to_start?: string;
    employment_status?: string;
    notice_period?: string;
    willing_to_relocate?: boolean;
  };
  job_preferences?: {
    preferred_titles?: string;
    preferred_countries?: string;
    preferred_work_type?: string;
  };
  family_info?: {
    has_spouse?: boolean;
    children_ages?: string;
    family_willing_to_relocate?: boolean;
  };
  
  // General
  document_type?: string;
  confidence?: number;
  original_language?: string;
}

interface ExtractionResult {
  success: boolean;
  data: ExtractedData | null;
  error?: string;
}

export function useDocumentExtraction() {
  const [isExtracting, setIsExtracting] = useState(false);
  const { toast } = useToast();

  const extractData = async (
    storagePath: string,
    docType: string,
    bucket: string = 'agency-documents'
  ): Promise<ExtractedData | null> => {
    setIsExtracting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke<ExtractionResult>(
        'extract-document-data',
        {
          body: {
            storage_path: storagePath,
            doc_type: docType,
            bucket,
          },
        }
      );

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Extraction failed');
      }

      if (data.data && Object.keys(data.data).length > 0) {
        toast({
          title: 'Data extracted',
          description: 'Document data has been extracted. Review the pre-filled fields.',
        });
        return data.data;
      }

      toast({
        title: 'No data extracted',
        description: 'Could not extract data from this document.',
        variant: 'default',
      });
      return null;

    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      
      if (!message.includes('Rate limit') && !message.includes('credits')) {
        toast({
          variant: 'destructive',
          title: 'Extraction failed',
          description: 'Failed to extract data from this document. Please try again.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Service unavailable',
          description: 'Extraction service is temporarily unavailable. Please try again later.',
        });
      }
      return null;
    } finally {
      setIsExtracting(false);
    }
  };

  return {
    extractData,
    isExtracting,
  };
}
