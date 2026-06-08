const fs = require('fs');
let content = fs.readFileSync('c:/Saas/src/pages/Admin/UserManagement.tsx', 'utf8');

content = content.replace(/\s*const \[searchParams\] = useSearchParams\(\);\n/, '\n');

content = content.replace(
  /const \[searchTerm, setSearchTerm\] = useState\(''\);/,
  `const [searchTerm, setSearchTerm] = useState('');\n  const [searchParams, setSearchParams] = useSearchParams();\n  const activeTab = searchParams.get('tab') || 'users';\n  const setActiveTab = (tab: string) => { searchParams.set('tab', tab); setSearchParams(searchParams); };`
);

fs.writeFileSync('c:/Saas/src/pages/Admin/UserManagement.tsx', content, 'utf8');
