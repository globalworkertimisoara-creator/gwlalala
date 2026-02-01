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
  
  // Passport specific
  passport_number?: string;
  passport_expiry?: string;
  
  // CV/Resume specific
  skills?: string;
  experience_years?: number;
  linkedin?: string;
  
  // Medical
  medical_status?: string;
  medical_date?: string;
  
  // Visa
  visa_type?: string;
  visa_expiry?: string;
  
  // General
  document_type?: string;
  confidence?: number;
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
      console.error('Document extraction error:', error);
      const message = error instanceof Error ? error.message : 'Failed to extract data';
      
      // Don't show error toast for rate limits - those are handled differently
      if (!message.includes('Rate limit') && !message.includes('credits')) {
        toast({
          variant: 'destructive',
          title: 'Extraction failed',
          description: message,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Service unavailable',
          description: message,
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
