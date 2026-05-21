const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Read .env manually
const envFile = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

function parseCSV(filePath, indicatorName) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l);
  
  const records = [];
  // Skip header (index 0)
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';');
    if (cols.length >= 2) {
      const dateParts = cols[0].split('/');
      if (dateParts.length === 3) {
        const isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
        const valueStr = cols[1].replace(/\./g, '').replace(',', '.');
        const value = parseFloat(valueStr);
        if (!isNaN(value)) {
          records.push({
            indicator: indicatorName,
            date: isoDate,
            value: value
          });
        }
      }
    }
  }
  return records;
}

async function run() {
  console.log('Parsing SP.csv...');
  const spData = parseCSV('SP.csv', 'bezerro_sp_cepea');
  console.log(`Parsed ${spData.length} SP records.`);

  console.log('Parsing MS.csv...');
  let msData = [];
  if (fs.existsSync('MS.csv')) {
    msData = parseCSV('MS.csv', 'bezerro_ms_cepea');
    console.log(`Parsed ${msData.length} MS records.`);
  }

  const allData = [...spData, ...msData];
  console.log(`Total records to insert: ${allData.length}`);

  // Note: we'll let MCP tool handle the DELETE before running this script, 
  // to ensure we wipe the mock data perfectly.

  const BATCH_SIZE = 1000;
  for (let i = 0; i < allData.length; i += BATCH_SIZE) {
    const batch = allData.slice(i, i + BATCH_SIZE);
    process.stdout.write(`Inserting batch ${i} to ${i + batch.length}... `);
    const { error } = await supabase
      .from('market_quotes')
      .upsert(batch, { onConflict: 'indicator,date' });
      
    if (error) {
      console.error('Error inserting batch:', error);
      // Wait and retry?
    } else {
      console.log('OK');
    }
  }

  console.log('Finished uploading real Bezerro data!');
}

run();
