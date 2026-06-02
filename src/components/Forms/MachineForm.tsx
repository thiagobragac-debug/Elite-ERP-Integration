import React, { useState } from 'react';
import { 
  Truck, 
  Calendar,
  Layers,
  Settings,
  Hash,
  Activity,
  Tag,
  DollarSign
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { SearchableSelect } from './SearchableSelect';

interface MachineFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const MachineForm: React.FC<MachineFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    nome: '',
    marca: '',
    modelo: '',
    categoria: '',
    horimetro_inicial: '0',
    quilometragem_inicial: '0',
    placa: '',
    ano: new Date().getFullYear().toString(),
    status: 'active',
    chassi: '',
    combustivel: 'Diesel',
    capacidade_tanque: '',
    valor_compra: '',
    potencia: '',
    peso_operacional: '',
    intervalo_revisao: '250',
    consumo_estimado: '',
    data_proxima_revisao: '',
    observacoes: ''
  });

  const { activeTenantId } = useTenant();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  React.useEffect(() => {
    if (isOpen && activeTenantId) {
      fetchCategories();
    }
  }, [isOpen, activeTenantId]);

  const fetchCategories = async () => {
    if (!activeTenantId) return;
    const { data } = await supabase
      .from('categorias_sistema')
      .select('id, nome')
      .eq('tenant_id', activeTenantId)
      .eq('modulo', 'frota')
      .eq('is_active', true)
      .order('nome');
    if (data) setCategories(data);
  };

  const handleCategoriaChange = async (val: string) => {
    setFormData({ ...formData, categoria: val });
    if (val && !categories.find(c => String(c.nome) === val)) {
      try {
        await supabase.from('categorias_sistema').insert({
          tenant_id: activeTenantId,
          modulo: 'frota',
          nome: val,
          is_active: true
        });
        fetchCategories();
      } catch (err) {
        console.error('[MachineForm] Erro ao criar categoria:', err);
      }
    }
  };

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.nome || '',
        marca: initialData.marca || '',
        modelo: initialData.modelo || '',
        categoria: initialData.categoria || '',
        horimetro_inicial: initialData.horimetro_atual?.toString() || '0',
        quilometragem_inicial: initialData.quilometragem_atual?.toString() || '0',
        placa: initialData.placa || '',
        ano: initialData.ano?.toString() || new Date().getFullYear().toString(),
        status: initialData.status || 'active',
        chassi: initialData.chassi || '',
        combustivel: initialData.combustivel || 'Diesel',
        capacidade_tanque: initialData.capacidade_tanque?.toString() || '',
        valor_compra: initialData.valor_compra?.toString() || '',
        potencia: initialData.potencia?.toString() || '',
        peso_operacional: initialData.peso_operacional?.toString() || '',
        intervalo_revisao: initialData.intervalo_revisao?.toString() || '250',
        consumo_estimado: initialData.consumo_estimado?.toString() || '',
        data_proxima_revisao: initialData.data_proxima_revisao || '',
        observacoes: initialData.observacoes || ''
      });
    } else {
      setFormData({
        nome: '',
        marca: '',
        modelo: '',
        categoria: '',
        horimetro_inicial: '0',
        quilometragem_inicial: '0',
        placa: '',
        ano: new Date().getFullYear().toString(),
        status: 'active',
        chassi: '',
        combustivel: 'Diesel',
        capacidade_tanque: '',
        valor_compra: '',
        potencia: '',
        peso_operacional: '',
        intervalo_revisao: '250',
        consumo_estimado: '',
        data_proxima_revisao: '',
        observacoes: ''
      });
    }
  }, [initialData, isOpen]);

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
    <SidePanel size="medium"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Máquina" : "Nova Máquina / Veículo"}
      subtitle="Cadastre um novo ativo na sua frota."
      icon={Truck}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Salvar Ativo"}
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Identificação Básica</h4>
        </div>
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label"><Truck size={14} /> Nome do Ativo</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Ex: Trator 01..." 
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              required 
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Tag size={14} /> Marca</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Ex: John Deere..." 
              value={formData.marca}
              onChange={(e) => setFormData({...formData, marca: e.target.value})}
              required
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Layers size={14} /> Modelo</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Ex: 6125J, SRX..." 
              value={formData.modelo}
              onChange={(e) => setFormData({...formData, modelo: e.target.value})}
              required
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Especificações Técnicas</h4>
        </div>
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label"><Settings size={14} /> Categoria</label>
            <SearchableSelect 
              value={formData.categoria}
              onChange={handleCategoriaChange}
              options={[
                { value: '', label: 'Selecionar...' },
                ...(categories || []).map(cat => ({ value: String(cat.nome), label: String(cat.nome) })),
              ]}
              creatable={true}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Ano</label>
            <input 
              className="tauze-input"
              type="number" 
              placeholder="2024" 
              value={formData.ano}
              onChange={(e) => setFormData({...formData, ano: e.target.value})}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Activity size={14} /> Potência (cv)</label>
            <input 
              className="tauze-input"
              type="number" 
              placeholder="Ex: 125" 
              value={formData.potencia}
              onChange={(e) => setFormData({...formData, potencia: e.target.value})}
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 03</div>
          <h4 className="tauze-section-title">Documentação e Combustível</h4>
        </div>
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label"><Hash size={14} /> Placa / Registro</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="ABC-1234" 
              value={formData.placa}
              onChange={(e) => setFormData({...formData, placa: e.target.value})}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Hash size={14} /> Chassi / Série</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Número de série..." 
              value={formData.chassi}
              onChange={(e) => setFormData({...formData, chassi: e.target.value})}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Settings size={14} /> Combustível</label>
            <SearchableSelect 
              value={formData.combustivel}
              onChange={(val: any) => setFormData({...formData, combustivel: val})}
              options={[
                { value: 'Diesel', label: 'Diesel' },
                { value: 'Diesel S10', label: 'Diesel S10' },
                { value: 'Gasolina', label: 'Gasolina' },
                { value: 'Etanol', label: 'Etanol' },
                { value: 'Arla 32', label: 'Arla 32' },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 04</div>
          <h4 className="tauze-section-title">Medições Iniciais e Capacidade</h4>
        </div>
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label"><Activity size={14} /> Cap. Tanque (L)</label>
            <input 
              className="tauze-input"
              type="number" 
              placeholder="0" 
              value={formData.capacidade_tanque}
              onChange={(e) => setFormData({...formData, capacidade_tanque: e.target.value})}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Activity size={14} /> Horímetro Inicial</label>
            <input 
              className="tauze-input"
              type="number" 
              placeholder="0" 
              value={formData.horimetro_inicial}
              onChange={(e) => setFormData({...formData, horimetro_inicial: e.target.value})}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Activity size={14} /> KM Inicial</label>
            <input 
              className="tauze-input"
              type="number" 
              placeholder="0" 
              value={formData.quilometragem_inicial}
              onChange={(e) => setFormData({...formData, quilometragem_inicial: e.target.value})}
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 05</div>
          <h4 className="tauze-section-title">Indicadores Operacionais</h4>
        </div>
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label"><DollarSign size={14} /> Valor Compra (R$)</label>
            <input 
              className="tauze-input"
              type="number" 
              step="0.01"
              placeholder="0.00" 
              value={formData.valor_compra}
              onChange={(e) => setFormData({...formData, valor_compra: e.target.value})}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Activity size={14} /> Peso Op. (kg)</label>
            <input 
              className="tauze-input"
              type="number" 
              placeholder="Ex: 5800" 
              value={formData.peso_operacional}
              onChange={(e) => setFormData({...formData, peso_operacional: e.target.value})}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Settings size={14} /> Int. Revisão (h/km)</label>
            <input 
              className="tauze-input"
              type="number" 
              placeholder="Ex: 250" 
              value={formData.intervalo_revisao}
              onChange={(e) => setFormData({...formData, intervalo_revisao: e.target.value})}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Activity size={14} /> Meta Cons. (L/h)</label>
            <input 
              className="tauze-input"
              type="number" 
              step="0.1"
              placeholder="Ex: 14.5" 
              value={formData.consumo_estimado}
              onChange={(e) => setFormData({...formData, consumo_estimado: e.target.value})}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Próxima Revisão</label>
            <input 
              className="tauze-input"
              type="date" 
              value={formData.data_proxima_revisao}
              onChange={(e) => setFormData({...formData, data_proxima_revisao: e.target.value})}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Activity size={14} /> Status da Máquina</label>
            <SearchableSelect 
              value={formData.status}
              onChange={(val: any) => setFormData({...formData, status: val})}
              options={[
                { value: 'active', label: 'Operacional' },
                { value: 'maintenance', label: 'Em Manutenção' },
                { value: 'stopped', label: 'Parado (Crítico)' },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 06</div>
          <h4 className="tauze-section-title">Informações Adicionais</h4>
        </div>
        <div className="tauze-input-grid grid-col-1">
          <div className="tauze-field-group">
            <label className="tauze-label"><Tag size={14} /> Observações Gerais</label>
            <textarea 
              className="tauze-input"
              placeholder="Histórico de avarias, notas sobre garantia ou especificações extras..." 
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              rows={3}
            />
          </div>
        </div>
      </section>
    </SidePanel>
  );
};
