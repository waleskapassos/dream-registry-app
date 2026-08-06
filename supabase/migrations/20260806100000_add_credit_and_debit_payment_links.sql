ALTER TABLE public.gifts
ADD COLUMN IF NOT EXISTS nubank_payment_url text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS nubank_credit_payment_url text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS nubank_debit_payment_url text NOT NULL DEFAULT '';

-- Preserve any link already saved during the previous configuration.
UPDATE public.gifts
SET
  nubank_credit_payment_url = CASE
    WHEN nubank_credit_payment_url = '' THEN nubank_payment_url
    ELSE nubank_credit_payment_url
  END,
  nubank_debit_payment_url = CASE
    WHEN nubank_debit_payment_url = '' THEN nubank_payment_url
    ELSE nubank_debit_payment_url
  END;
