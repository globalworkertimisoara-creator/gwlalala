import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ExtractionResult {
  success: boolean;
  data: ExtractedData | null;
  error?: string;
}

interface ExtractedData {
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
  };
  availability?: {
    available_to_start?: string;
    employment_status?: string;
    notice_period?: string;
  };
  job_preferences?: {
    preferred_titles?: string;
    preferred_countries?: string;
    preferred_work_type?: string;
  };
  
  // General
  document_type?: string;
  confidence?: number;
  original_language?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized', data: null }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { storage_path, doc_type, bucket } = await req.json();

    if (!storage_path || !bucket) {
      throw new Error("Missing required fields: storage_path, bucket");
    }

    // SECURITY: Validate storage_path format - prevent path traversal attacks
    if (storage_path.includes('..') || storage_path.includes('\\') || 
        !/^[a-zA-Z0-9_\-\/\.]+$/.test(storage_path)) {
      console.error(`Security: Invalid storage path format attempted: ${storage_path}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid storage path format', data: null }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Validate doc_type against allowed enum values
    const allowedDocTypes = [
      'cv', 'cv_profile', 'passport', 'photo', 'working_video', 'presentation_video',
      'trade_certificate', 'medical_clearance', 'training_doc', 'plane_ticket',
      'visa_document', 'residence_permit', 'resume', 'contract', 'certificate', 'other'
    ];
    if (doc_type && !allowedDocTypes.includes(doc_type)) {
      console.error(`Security: Invalid doc_type attempted: ${doc_type}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid document type', data: null }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate bucket is one of the allowed buckets
    const allowedBuckets = ['candidate-documents', 'agency-documents'];
    if (!allowedBuckets.includes(bucket)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid bucket', data: null }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // SECURITY: First verify user has access to this file using their token
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user info to verify they're authenticated
    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication', data: null }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has access to the storage path via RLS
    // For agency-documents, verify the path starts with their agency folder
    // For candidate-documents, only staff can access
    const { data: roleData } = await userSupabase.from('user_roles').select('role').eq('user_id', user.id).single();
    const isAgency = roleData?.role === 'agency';

    if (bucket === 'candidate-documents' && isAgency) {
      return new Response(
        JSON.stringify({ success: false, error: 'Access denied', data: null }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (bucket === 'agency-documents' && isAgency) {
      // Verify agency can only access their own documents
      const { data: agencyProfile } = await userSupabase.from('agency_profiles').select('id').eq('user_id', user.id).single();
      
      // SECURITY: Normalize path and ensure strict folder containment (prevent traversal)
      const normalizedPath = storage_path.replace(/\/+/g, '/');
      
      // Path must start with agency ID followed by a slash - prevents accessing other folders
      if (!agencyProfile || !normalizedPath.startsWith(agencyProfile.id + '/')) {
        console.error(`Security: Agency ${user.id} attempted to access unauthorized path: ${storage_path}`);
        return new Response(
          JSON.stringify({ success: false, error: 'Access denied to this path', data: null }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Only after authorization checks pass, use service key for signed URL
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get signed URL for the file
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storage_path, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw new Error(`Failed to get file URL: ${signedUrlError?.message || 'Unknown error'}`);
    }

    // Determine extraction prompt based on document type
    const extractionPrompts: Record<string, string> = {
      cv_profile: `Extract ALL available information from this CV/Resume document comprehensively:

PERSONAL INFO: Full name, email, phone, date of birth, nationality, current country, current city, gender, marital status, WhatsApp number, LinkedIn URL

EDUCATION (for each entry, max 3):
- Education level (High School, Bachelor's, Master's, PhD, Vocational, Certificate)
- Field of study
- Institution name
- Graduation year
- Degree/certificate obtained

WORK EXPERIENCE (for each entry, max 5):
- Job title
- Company name
- Country
- Start date (YYYY-MM-DD)
- End date (YYYY-MM-DD, or null if current)
- Brief job description

LANGUAGES (for each):
- Language name
- Proficiency level (basic, intermediate, advanced, fluent, native)

SKILLS (list of skills with estimated years of experience per skill)

REFERENCES (if listed):
- Name, position, phone, email, relationship

DRIVER'S LICENSE: Has license? Type? Years of driving?

SALARY: Current salary, expected salary, currency

AVAILABILITY: Available to start, employment status, notice period

JOB PREFERENCES: Preferred job titles, preferred countries, preferred work type (full_time, part_time, contract)

Extract everything visible. Translate all text to English.`,

      cv: `Extract the following from this CV/Resume:
- Full name
- Email address
- Phone number
- Date of birth (if visible)
- Nationality (if mentioned)
- Current country/location
- Skills (as comma-separated list)
- Years of experience (estimate from work history)
- LinkedIn URL (if present)`,
      
      passport: `Extract the following from this passport:
- Full name (as written)
- Date of birth
- Nationality
- Parents names (father and mother if visible)
- Passport number
- Issue date
- Expiry date
- Issuing authority/country`,
      
      photo: `This is a photo. If there's any text visible, extract:
- Any name or identification text`,
      
      working_video: `Describe any visible text or identification in this video thumbnail/frame.`,
      
      presentation_video: `Describe any visible text or identification in this video thumbnail/frame.`,
      
      trade_certificate: `Extract from this trade certificate:
- Full name
- Skills/trade qualification
- Date of issue
- Issuing organization`,

      certificate: `Extract from this certificate:
- Full name
- Certificate/qualification name
- Skills covered
- Date of issue
- Issuing organization`,
      
      medical_clearance: `Extract from this medical document:
- Full name
- Date of examination
- Medical status/result
- Doctor/clinic name`,
      
      training_doc: `Extract from this training document:
- Full name
- Training/course name
- Skills covered
- Date completed`,
      
      plane_ticket: `Extract from this plane ticket:
- Passenger name
- Travel dates`,
      
      visa_document: `Extract from this visa document:
- Full name
- Visa type
- Expiry date
- Nationality`,
      
      other: `Extract any personal information visible:
- Full name
- Email
- Phone
- Parents names (if visible)
- Any dates (issue dates, expiry dates)
- Any identification numbers (passport, visa, permit)`,
      
      residence_permit: `Extract from this residence permit:
- Full name
- Nationality
- Permit/card number
- Issue date
- Expiry date
- Issuing authority`,
      resume: `Extract the following from this CV/Resume:
- Full name
- Email address
- Phone number
- Date of birth (if visible)
- Nationality (if mentioned)
- Current country/location
- Skills (as comma-separated list)
- Years of experience (estimate from work history)
- LinkedIn URL (if present)`,
      
      contract: `Extract from this contract:
- Full name of employee/candidate
- Start date
- Any relevant terms`,
    };

    const basePrompt = extractionPrompts[doc_type] || extractionPrompts.other;
    
    const isFullCVExtraction = doc_type === 'cv_profile';

    const systemPrompt = `You are a multilingual document data extraction AI with OCR capabilities. Analyze the provided document image and extract structured information.

LANGUAGE SUPPORT:
- You can read documents in ANY language (Arabic, Chinese, Hindi, Spanish, French, German, Russian, Japanese, Korean, Thai, Vietnamese, etc.)
- Always translate extracted data to English for consistency
- If a name is in non-Latin script, provide both the original and transliterated/translated version

IMPORTANT RULES:
1. Only extract information that is CLEARLY visible in the document
2. Return data in valid JSON format
3. Use null for fields that cannot be determined
4. For dates, use YYYY-MM-DD format
5. For phone numbers, include country code if visible
6. For skills, provide as comma-separated string in English
7. Estimate experience_years as a number based on work history dates
8. Translate all extracted text to English while preserving accuracy

Return ONLY a JSON object with these possible fields:
{
  "full_name": "string or null (in English/Latin script)",
  "email": "string or null", 
  "phone": "string or null",
  "date_of_birth": "YYYY-MM-DD or null",
  "gender": "male/female/other or null",
  "nationality": "string or null (in English)",
  "current_country": "string or null (in English)",
  "current_city": "string or null",
  "marital_status": "single/married/divorced/widowed or null",
  "whatsapp": "string or null",
  "parents_names": "string or null (format: 'Father: Name, Mother: Name')",
  "passport_number": "string or null",
  "passport_expiry": "YYYY-MM-DD or null",
  "passport_issue_date": "YYYY-MM-DD or null",
  "passport_issued_by": "string or null (issuing authority/country)",
  "national_id_number": "string or null",
  "skills": "comma-separated string in English or null",
  "experience_years": "number or null",
  "linkedin": "URL string or null",
  "medical_status": "string or null",
  "medical_date": "YYYY-MM-DD or null",
  "visa_type": "string or null",
  "visa_expiry": "YYYY-MM-DD or null",
  "residence_permit_number": "string or null",
  "residence_permit_expiry": "YYYY-MM-DD or null",
  "document_type": "detected type",
  "confidence": "0-100 percentage",
  "original_language": "detected language of the document"${isFullCVExtraction ? `,
  "education": [{"education_level":"string","field_of_study":"string or null","institution_name":"string or null","graduation_year":"number or null","degree_obtained":"string or null"}],
  "work_experience": [{"job_title":"string","company_name":"string or null","country":"string or null","start_date":"YYYY-MM-DD or null","end_date":"YYYY-MM-DD or null","job_description":"string or null"}],
  "languages": [{"language_name":"string","proficiency_level":"basic/intermediate/advanced/fluent/native"}],
  "skills_list": [{"skill_name":"string","years_experience":"number or null"}],
  "references": [{"reference_name":"string","position_title":"string or null","phone":"string or null","email":"string or null","relationship":"string or null"}],
  "driver_license": {"has_license":"boolean","license_type":"string or null","years_experience":"number or null"},
  "salary_expectations": {"current_salary":"string or null","expected_salary":"string or null","currency":"string or null"},
  "availability": {"available_to_start":"string or null","employment_status":"employed/unemployed or null","notice_period":"string or null"},
  "job_preferences": {"preferred_titles":"string or null","preferred_countries":"string or null","preferred_work_type":"full_time/part_time/contract or null"}` : ''}
}`;

    // Call Lovable AI with the document image
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              { type: "text", text: basePrompt },
              { type: "image_url", image_url: { url: signedUrlData.signedUrl } }
            ]
          }
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later.", data: null }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI credits exhausted. Please add funds.", data: null }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI processing failed: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    let extractedData: ExtractedData;
    try {
      // Try to extract JSON from the response (it might have markdown formatting)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse extracted data");
    }

    // Clean up null values and empty strings
    const cleanedData: ExtractedData = {};
    for (const [key, value] of Object.entries(extractedData)) {
      if (value !== null && value !== "" && value !== "null") {
        (cleanedData as any)[key] = value;
      }
    }

    const result: ExtractionResult = {
      success: true,
      data: cleanedData,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Document extraction error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, data: null }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
