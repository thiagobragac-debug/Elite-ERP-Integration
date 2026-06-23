import React from 'react';
import { ShieldAlert, ArrowRight, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradeRequiredProps {
  moduleName?: string;
  isRoleRestriction?: boolean;
}

export const UpgradeRequired: React.FC<UpgradeRequiredProps> = ({ moduleName, isRoleRestriction }) => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '24px' }}>
      <div style={{ width: 80, height: 80, background: 'hsl(var(--text-muted) / 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, border: '1px solid hsl(var(--border))' }}>
        {isRoleRestriction ? (
          <Lock color="#ef4444" size={32} />
        ) : (
          <ShieldAlert color="#f59e0b" size={32} />
        )}
      </div>

      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'hsl(var(--text-main))', marginBottom: '12px' }}>
        {isRoleRestriction ? 'Acesso Restrito' : 'Módulo não contratado'}
      </h2>
      
      <p style={{ color: 'hsl(var(--text-muted))', maxWidth: '400px', marginBottom: '32px', lineHeight: 1.5 }}>
        {isRoleRestriction 
          ? `O seu perfil de acesso atual não tem permissão para visualizar a área de ${moduleName || 'sistema'}. Fale com o administrador da sua conta.`
          : `A funcionalidade que você tentou acessar (${moduleName || 'Módulo Avançado'}) não faz parte do seu plano atual. Faça um upgrade para liberar o acesso.`}
      </p>

      <div style={{ display: 'flex', gap: '16px' }}>
        <button
          onClick={() => navigate(-1)}
          className="secondary-btn"
          style={{ padding: '10px 24px', fontWeight: 500 }}
        >
          Voltar
        </button>
        
        {!isRoleRestriction && (
          <button
            onClick={() => navigate('/admin/assinatura')}
            style={{ padding: '10px 24px', borderRadius: '8px', background: '#f59e0b', color: 'black', fontWeight: 600, border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            Fazer Upgrade <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
