import React from 'react';
import { PieChart, Settings, ChevronRight } from 'lucide-react';

interface BICustomizerCardProps {
  onClick?: () => void;
}

export const BICustomizerCard: React.FC<BICustomizerCardProps> = ({ onClick }) => {
  return (
    <div className="bi-customizer-card animate-slide-up">
      <div className="bi-icon-wrapper">
        <PieChart size={24} className="bi-icon" />
      </div>
      
      <div className="bi-content">
        <h3 className="bi-title">Construtor de BI Customizado</h3>
        <p className="bi-subtitle">Combine diferentes métricas e crie visualizações exclusivas para sua operação.</p>
      </div>

      <button className="bi-action-btn" onClick={onClick}>
        <span>CONFIGURAR CANVAS BI</span>
        <Settings size={16} />
      </button>

      <style>{`
        .bi-customizer-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 32px;
          background: white;
          border: 1px solid hsl(var(--border));
          border-radius: 24px;
          margin: 24px 0;
          box-shadow: 0 4px 20px -4px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
        }

        .bi-customizer-card:hover {
          border-color: hsl(var(--brand));
          transform: translateY(-2px);
          box-shadow: 0 12px 30px -8px rgba(0,0,0,0.1);
        }

        .bi-icon-wrapper {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e6f4ef;
          border-radius: 16px;
          color: #27a376;
        }

        .bi-content {
          flex: 1;
        }

        .bi-title {
          font-size: 18px;
          font-weight: 800;
          color: hsl(var(--text-main));
          margin: 0 0 4px 0;
          letter-spacing: -0.02em;
        }

        .bi-subtitle {
          font-size: 14px;
          font-weight: 500;
          color: hsl(var(--text-muted));
          margin: 0;
        }

        .bi-action-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 24px;
          background: #27a376;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.2s;
        }

        .bi-action-btn:hover {
          background: #1f8b63;
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(39, 163, 118, 0.3);
        }

        @media (max-width: 768px) {
          .bi-customizer-card {
            flex-direction: column;
            text-align: center;
            gap: 16px;
            padding: 16px;
          }
          .bi-action-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};
