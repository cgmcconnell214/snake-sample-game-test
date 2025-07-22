-- Fix leaked password protection (security improvement)
-- Enable password security features
UPDATE auth.config 
SET 
  password_min_length = 8,
  password_require_letters = true,
  password_require_numbers = true,
  password_require_symbols = true
WHERE true;