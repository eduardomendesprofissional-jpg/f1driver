-- Attach recalc trigger on extrato_creditos
DROP TRIGGER IF EXISTS trg_recalc_driver_balance ON public.extrato_creditos;
CREATE TRIGGER trg_recalc_driver_balance
AFTER INSERT OR UPDATE OF status ON public.extrato_creditos
FOR EACH ROW
EXECUTE FUNCTION public.recalc_driver_balance();

-- Attach is_blocked recalculation on profiles
DROP TRIGGER IF EXISTS trg_check_driver_balance_block ON public.profiles;
CREATE TRIGGER trg_check_driver_balance_block
BEFORE UPDATE OF driver_balance ON public.profiles
FOR EACH ROW
WHEN (NEW.tipo = 'motorista')
EXECUTE FUNCTION public.check_driver_balance_block();