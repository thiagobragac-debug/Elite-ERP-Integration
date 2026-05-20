const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"](\.\/pages\/[^'"]+)['"];/g;
let replacedContent = content.replace(importRegex, (match, names, path) => {
  if (path.includes('Auth/') || path.includes('LandingPage')) return match;
  
  const exports = names.split(',').map(n => n.trim());
  let lazyDeclarations = '';
  exports.forEach(exp => {
    lazyDeclarations += `const ${exp} = React.lazy(() => import('${path}').then(m => ({ default: m.${exp} })));\n`;
  });
  return lazyDeclarations;
});

// Wrap the main Routes in Suspense, but not the outer Router. We'll wrap the inner Routes.
replacedContent = replacedContent.replace(
  /<Routes>/g, 
  '<React.Suspense fallback={<div className="loading-overlay" style={{display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "var(--primary)"}}>Carregando módulo...</div>}><Routes>'
);
replacedContent = replacedContent.replace(
  /<\/Routes>/g, 
  '</Routes></React.Suspense>'
);

fs.writeFileSync('src/App.tsx', replacedContent);
console.log('App.tsx refactored for React.lazy');
