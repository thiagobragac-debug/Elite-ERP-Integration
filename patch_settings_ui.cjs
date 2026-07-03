const fs = require('fs');
const filePath = 'c:/Saas/src/pages/Admin/SaaSAdminPanel/components/LandingPageSettings.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetStr =                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--text-primary))' }}>Exibir Mockup 
do Sistema</span>
                    <ToggleSwitch checked={showMockup} onChange={setShowMockup} size="sm" />
                  </div>
                </div>;
                
const replacement =                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--text-primary))' }}>Exibir Mockup do Sistema</span>
                    <ToggleSwitch checked={showMockup} onChange={setShowMockup} size="sm" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--text-primary))' }}>Tema Padrão da Landing Page</span>
                    <select
                      className="tauze-input"
                      style={{ width: 120, padding: '4px 8px' }}
                      value={defaultTheme}
                      onChange={e => setDefaultTheme(e.target.value as 'light' | 'dark')}
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                    </select>
                  </div>
                </div>;

content = content.replace(targetStr.replace(/\r\n/g, '\n'), replacement);
fs.writeFileSync(filePath, content);
