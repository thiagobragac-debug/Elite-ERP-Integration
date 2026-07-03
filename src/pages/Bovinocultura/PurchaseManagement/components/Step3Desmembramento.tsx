import React, { useState } from 'react';
import { FileSpreadsheet, Keyboard, Calculator, Upload, Plus, Trash2 } from 'lucide-react';

export const Step3Desmembramento: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'excel' | 'grid' | 'media'>('excel');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="tauze-tab-group" style={{ marginBottom: '0px' }}>
        <button 
          className={`tauze-tab-item ${activeTab === 'excel' ? 'active' : ''}`}
          onClick={() => setActiveTab('excel')}
        >
          <FileSpreadsheet size={16} /> Importar Planilha
        </button>
        <button 
          className={`tauze-tab-item ${activeTab === 'grid' ? 'active' : ''}`}
          onClick={() => setActiveTab('grid')}
        >
          <Keyboard size={16} /> Digitação Rápida
        </button>
        <button 
          className={`tauze-tab-item ${activeTab === 'media' ? 'active' : ''}`}
          onClick={() => setActiveTab('media')}
        >
          <Calculator size={16} /> Lote Fechado (Média)
        </button>
      </div>

      <div>
        {activeTab === 'excel' && (
          <div>
            <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '16px', fontSize: '13px' }}>
              Faça o upload da planilha fornecida pelo vendedor com a relação de animais. 
              As colunas obrigatórias são: Brinco, Sexo e Peso.
            </p>
            
            <div className="upload-zone" style={{ 
              border: '2px dashed hsl(var(--border))', 
              borderRadius: '8px', 
              padding: '48px 24px', 
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(0,0,0,0.1)'
            }}>
              <Upload size={32} style={{ color: 'hsl(var(--text-muted))', marginBottom: '16px', margin: '0 auto' }} />
              <p style={{ fontWeight: 600, marginBottom: '8px' }}>Clique para selecionar ou arraste o arquivo aqui</p>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>Formatos suportados: .xlsx, .xls, .csv</p>
            </div>
            
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="glass-btn secondary" style={{ fontSize: '13px' }}>
                Baixar Planilha Modelo
              </button>
            </div>
          </div>
        )}

        {activeTab === 'grid' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button className="glass-btn secondary">
                <Plus size={16} /> Adicionar 10 Linhas
              </button>
            </div>
            
            <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '16px', fontSize: '13px' }}>
              Dica: Use a tecla TAB para navegar rapidamente entre os campos.
            </p>

            <table className="tauze-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--border))', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Brinco Visual</th>
                  <th style={{ padding: '12px' }}>Brinco Eletrônico (RFID)</th>
                  <th style={{ padding: '12px' }}>Sexo</th>
                  <th style={{ padding: '12px' }}>Peso (kg)</th>
                  <th style={{ padding: '12px', width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '8px' }}>
                      <input type="text" className="tauze-input" placeholder="Ex: 001" />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input type="text" className="tauze-input" placeholder="Ex: 982000..." />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <select className="tauze-input">
                        <option value="M">Macho</option>
                        <option value="F">Fêmea</option>
                      </select>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input type="number" className="tauze-input" placeholder="0.00" />
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button className="action-dot delete" title="Remover linha">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'media' && (
          <div>
            <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '16px', fontSize: '13px' }}>
              O sistema criará fichas provisórias para os animais utilizando o peso médio. 
              A quantidade de fichas criadas será baseada no campo "Quantidade de Cabeças" preenchido no Passo 1.
            </p>

            <div className="tauze-input-grid grid-col-2">
              <div className="tauze-field-group">
                <label className="tauze-label">Peso Total da Carga (kg)</label>
                <input type="number" className="tauze-input" placeholder="Ex: 24000" />
              </div>
              
              <div className="tauze-field-group">
                <label className="tauze-label">Peso Médio Estimado por Animal</label>
                <div style={{ padding: '10px 16px', background: 'hsl(var(--bg-card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '18px', fontWeight: 600 }}>
                  0.00 kg
                </div>
                <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
                  Baseado em X cabeças informadas no Passo 1.
                </p>
              </div>
            </div>
            
            <div style={{ marginTop: '24px', padding: '16px', background: 'hsl(var(--brand) / 0.1)', border: '1px solid hsl(var(--brand))', borderRadius: '8px' }}>
              <h4 style={{ color: 'hsl(var(--brand))', marginBottom: '8px', fontSize: '14px', margin: '0 0 8px 0' }}>Como isso funciona?</h4>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', margin: 0 }}>
                Ao concluir, geraremos identificadores provisórios (Ex: COMPRA-LOTE-001). 
                Quando os animais passarem no tronco pela primeira vez, o vaqueiro poderá buscar este lote fechado e atualizar os brincos visuais e pesos individuais para oficializá-los.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
