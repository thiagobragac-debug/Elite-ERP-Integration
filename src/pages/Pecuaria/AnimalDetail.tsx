import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Beef, 
  Calendar, 
  Scale, 
  Activity, 
  Tag, 
  TrendingUp, 
  ShieldCheck, 
  History,
  Edit3,
  Trash2,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { EliteMainChart } from '../../components/Charts/EliteMainChart';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { formatNumber } from '../../utils/format';
import './AnimalDetail.css';

export const AnimalDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [animal, setAnimal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [weightHistory, setWeightHistory] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      fetchAnimalData();
    }
  }, [id]);

  const fetchAnimalData = async () => {
    setLoading(true);
    try {
      // Fetch animal info
      const { data: animalData } = await supabase
        .from('animais')
        .select('*, lotes(nome)')
        .eq('id', id)
        .single();
      
      if (animalData) {
        setAnimal(animalData);
        
        // Fetch weight history
        const { data: weights } = await supabase
          .from('pesagens')
          .select('*')
          .eq('animal_id', id)
          .order('data_pesagem', { ascending: true });
        
        if (weights) {
          const chartFormatted = weights.map((w: any) => ({
            label: new Date(w.data_pesagem).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            value: w.peso
          }));
          setWeightHistory(chartFormatted);
        }

        // Fetch other events (mocking for now, could be from other tables)
        setEvents([
          { date: animalData.created_at, type: 'ENTRADA', desc: 'Entrada na fazenda (Compra/Nascimento)' },
          ...(weights || []).map((w: any) => ({ 
            date: w.data_pesagem, 
            type: 'PESAGEM', 
            desc: `Pesagem realizada: ${w.peso}kg` 
          }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animal-detail-page">
        <div className="skeleton-grid">
          <KPISkeleton />
          <KPISkeleton />
          <KPISkeleton />
        </div>
      </div>
    );
  }

  if (!animal) {
    return <div>Animal não encontrado.</div>;
  }

  const currentWeight = animal.peso_atual || animal.peso_inicial || 0;
  
  // Cálculo Real de GMD
  const calculateRealGMD = () => {
    if (weightHistory.length < 2) return 0;
    const first = weightHistory[0];
    const last = weightHistory[weightHistory.length - 1];
    const weightDiff = last.value - first.value;
    
    // Parse dates to get day diff
    const d1 = new Date(animal.created_at);
    const d2 = new Date(); // Today
    const dayDiff = Math.max(1, Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
    
    return weightDiff / dayDiff;
  };

  const realGmd = calculateRealGMD();
  
  // Projeção de Abate (Meta: 20@ ou 600kg)
  const targetWeight = 600;
  const remainingWeight = Math.max(0, targetWeight - currentWeight);
  const daysToTarget = realGmd > 0 ? Math.ceil(remainingWeight / realGmd) : 0;
  const estimatedDate = daysToTarget > 0 ? new Date(Date.now() + daysToTarget * 24 * 60 * 60 * 1000) : null;

  // Regra de Negócio: Carência Sanitária (Simulando verificação em registros de manejo)
  const isUnderGracePeriod = events.some(e => e.type === 'MEDICAMENTO' && new Date(e.expiryDate) > new Date());

  return (
    <div className="animal-detail-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <button className="back-btn" onClick={() => navigate('/pecuaria/animal')}>
            <ArrowLeft size={20} />
            VOLTAR
          </button>
          <div className="title-row">
            <h1 className="page-title">#{animal.brinco}</h1>
            <div className="status-pill active">{animal.status}</div>
          </div>
          <p className="page-subtitle">{animal.raca} | {animal.sexo === 'M' ? 'Macho' : 'Fêmea'} | Lote: {animal.lotes?.nome || 'Sem Lote'}</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary"><Edit3 size={18} /> EDITAR</button>
          <button className="glass-btn secondary"><FileText size={18} /> RELATÓRIO</button>
          <button className="primary-btn"><Activity size={18} /> NOVO MANEJO</button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        <EliteStatCard 
          label="Peso Atual" 
          value={`${currentWeight} kg`} 
          icon={Scale} 
          color="#3b82f6" 
          progress={(currentWeight / 600) * 100}
          change={`${formatNumber(currentWeight - animal.peso_inicial)}kg total`}
          trend="up"
          periodLabel="Última Pesagem"
        />
        <EliteStatCard 
          label="GMD Médio Real" 
          value={`${realGmd.toFixed(3)} kg`} 
          icon={TrendingUp} 
          color={realGmd > 0.8 ? "#10b981" : "#f59e0b"} 
          progress={realGmd * 100}
          change={realGmd > 0.8 ? "Meta Atingida" : "Abaixo da Meta"}
          trend={realGmd > 0.7 ? "up" : "down"}
          periodLabel="Desde a Entrada"
        />
        <EliteStatCard 
          label="Previsão de Abate" 
          value={estimatedDate ? estimatedDate.toLocaleDateString() : 'Sem Dados'} 
          icon={Calendar} 
          color="#8b5cf6" 
          progress={daysToTarget > 0 ? Math.max(10, 100 - (daysToTarget / 3)) : 100}
          change={daysToTarget > 0 ? `${daysToTarget} dias restantes` : "Pronto para Abate"}
          trend="up"
          periodLabel="Meta: 600kg (20@)"
        />
        <EliteStatCard 
          label="Segurança Sanitária" 
          value={isUnderGracePeriod ? "BLOQUEADO" : "LIBERADO"} 
          icon={ShieldCheck} 
          color={isUnderGracePeriod ? "#ef4444" : "#166534"} 
          progress={isUnderGracePeriod ? 40 : 100}
          change={isUnderGracePeriod ? "Carência Ativa" : "Sem Restrições"}
          periodLabel="Manejo Sanitário"
        />
      </div>

      <div className="detail-grid">
        <section className="analytics-canvas">
          <div className="panel-header">
            <h3>Histórico de Peso (Curva de Crescimento)</h3>
            <div className="panel-actions">
              <button className="text-btn">Ciclo Completo</button>
            </div>
          </div>
          <div className="chart-container-elite" style={{ padding: '0 24px 24px' }}>
            {weightHistory.length > 0 ? (
              <EliteMainChart data={weightHistory} color="#3b82f6" height={350} />
            ) : (
              <div className="empty-chart-placeholder">
                <p>Nenhuma pesagem registrada para este animal.</p>
              </div>
            )}
          </div>
        </section>

        <section className="info-panel">
          <div className="panel-header">
            <h3>Dados Cadastrais</h3>
            <Tag size={18} />
          </div>
          <div className="info-list">
            <div className="info-item">
              <label>Data de Nascimento</label>
              <span>{new Date(animal.data_nascimento).toLocaleDateString()}</span>
            </div>
            <div className="info-item">
              <label>Raça</label>
              <span>{animal.raca}</span>
            </div>
            <div className="info-item">
              <label>Pelagem</label>
              <span>{animal.pelagem || 'Não informada'}</span>
            </div>
            <div className="info-item">
              <label>Origem</label>
              <span>{animal.origem || 'Própria'}</span>
            </div>
            <div className="info-item">
              <label>Pai (Brinco)</label>
              <span>{animal.pai_brinco || '-'}</span>
            </div>
            <div className="info-item">
              <label>Mãe (Brinco)</label>
              <span>{animal.mae_brinco || '-'}</span>
            </div>
          </div>
        </section>

        <section className="timeline-panel">
          <div className="panel-header">
            <h3>Linha do Tempo (Manejos & Eventos)</h3>
            <History size={18} />
          </div>
          <div className="timeline-list">
            {events.map((event, i) => (
              <div key={i} className="timeline-event">
                <div className="event-dot"></div>
                <div className="event-content">
                  <div className="event-header">
                    <span className="event-type">{event.type}</span>
                    <span className="event-date">{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  <p className="event-desc">{event.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
