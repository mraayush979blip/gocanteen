-- ======================================================================================
-- Supabase Trigger: Securely auto-increment Promo Code Usage count
-- Run this in your Supabase Dashboard -> SQL Editor
-- ======================================================================================

-- 1. Create a function to securely increment usage count bypassing RLS restrictions
CREATE OR REPLACE FUNCTION increment_promo_code_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the order has a coupon applied
  IF NEW.coupon_code IS NOT NULL AND NEW.coupon_code != '' THEN
    UPDATE public.promo_codes
    SET current_uses = COALESCE(current_uses, 0) + 1
    WHERE code = NEW.coupon_code;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Clean up any existing trigger to avoid duplicates
DROP TRIGGER IF EXISTS trg_increment_promo_usage ON public.orders;

-- 3. Attach the trigger to the orders table
CREATE TRIGGER trg_increment_promo_usage
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION increment_promo_code_usage();
