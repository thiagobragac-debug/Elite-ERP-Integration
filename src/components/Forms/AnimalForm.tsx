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
  MapPin,
  Calculator,
  Activity,
  Award,
  CircleDot
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
    brinco_eletronico: '',
    raca: '',
    sexo: 'M',
    data_nascimento: '',
    idade_meses: '',
    fazenda_id: '',
    lote_id: '',
    pasto_id: '',
    status: 'Ativo',
    peso_inicial: '',
    pelagem: '',
    origem: 'Nascido',
    mae_brinco: '',
    pai_brinco: '',
    valor_compra: '',
    categoria: '',
    finalidade: 'Corte'
  });
  const { activeTenantId } = useTenant();
  const [fazendas, setFazendas] = useState<any[]>([]);
  const [pastos, setPastos] = useState<any[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);
  const [racas, setRacas] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFazendas, setLoadingFazendas] = useState(false);
  const [loadingPastos, setLoadingPastos] = useState(false);
  const [loadingLotes, setLoadingLotes] = useState(false);

  React.useEffect(() => {
    if (isOpen && activeTenantId) {
      fetchFazendas();
      fetchRacas();
      fetchCategorias();
    }
    if (initialData) {
      setFormData({
        brinco: initialData.brinco || '',
        brinco_eletronico: initialData.brinco_eletronico || '',
        raca: initialData.raca || '',
        sexo: initialData.sexo || 'M',
        data_nascimento: initialData.data_nascimento || '',
        idade_meses: initialData.idade_meses || '',
        fazenda_id: initialData.fazenda_id || '',
        lote_id: initialData.lote_id || '',
        pasto_id: initialData.pasto_id || '',
        status: initialData.status || 'Ativo',
        peso_inicial: initialData.peso_inicial ? initialData.peso_inicial.toString().replace(/[^\d.-]/g, '') : '',
        pelagem: initialData.pelagem || '',
        origem: initialData.origem || 'Nascido',
        mae_brinco: initialData.mae_brinco || '',
        pai_brinco: initialData.pai_brinco || '',
        valor_compra: initialData.valor_compra ? initialData.valor_compra.toString().replace(/[^\d.-]/g, '') : '',
        categoria: initialData.categoria || '',
        finalidade: initialData.finalidade || 'Corte'
      });
    } else {
      setFormData({
        brinco: '',
        brinco_eletronico: '',
        raca: '',
        sexo: 'M',
        data_nascimento: '',
        idade_meses: '',
        fazenda_id: '',
        lote_id: '',
        pasto_id: '',
        status: 'Ativo',
        peso_inicial: '',
        pelagem: '',
        origem: 'Nascido',
        mae_brinco: '',
        pai_brinco: '',
        valor_compra: '',
        categoria: '',
        finalidade: 'Corte'
      });
    }
  }, [initialData, isOpen, activeTenantId]);

  React.useEffect(() => {
    if (formData.fazenda_id) {
      fetchPastos(formData.fazenda_id);
      fetchLotes(formData.fazenda_id);
    } else {
      setPastos([]);
      setLotes([]);
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

  const fetchLotes = async (fazendaId: string) => {
    setLoadingLotes(true);
    try {
      const { data } = await supabase
        .from('lotes')
        .select('id, nome')
        .eq('fazenda_id', fazendaId)
        .order('nome');
      setLotes(data || []);
    } catch {
      setLotes([]);
    } finally {
      setLoadingLotes(false);
    }
  };

  // UX: Sincronizar Data de Nascimento <-> Idade em Meses
  const handleIdadeChange = (meses: string) => {
    setFormData(prev => {
      if (!meses) return { ...prev, idade_meses: '', data_nascimento: '' };
      const m = parseInt(meses);
      if (isNaN(m)) return prev;
      const date = new Date();
      date.setMonth(date.getMonth() - m);
      return { ...prev, idade_meses: meses, data_nascimento: date.toISOString().split('T')[0] };
    });
  };

  const handleDataNascimentoChange = (dataStr: string) => {
    setFormData(prev => {
      if (!dataStr) return { ...prev, data_nascimento: '', idade_meses: '' };
      const birth = new Date(dataStr);
      const now = new Date();
      let months = (now.getFullYear() - birth.getFullYear()) * 12;
      months -= birth.getMonth();
      months += now.getMonth();
      if (months < 0) months = 0;
      return { ...prev, data_nascimento: dataStr, idade_meses: months.toString() };
    });
  };

  // Regra de Negócio: Sugestão de Categoria Automática
  React.useEffect(() => {
    if (!formData.data_nascimento && !formData.idade_meses) return;
    const months = parseInt(formData.idade_meses) || 0;
    
    let suggestedCat = formData.categoria;
    
    if (formData.sexo === 'M') {
      if (months <= 12) suggestedCat = 'Bezerro';
      else if (months <= 24) suggestedCat = 'Garrote';
      else if (months <= 36) suggestedCat = 'Boi Magro';
      else suggestedCat = 'Boi Gordo';
    } else {
      if (months <= 12) suggestedCat = 'Bezerra';
      else if (months <= 24) suggestedCat = 'Novilha';
      else suggestedCat = 'Vaca';
    }

    if (suggestedCat !== formData.categoria) {
      setFormData(prev => ({ ...prev, categoria: suggestedCat }));
    }
  }, [formData.idade_meses, formData.sexo]);

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

  const handleRacaChange = async (val: string) => {
    setFormData({ ...formData, raca: val });
    if (val && !racas.find(r => r.nome === val)) {
      try {
        await supabase.from('categorias_sistema').insert({
          tenant_id: activeTenantId,
          modulo: 'racas',
          nome: val,
          is_active: true
        });
        fetchRacas();
      } catch (e) {
        console.error('[AnimalForm] Erro ao criar raca', e);
      }
    }
  };

  const handleCategoriaChange = async (val: string) => {
    setFormData({ ...formData, categoria: val });
    if (val && !categorias.find(c => c.nome === val)) {
      try {
        await supabase.from('categorias_sistema').insert({
          tenant_id: activeTenantId,
          modulo: 'pecuaria',
          nome: val,
          is_active: true
        });
        fetchCategorias();
      } catch (e) {
        console.error('[AnimalForm] Erro ao criar categoria', e);
      }
    }
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

  // Regra Financeira: Cálculo do Custo por Arroba Estimado
  const custoArroba = React.useMemo(() => {
    const valor = parseFloat(formData.valor_compra);
    const peso = parseFloat(formData.peso_inicial);
    if (!isNaN(valor) && !isNaN(peso) && peso > 0) {
      const arrobas = peso / 30;
      return (valor / arrobas).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    return null;
  }, [formData.valor_compra, formData.peso_inicial]);

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
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Identificação Básica</h4>
        </div>
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label"><Hash size={14} /> Brinco Visual (Manejo)</label>
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
            <label className="tauze-label"><CircleDot size={14} /> Brinco Eletrônico (RFID)</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Ex: 076 0000 1234 5678" 
              value={formData.brinco_eletronico}
              onChange={(e) => setFormData({...formData, brinco_eletronico: e.target.value})}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Nascimento / Idade</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input 
                className="tauze-input"
                type="date" 
                title="Data de Nascimento"
                value={formData.data_nascimento}
                onChange={(e) => handleDataNascimentoChange(e.target.value)}
              />
              <input 
                className="tauze-input"
                type="number" 
                placeholder="Idade (meses)" 
                title="Idade em Meses"
                value={formData.idade_meses}
                onChange={(e) => handleIdadeChange(e.target.value)}
              />
            </div>
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Tag size={14} /> Raça</label>
            <SearchableSelect 
              value={formData.raca}
              onChange={handleRacaChange}
              options={[
                { value: '', label: 'Selecionar Raça...' },
                ...racas.map(r => ({ value: r.nome, label: r.nome }))
              ]}
              creatable={true}
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
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Localização do Animal</h4>
        </div>
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label"><Building2 size={14} /> Fazenda de Destino</label>
            <SearchableSelect 
              value={formData.fazenda_id}
              onChange={(val: any) => setFormData({...formData, fazenda_id: val, pasto_id: '', lote_id: ''})}
              disabled={loadingFazendas}
              options={[
                { value: '', label: loadingFazendas ? 'Carregando fazendas...' : 'Selecionar Fazenda...' },
                ...fazendas.map(f => ({ value: String(f.id), label: f.nome }))
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Award size={14} /> Lote de Destino (Opcional)</label>
            <SearchableSelect 
              value={formData.lote_id}
              onChange={(val: any) => setFormData({...formData, lote_id: val})}
              disabled={!formData.fazenda_id || loadingLotes}
              options={[
                { value: '', label: !formData.fazenda_id ? 'Selecione a fazenda' : loadingLotes ? 'Carregando lotes...' : 'Sem lote definido' },
                ...lotes.map(l => ({ value: String(l.id), label: l.nome }))
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
                { value: '', label: !formData.fazenda_id ? 'Selecione a fazenda' : loadingPastos ? 'Carregando pastos...' : 'Sem pasto definido' },
                ...pastos.map(p => ({ value: String(p.id), label: p.nome }))
              ]}
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 03</div>
          <h4 className="tauze-section-title">Origem e Genealogia</h4>
        </div>
        <div className="tauze-input-grid grid-col-2">
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

          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><DollarSign size={14} /> Valor de Compra (R$)</span>
              {custoArroba && formData.origem === 'Comprado' && (
                <span className="carencia-badge" style={{ padding: '2px 8px', fontSize: '10px', background: 'hsl(var(--brand)/0.1)', color: 'hsl(var(--brand))', borderRadius: '4px' }}>
                  Aprox. {custoArroba} / @
                </span>
              )}
            </label>
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
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 04</div>
          <h4 className="tauze-section-title">Classificação Zootécnica</h4>
        </div>
        <div className="tauze-input-grid grid-col-3">
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
            <label className="tauze-label"><Beef size={14} /> Categoria {formData.idade_meses ? <span style={{fontSize:'10px', color:'var(--brand)'}}>(Auto-Sugerido)</span> : ''}</label>
            <SearchableSelect 
              value={formData.categoria}
              onChange={handleCategoriaChange}
              options={[
                { value: '', label: 'Selecionar Categoria...' },
                ...categorias.map(c => ({ value: c.nome, label: c.nome }))
              ]}
              creatable={true}
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
        </div>
      </section>
    </SidePanel>
  );
};
