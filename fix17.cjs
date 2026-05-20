const fs = require('fs');

const authFile = 'c:/Saas/src/contexts/AuthContext.tsx';
if (fs.existsSync(authFile)) {
  let content = fs.readFileSync(authFile, 'utf8').replace(/\r\n/g, '\n');

  // Replace async callback with normal callback and promise chain
  const searchAuthChange = `    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          role: 'admin'
        });
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalData) {
          setAal(aalData.currentLevel);
        } else {
          setAal('aal1');
        }
      } else {
        setUser(null);
        setAal(null);
      }
      setLoading(false);
    });`;

  const replaceAuthChange = `    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          role: 'admin'
        });
        
        // Fetch AAL asynchronously without blocking the gotrue-js lock manager
        supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data: aalData }) => {
          if (aalData) {
            setAal(aalData.currentLevel);
          } else {
            setAal('aal1');
          }
        }).catch(console.error);
        
      } else {
        setUser(null);
        setAal(null);
      }
      setLoading(false);
    });`;

  content = content.replace(searchAuthChange, replaceAuthChange);
  content = content.split('\n').join('\r\n');
  fs.writeFileSync(authFile, content, 'utf8');
  console.log('Patched AuthContext.tsx to remove async deadlock');
} else {
  console.log('AuthContext.tsx not found');
}
