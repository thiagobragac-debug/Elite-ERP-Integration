const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  './src/components/Navigation/CommandPalette.tsx',
  './src/components/Copilot/GlobalCopilot.tsx',
  './src/pages/Auth/RoleSelector.tsx',
  './src/pages/Admin/ModuleSettings.tsx',
  './src/pages/Admin/PecuariaSettingsTab.tsx',
  './src/components/Guards/PermissionGuard.tsx'
];

filesToUpdate.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content
      .replace(/\/pecuaria/g, '/bovinocultura')
      .replace(/Pecuária/g, 'Bovinocultura')
      .replace(/pecuária/g, 'bovinocultura')
      .replace(/Pecuaria/g, 'Bovinocultura')
      .replace(/'pecuaria'/g, "'bovinocultura'")
      .replace(/pecuaria_/g, "bovinocultura_");
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Updated ' + filePath);
    }
  }
});
