-- Create network nodes table
CREATE TABLE public.network_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  allowed_domains JSONB NOT NULL DEFAULT '[]'::jsonb,
  node_type TEXT NOT NULL DEFAULT 'validator',
  priority INTEGER NOT NULL DEFAULT 1,
  timeout_ms INTEGER NOT NULL DEFAULT 5000,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.network_nodes ENABLE ROW LEVEL SECURITY;

-- Admin can manage all nodes
CREATE POLICY "Admins can manage network nodes" 
ON public.network_nodes 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

-- All authenticated users can view active nodes
CREATE POLICY "Users can view active network nodes" 
ON public.network_nodes 
FOR SELECT 
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_network_nodes_updated_at
BEFORE UPDATE ON public.network_nodes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default nodes
INSERT INTO public.network_nodes (name, url, description, node_type, created_by, allowed_domains) VALUES 
('Primary Validator', 'https://xrpl.ws', 'Primary XRPL validator node', 'validator', '00000000-0000-0000-0000-000000000000'::uuid, '["xrpl.ws", "ripple.com"]'::jsonb),
('Secondary Validator', 'https://s1.ripple.com:51234', 'Secondary XRPL validator node', 'validator', '00000000-0000-0000-0000-000000000000'::uuid, '["ripple.com", "s1.ripple.com"]'::jsonb);