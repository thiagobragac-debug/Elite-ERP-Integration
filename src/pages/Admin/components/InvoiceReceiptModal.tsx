import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Receipt, CheckCircle, Clock, AlertCircle, Download, FileText } from 'lucide-react';

interface InvoiceReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('pt-BR');
};

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  if (!isOpen || !invoice) return null;

  const isPaid = invoice.status === 'PAID';
  const isOverdue = invoice.status === 'OVERDUE';
  const isPending = invoice.status === 'PENDING';

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        <motion.div
          className="relative w-full max-w-lg bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/60 bg-[#0f172a]/95 z-10 sticky top-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Receipt className="text-indigo-400" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Recibo Detalhado</h3>
                <p className="text-sm text-slate-400">Fatura #{invoice.id.split('-')[0]}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar">
            {/* Status Banner */}
            <div className={`p-4 rounded-lg flex items-center gap-3 mb-6 ${
              isPaid ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
              isOverdue ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
              'bg-amber-500/10 border border-amber-500/20 text-amber-400'
            }`}>
              {isPaid && <CheckCircle size={24} />}
              {isOverdue && <AlertCircle size={24} />}
              {isPending && <Clock size={24} />}
              
              <div>
                <p className="font-semibold text-base">
                  {isPaid ? 'Fatura Paga' : isOverdue ? 'Fatura Atrasada' : 'Fatura Pendente'}
                </p>
                <p className="text-sm opacity-80">
                  {isPaid ? `O pagamento foi confirmado em ${formatDate(invoice.updated_at || invoice.due_date)}` : 
                   `O vencimento desta fatura é ${formatDate(invoice.due_date)}`}
                </p>
              </div>
            </div>

            {/* Invoice Breakdown */}
            <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 mb-6">
              <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Discriminação</h4>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                  <div>
                    <p className="text-white font-medium">{invoice.plan_name || 'Plano Base'}</p>
                    <p className="text-sm text-slate-400">Assinatura Mensal (Inclui Adicionais consolidados)</p>
                  </div>
                  <span className="text-slate-300 font-medium">{formatCurrency(invoice.amount)}</span>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-bold text-white">Total Geral</span>
                  <span className="text-xl font-bold text-indigo-400">{formatCurrency(invoice.amount)}</span>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800/50">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Método de Pagamento</p>
                <p className="text-sm text-slate-300 font-medium">{invoice.gateway || 'Automático'}</p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800/50">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">ID da Transação</p>
                <p className="text-sm text-slate-300 font-medium font-mono text-ellipsis overflow-hidden">{invoice.id}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-[#0f172a] flex justify-end gap-3 rounded-b-xl">
            {invoice.payment_link && !isPaid && (
              <a
                href={invoice.payment_link}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-lg bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors flex items-center gap-2"
              >
                Pagar Agora <FileText size={16} />
              </a>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
