const fs = require('fs');

const fixForm = (path) => {
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');

  // Replace 1: activeFarm destructure
  if (!content.includes('activeFarm } = useTenant()')) {
    content = content.replace('const { farms, activeTenantId } = useTenant();', 'const { farms, activeTenantId, activeFarm } = useTenant();');
  }
  
  // Replace 2: defaults
  content = content.replace(/is_global: true,\s*fazendas_vinculadas: \[\]/g, 'is_global: activeFarm ? false : true,\n        fazendas_vinculadas: activeFarm ? [activeFarm.id] : []');

  // Replace 3: useEffect deps
  content = content.replace(/\}, \[initialData, isOpen\]\);/g, '}, [initialData, isOpen, activeFarm]);');

  // Replace 4: Validation in handleSubmit
  const validationSearch = "alert('❌ O CPF ou CNPJ informado é inválido. Verifique os números e tente novamente.');\n      return;\n    }";
  const validationStr = `alert('❌ O CPF ou CNPJ informado é inválido. Verifique os números e tente novamente.');
      return;
    }
    if (!formData.is_global && (!formData.fazendas_vinculadas || formData.fazendas_vinculadas.length === 0)) {
      alert('❌ Selecione pelo menos uma fazenda (já que a opção Global está desmarcada).');
      return;
    }`;
  content = content.replace(validationSearch, validationStr);

  fs.writeFileSync(path, content, 'utf8');
  console.log('Fixed', path);
}

fixForm('C:/Saas/src/components/Forms/ClientForm.tsx');
fixForm('C:/Saas/src/components/Forms/SupplierForm.tsx');
