import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Building2, Calendar, Link, FileText, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ChargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    tenant_id: string;
    plan_name: string;
    amount: number;
    due_date: string;
    gateway: string;
    boleto_url?: string;
    notes?: string;
  }) => Promise<void>;
  tenantsList: any[];
}

export const ChargeModal: React.FC<ChargeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  tenantsList,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    tenant_id: '',
    plan_name: '',
    amount: '',
    due_date: '',
    gateway: 'manual',
    boleto_url: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      // Default due date = 30 days from now
      const due = new Date();
      due.setDate(due.getDate() + 30);
      setForm({
        tenant_id: '',
        plan_name: '',
        amount: '',
        due_date: due.toISOString().split('T')[0],
        gateway: 'manual',
        boleto_url: '',
        notes: '',
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.tenant_id) { toast.error('Selecione um parceiro.'); return; }
    if (!form.plan_name.trim()) { toast.error('Informe o nome do plano.'); return; }
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Informe um valor válido.'); return; }
    if (!form.due_date) { toast.error('Informe a data de vencimento.'); return; }

    setIsSaving(true);
    try {
      await onSave({
        tenant_id: form.tenant_id,
        plan_name: form.plan_name.trim(),
        amount: Number(form.amount),
        due_date: form.due_date,
        gateway: form.gateway,
        boleto_url: form.boleto_url || undefined,
        notes: form.notes || undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedTenantName = tenantsList.find(t => t.id === form.tenant_id)?.name || '';

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid hsl(var(--border))',
    background: 'hsl(var(--bg-main))',
    color: 'hsl(var(--text-main))',
    fontSize: '13px',
    fontWeight: '600',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: '800',
    color: 'hsl(var(--text-muted))',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'hsl(var(--bg-card))',
              borderRadius: '20px',
              border: '1px solid hsl(var(--border))',
              boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
              width: '100%',
              maxWidth: '520px',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '24px 28px 20px',
              borderBottom: '1px solid hsl(var(--border) / 0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'linear-gradient(135deg, hsl(var(--bg-card)), hsl(var(--bg-main)))',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px hsl(var(--success) / 0.3)',
                }}>
                  <DollarSign size={22} color="white" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: 'hsl(var(--text-main))' }}>
                    Nova Cobrança
                  </h2>
                  <p style={{ margin: 0, fontSize: '11px', color: 'hsl(var(--text-muted))', fontWeight: '600' }}>
                    Fatura manual para parceiro
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'hsl(var(--bg-main))',
                  border: '1px solid hsl(var(--border))',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'hsl(var(--text-muted))',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                {/* Parceiro */}
                <div>
                  <label style={labelStyle}>
                    <Building2 size={12} /> Parceiro *
                  </label>
                  <select
                    value={form.tenant_id}
                    onChange={(e) => setForm(f => ({ ...f, tenant_id: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="">Selecionar parceiro...</option>
                    {tenantsList
                      .filter(t => t.status?.toLowerCase() === 'ativo' || t.status?.toLowerCase() === 'trial')
                      .map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} — {t.plan || t.plano || 'Starter'}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Plano + Valor */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Plano / Descrição *</label>
                    <input
                      type="text"
                      placeholder="Ex: Plano Pro Mensal"
                      value={form.plan_name}
                      onChange={(e) => setForm(f => ({ ...f, plan_name: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>
                      <DollarSign size={12} /> Valor (R$) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      value={form.amount}
                      onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Vencimento + Gateway */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>
                      <Calendar size={12} /> Vencimento *
                    </label>
                    <input
                      type="date"
                      value={form.due_date}
                      onChange={(e) => setForm(f => ({ ...f, due_date: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Gateway</label>
                    <select
                      value={form.gateway}
                      onChange={(e) => setForm(f => ({ ...f, gateway: e.target.value }))}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="manual">Manual</option>
                      <option value="Asaas">Asaas</option>
                      <option value="Stripe">Stripe</option>
                      <option value="Pagarme">Pagar.me</option>
                    </select>
                  </div>
                </div>

                {/* Link do Boleto (Apenas Manual) */}
                {form.gateway === 'manual' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <label style={labelStyle}>
                      <Link size={12} /> Link de Pagamento / Boleto
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={form.boleto_url}
                      onChange={(e) => setForm(f => ({ ...f, boleto_url: e.target.value }))}
                      style={inputStyle}
                    />
                  </motion.div>
                )}

                {/* Observações */}
                <div>
                  <label style={labelStyle}>
                    <FileText size={12} /> Observações
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Notas internas sobre esta cobrança..."
                    value={form.notes}
                    onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: '60px', fontFamily: 'inherit' }}
                  />
                </div>

                {/* Preview */}
                {form.tenant_id && form.amount && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, hsl(var(--success) / 0.08), hsl(var(--success) / 0.03))',
                      border: '1px solid hsl(var(--success) / 0.2)',
                      display: 'flex', alignItems: 'center', gap: '10px',
                    }}
                  >
                    <CheckCircle size={16} color="hsl(var(--success))" />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'hsl(var(--success))' }}>
                      Fatura de R$ {Number(form.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para {selectedTenantName}
                    </span>
                  </motion.div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '12px',
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--bg-main))',
                      color: 'hsl(var(--text-muted))',
                      fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    style={{
                      flex: 2, padding: '12px', borderRadius: '12px',
                      background: isSaving
                        ? 'hsl(var(--success) / 0.5)'
                        : 'hsl(var(--success))',
                      border: 'none',
                      color: 'white',
                      fontSize: '13px', fontWeight: '800', cursor: isSaving ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      boxShadow: isSaving ? 'none' : '0 4px 14px hsl(var(--success) / 0.4)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {isSaving ? (
                      <><Loader2 size={16} className="animate-spin" /> Salvando...</>
                    ) : (
                      <><DollarSign size={16} /> Criar Fatura</>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
