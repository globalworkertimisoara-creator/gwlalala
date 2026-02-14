
-- Allow agency owners to insert billing payments for their own billing records
CREATE POLICY "Agency owners can insert billing payments" ON public.billing_payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.billing_records br
      WHERE br.id = billing_payments.billing_record_id
      AND public.can_access_billing(auth.uid(), br.agency_id)
    )
  );
