import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import toast from 'react-hot-toast';

export const useSecurityEnforcer = () => {
  const { user, logout } = useAuth();
  const { activeTenantId } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();

  const inactivityTimer = useRef<any>(null);

  useEffect(() => {
    if (!user || !activeTenantId) return;

    let isMounted = true;
    let settings: any = null;

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('tenant_security_settings')
          .select('*')
          .eq('tenant_id', activeTenantId)
          .maybeSingle();
        
        // 406 = tabela não existe ainda no banco — ignora silenciosamente
        if (error && (error.code === 'PGRST116' || error.message?.includes('406') || error.message?.includes('relation') || error.message?.includes('does not exist'))) {
          return;
        }
        if (isMounted && data) {
          settings = data;
          applyPolicies(data);
        }
      } catch (err) {
        // Ignora silenciosamente — tabela pode não existir neste ambiente
      }
    };

    const applyPolicies = async (secSettings: any) => {
      // 1. Checar IP Banido (Sempre)
      try {
        const { data: isBanned } = await supabase.rpc('check_ip_banned');
        if (isBanned) {
          toast.error('Acesso bloqueado: Seu IP está na lista de bloqueios de segurança.');
          await logout();
          return;
        }
      } catch (e) {
        console.warn('Erro ao verificar IP:', e);
      }

      // 2. Modo de Manutenção
      const userRole = (user.role as string).toUpperCase();
      if (secSettings.maintenance_mode && userRole !== 'SAAS_ADMIN' && userRole !== 'ADMIN') {
        toast.error('Sistema em manutenção. Acesso restrito a administradores.');
        await logout();
        return;
      }

      // 3. Acesso Multi-dispositivo (se desativado, força sessão única)
      if (secSettings.multi_device === false) {
        try {
          await supabase.rpc('enforce_single_session');
        } catch (e) {
          console.warn('Erro ao forçar sessão única:', e);
        }
      }
    };

    fetchSettings();

    // 4. Inatividade 30 min
    const resetTimer = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      if (settings?.inactivity_30m) {
        inactivityTimer.current = setTimeout(async () => {
          toast.error('Sessão expirada por inatividade (30 min).');
          await logout();
        }, 30 * 60 * 1000);
      }
    };

    // Registrar listeners se estivermos logados
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => resetTimer();

    events.forEach(event => document.addEventListener(event, handleActivity));
    resetTimer(); // Inicia o timer

    return () => {
      isMounted = false;
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      events.forEach(event => document.removeEventListener(event, handleActivity));
    };
  }, [user, activeTenantId, location.pathname, logout]);
};
