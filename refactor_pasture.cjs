const fs = require('fs');

function refactorPasture(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Replace old inputs
  content = content.replace(/<div className="form-group">/g, '<div className="tauze-field-group">');
  content = content.replace(/<div className="form-group full-width">/g, '<div className="tauze-field-group full-width">');
  
  // Handle inputs
  content = content.replace(/<input /g, '<input className="tauze-input" ');
  content = content.replace(/<textarea /g, '<textarea className="tauze-input tauze-textarea" ');
  
  // Handle labels
  content = content.replace(/<label>/g, '<label className="tauze-label">');

  // Inject sections
  content = content.replace(/<div className="tauze-field-group">\s*<label className="tauze-label"><Map size={14} \/> Selecionar Fazenda \/ Unidade<\/label>/m, 
    `<section className="tauze-form-section">\n        <div className="tauze-section-header">\n          <div className="tauze-section-badge">PASSO 01</div>\n          <h4 className="tauze-section-title">Dados Principais</h4>\n        </div>\n        <div className="tauze-input-grid grid-col-2">\n      <div className="tauze-field-group">
        <label className="tauze-label"><Map size={14} /> Selecionar Fazenda / Unidade</label>`);

  content = content.replace(/<div className="tauze-field-group">\s*<label className="tauze-label"><Trees size={14} \/> Tipo de Capim<\/label>/m, 
    `</div>\n      </section>\n\n      <section className="tauze-form-section">\n        <div className="tauze-section-header">\n          <div className="tauze-section-badge">PASSO 02</div>\n          <h4 className="tauze-section-title">Condições da Pastagem</h4>\n        </div>\n        <div className="tauze-input-grid grid-col-2">\n      <div className="tauze-field-group">\n        <label className="tauze-label"><Trees size={14} /> Tipo de Capim</label>`);

  content = content.replace(/<div className="tauze-field-group">\s*<label className="tauze-label"><Map size={14} \/> Topografia<\/label>/m, 
    `</div>\n      </section>\n\n      <section className="tauze-form-section">\n        <div className="tauze-section-header">\n          <div className="tauze-section-badge">PASSO 03</div>\n          <h4 className="tauze-section-title">Características da Área</h4>\n        </div>\n        <div className="tauze-input-grid grid-col-3">\n      <div className="tauze-field-group">\n        <label className="tauze-label"><Map size={14} /> Topografia</label>`);

  content = content.replace(/<div className="tauze-field-group">\s*<label className="tauze-label"><Shield size={14} \/> Estado da Cerca<\/label>/m, 
    `</div>\n      </section>\n\n      <section className="tauze-form-section">\n        <div className="tauze-section-header">\n          <div className="tauze-section-badge">PASSO 04</div>\n          <h4 className="tauze-section-title">Infraestrutura & Saúde</h4>\n        </div>\n        <div className="tauze-input-grid grid-col-2">\n      <div className="tauze-field-group">\n        <label className="tauze-label"><Shield size={14} /> Estado da Cerca</label>`);

  content = content.replace(/<\/div>\s*<\/SidePanel>/m, 
    `</div>\n      </section>\n    </SidePanel>`);

  content = content.replace(/style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '12px', border: '1px solid var\(--border\)', background: 'var\(--bg-input\)' }}/g, 'rows={3}');
  
  content = content.replace(/<div className="tauze-field-group full-width">/g, '<div className="tauze-field-group" style={{ gridColumn: \'span 2\' }}>');

  fs.writeFileSync(file, content);
  console.log(`Fixed ${file}`);
}

refactorPasture('c:/Saas/src/components/Forms/PastureForm.tsx');
