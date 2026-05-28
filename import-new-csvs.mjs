/**
 * import-new-csvs.mjs  —  importa BOI, MS, SP, MILHO para market_quotes
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nmirpozhgcoabcjwgvqk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taXJwb3poZ2NvYWJjandndnFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzg2MDkyMiwiZXhwIjoyMDkzNDM2OTIyfQ.DxO8EEQVInDcmEg9kntLzjG2Y79aN-l5CKec3NFLayE'
);

const FILES = [
  { file: 'BOI.csv',   indicator: 'boi_gordo_cepea',  label: 'Boi Gordo (@)'     },
  { file: 'MS.csv',    indicator: 'bezerro_ms_cepea',  label: 'Bezerro MS (cab)'  },
  { file: 'SP.csv',    indicator: 'bezerro_sp_cepea',  label: 'Bezerro SP (cab)'  },
  { file: 'MILHO.csv', indicator: 'milho_cepea',       label: 'Milho (saca 60kg)' },
];

const BATCH = 500;

function parseFile(filePath, indicator) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines   = content.split('\n').map(l => l.trim()).filter(Boolean).slice(1); // pula cabeçalho

  const records = [];
  let  skipped  = 0;

  for (const line of lines) {
    const cols = line.split(';');
    if (cols.length < 2) { skipped++; continue; }

    const datePart = cols[0].trim();
    // Coluna 2: remove ponto de milhar, troca vírgula por ponto
    const valStr = cols[1].trim().replace(/\./g, '').replace(',', '.');

    const parts = datePart.split('/');
    if (parts.length !== 3 || parts[2].length !== 4) { skipped++; continue; }

    const [day, month, year] = parts;
    const isoDate = `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;
    const value   = parseFloat(valStr);
    if (isNaN(value) || value <= 0) { skipped++; continue; }

    records.push({ indicator, date: isoDate, value });
  }

  return { records, skipped };
}

async function upsert(records, label) {
  let done = 0;
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const { error } = await supabase
      .from('market_quotes')
      .upsert(batch, { onConflict: 'indicator,date' });
    if (error) { console.error(`  ❌ Erro lote ${i}: ${error.message}`); return done; }
    done += batch.length;
    process.stdout.write(`\r     ${done}/${records.length} registros...`);
  }
  console.log('');
  return done;
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║      Importação CEPEA — Novos CSVs                   ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  let total = 0;
  const results = [];

  for (const { file, indicator, label } of FILES) {
    console.log(`▶ ${label}  ←  ${file}`);

    if (!fs.existsSync(file)) {
      console.log(`  ⚠️  Arquivo não encontrado: ${file}\n`);
      results.push({ label, ok: 0, skipped: 0 });
      continue;
    }

    const { records, skipped } = parseFile(file, indicator);
    const first = records[0]?.date ?? '-';
    const last  = records[records.length - 1]?.date ?? '-';
    console.log(`  📄 ${records.length} registros  |  ${first} → ${last}  |  ${skipped} ignorados`);

    const ok = await upsert(records, label);
    console.log(`  ✅ ${ok} registros importados/atualizados\n`);
    total += ok;
    results.push({ label, ok, skipped });
  }

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║                  RESULTADO FINAL                     ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  for (const r of results) {
    const icon = r.ok > 0 ? '✅' : '⚠️ ';
    console.log(`  ${icon} ${r.label.padEnd(22)} ${r.ok} registros`);
  }
  console.log(`\n  📦 TOTAL: ${total} registros importados/atualizados`);
  console.log('\n✅ Histórico atualizado em todo o sistema!\n');
}

main().catch(console.error);
