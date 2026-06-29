import { useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import toast from 'react-hot-toast';

export const useSaaSAdminCampaigns = (isSaving: boolean, setIsSaving: (s: boolean) => void) => {
  const [campaignsList, setCampaignsList] = useState<any[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  const fetchCampaigns = async () => {
    try {
      setCampaignsLoading(true);
      const { data, error }: any = await supabase
        .from('saas_campaigns')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      setCampaignsList(data || []);
    } catch (err) {
      console.error('Erro ao buscar Campanhas:', err);
      setCampaignsList([]);
    } finally {
      setCampaignsLoading(false);
    }
  };

  const handleSaveCampaign = async (data: any) => {
    try {
      setIsSaving(true);
      const campaignData = {
        name: data.name,
        discount_percentage: Number(data.discount_percentage),
        start_date: new Date(data.start_date).toISOString(),
        end_date: new Date(data.end_date).toISOString(),
        is_active: data.is_active,
        target_plan_ids: data.target_plan_ids || [],
        settings: data.settings || {},
      };

      const savePromise = selectedCampaign
        ? supabase.from('saas_campaigns').update(campaignData).eq('id', selectedCampaign.id)
        : supabase.from('saas_campaigns').insert([campaignData]);

      const { error } = await savePromise;
      if (error) {
        throw error;
      }

      await fetchCampaigns();
      setIsCampaignModalOpen(false);
      toast.success('Campanha salva com sucesso!');
    } catch (err: any) {
      console.error('Erro ao salvar campanha:', err);
      toast.error(`Erro ao salvar campanha: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    campaignsList,
    campaignsLoading,
    fetchCampaigns,
    isCampaignModalOpen,
    setIsCampaignModalOpen,
    selectedCampaign,
    setSelectedCampaign,
    handleSaveCampaign,
  };
};
