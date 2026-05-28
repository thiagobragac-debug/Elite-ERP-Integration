/**
 * add-pecuaria-subtitles.mjs
 * Adds date-contextual subtitles to all pecuaria handler stats
 */
import fs from 'fs';

const FILE = 'c:/Saas/src/hooks/report-handlers/pecuaria.ts';
let content = fs.readFileSync(FILE, 'utf-8');

// Add helpers at the top, after the imports
const HELPERS = `\nconst todayBR = () => new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });\nconst monthYearBR = () => new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });\n`;

// Insert helpers after the last import line
content = content.replace(
  /^(import .+;\r?\n)+/m,
  (match) => match + HELPERS
);

// Map of stat labels to their contextual subtitles
const SUBTITLES = {
  "label: 'GMD Médio Global'":      "subtitle: `Calculado em ${todayBR()}`",
  "label: 'Peso Total Rebanho'":    "subtitle: `Invent\\u00e1rio em ${todayBR()}`",  
  "label: 'Total Pesagens'":        "subtitle: `At\\u00e9 ${todayBR()}`",
  "label: 'GMD Projetado'":         "subtitle: 'Proje\\u00e7\\u00e3o baseada em hist\\u00f3rico'",
  "label: 'Cobertura Sanitária'":   "subtitle: `Verificado em ${todayBR()}`",
  "label: 'Aplicações (Mês)'":      "subtitle: `Refer\\u00eancia: ${monthYearBR()}`",
  "label: 'Custo Sanitário / UA'":  "subtitle: `Per\\u00edodo: ${monthYearBR()}`",
  "label: 'Em Carência Ativa'":     "subtitle: `Status em ${todayBR()}`",
  "label: 'Área Total Pasto'":      "subtitle: `Cadastro em ${todayBR()}`",
  "label: 'Média Lotação'":         "subtitle: `Verificado em ${todayBR()}`",
  "label: 'Pastos em Descanso'":    "subtitle: `Status em ${todayBR()}`",
  "label: 'Capacidade Suporte'":    "subtitle: `Calculado em ${todayBR()}`",
  "label: 'Animais Confinados'":    "subtitle: `Invent\\u00e1rio em ${todayBR()}`",
  "label: 'GMD do Rebanho'":        "subtitle: `Calculado em ${todayBR()}`",
  "label: 'Custo Diária (CPD)'":    "subtitle: `M\\u00e9dia at\\u00e9 ${todayBR()}`",
  "label: 'Currais Ativos'":        "subtitle: `Status em ${todayBR()}`",
  "label: 'Estoque Biológico'":     "subtitle: `Invent\\u00e1rio em ${todayBR()}`",
  "label: 'GMD Médio (Rebanho)'":   "subtitle: `Calculado em ${todayBR()}`",
  "label: 'Taxa de Lotação'":       "subtitle: `Verificado em ${todayBR()}`",
  "label: 'Animais em Carência'":   "subtitle: `Status em ${todayBR()}`",
  "label: 'Dietas Formuladas'":     "subtitle: `Cadastro em ${todayBR()}`",
  "label: 'Custo Médio/kg MS'":     "subtitle: `Per\\u00edodo: ${monthYearBR()}`",
  "label: 'Eficiência Alimentar'":  "subtitle: `Calculada em ${todayBR()}`",
  "label: 'Consumo Médio (DM)'":    "subtitle: `M\\u00e9dia at\\u00e9 ${todayBR()}`",
  "label: 'Total Rebanho'":         "subtitle: `Invent\\u00e1rio em ${todayBR()}`",
  "label: 'Peso Médio'":            "subtitle: `M\\u00e9dia em ${todayBR()}`",
  "label: 'Saídas / Abatidos'":     "subtitle: `At\\u00e9 ${todayBR()}`",
  "label: 'GMD Médio'":             "subtitle: `Calculado em ${todayBR()}`",
  "label: 'Lotes Operacionais'":    "subtitle: `Status em ${todayBR()}`",
  "label: 'Taxa de Ocupação'":      "subtitle: `Verificado em ${todayBR()}`",
  "label: 'Animais Totais'":        "subtitle: `Invent\\u00e1rio em ${todayBR()}`",
  "label: 'Uniformidade Lotes'":    "subtitle: `Calculado em ${todayBR()}`",
  "label: 'Taxa de Prenhez'":       "subtitle: `Apurada em ${todayBR()}`",
  "label: 'Partos Previstos (30d)'":"subtitle: `Pr\\u00f3ximos 30 dias a partir de ${todayBR()}`",
  "label: 'Total Prenhas'":         "subtitle: `Invent\\u00e1rio em ${todayBR()}`",
  "label: 'Intervalo Entre Partos'":"subtitle: `M\\u00e9dia hist\\u00f3rica at\\u00e9 ${todayBR()}`",
  "label: 'Total de Pesagens'":     "subtitle: `At\\u00e9 ${todayBR()}`",
  "label: 'Peso Médio (Página)'":   "subtitle: `M\\u00e9dia em ${todayBR()}`",
};

let count = 0;

for (const [labelStr, subtitleStr] of Object.entries(SUBTITLES)) {
  // Match the label line (with possible trailing comma) and add subtitle after it
  // Pattern: finds "label: 'XYZ'," possibly preceded by whitespace, and adds subtitle on next line
  const escapedLabel = labelStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Replace all occurrences where label is followed by newline (add subtitle after each label)
  const regex = new RegExp(`([ \\t]*${escapedLabel},?)(\\r?\\n)([ \\t]*)(?!subtitle:)`, 'g');
  
  const newContent = content.replace(regex, (match, labelLine, nl, indent) => {
    // Check if next line already has subtitle
    return `${labelLine}${nl}${indent}${subtitleStr},${nl}${indent}`;
  });
  
  if (newContent !== content) {
    count++;
    content = newContent;
  }
}

fs.writeFileSync(FILE, content, 'utf-8');
console.log(`✅ Adicionados subtítulos em ${count} stats no pecuaria.ts`);
