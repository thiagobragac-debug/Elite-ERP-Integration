const fs = require('fs');
const path = require('path');

// Revert custom projections back to select('*') keeping .limit(500)
// These were projections that may reference non-existent columns

const fixList = [
  {
    file: 'src/pages/Pecuaria/WeightManagement.tsx',
    from: ".select('id, peso, data_pesagem, tipo, animal_id, lote_id, observacao, fazenda_id, tenant_id, created_at, animais:animal_id(id, brinco)')",
    to: ".select('*, animais:animal_id(id, brinco)')"
  },
  {
    file: 'src/pages/Sales/SalesOrders.tsx',
    from: ".select('id, numero, status, created_at, valor_total, observacoes, cliente_id, fazenda_id, tenant_id, clientes(nome)')",
    to: ".select('*, clientes(nome)')"
  },
  {
    file: 'src/pages/Sales/Contracts.tsx',
    from: ".select('id, numero_contrato, tipo, status, data_inicio, data_fim, valor_total, cliente_id, fornecedor_id, fazenda_id, tenant_id, clientes(nome)')",
    to: ".select('*, clientes(nome)')"
  },
  {
    file: 'src/pages/Sales/Invoices.tsx',
    from: ".select('id, numero_nota, serie, status, data_emissao, valor_total, natureza_operacao, cliente_id, fazenda_id, tenant_id, clientes(nome)')",
    to: ".select('*, clientes(nome)')"
  },
  {
    file: 'src/pages/Fleet/FuelManagement.tsx',
    from: ".select('id, data, litros, valor_total, tipo_combustivel, responsavel, valor_medidor, maquina_id, fazenda_id, tenant_id, maquinas:maquina_id(nome)')",
    to: ".select('*, maquinas:maquina_id(nome)')"
  },
];

let fixed = 0;
for (const { file, from, to } of fixList) {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); continue; }
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes(from)) {
    content = content.replace(from, to);
    fs.writeFileSync(file, content);
    console.log('Reverted:', file);
    fixed++;
  } else {
    console.log('No match:', file);
  }
}
console.log('\nReverted', fixed, 'files. All queries now use select(*) with .limit(500)');
