-- Create storage bucket for agency uploads (100MB limit for videos)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('agency-documents', 'agency-documents', false, 104857600)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for agency-documents bucket
CREATE POLICY "Agencies can upload to their folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'agency-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Agencies can view their files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'agency-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Agencies can delete their files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'agency-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Staff can view all agency files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'agency-documents' 
  AND public.is_authenticated()
  AND NOT public.is_agency(auth.uid())
);