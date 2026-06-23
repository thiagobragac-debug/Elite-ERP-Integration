import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SidePanel } from '../Layout/SidePanel';

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
  type,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  if (!isOpen) {
    return null;
  }

  const isSuccess = (status: string) => status === 'PAGO' || status === 'RECEBIDO';

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  const getDayData = (day: number) => {
    const dateStr = new Date(year, month, day).toDateString();
    return data.filter((item) => new Date(item.data_vencimento).toDateString() === dateStr);
  };

  // Month stats
  const currentMonthData = data.filter((item) => {
    const d = new Date(item.data_vencimento);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const totalMes = currentMonthData.reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
  const totalPago = currentMonthData
    .filter((item) => isSuccess(item.status))
    .reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
  const totalPendente = totalMes - totalPago;

  // For heatmap
  let maxDailyValue = 0;
  for (let d = 1; d <= totalDays; d++) {
    const dailyTotal = getDayData(d).reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
    if (dailyTotal > maxDailyValue) {
      maxDailyValue = dailyTotal;
    }
  }

  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day empty" />);
  }

  for (let d = 1; d <= totalDays; d++) {
    const dayData = getDayData(d);
    const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();
    const isSelected = selectedDate === d;
    const dailyTotal = dayData.reduce((sum, item) => sum + (Number(item.valor) || 0), 0);

    // Heatmap calculation
    let bgColor = 'hsl(var(--bg-card))';
    if (dailyTotal > 0 && maxDailyValue > 0) {
      const intensity = dailyTotal / maxDailyValue;
      if (type === 'payable') {
        bgColor = `rgba(239, 68, 68, ${0.05 + intensity * 0.25})`; // Red heatmap
      } else {
        bgColor = `rgba(16, 185, 129, ${0.05 + intensity * 0.25})`; // Green heatmap
      }
    }

    days.push(
      <div
        key={d}
        className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayData.length > 0 ? 'clickable' : ''}`}
        style={{ backgroundColor: isSelected ? 'hsl(var(--bg-main))' : bgColor }}
        onClick={() => dayData.length > 0 && setSelectedDate(isSelected ? null : d)}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '4px',
          }}
        >
          <span className="day-number">{d}</span>
          {dailyTotal > 0 && (
            <span
              className={`daily-total-badge ${type === 'payable' ? 'deficit' : 'surplus'}`}
              title={type === 'payable' ? 'Saída (Deficitário)' : 'Entrada (Superavitário)'}
            >
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              }).format(dailyTotal)}
            </span>
          )}
        </div>
        <div className="day-events">
          {dayData.slice(0, 2).map((item, idx) => (
            <div
              key={idx}
              className={`event-tag ${isSuccess(item.status) ? 'success' : new Date(item.data_vencimento) < new Date() ? 'danger' : 'warning'}`}
            >
              {item.descricao}
            </div>
          ))}
          {dayData.length > 2 && <div className="more-count">+{dayData.length - 2} itens</div>}
        </div>
      </div>
    );
  }

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => e.preventDefault()}
      title={type === 'payable' ? 'Calendário de Pagamentos' : 'Projeção de Recebimentos'}
      subtitle={
        type === 'payable'
          ? 'Acompanhamento mensal de obrigações e vencimentos'
          : 'Previsão mensal de faturas e entradas de capital'
      }
      icon={CalendarIcon}
      size="xlarge"
      hideSubmit={true}
      cancelLabel="FECHAR VISUALIZAÇÃO"
    >
      <div className="calendar-portal-body" style={{ padding: 0 }}>
        <div className="calendar-nav-row" style={{ padding: '24px 24px 0 24px' }}>
          <div className="nav-controls">
            <button
              type="button"
              className="nav-arrow"
              onClick={() => {
                prevMonth();
                setSelectedDate(null);
              }}
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="nav-title">
              {monthNames[month]} {year}
            </h2>
            <button
              type="button"
              className="nav-arrow"
              onClick={() => {
                nextMonth();
                setSelectedDate(null);
              }}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="month-dashboard">
            <div className="dashboard-card">
              <span className="label">Total {type === 'payable' ? 'a Pagar' : 'a Receber'}</span>
              <span className="value">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  totalMes
                )}
              </span>
            </div>
            <div className="dashboard-card success">
              <span className="label">Já {type === 'payable' ? 'Pago' : 'Recebido'}</span>
              <span className="value">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  totalPago
                )}
              </span>
            </div>
            <div className="dashboard-card pending">
              <span className="label">Saldo Pendente</span>
              <span className="value">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  totalPendente
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="calendar-layout" style={{ padding: '24px' }}>
          <div className="tauze-calendar-grid" style={{ flex: 1 }}>
            <div className="grid-header">DOM</div>
            <div className="grid-header">SEG</div>
            <div className="grid-header">TER</div>
            <div className="grid-header">QUA</div>
            <div className="grid-header">QUI</div>
            <div className="grid-header">SEX</div>
            <div className="grid-header">SÁB</div>
            {days}
          </div>

          <AnimatePresence>
            {selectedDate && (
              <motion.div
                className="calendar-side-panel"
                initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                animate={{ width: 340, opacity: 1, marginLeft: 24 }}
                exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="side-panel-header">
                  <h3>
                    {selectedDate} de {monthNames[month]}
                  </h3>
                  <button className="close-btn" onClick={() => setSelectedDate(null)}>
                    <X size={18} />
                  </button>
                </div>
                <div className="side-panel-content">
                  {getDayData(selectedDate).map((item, idx) => (
                    <div key={idx} className="transaction-detail-card">
                      <div className="card-header">
                        <span
                          className={`status-badge ${isSuccess(item.status) ? 'success' : new Date(item.data_vencimento) < new Date() ? 'danger' : 'warning'}`}
                        >
                          {item.status}
                        </span>
                        <span className="value">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(item.valor)}
                        </span>
                      </div>
                      <div className="card-body">
                        <h4>{item.descricao}</h4>
                        {item.categoria && <p className="category">{item.categoria}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        .calendar-portal-body {
          background: hsl(var(--bg-card));
          overflow-y: auto;
          max-height: calc(90vh - 140px);
        }

        .calendar-layout {
          display: flex;
          align-items: flex-start;
          transition: all 0.3s ease;
        }

        .calendar-nav-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
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

        .tauze-calendar-grid {
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
          min-height: 110px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: all 0.2s;
        }

        .calendar-day.clickable {
          cursor: pointer;
        }

        .calendar-day.clickable:hover {
          filter: brightness(0.95);
        }

        .calendar-day.selected {
          border: 2px solid hsl(var(--brand));
          z-index: 10;
        }

        .calendar-day.empty { background: hsl(var(--bg-main) / 0.3) !important; }
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

        .daily-total-badge {
          font-size: 9px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .daily-total-badge.surplus {
          background: #dcfce7;
          color: #15803d;
        }
        .daily-total-badge.deficit {
          background: #fee2e2;
          color: #b91c1c;
        }

        .more-count {
          font-size: 9px;
          font-weight: 900;
          color: hsl(var(--text-muted));
          text-align: center;
          margin-top: 2px;
        }

        .month-dashboard {
          display: flex;
          gap: 16px;
        }

        .dashboard-card {
          background: hsl(var(--bg-main));
          border: 1px solid hsl(var(--border));
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          min-width: 140px;
        }

        .dashboard-card .label {
          font-size: 10px;
          font-weight: 800;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
        }

        .dashboard-card .value {
          font-size: 16px;
          font-weight: 800;
          color: hsl(var(--text-main));
          margin-top: 4px;
        }

        .dashboard-card.success .value { color: #10b981; }
        .dashboard-card.pending .value { color: #f59e0b; }

        .calendar-side-panel {
          background: hsl(var(--bg-main));
          border: 1px solid hsl(var(--border));
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 500px;
        }

        .side-panel-header {
          padding: 16px;
          border-bottom: 1px solid hsl(var(--border));
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: hsl(var(--bg-card));
        }

        .side-panel-header h3 {
          font-size: 14px;
          font-weight: 800;
          color: hsl(var(--text-main));
        }

        .close-btn {
          background: none;
          border: none;
          color: hsl(var(--text-muted));
          cursor: pointer;
          display: flex;
        }
        .close-btn:hover { color: #ef4444; }

        .side-panel-content {
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .transaction-detail-card {
          background: hsl(var(--bg-card));
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
          padding: 12px;
        }

        .transaction-detail-card .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .status-badge {
          font-size: 9px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .status-badge.success { background: #dcfce7; color: #15803d; }
        .status-badge.warning { background: #fef3c7; color: #92400e; }
        .status-badge.danger { background: #fee2e2; color: #b91c1c; }

        .transaction-detail-card .value {
          font-weight: 800;
          font-size: 13px;
        }

        .transaction-detail-card .card-body h4 {
          font-size: 12px;
          color: hsl(var(--text-main));
          font-weight: 600;
          margin-bottom: 4px;
        }

        .transaction-detail-card .category {
          font-size: 11px;
          color: hsl(var(--text-muted));
        }
      `}</style>
    </SidePanel>
  );
};
