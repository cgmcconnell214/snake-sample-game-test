-- Create message attachments storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', false);

-- Create policies for attachment access
CREATE POLICY "Users can upload their own message attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'message-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can read message attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'message-attachments' AND EXISTS (
  SELECT 1
  FROM public.user_messages m
  WHERE 
    (m.recipient_id = auth.uid() OR m.sender_id = auth.uid())
    AND SPLIT_PART(name, '/', 1) = m.id::text
));

CREATE POLICY "Users can delete their own message attachments" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'message-attachments' AND EXISTS (
  SELECT 1
  FROM public.user_messages m
  WHERE 
    m.sender_id = auth.uid()
    AND SPLIT_PART(name, '/', 1) = m.id::text
));