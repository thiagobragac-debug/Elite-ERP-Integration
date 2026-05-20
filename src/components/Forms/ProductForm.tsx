import React, { useState } from 'react';
import { 
  Package, 
  Tag,
  Hash,
  DollarSign,
  AlertTriangle,
  Layers,
  FileText
} from 'lucide-react';
import { FormModal } from './FormModal';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const ProductForm: React.FC<ProductFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    nome: '',
    categoria: 'Outros',
    unidade: 'un',
    estoque_minimo: '0',
    estoque_atual: '0',
    custo_medio: '0',
    descricao: '',
    ean: '',
    ncm: '',
    marca: '',
    localizacao: ''
  });

  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.nome || '',
        categoria: initialData.categoria || 'Outros',
        unidade: initialData.unidade || 'un',
        estoque_minimo: initialData.estoque_minimo?.toString() || '0',
        estoque_atual: initialData.estoque_atual?.toString() || '0',
        custo_medio: initialData.custo_medio?.toString() || '0',
        descricao: initialData.descricao || '',
        ean: initialData.ean || '',
        ncm: initialData.ncm || '',
        marca: initialData.marca || '',
        localizacao: initialData.localizacao || ''
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
      title={initialData ? "Editar Produto" : "Novo Insumo / Produto"}
      subtitle="Cadastre um item no seu estoque."
      icon={Package}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Salvar Item"}
    >
      <div className="elite-field-group">
        <label className="elite-label"><Package size={14} /> Nome do Item</label>
        <input 
          className="elite-input"
          type="text" 
          placeholder="Ex: Milho, NPK 04-14-08, Ivermectina..." 
          value={formData.nome}
          onChange={(e) => setFormData({...formData, nome: e.target.value})}
          required 
        />
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><Tag size={14} /> Categoria</label>
        <select 
          className="elite-input elite-select"
          value={formData.categoria}
          onChange={(e) => setFormData({...formData, categoria: e.target.value})}
          required
        >
          <option value="Semente">Semente</option>
          <option value="Adubo">Adubo</option>
          <option value="Medicamento">Medicamento</option>
          <option value="Suplemento">Suplemento / Sal</option>
          <option value="Combustível">Combustível</option>
          <option value="Outros">Outros</option>
        </select>
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><Tag size={14} /> Marca / Fabricante</label>
        <input 
          className="elite-input"
          type="text" 
          placeholder="Ex: Bunge, Syngenta..." 
          value={formData.marca}
          onChange={(e) => setFormData({...formData, marca: e.target.value})}
        />
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><Layers size={14} /> Localização (Almoxarifado)</label>
        <input 
          className="elite-input"
          type="text" 
          placeholder="Prateleira A, Galpão 01..." 
          value={formData.localizacao}
          onChange={(e) => setFormData({...formData, localizacao: e.target.value})}
        />
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><Hash size={14} /> Código de Barras (EAN)</label>
        <input 
          className="elite-input"
          type="text" 
          placeholder="789..." 
          value={formData.ean}
          onChange={(e) => setFormData({...formData, ean: e.target.value})}
        />
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><Hash size={14} /> NCM</label>
        <input 
          className="elite-input"
          type="text" 
          placeholder="Código Fiscal" 
          value={formData.ncm}
          onChange={(e) => setFormData({...formData, ncm: e.target.value})}
        />
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><Hash size={14} /> Est. Atual</label>
        <input 
          className="elite-input"
          type="number" 
          step="0.01"
          placeholder="0.00" 
          value={formData.estoque_atual}
          onChange={(e) => setFormData({...formData, estoque_atual: e.target.value})}
          required
        />
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><AlertTriangle size={14} /> Est. Mínimo</label>
        <input 
          className="elite-input"
          type="number" 
          step="0.01"
          placeholder="0.00" 
          value={formData.estoque_minimo}
          onChange={(e) => setFormData({...formData, estoque_minimo: e.target.value})}
          required
        />
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><Layers size={14} /> Unidade</label>
        <select 
          className="elite-input elite-select"
          value={formData.unidade}
          onChange={(e) => setFormData({...formData, unidade: e.target.value})}
          required
        >
          <option value="un">un</option>
          <option value="kg">kg</option>
          <option value="ton">ton</option>
          <option value="L">L</option>
          <option value="dose">dose</option>
          <option value="saco">saco</option>
        </select>
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><DollarSign size={14} /> Custo (R$)</label>
        <input 
          className="elite-input"
          type="number" 
          step="0.01"
          placeholder="0.00" 
          value={formData.custo_medio}
          onChange={(e) => setFormData({...formData, custo_medio: e.target.value})}
          required
        />
      </div>

      <div className="elite-field-group full-width">
        <label className="elite-label"><FileText size={14} /> Descrição / Notas</label>
        <textarea 
          className="elite-input"
          style={{ height: 'auto', minHeight: '80px', padding: '12px 16px', borderRadius: '14px' }}
          placeholder="Informações adicionais sobre o produto..." 
          value={formData.descricao}
          onChange={(e) => setFormData({...formData, descricao: e.target.value})}
          rows={2}
        />
      </div>
    </FormModal>
  );
};
