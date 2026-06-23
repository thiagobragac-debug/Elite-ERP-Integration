-- Adiciona colunas de configuração da tela de Login na tabela global system_settings
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS login_hero_title text DEFAULT 'Bem-vindo de volta à sua operação.',
ADD COLUMN IF NOT EXISTS login_hero_subtitle text DEFAULT 'Acompanhe rebanho, frota, finanças e colheita em tempo real — tudo em um único painel unificado.',
ADD COLUMN IF NOT EXISTS login_kpis jsonb DEFAULT '[
  {
    "label": "REBANHO ATIVO",
    "value": "4.820 cab.",
    "change": "+3,2% mês",
    "positive": true,
    "color": "#00b865",
    "spark": [42, 44, 41, 45, 48, 47, 50, 52]
  },
  {
    "label": "GMD MÉDIO DO LOTE",
    "value": "1,42 kg/dia",
    "change": "Meta ✓",
    "positive": true,
    "color": "#3b82f6",
    "spark": [1.1, 1.2, 1.15, 1.28, 1.3, 1.35, 1.4, 1.42]
  },
  {
    "label": "CAIXA CONSOLIDADO",
    "value": "R$ 2,4M",
    "change": "+12% mês",
    "positive": true,
    "color": "#8b5cf6",
    "spark": [2.1, 2.15, 2.1, 2.2, 2.25, 2.3, 2.35, 2.4]
  },
  {
    "label": "EFICIÊNCIA DIESEL",
    "value": "14,8 L/h",
    "change": "-2% consumo",
    "positive": true,
    "color": "#f59e0b",
    "spark": [16.2, 16.0, 15.8, 15.5, 15.2, 15.0, 14.9, 14.8]
  }
]'::jsonb;
