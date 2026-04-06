
-- Function to delete all user data across tables
CREATE OR REPLACE FUNCTION public.delete_user_data(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete user's ride messages
  DELETE FROM public.ride_messages WHERE sender_id = p_user_id;
  
  -- Delete user's ride splits
  DELETE FROM public.ride_splits WHERE convidado_user_id = p_user_id;
  
  -- Delete user's ride stops (via rides)
  DELETE FROM public.ride_stops WHERE ride_id IN (
    SELECT id FROM public.rides WHERE passageiro_id = p_user_id OR motorista_id = p_user_id
  );
  
  -- Delete user's voucher usage
  DELETE FROM public.voucher_usos WHERE user_id = p_user_id;
  
  -- Delete user's ratings
  DELETE FROM public.ratings WHERE avaliador_id = p_user_id OR avaliado_id = p_user_id;
  
  -- Delete user's rides
  DELETE FROM public.rides WHERE passageiro_id = p_user_id OR motorista_id = p_user_id;
  
  -- Delete user's envios
  DELETE FROM public.envios WHERE user_id = p_user_id;
  
  -- Delete user's saved routes
  DELETE FROM public.rotas_salvas WHERE user_id = p_user_id;
  
  -- Delete user's payment methods
  DELETE FROM public.metodos_pagamento WHERE user_id = p_user_id;
  
  -- Delete user's bank accounts
  DELETE FROM public.contas_bancarias WHERE user_id = p_user_id;
  
  -- Delete user's withdrawals
  DELETE FROM public.saques WHERE user_id = p_user_id;
  
  -- Delete user's wallet topups
  DELETE FROM public.wallet_topups WHERE user_id = p_user_id;
  
  -- Delete user's credit history
  DELETE FROM public.extrato_creditos WHERE perfil_id = p_user_id;
  
  -- Delete user's notifications
  DELETE FROM public.notificacoes WHERE user_id = p_user_id;
  
  -- Delete user's device tokens
  DELETE FROM public.device_tokens WHERE user_id = p_user_id;
  
  -- Delete user's driver data
  DELETE FROM public.driver_locations WHERE driver_id = p_user_id;
  DELETE FROM public.driver_conquistas WHERE driver_id = p_user_id;
  DELETE FROM public.verificacao_selfie WHERE driver_id = p_user_id;
  
  -- Delete user's referrals
  DELETE FROM public.indicacoes WHERE referrer_id = p_user_id;
  
  -- Delete user's profile
  DELETE FROM public.profiles WHERE id = p_user_id;
END;
$$;
