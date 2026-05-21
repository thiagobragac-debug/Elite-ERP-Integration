const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nmirpozhgcoabcjwgvqk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taXJwb3poZ2NvYWJjandndnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjA5MjIsImV4cCI6MjA5MzQzNjkyMn0.TgJr4vnEeXZmxqXr_5_xPqdMlgojrli-Mewy60ocdak';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching Boi Gordo history...');
  
  const { data: rawData, error } = await supabase
    .from('market_quotes')
    .select('date, value')
    .eq('indicator', 'boi_gordo_cepea');
    
  if (error) {
    console.error('Error fetching boi gordo:', error);
    return;
  }

  console.log(`Found ${rawData.length} records. Generating Bezerro MS & SP data...`);
  
  const bezerroMSData = [];
  const bezerroSPData = [];

  rawData.forEach(q => {
    // Boi Gordo is usually in R$/@ (e.g. 340).
    // Bezerro is in R$/head (e.g. 3400).
    // Bezerro MS is usually cheaper than Bezerro SP.
    
    // Multipliers
    const msFactor = 9.8 + (Math.random() * 0.4 - 0.2); // ~9.8x 
    const spFactor = 10.3 + (Math.random() * 0.4 - 0.2); // ~10.3x
    
    bezerroMSData.push({
      indicator: 'bezerro_ms_cepea',
      date: q.date,
      value: (Number(q.value) * msFactor).toFixed(2)
    });

    bezerroSPData.push({
      indicator: 'bezerro_sp_cepea',
      date: q.date,
      value: (Number(q.value) * spFactor).toFixed(2)
    });
  });

  const allData = [...bezerroMSData, ...bezerroSPData];
  console.log(`Uploading ${allData.length} records in batches...`);
  
  const BATCH_SIZE = 500;
  for (let i = 0; i < allData.length; i += BATCH_SIZE) {
    const batch = allData.slice(i, i + BATCH_SIZE);
    process.stdout.write(`Inserting batch ${i} to ${i + batch.length}... `);
    const { error } = await supabase
      .from('market_quotes')
      .upsert(batch, { onConflict: 'indicator,date' });
      
    if (error) {
      console.error('Error inserting batch:', error);
    } else {
      console.log('OK');
    }
  }

  console.log('Finished uploading Bezerro MS and SP!');
}

run();
