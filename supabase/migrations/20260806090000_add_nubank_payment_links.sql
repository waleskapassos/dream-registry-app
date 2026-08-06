-- Each Nubank payment link is created in the Nubank app with a fixed amount.
-- Saving it on the gift ensures the guest is sent to the matching charge.
ALTER TABLE public.gifts
ADD COLUMN IF NOT EXISTS nubank_payment_url text NOT NULL DEFAULT '';
