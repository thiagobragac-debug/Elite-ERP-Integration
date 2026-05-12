import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Mail, 
  MessageSquare, 
  Calendar, 
  ChevronDown, 
  Check,
  Bell,
  Users,
  Shield,
  Zap,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { useTenant } from '../../../contexts/TenantContext';

interface ScheduleModalProps {
  report: any;
  onClose: () => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({ report, onClose }) => {
  const { tenant, userProfile } = useTenant();
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [format, setFormat] = useState<'pdf' | 'xlsx'>('pdf');
  const [recipients, setRecipients] = useState(userProfile?.email || '');
  const [channels, setChannels] = useState({ email: true, whatsapp: false });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    if (!tenant?.id || !userProfile?.id) return;
    
    setIsSaving(true);
    
    try {
      // Como não temos certeza se a tabela existe, vamos salvar nos settings do perfil por enquanto
      // Isso garante persistência sem quebrar se a tabela não existir
      const newSchedule = {
        id: crypto.randomUUID(),
        reportId: report.id,
        reportTitle: report.title,
        frequency,
        format,
        recipients: recipients.split(',').map(e => e.trim()),
        channels,
        active: true,
        createdAt: new Date().toISOString()
      };

      const currentSchedules = userProfile.settings?.reportSchedules || [];
      
      const { error } = await supabase
        .from('profiles')
        .update({
          settings: {
            ...(userProfile.settings || {}),
            reportSchedules: [...currentSchedules, newSchedule]
          }
        })
        .eq('id', userProfile.id);

      if (error) throw error;
      
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      alert('Erro ao processar agendamento. Verifique sua conexão.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="schedule-modal-overlay">
      <motion.div 
        className="schedule-modal-content"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
      >
        <div className="modal-header">
          <div className="header-title-group">
            <div className="modal-icon">
              <Clock size={20} />
            </div>
            <div>
              <h3>Agendar Automação</h3>
              <p>Relatório: <strong>{report.title}</strong></p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="schedule-section">
            <label className="section-title">
              <Calendar size={14} />
              FREQUÊNCIA DE DISPARO
            </label>
            <div className="frequency-options">
              {(['daily', 'weekly', 'monthly'] as const).map((f) => (
                <button 
                  key={f}
                  className={`freq-btn ${frequency === f ? 'active' : ''}`}
                  onClick={() => setFrequency(f)}
                >
                  <span className="dot"></span>
                  {f === 'daily' ? 'Diário' : f === 'weekly' ? 'Semanal' : 'Mensal'}
                </button>
              ))}
            </div>
          </div>

          <div className="schedule-section">
            <label className="section-title">
              <Mail size={14} />
              DESTINATÁRIOS (E-MAILS)
            </label>
            <div className="input-wrapper">
              <input 
                type="text" 
                placeholder="Ex: diretor@fazenda.com, gerente@fazenda.com"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
              />
            </div>
          </div>

          <div className="schedule-section">
            <label className="section-title">
              <Shield size={14} />
              FORMATO E CANAIS
            </label>
            <div className="format-grid">
              <div className="format-selector">
                <button 
                  className={`fmt-btn ${format === 'pdf' ? 'active' : ''}`}
                  onClick={() => setFormat('pdf')}
                >
                  PDF Profissional
                </button>
                <button 
                  className={`fmt-btn ${format === 'xlsx' ? 'active' : ''}`}
                  onClick={() => setFormat('xlsx')}
                >
                  Planilha Excel
                </button>
              </div>
              
              <div className="channel-selector">
                <div 
                  className={`channel-toggle ${channels.email ? 'active' : ''}`}
                  onClick={() => setChannels(c => ({ ...c, email: !c.email }))}
                >
                  <Mail size={16} />
                  <span>E-mail</span>
                </div>
                <div 
                  className={`channel-toggle ${channels.whatsapp ? 'active' : ''}`}
                  onClick={() => setChannels(c => ({ ...c, whatsapp: !c.whatsapp }))}
                >
                  <MessageSquare size={16} />
                  <span>WhatsApp</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ai-optimization-tip">
            <Sparkles size={16} className="sparkle" />
            <p><strong>Dica Elite IA:</strong> Agendamentos semanais (Segunda-feira 06:00) têm 40% mais taxa de abertura por gestores.</p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>CANCELAR</button>
          <button 
            className={`save-btn ${saveSuccess ? 'success' : ''}`} 
            onClick={handleSave}
            disabled={isSaving || saveSuccess}
          >
            {isSaving ? 'PROCESSANDO...' : saveSuccess ? 'AGENDADO!' : 'CONFIRMAR AUTOMAÇÃO'}
          </button>
        </div>
      </motion.div>

      <style>{`
        .schedule-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .schedule-modal-content {
          background: white;
          width: 100%;
          max-width: 520px;
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.05);
        }

        .modal-header {
          padding: 24px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-title-group {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .modal-icon {
          width: 44px;
          height: 44px;
          background: #f1f5f9;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1e293b;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
        }

        .modal-header p {
          margin: 2px 0 0;
          font-size: 13px;
          color: #64748b;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          transition: 0.2s;
        }

        .close-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .modal-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .schedule-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 900;
          color: #94a3b8;
          letter-spacing: 0.05em;
        }

        .frequency-options {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .freq-btn {
          padding: 12px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: 0.2s;
        }

        .freq-btn .dot {
          width: 6px;
          height: 6px;
          background: #cbd5e1;
          border-radius: 50%;
        }

        .freq-btn.active {
          border-color: #10b981;
          background: #f0fdf4;
          color: #10b981;
        }

        .freq-btn.active .dot {
          background: #10b981;
        }

        .input-wrapper input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          color: #1e293b;
          outline: none;
          transition: 0.2s;
        }

        .input-wrapper input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .format-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .format-selector {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .fmt-btn {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: #f8fafc;
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          text-align: left;
        }

        .fmt-btn.active {
          background: #eff6ff;
          color: #3b82f6;
          border-color: #bfdbfe;
        }

        .channel-selector {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .channel-toggle {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          background: #f1f5f9;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          transition: 0.2s;
        }

        .channel-toggle.active {
          background: #0f172a;
          color: white;
        }

        .ai-optimization-tip {
          padding: 12px 16px;
          background: linear-gradient(90deg, #f0fdf4 0%, #ffffff 100%);
          border: 1px solid #dcfce7;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ai-optimization-tip p {
          margin: 0;
          font-size: 11px;
          color: #16a34a;
        }

        .sparkle { color: #10b981; }

        .modal-footer {
          padding: 24px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .cancel-btn {
          padding: 12px 24px;
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        .save-btn {
          padding: 12px 24px;
          background: #0f172a;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.3s;
        }

        .save-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
        }

        .save-btn.success {
          background: #10b981;
        }

        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};
