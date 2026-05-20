const fs = require('fs');
const path = require('path');
const dir = 'c:/Saas/src/hooks/report-handlers';

fs.readdirSync(dir).filter(f => f.endsWith('.ts')).forEach(f => {
  let p = path.join(dir, f);
  let c = fs.readFileSync(p, 'utf8');
  
  // Replace the catch block returning mockData
  c = c.replace(/\} catch \(error\) \{\s*console\.warn\('\[.*?\] Resilience Pattern Engaged:', error\);\s*return mockData;\s*\}/g, 
    '} catch (error: any) { console.error("Error:", error); return { data: [], stats: [], columns: mockData.columns, totalCount: 0 }; }'
  );
  
  // Replace the TIMEOUT_MS 
  c = c.replace(/const TIMEOUT_MS = 3000;/g, 'const TIMEOUT_MS = 30000;');
  
  fs.writeFileSync(p, c);
});
console.log('Done!');
