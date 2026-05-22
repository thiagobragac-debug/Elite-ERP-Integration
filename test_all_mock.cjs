const fs = require('fs');

async function testAll() {
  const files = [
    'pecuaria.ts', 'logistica.ts', 'comercial.ts', 'ia.ts', 
    'panorama.ts', 'governanca.ts', 'financeiro.ts'
  ];

  for (const file of files) {
    const fp = 'C:/Saas/src/hooks/report-handlers/' + file;
    if (!fs.existsSync(fp)) continue;
    let content = fs.readFileSync(fp, 'utf8');
    
    // We will simulate running mockData
    // Check if there are any IIFEs in mockData that use undefined variables
    const mockDataMatch = content.match(/const mockData = \{[\s\S]*?try \{/);
    if (mockDataMatch) {
      let mockBlock = mockDataMatch[0];
      // Does it contain `conf `?
      if (mockBlock.match(/\bconf\b/)) console.log(`Warning: conf found in mockData of ${file}`);
      if (mockBlock.match(/\bbaseProfit\b/)) console.log(`Warning: baseProfit found in mockData of ${file}`);
      if (mockBlock.match(/\bdeadAnimals\b/)) console.log(`Warning: deadAnimals found in mockData of ${file}`);
      if (mockBlock.match(/\bavgLotation\b/)) console.log(`Warning: avgLotation found in mockData of ${file}`);
    }
  }
}

testAll();