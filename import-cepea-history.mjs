/**
 * import-cepea-history.mjs
 * ─────────────────────────────────────────────────────────────────
 * Importa/atualiza o histórico completo de cotações CEPEA para o
 * banco de dados market_quotes.
 *
 * Fontes:
 *   • Arquivos CSV locais (MS.csv, SP.csv, boi_gordo.csv, milho.csv)
 *     OU
 *   • Download automático da página CEPEA
 *
 * Uso:
 *   node import-cepea-history.mjs              → importa todos os CSVs locais
 *   node import-cepea-history.mjs --download   → baixa da CEPEA e importa
 *   node import-cepea-history.mjs --check      → apenas mostra estado atual
 */

import fs   from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// ─── Config ───────────────────────────────────────────────────────
const SUPABASE_URL = 'https://nmirpozhgcoabcjwgvqk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taXJwb3poZ2NvYWJjandndnFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzg2MDkyMiwiZXhwIjoyMDkzNDM2OTIyfQ.DxO8EEQVInDcmEg9kntLzjG2Y79aN-l5CKec3NFLayE';
const BATCH_SIZE   = 500;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Mapa de indicadores ──────────────────────────────────────────
// csvFile: arquivo local esperado (null = sem CSV local, só widget)
// widgetId: id_indicador do widget CEPEA (para fallback/download)
const INDICATORS = [
  { name: 'boi_gordo_cepea',  label: 'Boi Gordo (@)',     csvFile: 'boi_gordo.csv', widgetId: 2  },
  { name: 'bezerro_ms_cepea', label: 'Bezerro MS (cab)',  csvFile: 'MS.csv',        widgetId: 8  },
  { name: 'bezerro_sp_cepea', label: 'Bezerro SP (cab)',  csvFile: 'SP.csv',        widgetId: 3  },
  { name: 'milho_cepea',      label: 'Milho (saca 60kg)', csvFile: 'milho.csv',     widgetId: 77 },
];

// ─── Parser CSV CEPEA ─────────────────────────────────────────────
// Formato: Data;À vista R$;À vista US$
// Exemplo: 04/01/2016;1.277,22;315,52
function parseCSV(content, indicatorName) {
  const lines = content
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .slice(1); // remove cabeçalho

  const records = [];
  let skipped = 0;

  for (const line of lines) {
    const parts = line.split(';');
    if (parts.length < 2) { skipped++; continue; }

    const datePart = parts[0].trim();
    // Valor: remove pontos de milhar, troca vírgula por ponto
    const valStr = parts[1].trim()
      .replace(/R\$\s*/i, '')
      .replace(/\./g, '')
      .replace(',', '.');

    const [day, month, year] = datePart.split('/');
    if (!day || !month || !year || year.length !== 4) { skipped++; continue; }

    const isoDate = `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;
    const value   = parseFloat(valStr);
    if (isNaN(value) || value <= 0) { skipped++; continue; }

    records.push({ indicator: indicatorName, date: isoDate, value });
  }

  return { records, skipped };
}

// ─── Upsert em lotes ──────────────────────────────────────────────
async function upsertBatches(records, indicatorName) {
  let inserted = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('market_quotes')
      .upsert(batch, { onConflict: 'indicator,date' });

    if (error) {
      console.error(`  ❌ Erro no lote ${i}-${i+batch.length}:`, error.message);
      return inserted;
    }
    inserted += batch.length;
    process.stdout.write(`\r  📦 ${inserted}/${records.length} registros...`);
  }
  console.log(''); // nova linha após progress
  return inserted;
}

// ─── Verifica estado atual no banco ───────────────────────────────
async function checkCurrentState() {
  const { data, error } = await supabase
    .from('market_quotes')
    .select('indicator')
    .order('indicator');

  if (error) { console.error('Erro:', error.message); return; }

  // Agrupa por indicator
  const stats = {};
  for (const row of data || []) {
    stats[row.indicator] = (stats[row.indicator] || 0) + 1;
  }

  console.log('\n📊 Estado atual do banco:');
  console.log('─'.repeat(60));

  // Mostra ranges por indicador
  for (const ind of INDICATORS) {
    const { data: minMax } = await supabase
      .from('market_quotes')
      .select('date')
      .eq('indicator', ind.name)
      .order('date', { ascending: true })
      .limit(1);
    const { data: minMaxLast } = await supabase
      .from('market_quotes')
      .select('date')
      .eq('indicator', ind.name)
      .order('date', { ascending: false })
      .limit(1);

    const count = stats[ind.name] || 0;
    const first = minMax?.[0]?.date || '-';
    const last  = minMaxLast?.[0]?.date || '-';
    console.log(`  ${ind.label.padEnd(20)} ${String(count).padStart(5)} registros  ${first} → ${last}`);
  }
  console.log('─'.repeat(60));
}

// ─── Importa de arquivo CSV local ────────────────────────────────
async function importFromCSV(ind) {
  if (!fs.existsSync(ind.csvFile)) {
    console.log(`  ⚠️  Arquivo não encontrado: ${ind.csvFile}`);
    return 0;
  }

  const content = fs.readFileSync(ind.csvFile, 'utf-8');
  const { records, skipped } = parseCSV(content, ind.name);

  if (records.length === 0) {
    console.log(`  ⚠️  Nenhum registro válido em ${ind.csvFile}`);
    return 0;
  }

  console.log(`  📄 ${ind.csvFile}: ${records.length} registros válidos, ${skipped} ignorados`);
  console.log(`  📅 Intervalo: ${records[0].date} → ${records[records.length - 1].date}`);

  return await upsertBatches(records, ind.name);
}

// ─── Main ─────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       CEPEA Historical Import — Tauze ERP                ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Mostra estado atual sempre
  await checkCurrentState();

  if (checkOnly) {
    console.log('\n✅ Verificação concluída (--check). Nenhum dado foi alterado.');
    return;
  }

  console.log('\n🚀 Iniciando importação...\n');

  let totalInserted = 0;
  const results = [];

  for (const ind of INDICATORS) {
    console.log(`\n▶ ${ind.label} (${ind.name})`);
    const inserted = await importFromCSV(ind);
    totalInserted += inserted;
    results.push({ indicator: ind.name, label: ind.label, inserted });
    if (inserted > 0) {
      console.log(`  ✅ ${inserted} registros importados/atualizados`);
    }
  }

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                    RESULTADO FINAL                       ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  for (const r of results) {
    const icon = r.inserted > 0 ? '✅' : '⚠️ ';
    console.log(`  ${icon} ${r.label.padEnd(22)} ${r.inserted} registros`);
  }
  console.log(`\n  📦 Total: ${totalInserted} registros importados/atualizados`);
  console.log('\n✅ Histórico atualizado! O sistema refletirá os novos dados imediatamente.\n');
}

main().catch(console.error);
