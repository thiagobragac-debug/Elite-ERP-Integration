const fs = require('fs');

// Adds real-time CPF/CNPJ validation to both forms
const addDocValidation = (filePath, hookVar) => {
  if (!fs.existsSync(filePath)) { console.log('Not found:', filePath); return; }
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add docStatus computed after the useTenant line
  const tenantLine = "const { farms, activeTenantId, activeFarm } = useTenant();";
  const docStatusCode = `
  // Real-time CPF/CNPJ validation status
  const docStatus = (() => {
    const clean = ${hookVar}.replace(/\\D/g, '');
    if (!clean) return 'empty';
    if (clean.length < 11) return 'typing';
    return isValidDocument(${hookVar}) ? 'valid' : 'invalid';
  })();`;
  
  if (!content.includes('docStatus')) {
    content = content.replace(tenantLine, tenantLine + docStatusCode);
  }

  // 2. Add visual badge inside the CNPJ input wrapper — after the search button closing tag
  // Find the pattern: the button that searches CNPJ, then close div
  const searchBtnClose = `              title="Buscar dados na Receita"`;
  const badgeCode = `
              data-doc-status={docStatus}`;

  // Add border color to the input based on docStatus
  const cnpjInputOriginal = `value={${hookVar === 'formData.cnpj' ? 'formData.cnpj' : 'formData.cnpj'}}
              onChange={(e) => setFormData({...formData, cnpj: maskCPFCNPJ(e.target.value)})}
              onBlur={handleCNPJSearch}
              className="flex-1"`;

  const cnpjInputReplaced = `value={formData.cnpj}
              onChange={(e) => setFormData({...formData, cnpj: maskCPFCNPJ(e.target.value)})}
              onBlur={handleCNPJSearch}
              className="flex-1"
              style={{
                borderColor: docStatus === 'valid' ? '#10b981' : docStatus === 'invalid' ? '#ef4444' : undefined,
                paddingRight: docStatus !== 'empty' && docStatus !== 'typing' ? '80px' : undefined
              }}`;

  content = content.replace(cnpjInputOriginal, cnpjInputReplaced);

  // 3. Add the badge overlay after the search button
  const searchBtnBlock = `            {loading ? <div className="spinner-tiny" /> : <Search size={18} />}
            </button>
          </div>`;
  const searchBtnWithBadge = `            {loading ? <div className="spinner-tiny" /> : <Search size={18} />}
            </button>
            {(docStatus === 'valid' || docStatus === 'invalid') && (
              <span style={{
                position: 'absolute',
                right: '50px',
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: '6px',
                letterSpacing: '0.04em',
                background: docStatus === 'valid' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                color: docStatus === 'valid' ? '#10b981' : '#ef4444',
                pointerEvents: 'none',
                whiteSpace: 'nowrap'
              }}>
                {docStatus === 'valid' ? '✓ VÁLIDO' : '✗ INVÁLIDO'}
              </span>
            )}
          </div>`;

  content = content.replace(searchBtnBlock, searchBtnWithBadge);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Done:', filePath);
};

addDocValidation('C:/Saas/src/components/Forms/ClientForm.tsx', 'formData.cnpj');
addDocValidation('C:/Saas/src/components/Forms/SupplierForm.tsx', 'formData.cnpj');
