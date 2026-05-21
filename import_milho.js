import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nmirpozhgcoabcjwgvqk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taXJwb3poZ2NvYWJjandndnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjA5MjIsImV4cCI6MjA5MzQzNjkyMn0.TgJr4vnEeXZmxqXr_5_xPqdMlgojrli-Mewy60ocdak';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const data = fs.readFileSync('milho.csv', 'utf-8');
const lines = data.split('\n').filter(l => l.trim().length > 0).slice(1);

const records = [];
for (const line of lines) {
  const parts = line.split(';');
  if (parts.length >= 2) {
    const datePart = parts[0].trim();
    const valPart = parts[1].trim().replace(',', '.');
    
    const [day, month, year] = datePart.split('/');
    if (day && month && year && year.length === 4) {
        const isoDate = `${year}-${month}-${day}`;
        const valNum = parseFloat(valPart);
        if (!isNaN(valNum)) {
            records.push({
                indicator: 'milho_cepea',
                date: isoDate,
                value: valNum
            });
        }
    }
  }
}

async function insertInBatches() {
    console.log(`Parsed ${records.length} valid records for milho_cepea.`);
    const batchSize = 1000;
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        console.log(`Inserting batch ${i} to ${i + batch.length}...`);
        const { error } = await supabase.from('market_quotes').upsert(batch, { onConflict: 'indicator,date' });
        if (error) {
            console.error('Error inserting:', error);
            return;
        }
    }
    console.log('Finished inserting ' + records.length + ' records.');
}

insertInBatches();
