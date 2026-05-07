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
import { FormModal } from './FormModal';

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
    categoria: 'Trator',
    horimetro_inicial: '0',
    quilometragem_inicial: '0',
    placa: '',
    ano: new Date().getFullYear().toString(),
    status: 'active',
    chassi: '',
    combustivel: 'Diesel',
    capacidade_tanque: '',
    valor_compra: '',
    data_proxima_revisao: '',
    observacoes: ''
  });

  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.nome || '',
        marca: initialData.marca || '',
        modelo: initialData.modelo || '',
        categoria: initialData.categoria || 'Trator',
        horimetro_inicial: initialData.horimetro_atual?.toString() || '0',
        quilometragem_inicial: initialData.quilometragem_atual?.toString() || '0',
        placa: initialData.placa || '',
        ano: initialData.ano?.toString() || new Date().getFullYear().toString(),
        status: initialData.status || 'active',
        chassi: initialData.chassi || '',
        combustivel: initialData.combustivel || 'Diesel',
        capacidade_tanque: initialData.capacidade_tanque?.toString() || '',
        valor_compra: initialData.valor_compra?.toString() || '',
        data_proxima_revisao: initialData.data_proxima_revisao || '',
        observacoes: initialData.observacoes || ''
      });
    } else {
      setFormData({
        nome: '',
        marca: '',
        modelo: '',
        categoria: 'Trator',
        horimetro_inicial: '0',
        quilometragem_inicial: '0',
        placa: '',
        ano: new Date().getFullYear().toString(),
        status: 'active',
        chassi: '',
        combustivel: 'Diesel',
        capacidade_tanque: '',
        valor_compra: '',
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
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Máquina" : "Nova Máquina / Veículo"}
      subtitle="Cadastre um novo ativo na sua frota."
      icon={Truck}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Salvar Ativo"}
    >
      <div className="form-group full-width">
        <label><Truck size={14} /> Nome do Ativo</label>
        <input 
          type="text" 
          placeholder="Ex: Trator 01, Hilux Branca..." 
          value={formData.nome}
          onChange={(e) => setFormData({...formData, nome: e.target.value})}
          required 
        />
      </div>

      <div className="form-group">
        <label><Tag size={14} /> Marca</label>
        <input 
          type="text" 
          placeholder="Ex: John Deere, Toyota..." 
          value={formData.marca}
          onChange={(e) => setFormData({...formData, marca: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><Layers size={14} /> Modelo</label>
        <input 
          type="text" 
          placeholder="Ex: 6125J, SRX..." 
          value={formData.modelo}
          onChange={(e) => setFormData({...formData, modelo: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><Settings size={14} /> Categoria</label>
        <select 
          value={formData.categoria}
          onChange={(e) => setFormData({...formData, categoria: e.target.value})}
          required
        >
          <option value="Trator">Trator</option>
          <option value="Implemento">Implemento</option>
          <option value="Caminhonete">Caminhonete / Carro</option>
          <option value="Caminhão">Caminhão</option>
          <option value="Outros">Outros</option>
        </select>
      </div>

      <div className="form-group">
        <label><Calendar size={14} /> Ano</label>
        <input 
          type="number" 
          placeholder="2024" 
          value={formData.ano}
          onChange={(e) => setFormData({...formData, ano: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><Activity size={14} /> Horímetro Inicial</label>
        <input 
          type="number" 
          placeholder="0" 
          value={formData.horimetro_inicial}
          onChange={(e) => setFormData({...formData, horimetro_inicial: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><Activity size={14} /> KM Inicial</label>
        <input 
          type="number" 
          placeholder="0" 
          value={formData.quilometragem_inicial}
          onChange={(e) => setFormData({...formData, quilometragem_inicial: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><Hash size={14} /> Placa / Registro</label>
        <input 
          type="text" 
          placeholder="ABC-1234" 
          value={formData.placa}
          onChange={(e) => setFormData({...formData, placa: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><Hash size={14} /> Chassi / Série</label>
        <input 
          type="text" 
          placeholder="Número de identificação..." 
          value={formData.chassi}
          onChange={(e) => setFormData({...formData, chassi: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><Settings size={14} /> Combustível</label>
        <select 
          value={formData.combustivel}
          onChange={(e) => setFormData({...formData, combustivel: e.target.value})}
        >
          <option>Diesel</option>
          <option>Diesel S10</option>
          <option>Gasolina</option>
          <option>Etanol</option>
          <option>Arla 32</option>
        </select>
      </div>

      <div className="form-group">
        <label><Activity size={14} /> Capacidade Tanque (L)</label>
        <input 
          type="number" 
          placeholder="0" 
          value={formData.capacidade_tanque}
          onChange={(e) => setFormData({...formData, capacidade_tanque: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><DollarSign size={14} /> Valor de Compra (R$)</label>
        <input 
          type="number" 
          step="0.01"
          placeholder="0.00" 
          value={formData.valor_compra}
          onChange={(e) => setFormData({...formData, valor_compra: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><Calendar size={14} /> Próxima Revisão</label>
        <input 
          type="date" 
          value={formData.data_proxima_revisao}
          onChange={(e) => setFormData({...formData, data_proxima_revisao: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><Activity size={14} /> Status da Máquina</label>
        <select 
          value={formData.status}
          onChange={(e) => setFormData({...formData, status: e.target.value})}
        >
          <option value="active">Operacional</option>
          <option value="maintenance">Em Manutenção</option>
          <option value="stopped">Parado (Crítico)</option>
        </select>
      </div>

      <div className="form-group full-width">
        <label><Tag size={14} /> Observações Gerais</label>
        <textarea 
          placeholder="Histórico de avarias, notas sobre garantia ou especificações extras..." 
          value={formData.observacoes}
          onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
          style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-input)' }}
        />
      </div>
    </FormModal>
  );
};
