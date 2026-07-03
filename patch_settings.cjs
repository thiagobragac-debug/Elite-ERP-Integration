const fs = require('fs');
const filePath = 'c:/Saas/src/pages/Admin/SaaSAdminPanel/components/LandingPageSettings.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add state
content = content.replace(
  'const [showFaq, setShowFaq] = useState(settings.landing_show_faq ?? true);',
  'const [showFaq, setShowFaq] = useState(settings.landing_show_faq ?? true);\n  const [defaultTheme, setDefaultTheme] = useState(settings.landing_default_theme || "dark");'
);

// Update useEffect 1
content = content.replace(
  'setShowFaq(settings.landing_show_faq ?? true);',
  'setShowFaq(settings.landing_show_faq ?? true);\n      setDefaultTheme(settings.landing_default_theme || "dark");'
);

// Update useEffect 2
content = content.replace(
  'showFaq !== (settings.landing_show_faq ?? true);',
  'showFaq !== (settings.landing_show_faq ?? true) ||\n        defaultTheme !== (settings.landing_default_theme || "dark");'
);

// Update useEffect 2 deps
content = content.replace(
  'socialYoutube, showTicker, showMockup, showFaq, settings',
  'socialYoutube, showTicker, showMockup, showFaq, defaultTheme, settings'
);

// Update handleSave
content = content.replace(
  'landing_show_faq: showFaq,',
  'landing_show_faq: showFaq,\n          landing_default_theme: defaultTheme,'
);

fs.writeFileSync(filePath, content);
