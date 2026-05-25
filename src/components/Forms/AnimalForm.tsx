import React, { useState } from 'react';
import { 
  Beef, 
  Hash, 
  Calendar, 
  Tag, 
  Layers,
  Info,
  Activity,
  User,
  Users,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { FormModal } from './FormModal';
import { supabase } from '../../lib/supabase';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useTenant } from '../../contexts/TenantContext';
import { isValidUUID } from '../../utils/validation';

interface AnimalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
}

export const AnimalForm: React.FC<AnimalFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    brinco: '',
    raca: 'Nelore',
    sexo: 'M',
    data_nascimento: '',
    lote_id: '',
    status: 'Ativo',
    peso_inicial: '',
    pelagem: '',
    origem: 'Nascido',
    mae_brinco: '',
    pai_brinco: '',
    valor_compra: '',
    categoria: 'Boi',
    finalidade: 'Corte'
  });
  const { applyFarmFilter } = useFarmFilter();
  const { activeTenantId } = useTenant();
  const [lotes, setLotes] = useState<any[]>([]);
  const [racas, setRacas] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLotes, setLoadingLotes] = useState(false);

  React.useEffect(() => {
    fetchLotes();
    if (isOpen && activeTenantId) {
      fetchRacas();
      fetchCategorias();
    }
    if (initialData) {
      setFormData({
        brinco: initialData.brinco || '',
        raca: initialData.raca || 'Nelore',
        sexo: initialData.sexo || 'M',
        data_nascimento: initialData.data_nascimento || '',
        lote_id: initialData.lote_id || '',
        status: initialData.status || 'Ativo',
        peso_inicial: initialData.peso_inicial || '',
        pelagem: initialData.pelagem || '',
        origem: initialData.origem || 'Nascido',
        mae_brinco: initialData.mae_brinco || '',
        pai_brinco: initialData.pai_brinco || '',
        valor_compra: initialData.valor_compra || '',
        categoria: initialData.categoria || 'Boi',
        finalidade: initialData.finalidade || 'Corte'
      });
    } else {
      setFormData({
        brinco: '',
        raca: 'Nelore',
        sexo: 'M',
        data_nascimento: '',
        lote_id: '',
        status: 'Ativo',
        peso_inicial: '',
        pelagem: '',
        origem: 'Nascido',
        mae_brinco: '',
        pai_brinco: '',
        valor_compra: '',
        categoria: 'Boi',
        finalidade: 'Corte'
      });
    }
  }, [initialData, isOpen]);

  const fetchLotes = async () => {
    setLoadingLotes(true);
    try {
      const { data, error } = await applyFarmFilter(supabase.from('lotes').select('id, nome')).order('nome');
      if (error) throw error;
      setLotes(data || []);
    } catch (err) {
      console.error('[AnimalForm] Erro ao buscar lotes:', err);
    } finally {
      setLoadingLotes(false);
    }
  };

  const fetchRacas = async () => {
    const { data } = await supabase
      .from('categorias_sistema')
      .select('id, nome')
      .eq('tenant_id', activeTenantId)
      .eq('modulo', 'racas')
      .eq('is_active', true)
      .order('nome');
    if (data) setRacas(data);
  };

  const fetchCategorias = async () => {
    const { data } = await supabase
      .from('categorias_sistema')
      .select('id, nome')
      .eq('tenant_id', activeTenantId)
      .eq('modulo', 'pecuaria')
      .eq('is_active', true)
      .order('nome');
    if (data) setCategorias(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Animal" : "Cadastrar Novo Animal"}
      subtitle="Insira as informações básicas para rastreabilidade."
      icon={Beef}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Salvar Animal"}
    >
      <div className="tauze-field-group">
        <label className="tauze-label"><Hash size={14} /> Número do Brinco</label>
        <input 
          className="tauze-input"
          type="text" 
          placeholder="Ex: 1234-A" 
          value={formData.brinco}
          onChange={(e) => setFormData({...formData, brinco: e.target.value})}
          required 
        />
      </div>

      <div className="tauze-field-group">
        <label className="tauze-label"><Tag size={14} /> Raça</label>
        <select 
          className="tauze-input tauze-select"
          value={formData.raca}
          onChange={(e) => setFormData({...formData, raca: e.target.value})}
        >
          <option value="">Selecionar Raça...</option>
          {racas.map(r => (
            <option key={r.id} value={r.nome}>{r.nome}</option>
          ))}
        </select>
      </div>

      <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
        <label className="tauze-label"><User size={14} /> Sexo</label>
        <div className="tauze-form-radio-group">
          <div 
            className={`tauze-form-radio-item ${formData.sexo === 'M' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, sexo: 'M'})}
          >
            <User size={16} />
            <span>Macho</span>
          </div>
          <div 
            className={`tauze-form-radio-item ${formData.sexo === 'F' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, sexo: 'F'})}
          >
            <User size={16} />
            <span>Fêmea</span>
          </div>
        </div>
      </div>

      <div className="tauze-field-group">
        <label className="tauze-label"><Calendar size={14} /> Data de Nascimento</label>
        <input 
          className="tauze-input"
          type="date" 
          value={formData.data_nascimento}
          onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})}
        />
      </div>

      <div className="tauze-field-group">
        <label className="tauze-label"><Layers size={14} /> Lote de Destino</label>
        <select 
          className="tauze-input tauze-select"
          value={formData.lote_id}
          onChange={(e) => setFormData({...formData, lote_id: e.target.value})}
          required
          disabled={loadingLotes}
        >
          <option value="">{loadingLotes ? 'Carregando lotes...' : 'Selecionar Lote...'}</option>
          {lotes.map(lote => (
            <option key={lote.id} value={lote.id}>{lote.nome}</option>
          ))}
        </select>
      </div>

      <div className="tauze-field-group">
        <label className="tauze-label"><Info size={14} /> Pelagem</label>
        <input 
          className="tauze-input"
          type="text" 
          placeholder="Ex: Branco, Manchado" 
          value={formData.pelagem}
          onChange={(e) => setFormData({...formData, pelagem: e.target.value})}
        />
      </div>

      <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
        <label className="tauze-label"><Users size={14} /> Origem do Animal</label>
        <div className="tauze-form-radio-group">
          <div 
            className={`tauze-form-radio-item ${formData.origem === 'Nascido' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, origem: 'Nascido'})}
          >
            <span>Nascido na Fazenda</span>
          </div>
          <div 
            className={`tauze-form-radio-item ${formData.origem === 'Comprado' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, origem: 'Comprado'})}
          >
            <span>Comprado (Entrada)</span>
          </div>
        </div>
      </div>

      <div className="tauze-field-group">
        <label className="tauze-label"><Users size={14} /> Brinco da Mãe</label>
        <input 
          className="tauze-input"
          type="text" 
          placeholder="Brinco da Matriz" 
          value={formData.mae_brinco}
          onChange={(e) => setFormData({...formData, mae_brinco: e.target.value})}
        />
      </div>

      <div className="tauze-field-group">
        <label className="tauze-label"><Users size={14} /> Brinco do Pai</label>
        <input 
          className="tauze-input"
          type="text" 
          placeholder="Brinco do Reprodutor" 
          value={formData.pai_brinco}
          onChange={(e) => setFormData({...formData, pai_brinco: e.target.value})}
        />
      </div>

      <div className="tauze-field-group">
        <label className="tauze-label"><DollarSign size={14} /> Valor de Compra (R$)</label>
        <input 
          className="tauze-input"
          type="number" 
          step="0.01"
          placeholder="0.00" 
          value={formData.valor_compra}
          onChange={(e) => setFormData({...formData, valor_compra: e.target.value})}
          disabled={formData.origem === 'Nascido'}
        />
      </div>

      <div className="tauze-field-group">
        <label className="tauze-label"><Info size={14} /> Peso de Entrada (kg)</label>
        <input 
          className="tauze-input"
          type="number" 
          placeholder="0.0" 
          value={formData.peso_inicial}
          onChange={(e) => setFormData({...formData, peso_inicial: e.target.value})}
        />
      </div>

      <div className="tauze-field-group">
        <label className="tauze-label"><Beef size={14} /> Categoria</label>
        <select 
          className="tauze-input tauze-select"
          value={formData.categoria}
          onChange={(e) => setFormData({...formData, categoria: e.target.value})}
        >
          <option value="">Selecionar...</option>
          {categorias.map(c => (
            <option key={c.id} value={c.nome}>{c.nome}</option>
          ))}
        </select>
      </div>

      <div className="tauze-field-group">
        <label className="tauze-label"><TrendingUp size={14} /> Finalidade</label>
        <select 
          className="tauze-input tauze-select"
          value={formData.finalidade}
          onChange={(e) => setFormData({...formData, finalidade: e.target.value})}
        >
          <option>Corte</option>
          <option>Reprodução</option>
          <option>Descarte</option>
          <option>Exposição</option>
        </select>
      </div>
    </FormModal>
  );
};
