import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';

interface FinancialCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  type: 'payable' | 'receivable';
}

export const FinancialCalendarModal: React.FC<FinancialCalendarModalProps> = ({
  isOpen,
  onClose,
  data,
  type
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  if (!isOpen) return null;

  const isSuccess = (status: string) => status === 'PAGO' || status === 'RECEBIDO';

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  const getDayData = (day: number) => {
    const dateStr = new Date(year, month, day).toDateString();
    return data.filter(item => new Date(item.data_vencimento).toDateString() === dateStr);
  };

  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }

  for (let d = 1; d <= totalDays; d++) {
    const dayData = getDayData(d);
    const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();
    
    days.push(
      <div key={d} className={`calendar-day ${isToday ? 'today' : ''}`}>
        <span className="day-number">{d}</span>
        <div className="day-events">
          {dayData.slice(0, 2).map((item, idx) => (
            <div 
              key={idx} 
              className={`event-tag ${isSuccess(item.status) ? 'success' : (new Date(item.data_vencimento) < new Date() ? 'danger' : 'warning')}`}
            >
              {item.descricao}
            </div>
          ))}
          {dayData.length > 2 && <div className="more-count">+{dayData.length - 2} itens</div>}
        </div>
      </div>
    );
  }

  return createPortal(
    <div className="elite-modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="elite-modal-container xlarge"
        style={{ maxWidth: '1100px', width: '95%', padding: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="elite-modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="icon-wrapper" style={{ 
              background: 'rgba(255,255,255,0.1)', 
              width: '44px', 
              height: '44px', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: type === 'payable' ? '#ef4444' : '#10b981'
            }}>
              <CalendarIcon size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                {type === 'payable' ? 'Calendário de Pagamentos' : 'Projeção de Recebimentos'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                {type === 'payable' 
                  ? 'Acompanhamento mensal de obrigações e vencimentos' 
                  : 'Previsão mensal de faturas e entradas de capital'}
              </p>
            </div>
          </div>
          <button className="icon-btn-secondary" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="calendar-portal-body">
          <div className="calendar-nav-row">
            <div className="nav-controls">
              <button className="nav-arrow" onClick={prevMonth}><ChevronLeft size={20} /></button>
              <h2 className="nav-title">{monthNames[month]} {year}</h2>
              <button className="nav-arrow" onClick={nextMonth}><ChevronRight size={20} /></button>
            </div>
            <div className="calendar-legend-chips">
              <div className="chip"><div className="dot danger"></div> Atrasado</div>
              <div className="chip"><div className="dot warning"></div> Pendente</div>
              <div className="chip"><div className="dot success"></div> Pago</div>
            </div>
          </div>

          <div className="elite-calendar-grid">
            <div className="grid-header">DOM</div>
            <div className="grid-header">SEG</div>
            <div className="grid-header">TER</div>
            <div className="grid-header">QUA</div>
            <div className="grid-header">QUI</div>
            <div className="grid-header">SEX</div>
            <div className="grid-header">SÁB</div>
            {days}
          </div>
        </div>

        <div className="elite-modal-footer">
          <button type="button" className="glass-btn secondary" onClick={onClose} style={{ marginLeft: 'auto' }}>
            FECHAR VISUALIZAÇÃO
          </button>
        </div>
      </motion.div>

      <style>{`
        .calendar-portal-body {
          padding: 24px;
          background: hsl(var(--bg-card));
          overflow-y: auto;
          max-height: calc(90vh - 140px);
        }

        .calendar-nav-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .nav-controls {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .nav-title {
          font-size: 20px;
          font-weight: 800;
          color: hsl(var(--text-main));
          text-transform: uppercase;
          letter-spacing: -0.02em;
          min-width: 200px;
          text-align: center;
        }

        .nav-arrow {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: hsl(var(--bg-main));
          border: 1px solid hsl(var(--border));
          color: hsl(var(--text-muted));
          transition: all 0.2s;
        }

        .nav-arrow:hover {
          background: hsl(var(--brand) / 0.1);
          color: hsl(var(--brand));
          border-color: hsl(var(--brand) / 0.3);
        }

        .calendar-legend-chips {
          display: flex;
          gap: 16px;
        }

        .chip {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 800;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
        }

        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .dot.danger { background: #ef4444; box-shadow: 0 0 10px rgba(239, 68, 68, 0.4); }
        .dot.warning { background: #f59e0b; box-shadow: 0 0 10px rgba(245, 158, 11, 0.4); }
        .dot.success { background: #10b981; box-shadow: 0 0 10px rgba(16, 185, 129, 0.4); }

        .elite-calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background: hsl(var(--border));
          border: 1px solid hsl(var(--border));
          border-radius: 16px;
          overflow: hidden;
        }

        .grid-header {
          background: hsl(var(--bg-main));
          padding: 12px;
          text-align: center;
          font-size: 10px;
          font-weight: 900;
          color: hsl(var(--text-muted));
        }

        .calendar-day {
          background: white;
          min-height: 110px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .calendar-day.empty { background: hsl(var(--bg-main) / 0.3); }
        .calendar-day.today { background: hsl(var(--brand) / 0.03); }

        .day-number {
          font-size: 13px;
          font-weight: 800;
          color: hsl(var(--text-muted));
        }

        .today .day-number {
          color: hsl(var(--brand));
          position: relative;
        }

        .today .day-number::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 12px;
          height: 2px;
          background: hsl(var(--brand));
          border-radius: 2px;
        }

        .day-events {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .event-tag {
          font-size: 9px;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-transform: uppercase;
        }

        .event-tag.success { background: #dcfce7; color: #15803d; }
        .event-tag.warning { background: #fef3c7; color: #92400e; }
        .event-tag.danger { background: #fee2e2; color: #b91c1c; }

        .more-count {
          font-size: 9px;
          font-weight: 900;
          color: hsl(var(--text-muted));
          text-align: center;
          margin-top: 2px;
        }
      `}</style>
    </div>,
    document.body
  );
};
