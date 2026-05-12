import React from 'react';
import { createPortal } from 'react-dom';
import { X, Filter, Globe, CreditCard, Activity, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SaaSFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    status: string;
    plan: string;
    minUsers: number;
    maxUsers: number;
    dateStart: string;
    dateEnd: string;
  };
  setFilters: (filters: any) => void;
  activeTab: string;
}

export const SaaSFilterModal: React.FC<SaaSFilterModalProps> = ({ 
  isOpen, 
  onClose, 
  filters, 
  setFilters,
  activeTab
}) => {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
          >
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <Filter size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Filtros Inteligentes</h2>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">SaaS Infrastructure v5.0</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
              {activeTab === 'tenants' && (
                <>
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      <Activity size={14} className="text-indigo-500" /> Status da Instância
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {['all', 'Ativo', 'Bloqueado', 'Suspenso'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setFilters({ ...filters, status: s })}
                          className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${
                            filters.status === s 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' 
                              : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          {s === 'all' ? 'Todos Status' : s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      <CreditCard size={14} className="text-amber-500" /> Plano Assinado
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {['all', 'Starter', 'Pro', 'Enterprise'].map((p) => (
                        <button
                          key={p}
                          onClick={() => setFilters({ ...filters, plan: p })}
                          className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${
                            filters.plan === p 
                              ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-100' 
                              : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'
                          }`}
                        >
                          {p === 'all' ? 'Todos Planos' : p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      <Globe size={14} className="text-emerald-500" /> Volume de Usuários
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-500">Mínimo</span>
                        <input 
                          type="number" 
                          value={filters.minUsers}
                          onChange={(e) => setFilters({ ...filters, minUsers: Number(e.target.value) })}
                          className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 outline-none font-bold text-slate-700 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-500">Máximo</span>
                        <input 
                          type="number" 
                          value={filters.maxUsers}
                          onChange={(e) => setFilters({ ...filters, maxUsers: Number(e.target.value) })}
                          className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 outline-none font-bold text-slate-700 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <Calendar size={14} className="text-indigo-500" /> Janela de Provisionamento
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="date" 
                    value={filters.dateStart}
                    onChange={(e) => setFilters({ ...filters, dateStart: e.target.value })}
                    className="px-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 outline-none font-bold text-slate-700 transition-all"
                  />
                  <input 
                    type="date" 
                    value={filters.dateEnd}
                    onChange={(e) => setFilters({ ...filters, dateEnd: e.target.value })}
                    className="px-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 outline-none font-bold text-slate-700 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => {
                  setFilters({
                    status: 'all',
                    plan: 'all',
                    minUsers: 0,
                    maxUsers: 1000,
                    dateStart: '',
                    dateEnd: ''
                  });
                }}
                className="flex-1 px-6 py-4 rounded-2xl text-xs font-black text-slate-500 hover:bg-slate-200 transition-all tracking-widest"
              >
                LIMPAR TUDO
              </button>
              <button 
                onClick={onClose}
                className="flex-[2] px-6 py-4 rounded-2xl text-xs font-black bg-indigo-600 text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all tracking-widest"
              >
                APLICAR INTELIGÊNCIA
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
