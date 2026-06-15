const fs = require('fs');
const file = 'src/pages/Pecuaria/ReproductionManagement.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `  const deleteReproMutation = useMutation({`;

const replacement = `  const saveReproMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (selectedEvent) {
        const { error } = await supabase.from('eventos_reprodutivos').update(payload).eq('id', selectedEvent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('eventos_reprodutivos').insert([{ ...payload, ...insertPayload }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report'] });
      setIsModalOpen(false);
      toast.success(selectedEvent ? '✅ Evento reprodutivo atualizado!' : '✅ Evento reprodutivo cadastrado!');
    },
    onError: (err: any) => {
      toast.error('❌ Erro ao salvar evento reprodutivo: ' + err.message);
    }
  });

  const handleSubmit = async (data: any) => {
    if (!canCreate && !selectedEvent) {
      toast.error('⚠️ Selecione uma unidade específica para registrar um novo evento reprodutivo.');
      return;
    }

    let obsParts = [];
    if (data.ecc) obsParts.push(\`ECC: \${data.ecc}\`);
    if (data.touro) obsParts.push(\`Touro/Sêmen: \${data.touro}\`);
    if (data.resultado_diagnostico) obsParts.push(\`Diagnóstico: \${data.resultado_diagnostico}\`);
    if (data.dias_gestacao) obsParts.push(\`Dias Gestação: \${data.dias_gestacao}\`);
    if (data.sexo_cria) obsParts.push(\`Sexo da Cria: \${data.sexo_cria}\`);
    if (data.id_cria) obsParts.push(\`ID da Cria: \${data.id_cria}\`);
    if (data.observacoes) obsParts.push(data.observacoes);

    const payload = {
      animal_id: data.animal_id,
      tipo_evento: data.tipo_evento,
      data_evento: data.data_evento,
      resultado: data.resultado || data.resultado_diagnostico,
      observacoes: obsParts.join(' | '),
      status: data.status
    };

    saveReproMutation.mutate(payload);
  };

  const batchSaveReproMutation = useMutation({
    mutationFn: async (batchData: any[]) => {
      const { error } = await supabase.from('eventos_reprodutivos').insert(batchData.map(d => ({ ...d, ...insertPayload })));
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report'] });
      setIsBatchModalOpen(false);
      toast.success('✅ Lançamento em lote salvo!');
    },
    onError: (err: any) => {
      toast.error('❌ Erro ao salvar lote reprodutivo: ' + err.message);
    }
  });

  const handleBatchSubmit = async (batchData: any[]) => {
    batchSaveReproMutation.mutate(batchData);
  };

  const deleteReproMutation = useMutation({`;

// Delete the malformed lines
const startMalformed = content.indexOf(`  const saveReproMutation = useMutation({`);
const endMalformed = content.indexOf(`  const deleteReproMutation = useMutation({`);
if (startMalformed !== -1 && endMalformed !== -1) {
  content = content.substring(0, startMalformed) + replacement + content.substring(endMalformed + target.length);
  fs.writeFileSync(file, content, 'utf8');
  console.log("File patched successfully!");
} else {
  console.log("Could not find targets");
}
