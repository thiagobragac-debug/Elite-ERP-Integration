/**
 * export-cepea-csv.mjs
 * Exporta os dados do banco para CSVs locais de backup
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nmirpozhgcoabcjwgvqk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taXJwb3poZ2NvYWJjandndnFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzg2MDkyMiwiZXhwIjoyMDkzNDM2OTIyfQ.DxO8EEQVInDcmEg9kntLzjG2Y79aN-l5CKec3NFLayE'
);

const EXPORTS = [
  { indicator: 'boi_gordo_cepea',  file: 'boi_gordo.csv'  },
  { indicator: 'milho_cepea',      file: 'milho.csv'       },
  { indicator: 'bezerro_ms_cepea', file: 'MS_backup.csv'   },
  { indicator: 'bezerro_sp_cepea', file: 'SP_backup.csv'   },
];

async function fetchAll(indicator) {
  let all = [];
  let page = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('market_quotes')
      .select('date, value')
      .eq('indicator', indicator)
      .order('date', { ascending: true })
      .range(page * PAGE, (page + 1) * PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all = [...all, ...data];
    if (data.length < PAGE) break;
    page++;
  }
  return all;
}

function toCSV(rows) {
  const lines = ['Data;À vista R$'];
  for (const row of rows) {
    const d = new Date(row.date);
    const day   = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year  = d.getUTCFullYear();
    const val   = Number(row.value).toFixed(2).replace('.', ',');
    lines.push(`${day}/${month}/${year};${val}`);
  }
  return lines.join('\n');
}

async function main() {
  console.log('📤 Exportando CSVs do banco...\n');
  for (const exp of EXPORTS) {
    process.stdout.write(`  ▶ ${exp.indicator}... `);
    const rows = await fetchAll(exp.indicator);
    if (rows.length === 0) {
      console.log('⚠️  sem dados');
      continue;
    }
    fs.writeFileSync(exp.file, toCSV(rows), 'utf-8');
    console.log(`✅ ${rows.length} registros → ${exp.file}`);
  }
  console.log('\n✅ Exportação concluída!');
}

main().catch(console.error);
