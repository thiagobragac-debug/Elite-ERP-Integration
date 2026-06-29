import { useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import toast from 'react-hot-toast';

export const useSaaSAdminLeads = () => {
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);

  const fetchLeads = async () => {
    try {
      setLeadsLoading(true);
      const { data, error } = await supabase
        .from('saas_leads')
        .select('*').eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeadsList(data || []);
    } catch (err) {
      console.error('Erro ao buscar Leads:', err);
    } finally {
      setLeadsLoading(false);
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('saas_leads')
        .update({ status: newStatus })
        .eq('id', leadId).eq('tenant_id', activeTenantId);

      if (error) throw error;
      toast.success('Status do lead atualizado!');
      await fetchLeads();
    } catch (err: any) {
      toast.error(`Erro ao atualizar status: ${err.message}`);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('saas_leads')
        .delete().eq('id', leadId).eq('tenant_id', activeTenantId);

      if (error) throw error;
      toast.success('Lead removido com sucesso!');
      await fetchLeads();
    } catch (err: any) {
      toast.error(`Erro ao remover lead: ${err.message}`);
    }
  };

  return {
    leadsList,
    leadsLoading,
    fetchLeads,
    handleUpdateLeadStatus,
    handleDeleteLead
  };
};
