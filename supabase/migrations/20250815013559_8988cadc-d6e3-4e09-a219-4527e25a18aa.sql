-- Create atomic enrollment redemption function
CREATE OR REPLACE FUNCTION public.redeem_enrollment_link_atomic(
  p_code text,
  p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_link_record course_enrollment_links%ROWTYPE;
  v_existing_enrollment uuid;
  v_new_count integer;
  v_result jsonb;
BEGIN
  -- Lock and get the enrollment link
  SELECT * INTO v_link_record
  FROM course_enrollment_links
  WHERE code = p_code
  FOR UPDATE;
  
  -- Check if link exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid code');
  END IF;
  
  -- Check if link is active
  IF NOT v_link_record.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Link is inactive');
  END IF;
  
  -- Check if link has expired
  IF v_link_record.expires_at IS NOT NULL AND v_link_record.expires_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Link expired');
  END IF;
  
  -- Check current usage vs max uses
  IF v_link_record.used_count >= v_link_record.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usage limit reached');
  END IF;
  
  -- Calculate new count after increment
  v_new_count := v_link_record.used_count + 1;
  
  -- Double-check that incrementing won't exceed max_uses
  IF v_new_count > v_link_record.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usage limit would be exceeded');
  END IF;
  
  -- Check if user is already enrolled
  SELECT id INTO v_existing_enrollment
  FROM course_enrollments
  WHERE course_id = v_link_record.course_id
    AND student_id = p_user_id;
  
  -- Create enrollment if not exists
  IF v_existing_enrollment IS NULL THEN
    INSERT INTO course_enrollments (
      student_id,
      course_id,
      payment_amount,
      payment_status,
      payment_provider
    ) VALUES (
      p_user_id,
      v_link_record.course_id,
      0,
      'paid',
      'bypass'
    );
  END IF;
  
  -- Atomically increment the usage count
  UPDATE course_enrollment_links
  SET 
    used_count = v_new_count,
    is_active = CASE 
      WHEN v_new_count >= max_uses THEN false 
      ELSE is_active 
    END
  WHERE id = v_link_record.id;
  
  -- Return success with course info
  RETURN jsonb_build_object(
    'success', true,
    'course_id', v_link_record.course_id,
    'already_enrolled', v_existing_enrollment IS NOT NULL,
    'used_count', v_new_count,
    'max_uses', v_link_record.max_uses
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error information
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Database error: ' || SQLERRM
    );
END;
$$;