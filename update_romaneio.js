const fs = require('fs');

function updateFile(filepath, pattern, replacement) {
    let content = fs.readFileSync(filepath, 'utf8');
    if (!content.includes('especie_id:')) {
        content = content.replace(pattern, replacement);
        fs.writeFileSync(filepath, content, 'utf8');
        console.log('Updated ' + filepath);
    } else {
        console.log('Already updated ' + filepath);
    }
}

// RomaneioEmbarqueModal.tsx
updateFile(
    'C:/Saas/src/components/Modals/RomaneioEmbarqueModal.tsx',
    /(const payload = \{[\s\S]*?)(};)/,
    "\  especie_id: 'bovino',\n      aptidao_id: 'corte',\n    \"
);

