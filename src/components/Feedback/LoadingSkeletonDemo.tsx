/**
 * LoadingSkeleton Demo Page
 * 
 * Demonstração visual de todas as variantes do componente LoadingSkeleton
 * Útil para testes visuais e documentação
 * 
 * Acesso: http://localhost:5173/demo/loading-skeleton
 */

import { useState } from 'react';
import { LoadingSkeleton } from './LoadingSkeleton';

type SkeletonVariant = 'table' | 'card' | 'form' | 'chart';

export default function LoadingSkeletonDemo() {
  const [activeVariant, setActiveVariant] = useState<SkeletonVariant>('table');
  const [rows, setRows] = useState(5);
  const [columns, setColumns] = useState(4);
  const [fullScreen, setFullScreen] = useState(false);

  const variants: SkeletonVariant[] = ['table', 'card', 'form', 'chart'];

  return (
    <div style={{ padding: '24px', background: 'hsl(var(--bg-main))', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px', color: 'hsl(var(--text-primary))' }}>
          LoadingSkeleton Demo
        </h1>
        <p style={{ color: 'hsl(var(--text-muted))', fontSize: '14px' }}>
          Demonstração visual das variantes do componente LoadingSkeleton
        </p>
      </div>

      {/* Controls */}
      <div className="premium-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: 'hsl(var(--text-primary))' }}>
          Controles
        </h2>

        {/* Variant Selection */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: 'hsl(var(--text-secondary))' }}>
            Variante:
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {variants.map((variant) => (
              <button
                key={variant}
                onClick={() => setActiveVariant(variant)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: activeVariant === variant ? '2px solid hsl(var(--brand))' : '1px solid hsl(var(--border))',
                  background: activeVariant === variant ? 'hsl(var(--brand) / 0.1)' : 'transparent',
                  color: activeVariant === variant ? 'hsl(var(--brand))' : 'hsl(var(--text-primary))',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  textTransform: 'capitalize',
                }}
              >
                {variant}
              </button>
            ))}
          </div>
        </div>

        {/* Table-specific controls */}
        {activeVariant === 'table' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: 'hsl(var(--text-secondary))' }}>
                Rows: {rows}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: 'hsl(var(--text-secondary))' }}>
                Columns: {columns}
              </label>
              <input
                type="range"
                min="2"
                max="8"
                value={columns}
                onChange={(e) => setColumns(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}

        {/* Full Screen Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            id="fullscreen-toggle"
            checked={fullScreen}
            onChange={(e) => setFullScreen(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <label htmlFor="fullscreen-toggle" style={{ fontSize: '14px', color: 'hsl(var(--text-secondary))', cursor: 'pointer' }}>
            Full Screen Mode
          </label>
        </div>
      </div>

      {/* Demo Area */}
      <div className="premium-card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: 'hsl(var(--text-primary))' }}>
          Preview: <span style={{ color: 'hsl(var(--brand))', textTransform: 'capitalize' }}>{activeVariant}</span> Variant
        </h2>

        <div style={{ border: '1px dashed hsl(var(--border))', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <LoadingSkeleton
            variant={activeVariant}
            rows={rows}
            columns={columns}
            fullScreen={fullScreen}
          />
        </div>
      </div>

      {/* Documentation */}
      <div className="premium-card" style={{ padding: '24px', marginTop: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: 'hsl(var(--text-primary))' }}>
          Informações da Variante
        </h2>

        {activeVariant === 'table' && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'hsl(var(--brand))' }}>Table Variant</h3>
            <p style={{ fontSize: '14px', color: 'hsl(var(--text-muted))', marginBottom: '12px' }}>
              Skeleton para listagens e tabelas com header, filtros, linhas e paginação.
            </p>
            <p style={{ fontSize: '14px', color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
              <strong>Casos de Uso:</strong>
            </p>
            <ul style={{ fontSize: '14px', color: 'hsl(var(--text-muted))', paddingLeft: '20px', lineHeight: 1.6 }}>
              <li>AnimalManagement</li>
              <li>AccountsPayable</li>
              <li>InventoryManagement</li>
              <li>FleetManagement</li>
            </ul>
          </div>
        )}

        {activeVariant === 'card' && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'hsl(var(--brand))' }}>Card Variant</h3>
            <p style={{ fontSize: '14px', color: 'hsl(var(--text-muted))', marginBottom: '12px' }}>
              Skeleton para layouts em grid de cards (dashboards, galerias).
            </p>
            <p style={{ fontSize: '14px', color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
              <strong>Casos de Uso:</strong>
            </p>
            <ul style={{ fontSize: '14px', color: 'hsl(var(--text-muted))', paddingLeft: '20px', lineHeight: 1.6 }}>
              <li>Dashboard executivo</li>
              <li>Lista de fazendas</li>
              <li>Galeria de animais</li>
              <li>Cards de KPI</li>
            </ul>
          </div>
        )}

        {activeVariant === 'form' && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'hsl(var(--brand))' }}>Form Variant</h3>
            <p style={{ fontSize: '14px', color: 'hsl(var(--text-muted))', marginBottom: '12px' }}>
              Skeleton para formulários com campos de entrada.
            </p>
            <p style={{ fontSize: '14px', color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
              <strong>Casos de Uso:</strong>
            </p>
            <ul style={{ fontSize: '14px', color: 'hsl(var(--text-muted))', paddingLeft: '20px', lineHeight: 1.6 }}>
              <li>Modal de cadastro de animal</li>
              <li>Formulário de conta a pagar</li>
              <li>Edição de fornecedor</li>
              <li>Qualquer formulário de cadastro/edição</li>
            </ul>
          </div>
        )}

        {activeVariant === 'chart' && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'hsl(var(--brand))' }}>Chart Variant</h3>
            <p style={{ fontSize: '14px', color: 'hsl(var(--text-muted))', marginBottom: '12px' }}>
              Skeleton para gráficos e visualizações de dados.
            </p>
            <p style={{ fontSize: '14px', color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
              <strong>Casos de Uso:</strong>
            </p>
            <ul style={{ fontSize: '14px', color: 'hsl(var(--text-muted))', paddingLeft: '20px', lineHeight: 1.6 }}>
              <li>Relatórios com gráficos</li>
              <li>Dashboard de vendas</li>
              <li>Análise de performance</li>
              <li>Indicadores de mercado (Cepea)</li>
            </ul>
          </div>
        )}
      </div>

      {/* Code Example */}
      <div className="premium-card" style={{ padding: '24px', marginTop: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: 'hsl(var(--text-primary))' }}>
          Código de Exemplo
        </h2>
        <pre style={{
          background: 'hsl(var(--bg-secondary))',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          overflow: 'auto',
          fontSize: '13px',
          color: 'hsl(var(--text-primary))',
          fontFamily: 'monospace',
        }}>
{`<LoadingSkeleton 
  variant="${activeVariant}" ${activeVariant === 'table' ? `
  rows={${rows}}
  columns={${columns}}` : ''}
  fullScreen={${fullScreen}}
/>`}
        </pre>
      </div>
    </div>
  );
}
