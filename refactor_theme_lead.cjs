const fs = require('fs');
const path = require('path');

const filePath = 'c:/Saas/src/pages/LandingPage/components/LeadFormSection.tsx';
if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/#080d14/g, 'rgb(var(--landing-bg-main))');
  content = content.replace(/#fff(fff)?([^a-zA-Z0-9_-])/g, 'rgb(var(--landing-text-main))');
  content = content.replace(/rgba\(255,\s*255,\s*255,/g, 'rgba(var(--landing-text-main),');
  content = content.replace(/rgba\(0,\s*184,\s*101,/g, 'rgba(var(--landing-brand),');
  content = content.replace(/#00b865/ig, 'rgb(var(--landing-brand))');
  fs.writeFileSync(filePath, content);
  console.log('Processed', filePath);
}
