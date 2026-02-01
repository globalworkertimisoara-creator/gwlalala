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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { storage_path, doc_type, bucket } = await req.json();

    if (!storage_path || !bucket) {
      throw new Error("Missing required fields: storage_path, bucket");
    }

    // Create Supabase client to get the file
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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
- Passport number
- Expiry date
- Country of issue`,
      
      photo: `This is a photo. If there's any text visible, extract:
- Any name or identification text`,
      
      working_video: `Describe any visible text or identification in this video thumbnail/frame.`,
      
      presentation_video: `Describe any visible text or identification in this video thumbnail/frame.`,
      
      trade_certificate: `Extract from this trade certificate:
- Full name
- Skills/trade qualification
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
- Any dates
- Any identification numbers`,
      
      // For candidate documents (internal staff)
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
  "nationality": "string or null (in English)",
  "current_country": "string or null (in English)",
  "passport_number": "string or null",
  "passport_expiry": "YYYY-MM-DD or null",
  "skills": "comma-separated string in English or null",
  "experience_years": "number or null",
  "linkedin": "URL string or null",
  "medical_status": "string or null",
  "medical_date": "YYYY-MM-DD or null",
  "visa_type": "string or null",
  "visa_expiry": "YYYY-MM-DD or null",
  "document_type": "detected type",
  "confidence": "0-100 percentage",
  "original_language": "detected language of the document"
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
