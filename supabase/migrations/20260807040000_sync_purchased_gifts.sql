-- Recalcula os presentes já pagos para corrigir dados anteriores à automação.
UPDATE public.gifts AS gift
SET purchased_count = COALESCE((
  SELECT SUM(item.quantity)::integer
  FROM public.order_items AS item
  JOIN public.orders AS purchase_order ON purchase_order.id = item.order_id
  WHERE item.gift_id = gift.id
    AND purchase_order.status = 'paid'
), 0);

CREATE OR REPLACE FUNCTION public.sync_gift_purchased_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  count_delta integer;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF OLD.status <> 'paid' AND NEW.status = 'paid' THEN
    count_delta := 1;
  ELSIF OLD.status = 'paid' AND NEW.status <> 'paid' THEN
    count_delta := -1;
  ELSE
    RETURN NEW;
  END IF;

  UPDATE public.gifts AS gift
  SET purchased_count = GREATEST(0, gift.purchased_count + count_delta * item.quantity)
  FROM public.order_items AS item
  WHERE item.order_id = NEW.id
    AND item.gift_id = gift.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_gifts_when_order_status_changes ON public.orders;
CREATE TRIGGER sync_gifts_when_order_status_changes
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.sync_gift_purchased_count();
