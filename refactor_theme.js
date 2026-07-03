const fs = require('fs');
const path = require('path');

const dirs = [
  'c:/Saas/src/pages',
  'c:/Saas/src/pages/LandingPage',
  'c:/Saas/src/pages/LandingPage/components'
];

const filesToProcess = [
  'LandingPage.tsx',
  'LandingPage.css',
  'HeroSection.tsx',
  'FeaturesSection.tsx',
  'InteractiveAppMockup.tsx',
  'PricingSection.tsx',
  'TestimonialsSection.tsx',
  'FAQSection.tsx',
  'FooterSection.tsx',
  'TickerSection.tsx',
  'WorkflowSection.tsx'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    if (filesToProcess.includes(file)) {
      const filePath = path.join(dir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      
      content = content.replace(/#080d14/g, 'rgb(var(--landing-bg-main))');
      content = content.replace(/#fff(fff)?([^a-zA-Z0-9_-])/g, 'rgb(var(--landing-text-main))');
      content = content.replace(/rgba\(255,\s*255,\s*255,/g, 'rgba(var(--landing-text-main),');
      content = content.replace(/rgba\(0,\s*184,\s*101,/g, 'rgba(var(--landing-brand),');
      content = content.replace(/#00b865/ig, 'rgb(var(--landing-brand))');
      
      fs.writeFileSync(filePath, content);
      console.log('Processed', filePath);
    }
  });
});
