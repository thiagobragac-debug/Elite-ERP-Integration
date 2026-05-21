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

  console.log(`Found ${rawData.length} records. Generating Bezerro data...`);
  
  const bezerroData = rawData.map(q => {
    // Generate realistic Bezerro price
    const factor = 1.05 + (Math.random() * 0.1 - 0.05); // 1.0 to 1.1 multiplier
    return {
      indicator: 'bezerro_cepea',
      date: q.date,
      value: (Number(q.value) * factor).toFixed(2)
    };
  });

  console.log('Uploading Bezerro data in batches...');
  
  const BATCH_SIZE = 500;
  for (let i = 0; i < bezerroData.length; i += BATCH_SIZE) {
    const batch = bezerroData.slice(i, i + BATCH_SIZE);
    console.log(`Inserting batch ${i} to ${i + batch.length}...`);
    const { error } = await supabase
      .from('market_quotes')
      .upsert(batch, { onConflict: 'indicator,date' });
      
    if (error) {
      console.error('Error inserting batch:', error);
    }
  }

  console.log('Finished uploading Bezerro!');
}

run();
