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

interface AnimalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
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

  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
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
      <div className="elite-field-group">
        <label className="elite-label"><Hash size={14} /> Número do Brinco</label>
        <input 
          className="elite-input"
          type="text" 
          placeholder="Ex: 1234-A" 
          value={formData.brinco}
          onChange={(e) => setFormData({...formData, brinco: e.target.value})}
          required 
        />
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><Tag size={14} /> Raça</label>
        <select 
          className="elite-input elite-select"
          value={formData.raca}
          onChange={(e) => setFormData({...formData, raca: e.target.value})}
        >
          <option>Nelore</option>
          <option>Angus</option>
          <option>Brahman</option>
          <option>Cruzamento Industrial</option>
        </select>
      </div>

      <div className="elite-field-group" style={{ gridColumn: 'span 2' }}>
        <label className="elite-label"><User size={14} /> Sexo</label>
        <div className="elite-form-radio-group">
          <div 
            className={`elite-form-radio-item ${formData.sexo === 'M' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, sexo: 'M'})}
          >
            <User size={16} />
            <span>Macho</span>
          </div>
          <div 
            className={`elite-form-radio-item ${formData.sexo === 'F' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, sexo: 'F'})}
          >
            <User size={16} />
            <span>Fêmea</span>
          </div>
        </div>
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><Calendar size={14} /> Data de Nascimento</label>
        <input 
          className="elite-input"
          type="date" 
          value={formData.data_nascimento}
          onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})}
        />
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><Layers size={14} /> Lote de Destino</label>
        <select 
          className="elite-input elite-select"
          value={formData.lote_id}
          onChange={(e) => setFormData({...formData, lote_id: e.target.value})}
          required
        >
          <option value="">Selecionar Lote...</option>
          <option value="1">LOTE-A1 (Engorda)</option>
          <option value="2">LOTE-B2 (Recria)</option>
        </select>
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><Info size={14} /> Pelagem</label>
        <input 
          className="elite-input"
          type="text" 
          placeholder="Ex: Branco, Manchado" 
          value={formData.pelagem}
          onChange={(e) => setFormData({...formData, pelagem: e.target.value})}
        />
      </div>

      <div className="elite-field-group" style={{ gridColumn: 'span 2' }}>
        <label className="elite-label"><Users size={14} /> Origem do Animal</label>
        <div className="elite-form-radio-group">
          <div 
            className={`elite-form-radio-item ${formData.origem === 'Nascido' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, origem: 'Nascido'})}
          >
            <span>Nascido na Fazenda</span>
          </div>
          <div 
            className={`elite-form-radio-item ${formData.origem === 'Comprado' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, origem: 'Comprado'})}
          >
            <span>Comprado (Entrada)</span>
          </div>
        </div>
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><Users size={14} /> Brinco da Mãe</label>
        <input 
          className="elite-input"
          type="text" 
          placeholder="Brinco da Matriz" 
          value={formData.mae_brinco}
          onChange={(e) => setFormData({...formData, mae_brinco: e.target.value})}
        />
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><Users size={14} /> Brinco do Pai</label>
        <input 
          className="elite-input"
          type="text" 
          placeholder="Brinco do Reprodutor" 
          value={formData.pai_brinco}
          onChange={(e) => setFormData({...formData, pai_brinco: e.target.value})}
        />
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><DollarSign size={14} /> Valor de Compra (R$)</label>
        <input 
          className="elite-input"
          type="number" 
          step="0.01"
          placeholder="0.00" 
          value={formData.valor_compra}
          onChange={(e) => setFormData({...formData, valor_compra: e.target.value})}
          disabled={formData.origem === 'Nascido'}
        />
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><Info size={14} /> Peso de Entrada (kg)</label>
        <input 
          className="elite-input"
          type="number" 
          placeholder="0.0" 
          value={formData.peso_inicial}
          onChange={(e) => setFormData({...formData, peso_inicial: e.target.value})}
        />
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><Beef size={14} /> Categoria</label>
        <select 
          className="elite-input elite-select"
          value={formData.categoria}
          onChange={(e) => setFormData({...formData, categoria: e.target.value})}
        >
          <option>Bezerro</option>
          <option>Garrote</option>
          <option>Boi</option>
          <option>Vaca</option>
          <option>Novilha</option>
          <option>Touro</option>
        </select>
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><TrendingUp size={14} /> Finalidade</label>
        <select 
          className="elite-input elite-select"
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
