/**
 * add-logistica-subtitles.mjs
 * Adds date-contextual subtitles to all logistica handler stats
 */
import fs from 'fs';

const FILE = 'c:/Saas/src/hooks/report-handlers/logistica.ts';
let content = fs.readFileSync(FILE, 'utf-8');

// Add helpers at the top
const HELPERS = `\nconst todayBR = () => new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });\nconst monthYearBR = () => new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });\n`;

content = content.replace(
  /^(import .+;\r?\n)+/m,
  (match) => match + HELPERS
);

const SUBTITLES = {
  "label: 'Consumo Total (L)'":     "subtitle: `Período: ${monthYearBR()}`",
  "label: 'Custo Operacional'":     "subtitle: `Período: ${monthYearBR()}`",
  "label: 'Média L/Abast.'":        "subtitle: `Média até ${todayBR()}`",
  "label: 'Frota Ativa'":           "subtitle: `Status em ${todayBR()}`",
  "label: 'Investimento Oficina'":  "subtitle: `Período: ${monthYearBR()}`",
  "label: 'Intervenções'":          "subtitle: `Até ${todayBR()}`",
  "label: 'Custo Médio / Máq'":    "subtitle: `Média em ${monthYearBR()}`",
  "label: 'Disponibilidade Frota'": "subtitle: `Verificado em ${todayBR()}`",
  "label: 'Patrimônio Estoque'":    "subtitle: `Inventário em ${todayBR()}`",
  "label: 'Itens Abaixo Mínimo'":  "subtitle: `Status em ${todayBR()}`",
  "label: 'Acuracidade'":           "subtitle: `Calculada em ${todayBR()}`",
  "label: 'Giro de Estoque'":       "subtitle: `Período: ${monthYearBR()}`",
  "label: 'Volume Compras'":        "subtitle: `Período: ${monthYearBR()}`",
  "label: 'Pedidos Pendentes'":     "subtitle: `Status em ${todayBR()}`",
  "label: 'Média / Pedido'":        "subtitle: `Média em ${monthYearBR()}`",
  "label: 'Saving Estimado'":       "subtitle: `Calculado em ${todayBR()}`",
};

let count = 0;

for (const [labelStr, subtitleStr] of Object.entries(SUBTITLES)) {
  const escapedLabel = labelStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`([ \\t]*${escapedLabel},?)(\\r?\\n)([ \\t]*)(?!subtitle:)`, 'g');
  
  const newContent = content.replace(regex, (match, labelLine, nl, indent) => {
    return `${labelLine}${nl}${indent}${subtitleStr},${nl}${indent}`;
  });
  
  if (newContent !== content) {
    count++;
    content = newContent;
  }
}

fs.writeFileSync(FILE, content, 'utf-8');
console.log(`✅ Adicionados subtítulos em ${count} stats no logistica.ts`);
