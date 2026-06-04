import React, { useState } from 'react';
import { 
  X, 
  PieChart, 
  BarChart3, 
  LineChart, 
  Layout, 
  CheckCircle2, 
  Plus,
  Layers,
  Activity,
  DollarSign,
  TrendingUp,
  Settings,
  GripHorizontal
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';

interface BIConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BIConfigurationModal: React.FC<BIConfigurationModalProps> = ({ isOpen, onClose }) => {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['Evolução de GMD', 'Fluxo de Caixa']);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const metrics = [
    { id: '1', name: 'Evolução de GMD', category: 'Pecuária', icon: Activity },
    { id: '2', name: 'Taxa de Lotação', category: 'Pastagens', icon: Layers },
    { id: '3', name: 'Fluxo de Caixa', category: 'Financeiro', icon: DollarSign },
    { id: '4', name: 'Giro de Estoque', category: 'Insumos', icon: Layout },
    { id: '5', name: 'EBITDA Projetado', category: 'Estratégico', icon: TrendingUp },
    { id: '6', name: 'Performance de Vendas', category: 'Comercial', icon: PieChart },
  ];

  const groupedMetrics = metrics.reduce((acc, metric) => {
    if (!acc[metric.category]) acc[metric.category] = [];
    acc[metric.category].push(metric);
    return acc;
  }, {} as Record<string, typeof metrics>);

  const toggleMetric = (name: string) => {
    setSelectedMetrics(prev => 
      prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
    );
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Firefox requires setting data
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    
    const newMetrics = [...selectedMetrics];
    const draggedItem = newMetrics[draggedItemIndex];
    newMetrics.splice(draggedItemIndex, 1);
    newMetrics.splice(index, 0, draggedItem);
    
    setSelectedMetrics(newMetrics);
    setDraggedItemIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simula salvamento
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    onClose();
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSave}
      title="Configurador de Canvas BI"
      subtitle="Personalize seus dashboards com métricas customizadas"
      icon={Settings}
      submitLabel="Salvar Configuração de BI"
      loading={isSaving}
      size="large"
    >
      <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', minHeight: '500px' }}>
        <div style={{ paddingRight: '24px', borderRight: '1px solid hsl(var(--border))', overflowY: 'auto', maxHeight: '600px' }}>
          <h3 style={{ fontSize: '10px', fontWeight: 900, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Métricas Disponíveis</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.entries(groupedMetrics).map(([category, catMetrics]) => (
              <div key={category}>
                <h4 style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--brand))', marginBottom: '8px', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '4px' }}>{category}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {catMetrics.map(metric => (
                    <button 
                      key={metric.id} 
                      type="button"
                      disabled={isSaving}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '12px', border: `1.5px solid ${selectedMetrics.includes(metric.name) ? '#27a376' : 'hsl(var(--border))'}`,
                        background: selectedMetrics.includes(metric.name) ? 'rgba(39, 163, 118, 0.05)' : 'white',
                        cursor: isSaving ? 'not-allowed' : 'pointer', textAlign: 'left', transition: '0.2s', opacity: isSaving ? 0.6 : 1
                      }}
                      onClick={() => toggleMetric(metric.name)}
                    >
                      <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'hsl(var(--bg-main))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: selectedMetrics.includes(metric.name) ? '#27a376' : 'hsl(var(--text-muted))' }}>
                        <metric.icon size={16} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--text-main))' }}>{metric.name}</div>
                      </div>
                      {selectedMetrics.includes(metric.name) && <CheckCircle2 size={16} style={{ color: '#27a376' }} />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'hsl(var(--bg-main)/0.3)', borderRadius: '24px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 900 }}>Visualização do Canvas (Drag & Drop)</h3>
            <span style={{ fontSize: '9px', fontWeight: 900, background: 'hsl(var(--text-main))', color: 'white', padding: '4px 10px', borderRadius: '20px' }}>{selectedMetrics.length} MÉTRICAS ATIVAS</span>
          </div>

          {isSaving ? (
            // Skeleton Screen Loading
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ background: 'hsl(var(--bg-card))', padding: '16px', borderRadius: '16px', border: '1px solid hsl(var(--border))', opacity: 0.7, animation: 'pulse 1.5s infinite' }}>
                  <div style={{ height: '12px', background: 'hsl(var(--border))', borderRadius: '4px', width: '40%', marginBottom: '16px' }}></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ height: '8px', background: 'hsl(var(--bg-main))', borderRadius: '4px', width: '60%' }}></div>
                    <div style={{ height: '8px', background: 'hsl(var(--bg-main))', borderRadius: '4px', width: '85%' }}></div>
                    <div style={{ height: '8px', background: 'hsl(var(--bg-main))', borderRadius: '4px', width: '45%' }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : selectedMetrics.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {selectedMetrics.map((m, i) => (
                <div 
                  key={m} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDragEnd={handleDragEnd}
                  style={{ 
                    background: 'hsl(var(--bg-card))', 
                    padding: '16px', 
                    borderRadius: '16px', 
                    border: '1px solid hsl(var(--border))', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    cursor: 'grab',
                    opacity: draggedItemIndex === i ? 0.5 : 1,
                    transform: draggedItemIndex === i ? 'scale(0.98)' : 'scale(1)',
                    transition: 'transform 0.2s, opacity 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <GripHorizontal size={14} style={{ color: 'hsl(var(--text-muted))', cursor: 'grab' }} />
                      <span style={{ fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>{m}</span>
                    </div>
                    <BarChart3 size={12} style={{ color: 'hsl(var(--text-muted))' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ height: '8px', background: 'hsl(var(--bg-main))', borderRadius: '4px', width: '60%' }}></div>
                    <div style={{ height: '8px', background: 'hsl(var(--bg-main))', borderRadius: '4px', width: '85%' }}></div>
                    <div style={{ height: '8px', background: 'hsl(var(--bg-main))', borderRadius: '4px', width: '45%' }}></div>
                  </div>
                </div>
              ))}
              <div style={{ border: '2px dashed hsl(var(--border))', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', color: 'hsl(var(--text-muted))' }}>
                <Plus size={24} />
              </div>
            </div>
          ) : (
            <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--text-muted))', textAlign: 'center' }}>
              <Layout size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <p style={{ fontSize: '14px', fontWeight: 600 }}>Selecione métricas ao lado para começar<br/>a montar seu BI customizado.</p>
            </div>
          )}
        </div>
      </div>
    </SidePanel>
  );
};
