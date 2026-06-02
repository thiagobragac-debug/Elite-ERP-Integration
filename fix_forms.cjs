const fs = require('fs');

function fixForm(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Replace old grid headers with sections
  content = content.replace(/<div className="form-group full-width" style={{ display: 'grid', gridTemplateColumns: '1fr 190px', gap: '16px', border: 'none', padding: 0, background: 'transparent' }}>/,
    `<section className="tauze-form-section">\n        <div className="tauze-section-header">\n          <div className="tauze-section-badge">PASSO 01</div>\n          <h4 className="tauze-section-title">Dados Básicos</h4>\n        </div>\n        <div className="tauze-input-grid grid-col-2">`);

  content = content.replace(/<div className="form-group full-width" style={{ display: 'grid', gridTemplateColumns: '1fr 1\\.5fr', gap: '16px', border: 'none', padding: 0, background: 'transparent' }}>/,
    `</div>\n        <div className="tauze-input-grid grid-col-2" style={{ marginTop: '16px' }}>`);

  content = content.replace(/<div className="form-section-title full-width">\s*<MapPin size={16} \/>\s*<span>Endereço Completo<\/span>\s*<\/div>\s*<div className="form-group full-width" style={{ display: 'grid', gridTemplateColumns: '1\\.2fr 1fr 3fr', gap: '16px', border: 'none', padding: 0, background: 'transparent' }}>/m,
    `</div>\n      </section>\n\n      <section className="tauze-form-section">\n        <div className="tauze-section-header">\n          <div className="tauze-section-badge">PASSO 02</div>\n          <h4 className="tauze-section-title">Endereço</h4>\n        </div>\n        <div className="tauze-input-grid grid-col-3">`);

  content = content.replace(/<div className="form-group full-width" style={{ display: 'grid', gridTemplateColumns: '1fr 1\\.5fr 2fr', gap: '16px', border: 'none', padding: 0, background: 'transparent' }}>/,
    `</div>\n        <div className="tauze-input-grid grid-col-3" style={{ marginTop: '16px' }}>`);

  content = content.replace(/<div className="form-group full-width" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1\\.5fr', gap: '16px', border: 'none', padding: 0, background: 'transparent' }}>/,
    `</div>\n        <div className="tauze-input-grid grid-col-3" style={{ marginTop: '16px' }}>`);

  content = content.replace(/<div className="form-group full-width" style={{ display: 'grid', gridTemplateColumns: '1fr 1\\.5fr', gap: '24px', alignItems: 'start', border: 'none', padding: 0, background: 'transparent', marginTop: '12px' }}>\s*{\/\* Left Column \*\/}\s*<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>\s*<div className="form-section-title full-width" style={{ marginBottom: 0 }}>\s*<CreditCard size={16} \/>\s*<span>Parâmetros Financeiros<\/span>\s*<\/div>/m,
    `</div>\n      </section>\n\n      <section className="tauze-form-section">\n        <div className="tauze-section-header">\n          <div className="tauze-section-badge">PASSO 03</div>\n          <h4 className="tauze-section-title">Configurações</h4>\n        </div>\n        <div className="tauze-input-grid grid-col-2">\n        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>`);

  content = content.replace(/<div className="form-section-title full-width" style={{ marginBottom: 0 }}>\s*<Building2 size={16} \/>\s*<span>Abrangência e Visibilidade<\/span>\s*<\/div>/, '');

  content = content.replace(/<\/div>\s*<style>{`/m, `</div>\n        </div>\n      </section>\n\n      <style>{\``);

  // Replace inner form-groups with tauze-field-group
  content = content.replace(/<div className="form-group" style={{ margin: 0, padding: 0, border: 'none', background: 'transparent', gridColumn: 'span 1' }}>/g, '<div className="tauze-field-group">');
  content = content.replace(/<div className="form-group full-width" style={{ marginBottom: 0 }}>/g, '<div className="tauze-field-group full-width">');
  
  content = content.replace(/<input /g, '<input className="tauze-input" ');
  content = content.replace(/<input className="tauze-input" type="checkbox"/g, '<input type="checkbox"');
  
  fs.writeFileSync(file, content);
  console.log(`Fixed ${file}`);
}

fixForm('c:/Saas/src/components/Forms/ClientForm.tsx');
fixForm('c:/Saas/src/components/Forms/SupplierForm.tsx');
