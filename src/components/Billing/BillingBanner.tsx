import React from 'react';
import { AlertCircle, CreditCard, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface BillingBannerProps {
  status: 'warning' | 'lock';
  daysOverdue?: number;
}

export const BillingBanner: React.FC<BillingBannerProps> = ({ status, daysOverdue = 0 }) => {
  if (status === 'lock') {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-width-[500px] bg-white rounded-[32px] p-10 text-center shadow-2xl border border-slate-200"
        >
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <Lock size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4">ACESSO SUSPENSO</h2>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed">
            Detectamos uma pendência financeira em sua assinatura. <br />
            Para garantir a integridade dos seus dados e a continuidade operacional, o acesso foi temporariamente suspenso.
          </p>
          <div className="flex flex-col gap-4">
            <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-200">
              <CreditCard size={20} />
              REGULARIZAR AGORA
            </button>
            <button className="w-full text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors">
              FALAR COM FINANCEIRO
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-amber-500 text-white px-6 py-3 flex items-center justify-between gap-4 shadow-lg">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
          <AlertCircle size={18} />
        </div>
        <div>
          <span className="font-black text-xs uppercase tracking-wider block leading-tight">Pagamento Pendente</span>
          <p className="text-sm font-bold opacity-90">Sua assinatura venceu há {daysOverdue} dias. Evite a suspensão do sistema.</p>
        </div>
      </div>
      <button className="bg-white text-amber-600 px-6 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-amber-50 transition-colors">
        PAGAR AGORA
        <ArrowRight size={14} />
      </button>
    </div>
  );
};
