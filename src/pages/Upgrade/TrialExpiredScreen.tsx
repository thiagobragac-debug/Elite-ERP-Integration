import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Zap, Shield, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTenantCore } from '../../contexts/TenantContext';

export const TrialExpiredScreen: React.FC = () => {
  const navigate = useNavigate();
  const { tenant } = useTenantCore();

  const handleUpgrade = () => {
    // Redireciona para o módulo interno de faturamento/assinaturas
    navigate('/configuracoes/assinatura');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden font-sans">
      
      {/* Background Decorativo Glassmorphism */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-0 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
      >
        
        {/* Painel Esquerdo - Ação e Marketing */}
        <div className="p-10 flex flex-col justify-center border-r border-slate-800">
          <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mb-6 border border-red-500/30">
            <Lock size={28} />
          </div>
          
          <h1 className="text-3xl font-bold text-slate-100 mb-3 tracking-tight">
            O tempo voa quando o rebanho cresce!
          </h1>
          <p className="text-slate-400 mb-8 text-lg leading-relaxed">
            Seu passe VIP (Porteira Aberta) chegou ao fim. Para continuar gerenciando a fazenda <strong>{tenant?.nome}</strong> sem interrupções, assine agora o plano Confinamento.
          </p>

          <button
            onClick={handleUpgrade}
            className="group relative flex items-center justify-center gap-3 w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-lg py-4 px-6 rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
          >
            <Zap size={20} className="text-slate-900 fill-slate-900" />
            Fazer Upgrade Agora
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <div className="mt-6 text-sm text-slate-500 text-center">
            Pagamento seguro processado direto pelo Elite ERP. Cancelamento fácil a qualquer momento.
          </div>
        </div>

        {/* Painel Direito - Benefícios do Upgrade */}
        <div className="p-10 bg-slate-950/40 flex flex-col justify-center relative">
          <h2 className="text-xl font-semibold text-slate-200 mb-6 flex items-center gap-2">
            O que você ganha com o Plano Confinamento:
          </h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="mt-1 flex-shrink-0 text-emerald-400">
                <CheckCircle size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200">Módulo Financeiro e DRE</h3>
                <p className="text-sm text-slate-400 mt-1">Visão total sobre custos por arroba, DRE agrícola e previsibilidade de caixa.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1 flex-shrink-0 text-emerald-400">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200">Gestão Multiempresa</h3>
                <p className="text-sm text-slate-400 mt-1">Controle múltiplas fazendas ou unidades em um único painel centralizado.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1 flex-shrink-0 text-emerald-400">
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200">Inteligência de Mercado (Cepea)</h3>
                <p className="text-sm text-slate-400 mt-1">Acompanhe as cotações ao vivo do bezerro e boi gordo para fechar os melhores negócios.</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
