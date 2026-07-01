import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Map, User, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { isValidCPF, isValidCNPJ, formatCpfCnpj } from '../../utils/validators';
import { fetchCNPJ } from '../../utils/brasilApi';
import toast from 'react-hot-toast';

export const OnboardingWizard = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchingCnpj, setFetchingCnpj] = useState(false);

  // Form State
  const [documento, setDocumento] = useState('');
  const [telefone, setTelefone] = useState('');
  
  // Tenant State
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  
  // Farm State
  const [farmName, setFarmName] = useState('');
  const [hectares, setHectares] = useState('');

  const handleDocumentBlur = async () => {
    const cleanDoc = documento.replace(/\D/g, '');
    if (cleanDoc.length === 14 && isValidCNPJ(cleanDoc)) {
      setFetchingCnpj(true);
      try {
        const data = await fetchCNPJ(cleanDoc);
        setRazaoSocial(data.razao_social || '');
        setNomeFantasia(data.nome_fantasia || '');
        toast.success('Dados do CNPJ preenchidos automaticamente.');
      } catch (err) {
        toast.error('Não foi possível buscar os dados do CNPJ.');
      } finally {
        setFetchingCnpj(false);
      }
    }
  };

  const handleNextStep1 = () => {
    const cleanDoc = documento.replace(/\D/g, '');
    if (cleanDoc.length === 11) {
      if (!isValidCPF(cleanDoc)) {
        toast.error('CPF inválido.');
        return;
      }
    } else if (cleanDoc.length === 14) {
      if (!isValidCNPJ(cleanDoc)) {
        toast.error('CNPJ inválido.');
        return;
      }
    } else {
      toast.error('Digite um CPF ou CNPJ válido.');
      return;
    }
    
    if (telefone.length < 10) {
      toast.error('Telefone inválido.');
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!razaoSocial.trim()) {
      toast.error('Razão Social / Nome é obrigatório.');
      return;
    }
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!farmName.trim()) {
      toast.error('Nome da Fazenda é obrigatório.');
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_initial_tenant_and_farm', {
        p_user_id: user?.id,
        p_cpf_cnpj: documento.replace(/\D/g, ''),
        p_razao_social: razaoSocial,
        p_nome_fantasia: nomeFantasia || razaoSocial,
        p_telefone: telefone,
        p_farm_name: farmName,
        p_tamanho_hectares: Number(hectares) || 0
      });

      if (error) throw error;
      
      toast.success('Conta configurada com sucesso!');
      
      // Forçar refresh para atualizar contextos e redirecionar
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
      
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Falha ao concluir configuração.');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        background: '#080d14',
        padding: '20px',
        overflow: 'hidden',
        position: 'fixed',
        inset: 0,
      }}
    >
      <style>{`
        @keyframes float-a { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes float-b { 0%,100%{transform:translateY(-6px)} 50%{transform:translateY(4px)} }
        
        .onboarding-input {
          width: 100%;
          padding: 14px 16px 14px 44px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 13px;
          font-size: 14px;
          color: #fff;
          outline: none;
          transition: all 0.25s;
          font-family: inherit;
        }
        .onboarding-input-no-icon {
          padding-left: 16px;
        }
        .onboarding-input::placeholder { color: rgba(255,255,255,0.22); }
        .onboarding-input:focus {
          background: rgba(255,255,255,0.07);
          border-color: rgba(0,184,101,0.45);
          box-shadow: 0 0 0 4px rgba(0,184,101,0.1);
        }
        
        .submit-btn {
          width: 100%;
          padding: 15px;
          border-radius: 13px;
          border: none;
          background: #00b865;
          color: #fff;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .submit-btn:hover:not(:disabled) {
          background: #009e57;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,184,101,0.3);
        }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .back-btn {
          width: 100%;
          padding: 15px;
          border-radius: 13px;
          border: 1px solid rgba(255,255,255,0.2);
          background: transparent;
          color: rgba(255,255,255,0.8);
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
        }
        .back-btn:hover {
          background: rgba(255,255,255,0.05);
          color: #fff;
        }
      `}</style>
      
      {/* Background Decorators */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(0,184,101,0.08) 0%, transparent 60%)', filter: 'blur(60px)', animation: 'float-a 8s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 60%)', filter: 'blur(80px)', animation: 'float-b 10s ease-in-out infinite' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          background: 'rgba(255,255,255,0.03)', 
          padding: '48px', 
          borderRadius: '24px', 
          maxWidth: '520px', 
          width: '100%', 
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #00b865, #00d273)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
            <Building2 size={22} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Bem-vindo ao Tauze!</h1>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '36px', fontSize: '15px', lineHeight: 1.5 }}>
          Ficamos felizes em ter você aqui. Precisamos de alguns detalhes básicos para configurar a infraestrutura isolada e segura do seu ambiente.
        </p>

        {/* Stepper Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: 'rgba(255,255,255,0.1)', zIndex: 0 }} />
          {[1, 2, 3].map(i => (
            <div key={i} style={{ 
              width: '32px', height: '32px', borderRadius: '50%', 
              background: step >= i ? '#00b865' : '#080d14', 
              color: step >= i ? '#000' : 'rgba(255,255,255,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', zIndex: 1, border: `2px solid ${step >= i ? '#00b865' : 'rgba(255,255,255,0.1)'}`,
              transition: 'all 0.3s'
            }}>
              {step > i ? <CheckCircle2 size={16} strokeWidth={3} /> : i}
            </div>
          ))}
        </div>

        {/* Form Sections */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#fff', fontSize: '14px', fontWeight: 600 }}>CPF ou CNPJ *</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                  <input 
                    type="text" 
                    value={documento}
                    onChange={(e) => setDocumento(formatCpfCnpj(e.target.value))}
                    onBlur={handleDocumentBlur}
                    placeholder="Digite seu CPF ou CNPJ"
                    className="onboarding-input"
                  />
                </div>
              </div>
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#fff', fontSize: '14px', fontWeight: 600 }}>Telefone *</label>
                <input 
                  type="text" 
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value.replace(/\D/g, ''))}
                  placeholder="(00) 00000-0000"
                  className="onboarding-input onboarding-input-no-icon"
                />
              </div>
              <button onClick={handleNextStep1} className="submit-btn">
                Próximo Passo <ArrowRight size={18} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {fetchingCnpj && <p style={{ color: '#00b865', marginBottom: '16px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><Loader2 className="animate-spin" size={14} /> Buscando dados na Receita...</p>}
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#fff', fontSize: '14px', fontWeight: 600 }}>Razão Social / Nome Completo *</label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                  <input 
                    type="text" 
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    placeholder="Nome da sua Empresa ou Pessoa"
                    className="onboarding-input"
                  />
                </div>
              </div>
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#fff', fontSize: '14px', fontWeight: 600 }}>Nome Fantasia</label>
                <input 
                  type="text" 
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
                  placeholder="Apelido da Empresa"
                  className="onboarding-input onboarding-input-no-icon"
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setStep(1)} className="back-btn" style={{ flex: 1 }}>Voltar</button>
                <button onClick={handleNextStep2} className="submit-btn" style={{ flex: 2 }}>Próximo Passo <ArrowRight size={18} /></button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#fff', fontSize: '14px', fontWeight: 600 }}>Nome da Primeira Fazenda *</label>
                <div style={{ position: 'relative' }}>
                  <Map size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                  <input 
                    type="text" 
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="Ex: Fazenda Boa Vista"
                    className="onboarding-input"
                  />
                </div>
              </div>
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#fff', fontSize: '14px', fontWeight: 600 }}>Tamanho (Hectares)</label>
                <input 
                  type="number" 
                  value={hectares}
                  onChange={(e) => setHectares(e.target.value)}
                  placeholder="Ex: 500"
                  className="onboarding-input onboarding-input-no-icon"
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setStep(2)} disabled={loading} className="back-btn" style={{ flex: 1 }}>Voltar</button>
                <button onClick={handleSubmit} disabled={loading} className="submit-btn" style={{ flex: 2 }}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : 'Concluir Setup'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
