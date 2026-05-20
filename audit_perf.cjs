const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let fullPath = path.join(dir, f);
    if (fs.statSync(fullPath).isDirectory()) walkDir(fullPath, callback);
    else callback(fullPath);
  });
}

let issues = { SELECT_STAR: [], NO_LIMIT: [], NO_ISREADY_GUARD: [], NO_FARM_FILTER: [] };

walkDir(path.join(process.cwd(), 'src/pages'), (filePath) => {
  if (!filePath.endsWith('.tsx')) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const rel = path.relative(process.cwd(), filePath);

  // 1. select('*') without head:true
  if (content.includes(".select('*')") || content.includes('.select("*")')) {
    // exclude count-only head queries
    const lines = content.split('\n').filter(l => (l.includes(".select('*')") || l.includes('.select("*")')) && !l.includes('head: true') && !l.includes("head:true"));
    if (lines.length > 0) issues.SELECT_STAR.push(rel + ' (' + lines.length + ' hits)');
  }

  // 2. Has supabase queries but NO .limit() anywhere
  if (content.includes('supabase.from') && !content.includes('.limit(') && !content.includes('range(') && !content.includes('.single()')) {
    issues.NO_LIMIT.push(rel);
  }

  // 3. useEffect with activeFarmId but no isReady guard
  if (content.includes('useEffect') && content.includes('activeFarmId') && !content.includes('isReady')) {
    issues.NO_ISREADY_GUARD.push(rel);
  }

  // 4. fetches data but no farm filter at all
  if (content.includes('supabase.from') && !content.includes('applyFarmFilter') && !content.includes('applyTenantFilter') && !content.includes('saas_') && !content.includes('/Admin/SaaS')) {
    issues.NO_FARM_FILTER.push(rel);
  }
});

for (const [type, files] of Object.entries(issues)) {
  if (files.length > 0) {
    console.log('\n=== ' + type + ' ===');
    files.forEach(f => console.log('  ' + f));
  }
}
