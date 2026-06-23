import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, ShieldCheck, Edit2, Zap, Eye, EyeOff, Save, RefreshCw, AlertTriangle, QrCode, ScanLine } from 'lucide-react';
import { ToggleSwitch } from '../../../../components/UI/ToggleSwitch';

interface GatewaySettingsPageProps {
  gatewaySettings: any;
  isLoadingSettings: boolean;
  handleSaveSettings: () => void;
  updateGatewayField: (gateway: string, field: string, value: any) => void;
}

export const GatewaySettingsPage: React.FC<GatewaySettingsPageProps> = ({
  gatewaySettings,
  isLoadingSettings,
  handleSaveSettings,
  updateGatewayField,
}) => {
  const [showStripeKey, setShowStripeKey] = useState(false);
  const [showAsaasKey, setShowAsaasKey] = useState(false);
  const [showPagarmeKey, setShowPagarmeKey] = useState(false);

  // Verifica se pelo menos um gateway está ativo
  const hasActiveGateway = gatewaySettings?.stripe?.is_active || gatewaySettings?.asaas?.is_active || gatewaySettings?.pagarme?.is_active;

  return (
    <motion.div
      key="gateway-settings"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="saas-view-wrapper management-content"
      style={{ width: '100%', maxWidth: 900 }}
    >
      {/* ── SMART ROUTING (Visually Distinct Header) ── */}
      <div style={{
        background: 'linear-gradient(135deg, hsl(var(--bg-card)) 0%, rgba(59,130,246,0.05) 100%)',
        border: '1px solid hsl(var(--border))',
        borderRadius: 16,
        padding: 24,
        marginBottom: 32,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* BG Accent */}
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'rgba(59,130,246,0.1)', filter: 'blur(40px)', borderRadius: '50%' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, position: 'relative' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={24} color="#3b82f6" />
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'hsl(var(--text-primary))', margin: 0 }}>Orquestrador de Pagamentos (Smart Routing)</h3>
            <p style={{ fontSize: 13, color: 'hsl(var(--text-muted))', margin: '4px 0 0' }}>Distribua o processamento de pagamentos entre os gateways ativos da sua conta.</p>
          </div>
        </div>

        {!hasActiveGateway ? (
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: 16, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle size={18} color="#f59e0b" />
            <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 500 }}>Você precisa ativar pelo menos um Gateway abaixo para configurar o roteamento.</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, position: 'relative' }}>
            {/* Rota: Cartão de Crédito */}
            <div style={{ background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <CreditCard size={16} color="hsl(var(--text-primary))" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--text-primary))' }}>Cartão de Crédito</span>
              </div>
              <select 
                value={gatewaySettings?.routing?.card || 'stripe'} 
                onChange={(e) => updateGatewayField('routing', 'card', e.target.value)} 
                className="tauze-input"
                style={{ fontSize: 13, padding: '8px 12px' }}
              >
                {gatewaySettings?.stripe?.is_active && <option value="stripe">Stripe</option>}
                {gatewaySettings?.pagarme?.is_active && <option value="pagarme">Pagar.me</option>}
                {gatewaySettings?.asaas?.is_active && <option value="asaas">Asaas</option>}
              </select>
            </div>
            
            {/* Rota: PIX */}
            <div style={{ background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <QrCode size={16} color="#32bcad" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--text-primary))' }}>PIX Instantâneo</span>
              </div>
              <select 
                value={gatewaySettings?.routing?.pix || 'asaas'} 
                onChange={(e) => updateGatewayField('routing', 'pix', e.target.value)} 
                className="tauze-input"
                style={{ fontSize: 13, padding: '8px 12px' }}
              >
                {gatewaySettings?.asaas?.is_active && <option value="asaas">Asaas</option>}
                {gatewaySettings?.pagarme?.is_active && <option value="pagarme">Pagar.me</option>}
                {gatewaySettings?.stripe?.is_active && <option value="stripe">Stripe</option>}
              </select>
            </div>

            {/* Rota: Boleto */}
            <div style={{ background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <ScanLine size={16} color="hsl(var(--text-primary))" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--text-primary))' }}>Boleto Bancário</span>
              </div>
              <select 
                value={gatewaySettings?.routing?.boleto || 'asaas'} 
                onChange={(e) => updateGatewayField('routing', 'boleto', e.target.value)} 
                className="tauze-input"
                style={{ fontSize: 13, padding: '8px 12px' }}
              >
                {gatewaySettings?.asaas?.is_active && <option value="asaas">Asaas</option>}
                {gatewaySettings?.pagarme?.is_active && <option value="pagarme">Pagar.me</option>}
              </select>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gap: 24 }}>
        
        {/* ── GATEWAY: STRIPE ── */}
        <div style={{ background: 'hsl(var(--bg-card))', border: `1px solid ${gatewaySettings?.stripe?.is_active ? '#635BFF' : 'hsl(var(--border))'}`, borderRadius: 16, overflow: 'hidden', transition: 'all 0.3s' }}>
          <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: gatewaySettings?.stripe?.is_active ? 'rgba(99,91,255,0.03)' : 'transparent' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#635BFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={24} color="#fff" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--text-primary))', margin: 0 }}>Stripe</h3>
                <p style={{ fontSize: 12, color: 'hsl(var(--text-muted))', margin: '4px 0 0' }}>Infraestrutura global de pagamentos.</p>
              </div>
            </div>
            <ToggleSwitch checked={gatewaySettings?.stripe?.is_active} onChange={(v: boolean) => updateGatewayField('stripe', 'is_active', v)} size="sm" labelOn="ATIVO" labelOff="INATIVO" showStatus />
          </div>
          <AnimatePresence>
            {gatewaySettings?.stripe?.is_active && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                <div style={{ padding: '0 24px 24px', borderTop: '1px solid hsl(var(--border))', marginTop: 16, paddingTop: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24 }}>
                    <div className="tauze-field-group">
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'hsl(var(--text-muted))', marginBottom: 8, letterSpacing: '0.05em' }}>AMBIENTE</label>
                      <select value={gatewaySettings?.stripe?.environment} onChange={(e) => updateGatewayField('stripe', 'environment', e.target.value)} className="tauze-input">
                        <option value="test">Sandbox (Testes)</option>
                        <option value="production">Produção</option>
                      </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="tauze-field-group">
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'hsl(var(--text-muted))', marginBottom: 8, letterSpacing: '0.05em' }}>CHAVE PÚBLICA</label>
                        <input type="text" value={gatewaySettings?.stripe?.api_key || ''} onChange={(e) => updateGatewayField('stripe', 'api_key', e.target.value)} placeholder="pk_live_..." className="tauze-input" style={{ fontFamily: 'monospace', fontSize: 12 }} />
                      </div>
                      <div className="tauze-field-group">
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'hsl(var(--text-muted))', marginBottom: 8, letterSpacing: '0.05em' }}>CHAVE SECRETA</label>
                        <div style={{ display: 'flex', background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))', borderRadius: 8, paddingRight: 8 }}>
                          <input type={showStripeKey ? 'text' : 'password'} value={gatewaySettings?.stripe?.secret_key || ''} onChange={(e) => updateGatewayField('stripe', 'secret_key', e.target.value)} placeholder="sk_live_..." style={{ flex: 1, background: 'transparent', border: 'none', padding: '10px 14px', color: 'hsl(var(--text-primary))', fontFamily: 'monospace', fontSize: 12, outline: 'none' }} />
                          <button type="button" onClick={() => setShowStripeKey(!showStripeKey)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))' }}>
                            {showStripeKey ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── GATEWAY: ASAAS ── */}
        <div style={{ background: 'hsl(var(--bg-card))', border: `1px solid ${gatewaySettings?.asaas?.is_active ? '#00b865' : 'hsl(var(--border))'}`, borderRadius: 16, overflow: 'hidden', transition: 'all 0.3s' }}>
          <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: gatewaySettings?.asaas?.is_active ? 'rgba(0,184,101,0.03)' : 'transparent' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#00b865', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Edit2 size={24} color="#fff" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--text-primary))', margin: 0 }}>Asaas</h3>
                <p style={{ fontSize: 12, color: 'hsl(var(--text-muted))', margin: '4px 0 0' }}>Ideal para gestão automatizada de PIX e Boletos bancários.</p>
              </div>
            </div>
            <ToggleSwitch checked={gatewaySettings?.asaas?.is_active} onChange={(v: boolean) => updateGatewayField('asaas', 'is_active', v)} size="sm" labelOn="ATIVO" labelOff="INATIVO" showStatus />
          </div>
          <AnimatePresence>
            {gatewaySettings?.asaas?.is_active && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                <div style={{ padding: '0 24px 24px', borderTop: '1px solid hsl(var(--border))', marginTop: 16, paddingTop: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24 }}>
                    <div className="tauze-field-group">
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'hsl(var(--text-muted))', marginBottom: 8, letterSpacing: '0.05em' }}>AMBIENTE</label>
                      <select value={gatewaySettings?.asaas?.environment} onChange={(e) => updateGatewayField('asaas', 'environment', e.target.value)} className="tauze-input">
                        <option value="test">Sandbox (Testes)</option>
                        <option value="production">Produção</option>
                      </select>
                    </div>
                    <div className="tauze-field-group">
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'hsl(var(--text-muted))', marginBottom: 8, letterSpacing: '0.05em' }}>TOKEN DE ACESSO DA API</label>
                      <div style={{ display: 'flex', background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))', borderRadius: 8, paddingRight: 8 }}>
                        <input type={showAsaasKey ? 'text' : 'password'} value={gatewaySettings?.asaas?.api_key || ''} onChange={(e) => updateGatewayField('asaas', 'api_key', e.target.value)} placeholder="$asaas_..." style={{ flex: 1, background: 'transparent', border: 'none', padding: '10px 14px', color: 'hsl(var(--text-primary))', fontFamily: 'monospace', fontSize: 12, outline: 'none' }} />
                        <button type="button" onClick={() => setShowAsaasKey(!showAsaasKey)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))' }}>
                          {showAsaasKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <div className="tauze-field-group">
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'hsl(var(--text-muted))', marginBottom: 8, letterSpacing: '0.05em' }}>API URL (ASAAS_API_URL)</label>
                      <input
                        type="text"
                        className="tauze-input"
                        value={gatewaySettings?.asaas?.api_url || ''}
                        onChange={(e) => updateGatewayField('asaas', 'api_url', e.target.value)}
                        placeholder="https://api.asaas.com (Produção) ou https://sandbox.asaas.com (Testes)"
                        style={{ fontFamily: 'monospace', fontSize: 12 }}
                      />
                      <span style={{ fontSize: 11, color: 'hsl(var(--text-muted))', marginTop: 4, display: 'block' }}>Configure também a variável <strong>ASAAS_API_URL</strong> nas Edge Functions do Supabase.</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── GATEWAY: PAGAR.ME ── */}
        <div style={{ background: 'hsl(var(--bg-card))', border: `1px solid ${gatewaySettings?.pagarme?.is_active ? '#8b5cf6' : 'hsl(var(--border))'}`, borderRadius: 16, overflow: 'hidden', transition: 'all 0.3s' }}>
          <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: gatewaySettings?.pagarme?.is_active ? 'rgba(139,92,246,0.03)' : 'transparent' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={24} color="#fff" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--text-primary))', margin: 0 }}>Pagar.me</h3>
                <p style={{ fontSize: 12, color: 'hsl(var(--text-muted))', margin: '4px 0 0' }}>Ecossistema avançado de pagamentos locais.</p>
              </div>
            </div>
            <ToggleSwitch checked={gatewaySettings?.pagarme?.is_active} onChange={(v: boolean) => updateGatewayField('pagarme', 'is_active', v)} size="sm" labelOn="ATIVO" labelOff="INATIVO" showStatus />
          </div>
          <AnimatePresence>
            {gatewaySettings?.pagarme?.is_active && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                <div style={{ padding: '0 24px 24px', borderTop: '1px solid hsl(var(--border))', marginTop: 16, paddingTop: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24 }}>
                    <div className="tauze-field-group">
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'hsl(var(--text-muted))', marginBottom: 8, letterSpacing: '0.05em' }}>AMBIENTE</label>
                      <select value={gatewaySettings?.pagarme?.environment} onChange={(e) => updateGatewayField('pagarme', 'environment', e.target.value)} className="tauze-input">
                        <option value="test">Sandbox (Testes)</option>
                        <option value="production">Produção</option>
                      </select>
                    </div>
                    <div className="tauze-field-group">
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'hsl(var(--text-muted))', marginBottom: 8, letterSpacing: '0.05em' }}>CHAVE DE CRIPTOGRAFIA</label>
                      <div style={{ display: 'flex', background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))', borderRadius: 8, paddingRight: 8 }}>
                        <input type={showPagarmeKey ? 'text' : 'password'} value={gatewaySettings?.pagarme?.encryption_key || ''} onChange={(e) => updateGatewayField('pagarme', 'encryption_key', e.target.value)} placeholder="ek_live_..." style={{ flex: 1, background: 'transparent', border: 'none', padding: '10px 14px', color: 'hsl(var(--text-primary))', fontFamily: 'monospace', fontSize: 12, outline: 'none' }} />
                        <button type="button" onClick={() => setShowPagarmeKey(!showPagarmeKey)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))' }}>
                          {showPagarmeKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* ── FOOTER ACTIONS ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 24, borderTop: '1px solid hsl(var(--border))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'hsl(var(--text-muted))' }}>
          <RefreshCw size={14} className={isLoadingSettings ? 'animate-spin' : ''} />
          {isLoadingSettings ? 'Sincronizando com HSM...' : `Última sincronização na base local.`}
        </div>
        <button
          className="primary-btn"
          onClick={handleSaveSettings}
          disabled={isLoadingSettings}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', fontSize: 14 }}
        >
          {isLoadingSettings
            ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Aplicando Cofre...</>
            : <><Save size={16} />Salvar Configurações de Gateway</>}
        </button>
      </div>
    </motion.div>
  );
};
