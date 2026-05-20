/**
 * LCDPR — Tabela de Naturezas (Códigos RFB)
 * Receitas: R | Despesas: D
 */
export interface LCDPRNatureza {
  codigo: string;
  tipo: 'R' | 'D';
  descricao: string;
}

export const NATUREZAS_LCDPR: LCDPRNatureza[] = [
  // RECEITAS
  { codigo: '01', tipo: 'R', descricao: 'Venda de animais e produtos de origem animal' },
  { codigo: '02', tipo: 'R', descricao: 'Venda de produtos de origem vegetal' },
  { codigo: '03', tipo: 'R', descricao: 'Arrendamento e parceria recebido' },
  { codigo: '04', tipo: 'R', descricao: 'Subvenções, incentivos e auxílios' },
  { codigo: '05', tipo: 'R', descricao: 'Indenizações e seguros' },
  { codigo: '09', tipo: 'R', descricao: 'Outras receitas da atividade rural' },
  // DESPESAS
  { codigo: '11', tipo: 'D', descricao: 'Custeio da lavoura (sementes, fertilizantes, defensivos)' },
  { codigo: '12', tipo: 'D', descricao: 'Arrendamento e parceria pagos' },
  { codigo: '13', tipo: 'D', descricao: 'Remuneração de empregados e encargos' },
  { codigo: '14', tipo: 'D', descricao: 'Benfeitorias e instalações' },
  { codigo: '15', tipo: 'D', descricao: 'Máquinas, tratores e implementos' },
  { codigo: '16', tipo: 'D', descricao: 'Animais de trabalho, reprodutores e matrizes' },
  { codigo: '17', tipo: 'D', descricao: 'Combustíveis e lubrificantes' },
  { codigo: '18', tipo: 'D', descricao: 'Energia elétrica e comunicações' },
  { codigo: '19', tipo: 'D', descricao: 'Serviços de terceiros' },
  { codigo: '20', tipo: 'D', descricao: 'Taxas, impostos e contribuições' },
  { codigo: '21', tipo: 'D', descricao: 'Seguro da atividade rural' },
  { codigo: '22', tipo: 'D', descricao: 'Custeio pecuário (rações, vacinas, medicamentos)' },
  { codigo: '29', tipo: 'D', descricao: 'Outras despesas da atividade rural' },
];

export const getNatureza = (codigo: string) =>
  NATUREZAS_LCDPR.find(n => n.codigo === codigo);

export const NATUREZAS_RECEITA = NATUREZAS_LCDPR.filter(n => n.tipo === 'R');
export const NATUREZAS_DESPESA = NATUREZAS_LCDPR.filter(n => n.tipo === 'D');
