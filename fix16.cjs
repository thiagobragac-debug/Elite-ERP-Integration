const fs = require('fs');

const authFile = 'c:/Saas/src/contexts/AuthContext.tsx';
if (fs.existsSync(authFile)) {
  let content = fs.readFileSync(authFile, 'utf8').replace(/\r\n/g, '\n');

  content = content.replace(
    `  aal: 'aal1' | 'aal2' | null;\n  login:`,
    `  aal: 'aal1' | 'aal2' | null;\n  setAal: (level: 'aal1' | 'aal2' | null) => void;\n  login:`
  );

  content = content.replace(
    `value={{ user, isAuthenticated: !!user, aal, login, logout, loading }}`,
    `value={{ user, isAuthenticated: !!user, aal, setAal, login, logout, loading }}`
  );

  content = content.split('\n').join('\r\n');
  fs.writeFileSync(authFile, content, 'utf8');
  console.log('Patched AuthContext.tsx');
}

const mfaFile = 'c:/Saas/src/pages/Auth/MFAEnroll.tsx';
if (fs.existsSync(mfaFile)) {
  let content = fs.readFileSync(mfaFile, 'utf8').replace(/\r\n/g, '\n');

  // Add setAal extraction
  content = content.replace(
    `const { user } = useAuth();`,
    `const { user, setAal } = useAuth();`
  );

  // Use setAal in handleVerify
  content = content.replace(
    `      setStep('success');\n      setTimeout(() => navigate('/'), 2000);`,
    `      setStep('success');\n      if (setAal) setAal('aal2');\n      setTimeout(() => navigate('/'), 2000);`
  );

  content = content.split('\n').join('\r\n');
  fs.writeFileSync(mfaFile, content, 'utf8');
  console.log('Patched MFAEnroll.tsx');
}
