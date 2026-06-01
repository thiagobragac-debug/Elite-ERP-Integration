import React, { useState } from 'react';
import { 
  Beef, 
  Hash, 
  Calendar, 
  Tag, 
  Info,
  User,
  Users,
  DollarSign,
  TrendingUp,
  Building2,
  MapPin
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { SearchableSelect } from './SearchableSelect';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';

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
    fazenda_id: '',
    pasto_id: '',
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
  const { activeTenantId } = useTenant();
  const [fazendas, setFazendas] = useState<any[]>([]);
  const [pastos, setPastos] = useState<any[]>([]);
  const [racas, setRacas] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFazendas, setLoadingFazendas] = useState(false);
  const [loadingPastos, setLoadingPastos] = useState(false);

  React.useEffect(() => {
    if (isOpen && activeTenantId) {
      fetchFazendas();
      fetchRacas();
      fetchCategorias();
    }
    if (initialData) {
      setFormData({
        brinco: initialData.brinco || '',
        raca: initialData.raca || 'Nelore',
        sexo: initialData.sexo || 'M',
        data_nascimento: initialData.data_nascimento || '',
        fazenda_id: initialData.fazenda_id || '',
        pasto_id: initialData.pasto_id || '',
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
        fazenda_id: '',
        pasto_id: '',
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
  }, [initialData, isOpen, activeTenantId]);

  React.useEffect(() => {
    if (formData.fazenda_id) {
      fetchPastos(formData.fazenda_id);
    } else {
      setPastos([]);
    }
  }, [formData.fazenda_id]);

  const fetchFazendas = async () => {
    if (!activeTenantId) return;
    setLoadingFazendas(true);
    try {
      const { data, error } = await supabase
        .from('fazendas')
        .select('id, nome')
        .eq('tenant_id', activeTenantId)
        .order('nome');
      if (error) throw error;
      setFazendas(data || []);
    } catch (err) {
      console.error('[AnimalForm] Erro ao buscar fazendas:', err);
    } finally {
      setLoadingFazendas(false);
    }
  };

  const fetchPastos = async (fazendaId: string) => {
    setLoadingPastos(true);
    try {
      const { data } = await supabase
        .from('pastos')
        .select('id, nome')
        .eq('fazenda_id', fazendaId)
        .order('nome');
      setPastos(data || []);
    } finally {
      setLoadingPastos(false);
    }
  };

  const fetchRacas = async () => {
    if (!activeTenantId) return;
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
    if (!activeTenantId) return;
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
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Animal" : "Cadastrar Novo Animal"}
      subtitle="Insira as informações básicas para rastreabilidade."
      icon={Beef}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Salvar Animal"}
      size="large"
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
        <SearchableSelect 
          value={formData.raca}
          onChange={(val: any) => setFormData({...formData, raca: val})}
          options={[
            { value: '', label: 'Selecionar Raça...' },
            ...racas.map(r => ({ value: r.nome, label: r.nome }))
          ]}
        />
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
        <label className="tauze-label"><Building2 size={14} /> Fazenda de Destino</label>
        <SearchableSelect 
          value={formData.fazenda_id}
          onChange={(val: any) => setFormData({...formData, fazenda_id: val, pasto_id: ''})}
          disabled={loadingFazendas}
          options={[
            { value: '', label: loadingFazendas ? 'Carregando fazendas...' : 'Selecionar Fazenda...' },
            ...fazendas.map(f => ({ value: String(f.id), label: f.nome }))
          ]}
        />
      </div>

      <div className="tauze-field-group">
        <label className="tauze-label"><MapPin size={14} /> Pasto (Opcional)</label>
        <SearchableSelect 
          value={formData.pasto_id}
          onChange={(val: any) => setFormData({...formData, pasto_id: val})}
          disabled={!formData.fazenda_id || loadingPastos}
          options={[
            { value: '', label: !formData.fazenda_id ? 'Selecione a fazenda primeiro' : loadingPastos ? 'Carregando pastos...' : 'Sem pasto definido' },
            ...pastos.map(p => ({ value: String(p.id), label: p.nome }))
          ]}
        />
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
        <SearchableSelect 
          value={formData.categoria}
          onChange={(val: any) => setFormData({...formData, categoria: val})}
          options={[
            { value: '', label: 'Selecionar Categoria...' },
            ...categorias.map(c => ({ value: c.nome, label: c.nome }))
          ]}
        />
      </div>

      <div className="tauze-field-group">
        <label className="tauze-label"><Beef size={14} /> Finalidade</label>
        <SearchableSelect 
          value={formData.finalidade}
          onChange={(val: any) => setFormData({...formData, finalidade: val})}
          options={[
            { value: '', label: 'Selecionar...' },
            { value: 'Corte', label: 'Corte' },
            { value: 'Leite', label: 'Leite' },
            { value: 'Reprodução', label: 'Reprodução' }
          ]}
        />
      </div>
    </SidePanel>
  );
};
