import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  X, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  Building2, 
  ShieldAlert, 
  Check, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { FormModal } from '../../../components/Forms/FormModal';

interface SupplierBid {
  supplier_id?: string;
  price?: number | string;
  delivery_days?: number | string;
  // Fallbacks support
  name?: string;
  fornecedor_nome?: string;
  preco?: number | string;
  deliveryDays?: number | string;
  prazo_entrega?: number | string;
  isWinner?: boolean;
  vencedor?: boolean;
}

interface QuotationMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: any;
  onApprove: (quotationId: string, supplier: any) => Promise<void>;
}

export const QuotationMatrixModal: React.FC<QuotationMatrixModalProps> = ({
  isOpen,
  onClose,
  quotation,
  onApprove
}) => {
  const [suppliers, setSuppliers] = useState<Record<string, string>>({});
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && quotation) {
      fetchSuppliersList();
    }
  }, [isOpen, quotation]);

  const fetchSuppliersList = async () => {
    setLoading(true);
    try {
      const tenantId = quotation.tenant_id;
      if (tenantId) {
        const { data } = await supabase
          .from('fornecedores')
          .select('id, nome')
          .eq('tenant_id', tenantId);
        
        if (data) {
          const map: Record<string, string> = {};
          data.forEach(s => {
            map[s.id] = s.nome;
          });
          setSuppliers(map);
        }
      }
    } catch (err) {
      console.error('[QuotationMatrixModal] Error fetching suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!quotation) return null;

  const rawBids: SupplierBid[] = quotation.suppliers || quotation.dados_fornecedores || [];

  // Parse and normalize bids
  const bids = rawBids.map((b, index) => {
    const sId = b.supplier_id || '';
    const name = b.name || b.fornecedor_nome || suppliers[sId] || `Fornecedor ${index + 1}`;
    const price = Number(b.price || b.preco || 0);
    const deliveryDays = Number(b.delivery_days || b.deliveryDays || b.prazo_entrega || 0);
    const isWinner = !!(b.isWinner || b.vencedor || quotation.status === 'closed' && (b.isWinner || b.vencedor));

    return {
      ...b,
      resolvedName: name,
      parsedPrice: price,
      parsedDeliveryDays: deliveryDays,
      isWinner
    };
  });

  // Calculate best metrics
  const validPrices = bids.map(b => b.parsedPrice).filter(p => p > 0);
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;

  const validDays = bids.map(b => b.parsedDeliveryDays).filter(d => d > 0);
  const minDays = validDays.length > 0 ? Math.min(...validDays) : 0;

  const handleSelectWinner = async (bid: any, index: number) => {
    setApprovingId(index.toString());
    try {
      await onApprove(quotation.id, bid);
    } catch (err) {
      console.error(err);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => { e.preventDefault(); onClose(); }}
      title="Matriz Comparativa de Fornecedores"
      subtitle={`Análise das propostas comerciais para o item: ${quotation.produto_id || 'N/A'}`}
      icon={BarChart2}
      hideSubmit={true}
      size="large"
    >
      <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              border: '3px solid rgba(255,255,255,0.1)', 
              borderTopColor: '#10b981', 
              borderRadius: '50%', 
              margin: '0 auto 16px', 
              animation: 'spin 1s linear infinite' 
            }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>Carregando dados comparativos...</span>
          </div>
        ) : bids.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', background: 'hsl(var(--bg-main)/0.2)', borderRadius: '20px', border: '1px dashed hsl(var(--border))' }}>
            <ShieldAlert size={36} color="hsl(var(--warning))" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'hsl(var(--text-main))', marginBottom: '4px' }}>Nenhuma Proposta Recebida</h3>
            <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>Este mapa de cotação ainda não possui propostas de fornecedores cadastradas.</p>
          </div>
        ) : (
          <>
            {/* Header com os Destaques Inteligentes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ 
                padding: '16px', 
                background: 'rgba(16, 185, 129, 0.04)', 
                border: '1.5px solid rgba(16, 185, 129, 0.25)', 
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ background: '#10b981', color: 'white', padding: '10px', borderRadius: '12px' }}>
                  <TrendingDown size={20} />
                </div>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Foco em Economia</span>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, margin: '2px 0 0', color: 'hsl(var(--text-main))' }}>Menor Preço de Mercado</h4>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: '#10b981' }}>
                    {minPrice > 0 ? minPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '---'}
                  </span>
                </div>
              </div>

              <div style={{ 
                padding: '16px', 
                background: 'rgba(59, 130, 246, 0.04)', 
                border: '1.5px solid rgba(59, 130, 246, 0.25)', 
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ background: '#3b82f6', color: 'white', padding: '10px', borderRadius: '12px' }}>
                  <Clock size={20} />
                </div>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Foco em Agilidade</span>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, margin: '2px 0 0', color: 'hsl(var(--text-main))' }}>Melhor Prazo de Entrega</h4>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: '#3b82f6' }}>
                    {minDays > 0 ? `${minDays} dias úteis` : '---'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabela de Grid Translúcida Premium */}
            <div style={{ background: 'hsl(var(--bg-main)/0.2)', borderRadius: '20px', border: '1px solid hsl(var(--border))', overflow: 'hidden' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '2fr 1fr 1fr 1.5fr', 
                padding: '16px 24px', 
                background: 'hsl(var(--bg-main)/0.4)',
                borderBottom: '1px solid hsl(var(--border))',
                fontSize: '11px',
                fontWeight: 800,
                color: 'hsl(var(--text-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div>Fornecedor</div>
                <div style={{ textAlign: 'center' }}>Preço Unitário</div>
                <div style={{ textAlign: 'center' }}>Prazo de Entrega</div>
                <div style={{ textAlign: 'right' }}>Ação de Elite</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <AnimatePresence>
                  {bids.map((bid, index) => {
                    const isLowest = bid.parsedPrice === minPrice && minPrice > 0;
                    const isFastest = bid.parsedDeliveryDays === minDays && minDays > 0;
                    const isRowWinner = bid.isWinner;
                    const isAnyWinner = bids.some(b => b.isWinner);

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: index * 0.05 }}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 1fr 1.5fr',
                          padding: '18px 24px',
                          alignItems: 'center',
                          borderBottom: index === bids.length - 1 ? 'none' : '1px solid hsl(var(--border))',
                          background: isRowWinner 
                            ? 'rgba(16, 185, 129, 0.05)' 
                            : isLowest 
                            ? 'rgba(16, 185, 129, 0.015)' 
                            : 'transparent',
                          borderLeft: isRowWinner 
                            ? '4px solid #10b981' 
                            : isLowest 
                            ? '4px solid rgba(16, 185, 129, 0.5)' 
                            : isFastest 
                            ? '4px solid rgba(59, 130, 246, 0.5)'
                            : '4px solid transparent',
                          transition: 'all 0.25s ease'
                        }}
                      >
                        {/* Fornecedor */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: 'hsl(var(--text-main))' }}>
                            {bid.resolvedName}
                          </span>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {isRowWinner && (
                              <span className="status-pill active" style={{ fontSize: '8px', padding: '1px 6px', fontWeight: 950, background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0' }}>
                                CONTRATADO
                              </span>
                            )}
                            {isLowest && (
                              <span className="status-pill active" style={{ fontSize: '8px', padding: '1px 6px', fontWeight: 950, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                MENOR PREÇO
                              </span>
                            )}
                            {isFastest && (
                              <span className="status-pill info" style={{ fontSize: '8px', padding: '1px 6px', fontWeight: 950, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                MAIS RÁPIDO
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Preço */}
                        <div style={{ textAlign: 'center' }}>
                          <span style={{ 
                            fontSize: '13px', 
                            fontWeight: isLowest ? 900 : 700, 
                            color: isLowest ? '#10b981' : 'hsl(var(--text-main))' 
                          }}>
                            {bid.parsedPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>

                        {/* Prazo */}
                        <div style={{ textAlign: 'center' }}>
                          <span style={{ 
                            fontSize: '13px', 
                            fontWeight: isFastest ? 900 : 700, 
                            color: isFastest ? '#3b82f6' : 'hsl(var(--text-main))',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Clock size={12} />
                            {bid.parsedDeliveryDays} {bid.parsedDeliveryDays === 1 ? 'dia' : 'dias'}
                          </span>
                        </div>

                        {/* Botão de Decisão */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          {isRowWinner ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '11px', fontWeight: 900 }}>
                              <CheckCircle2 size={16} />
                              VENCEDOR APROVADO
                            </div>
                          ) : quotation.status === 'closed' ? (
                            <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>Cotação Encerrada</span>
                          ) : (
                            <button
                              type="button"
                              className="primary-btn"
                              disabled={approvingId !== null}
                              onClick={() => handleSelectWinner(bid, index)}
                              style={{ 
                                padding: '6px 12px', 
                                fontSize: '11px', 
                                borderRadius: '10px', 
                                background: isLowest ? '#10b981' : 'hsl(var(--brand))',
                                border: 'none',
                                opacity: approvingId !== null ? 0.6 : 1,
                                height: 'auto'
                              }}
                            >
                              {approvingId === index.toString() ? (
                                <div style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                              ) : (
                                <>
                                  Aprovar
                                  <ArrowRight size={12} style={{ marginLeft: '4px' }} />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </>
        )}
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </FormModal>
  );
};
