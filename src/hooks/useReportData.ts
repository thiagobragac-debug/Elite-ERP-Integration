import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../contexts/TenantContext';

export interface ReportData {
  data: any[];
  stats: {
    label: string;
    value: string | number;
    change: string;
    trend: 'up' | 'down' | 'neutral';
  }[];
  columns: any[];
  loading: boolean;
  error: string | null;
}

export const fetchReportDataById = async (reportId: string, tenantId: string) => {
  let data: any[] = [];
  let stats: any[] = [];
  let columns: any[] = [];

  try {
    switch (reportId) {
      case 'performance-ponderal':
      case '1': { // Pecuária: Performance Ponderal
        const { data: pesagens, error: pError } = await supabase
          .from('pesagens')
          .select(`
            id,
            data_pesagem,
            peso,
            animais (brinco, lote_id)
          `)
          .eq('tenant_id', tenantId)
          .order('data_pesagem', { ascending: false })
          .limit(100);

        if (pError) throw pError;

        data = pesagens.map(p => ({
          id: p.id,
          brinco: p.animais?.brinco || 'N/A',
          evolucao: `${p.peso} kg`,
          gmd: '-', 
          data: new Date(p.data_pesagem).toLocaleDateString('pt-BR')
        }));

        columns = [
          { header: 'Animal / Brinco', accessor: 'brinco' },
          { header: 'Peso Registrado', accessor: 'evolucao' },
          { header: 'GMD (kg)', accessor: 'gmd' },
          { header: 'Data Pesagem', accessor: 'data' }
        ];

        const avgPeso = pesagens.reduce((acc, curr) => acc + (Number(curr.peso) || 0), 0) / (pesagens.length || 1);
        stats = [
          { label: 'Peso Médio Pesagem', value: `${avgPeso.toFixed(2)} kg`, change: '+2.1%', trend: 'up' },
          { label: 'Total Pesagens (Mês)', value: pesagens.length, change: '+12%', trend: 'up' },
          { label: 'Eficiência Global', value: '88%', change: '-0.5%', trend: 'down' }
        ];
        break;
      }

      case 'fluxo-caixa':
      case '6': { // Financeiro: Fluxo de Caixa
        const { data: finance, error: fError } = await supabase
          .from('contas_receber')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('data_vencimento', { ascending: false });

        if (fError) throw fError;

        data = finance.map(f => ({
          id: f.id,
          descricao: f.descricao,
          valor: f.valor_total,
          status: f.status,
          vencimento: new Date(f.data_vencimento).toLocaleDateString('pt-BR')
        }));

        columns = [
          { header: 'Descrição', accessor: 'descricao' },
          { header: 'Valor', accessor: 'valor' },
          { header: 'Vencimento', accessor: 'vencimento' },
          { header: 'Status', accessor: 'status' }
        ];

        const totalReceber = finance.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0);
        stats = [
          { label: 'Total a Receber', value: `R$ ${totalReceber.toLocaleString()}`, change: '+5%', trend: 'up' },
          { label: 'Liquidez Corrente', value: '1.24', change: '+0.02', trend: 'up' },
          { label: 'Inadimplência', value: '4.2%', change: '+1.1%', trend: 'down' }
        ];
        break;
      }

      case 'sanidade-animal':
      case '2': { // Pecuária: Sanidade
        const { data: sanidade, error: sError } = await supabase
          .from('sanidade')
          .select('*')
          .eq('tenant_id', tenantId)
          .limit(50);

        if (sError) throw sError;

        data = sanidade.map(s => ({
          id: s.id,
          vacina: s.produto || s.titulo,
          lote: s.lote_id || 'N/A',
          data: new Date(s.data_manejo).toLocaleDateString('pt-BR'),
          status: s.status
        }));

        columns = [
          { header: 'Medicamento/Vacina', accessor: 'vacina' },
          { header: 'Lote Aplicado', accessor: 'lote' },
          { header: 'Data Manejo', accessor: 'data' },
          { header: 'Status', accessor: 'status' }
        ];

        stats = [
          { label: 'Cobertura Sanitária', value: '98.5%', change: '+0.5%', trend: 'up' },
          { label: 'Aplicações (Mês)', value: sanidade.length, change: '+15%', trend: 'up' },
          { label: 'Custo Sanitário / UA', value: 'R$ 4.20', change: '-2%', trend: 'down' }
        ];
        break;
      }

      case 'consumo-frotas':
      case '11': { // Frotas: Abastecimento
        const { data: frota, error: frError } = await supabase
          .from('abastecimentos')
          .select('*, maquinas(nome)')
          .eq('tenant_id', tenantId)
          .limit(50);

        if (frError) throw frError;

        data = frota.map(f => ({
          id: f.id,
          maquina: f.maquinas?.nome || 'N/A',
          litros: `${f.litros} L`,
          valor: `R$ ${f.valor_total?.toLocaleString()}`,
          data: new Date(f.data).toLocaleDateString('pt-BR')
        }));

        columns = [
          { header: 'Equipamento', accessor: 'maquina' },
          { header: 'Volume', accessor: 'litros' },
          { header: 'Custo Total', accessor: 'valor' },
          { header: 'Data', accessor: 'data' }
        ];

        const totalLitros = frota.reduce((acc, curr) => acc + (Number(curr.litros) || 0), 0);
        stats = [
          { label: 'Consumo Total (L)', value: totalLitros.toLocaleString(), change: '+8%', trend: 'up' },
          { label: 'Média L/Hora', value: '14.2', change: '-1.2', trend: 'down' },
          { label: 'Custo Operacional', value: `R$ ${(totalLitros * 5.8).toLocaleString()}`, change: '+3%', trend: 'up' }
        ];
        break;
      }

      case 'movimentacao-estoque':
      case '16': { // Suprimentos: Estoque
        const { data: estoque, error: esError } = await supabase
          .from('movimentacoes_estoque')
          .select('*, produtos(nome)')
          .eq('tenant_id', tenantId)
          .limit(50);

        if (esError) throw esError;

        data = estoque.map(e => ({
          id: e.id,
          produto: e.produtos?.nome || 'N/A',
          tipo: e.tipo,
          qtd: e.quantidade,
          data: new Date(e.data_movimentacao).toLocaleDateString('pt-BR')
        }));

        columns = [
          { header: 'Insumo', accessor: 'produto' },
          { header: 'Tipo', accessor: 'tipo' },
          { header: 'Quantidade', accessor: 'qtd' },
          { header: 'Data', accessor: 'data' }
        ];

        stats = [
          { label: 'Giro de Estoque', value: '4.2x', change: '+0.5', trend: 'up' },
          { label: 'Rupturas (Mês)', value: '0', change: '-100%', trend: 'up' },
          { label: 'Valor em Estoque', value: 'R$ 452.000', change: '+12%', trend: 'up' }
        ];
        break;
      }

      case '8': { // Financeiro: Contas a Pagar
        const { data: pagar, error: pErr } = await supabase
          .from('contas_pagar')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('data_vencimento', { ascending: true });
        if (pErr) throw pErr;
        data = pagar.map(p => ({ id: p.id, desc: p.descricao, valor: p.valor_total, data: new Date(p.data_vencimento).toLocaleDateString('pt-BR'), status: p.status }));
        columns = [{ header: 'Descrição', accessor: 'desc' }, { header: 'Valor', accessor: 'valor' }, { header: 'Vencimento', accessor: 'data' }, { header: 'Status', accessor: 'status' }];
        const totalPagar = pagar.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0);
        stats = [{ label: 'Total a Pagar', value: `R$ ${totalPagar.toLocaleString()}`, change: '-2%', trend: 'down' }, { label: 'Comprometimento', value: '64%', change: '+5%', trend: 'up' }, { label: 'Dívida CP', value: `R$ ${(totalPagar * 0.4).toLocaleString()}`, change: '0%', trend: 'neutral' }];
        break;
      }

      case '10': { // Financeiro: Extrato Bancário
        const { data: contas, error: cError } = await supabase
          .from('contas_bancarias')
          .select('*')
          .eq('tenant_id', tenantId);
        if (cError) throw cError;
        data = contas.map(c => ({ id: c.id, banco: c.banco, conta: c.conta, saldo: c.saldo_atual, tipo: c.tipo }));
        columns = [{ header: 'Banco', accessor: 'banco' }, { header: 'Conta', accessor: 'conta' }, { header: 'Tipo', accessor: 'tipo' }, { header: 'Saldo Atual', accessor: 'saldo' }];
        const totalSaldo = contas.reduce((acc, curr) => acc + (Number(curr.saldo_atual) || 0), 0);
        stats = [{ label: 'Saldo Consolidado', value: `R$ ${totalSaldo.toLocaleString()}`, change: '+1.2%', trend: 'up' }, { label: 'Contas Ativas', value: contas.length, change: '0', trend: 'neutral' }, { label: 'Liquidez Imediata', value: `R$ ${totalSaldo.toLocaleString()}`, change: '+1.2%', trend: 'up' }];
        break;
      }

      case '12': { // Frotas: Manutenções
        const { data: manut, error: mError } = await supabase
          .from('manutencao_frota')
          .select('*, maquinas(nome)')
          .eq('tenant_id', tenantId);
        if (mError) throw mError;
        data = manut.map(m => ({ id: m.id, maq: m.maquinas?.nome || 'N/A', tipo: m.tipo, valor: m.custo, data: new Date(m.data_inicio).toLocaleDateString('pt-BR') }));
        columns = [{ header: 'Equipamento', accessor: 'maq' }, { header: 'Tipo', accessor: 'tipo' }, { header: 'Custo', accessor: 'valor' }, { header: 'Data', accessor: 'data' }];
        const totalManut = manut.reduce((acc, curr) => acc + (Number(curr.custo) || 0), 0);
        stats = [{ label: 'Custo Oficina', value: `R$ ${totalManut.toLocaleString()}`, change: '+15%', trend: 'up' }, { label: 'Intervenções', value: manut.length, change: '+2', trend: 'up' }, { label: 'Declinio Prod.', value: '12%', change: '+2%', trend: 'down' }];
        break;
      }

      case '14': { // Suprimentos: Inventário
        const { data: inv, error: iError } = await supabase
          .from('produtos')
          .select('*')
          .eq('tenant_id', tenantId);
        if (iError) throw iError;
        data = inv.map(i => ({ id: i.id, nome: i.nome, qtd: i.estoque_atual, un: i.unidade_medida || i.unidade, valor: i.custo_medio }));
        columns = [{ header: 'Produto', accessor: 'nome' }, { header: 'Estoque', accessor: 'qtd' }, { header: 'Unidade', accessor: 'un' }, { header: 'Custo Médio', accessor: 'valor' }];
        const totalInv = inv.reduce((acc, curr) => acc + (Number(curr.estoque_atual) * Number(curr.custo_medio) || 0), 0);
        stats = [{ label: 'Patrimônio Estoque', value: `R$ ${totalInv.toLocaleString()}`, change: '+4%', trend: 'up' }, { label: 'Itens em Falta', value: '2', change: '-50%', trend: 'up' }, { label: 'Acuracidade', value: '99.2%', change: '+0.1%', trend: 'up' }];
        break;
      }

      case '17': { // Vendas: Pedidos
        const { data: vendas, error: vError } = await supabase
          .from('pedidos_venda')
          .select('*, clientes(nome)')
          .eq('tenant_id', tenantId);
        if (vError) throw vError;
        data = vendas.map(v => ({ id: v.id, cliente: v.clientes?.nome || 'N/A', total: v.valor_total, status: v.status, data: new Date(v.created_at).toLocaleDateString('pt-BR') }));
        columns = [{ header: 'Cliente', accessor: 'cliente' }, { header: 'Total', accessor: 'total' }, { header: 'Status', accessor: 'status' }, { header: 'Data', accessor: 'data' }];
        const totalVendas = vendas.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
        stats = [{ label: 'Vendas (Mês)', value: `R$ ${totalVendas.toLocaleString()}`, change: '+22%', trend: 'up' }, { label: 'Ticket Médio', value: `R$ ${(totalVendas / (vendas.length || 1)).toLocaleString()}`, change: '+5%', trend: 'up' }, { label: 'Conversão', value: '68%', change: '+12%', trend: 'up' }];
        break;
      }

      case '20': { // Clientes
        const { data: cls, error: clError } = await supabase
          .from('clientes')
          .select('*')
          .eq('tenant_id', tenantId);
        if (clError) throw clError;
        data = cls.map(c => ({ id: c.id, nome: c.nome, cnpj: c.documento, cidade: c.cidade }));
        columns = [{ header: 'Cliente', accessor: 'nome' }, { header: 'CNPJ/CPF', accessor: 'cnpj' }, { header: 'Cidade', accessor: 'cidade' }];
        stats = [{ label: 'Base Clientes', value: cls.length, change: '+1', trend: 'up' }, { label: 'Ativos', value: cls.length, change: '0', trend: 'neutral' }, { label: 'Churn Rate', value: '0%', change: '0%', trend: 'neutral' }];
        break;
      }

      case '21': { // Governança: Audit Logs
        const { data: logs, error: lError } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(50);
        if (lError) throw lError;
        data = logs.map(l => ({ id: l.id, acao: l.action, modulo: l.table_name, user: l.user_id, data: new Date(l.created_at).toLocaleString('pt-BR') }));
        columns = [{ header: 'Ação', accessor: 'acao' }, { header: 'Módulo', accessor: 'modulo' }, { header: 'Usuário', accessor: 'user' }, { header: 'Data/Hora', accessor: 'data' }];
        stats = [{ label: 'Ações Hoje', value: logs.length, change: '+5%', trend: 'up' }, { label: 'Severidade Alta', value: '0', change: '0', trend: 'neutral' }, { label: 'Integridade', value: '100%', change: '0', trend: 'neutral' }];
        break;
      }

      case '3': { // Pecuária: Pastagens
        const { data: pastos, error: pasError } = await supabase
          .from('pastos')
          .select('*, animais(count)')
          .eq('tenant_id', tenantId);
        if (pasError) throw pasError;
        data = pastos.map(p => ({ id: p.id, nome: p.nome, area: `${p.area} ha`, lotacao: `${(p.animais?.[0]?.count || 0) / (Number(p.area) || 1).toFixed(2)} UA/ha` }));
        columns = [{ header: 'Pasto', accessor: 'nome' }, { header: 'Área', accessor: 'area' }, { header: 'Lotação Atual', accessor: 'lotacao' }];
        stats = [{ label: 'Área Total', value: `${pastos.reduce((acc, curr) => acc + (Number(curr.area) || 0), 0)} ha`, change: '0', trend: 'neutral' }, { label: 'Média Lotação', value: '1.2 UA/ha', change: '+5%', trend: 'up' }, { label: 'Pastos em Descanso', value: '2', change: '-1', trend: 'down' }];
        break;
      }

      case '7': { // Financeiro: DRE
        const { data: rec } = await supabase.from('contas_receber').select('valor_total').eq('tenant_id', tenantId).eq('status', 'Efetivado');
        const { data: pagDre } = await supabase.from('contas_pagar').select('valor_total').eq('tenant_id', tenantId).eq('status', 'Efetivado');
        const totalRec = rec?.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0) || 0;
        const totalPag = pagDre?.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0) || 0;
        data = [
          { id: 1, cat: 'Receita Bruta', valor: totalRec },
          { id: 2, cat: 'Despesas Operacionais', valor: totalPag },
          { id: 3, cat: 'Resultado Líquido', valor: totalRec - totalPag }
        ];
        columns = [{ header: 'Categoria', accessor: 'cat' }, { header: 'Valor Consolidado', accessor: (item: any) => `R$ ${item.valor.toLocaleString()}` }];
        stats = [{ label: 'Margem Líquida', value: `${(((totalRec - totalPag) / (totalRec || 1)) * 100).toFixed(1)}%`, change: '+2%', trend: 'up' }, { label: 'Ponto de Equilíbrio', value: 'Atingido', change: 'OK', trend: 'up' }, { label: 'EBITDA Est.', value: `R$ ${(totalRec - totalPag * 0.8).toLocaleString()}`, change: '+4%', trend: 'up' }];
        break;
      }

      case '13': { // Frotas: Custo Total
        const { data: cMaquinas } = await supabase.from('maquinas').select('id, nome').eq('tenant_id', tenantId);
        const { data: cAbast } = await supabase.from('abastecimentos').select('maquina_id, valor_total').eq('tenant_id', tenantId);
        const { data: cManut } = await supabase.from('manutencao_frota').select('maquina_id, custo').eq('tenant_id', tenantId);
        data = cMaquinas?.map(m => {
          const abast = cAbast?.filter(a => a.maquina_id === m.id).reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0) || 0;
          const manut = cManut?.filter(ma => ma.maquina_id === m.id).reduce((acc, curr) => acc + (Number(curr.custo) || 0), 0) || 0;
          return { id: m.id, nome: m.nome, total: abast + manut, abast, manut };
        }) || [];
        columns = [{ header: 'Máquina', accessor: 'nome' }, { header: 'Combustível', accessor: 'abast' }, { header: 'Manutenção', accessor: 'manut' }, { header: 'Custo Total', accessor: 'total' }];
        stats = [{ label: 'Custo Total Frota', value: `R$ ${data.reduce((acc, curr) => acc + curr.total, 0).toLocaleString()}`, change: '+8%', trend: 'up' }, { label: 'Máquina + Cara', value: data.sort((a,b) => b.total - a.total)[0]?.nome || 'N/A', change: 'Alerta', trend: 'down' }, { label: 'Eficiência R$', value: 'R$ 42/hora', change: '-5%', trend: 'down' }];
        break;
      }

      case '22': { // Governança: Usuários
        const { data: users, error: uError } = await supabase
          .from('perfis_usuario')
          .select('*')
          .eq('tenant_id', tenantId);
        if (uError) throw uError;
        data = users.map(u => ({ id: u.id, nome: u.nome, cargo: u.cargo, status: u.ativo ? 'Ativo' : 'Inativo' }));
        columns = [{ header: 'Colaborador', accessor: 'nome' }, { header: 'Cargo/Função', accessor: 'cargo' }, { header: 'Status', accessor: 'status' }];
        stats = [{ label: 'Total Equipe', value: users.length, change: '0', trend: 'neutral' }, { label: 'Acessos Hoje', value: '4', change: '+1', trend: 'up' }, { label: 'Licenças', value: '10', change: '4 livres', trend: 'neutral' }];
        break;
      }

      case '15': { // Suprimentos: Compras
        const { data: compras, error: comError } = await supabase.from('pedidos_compra').select('*, fornecedores(nome)').eq('tenant_id', tenantId);
        if (comError) throw comError;
        data = compras.map(c => ({ id: c.id, forn: c.fornecedores?.nome || 'N/A', total: c.valor_total, status: c.status, data: new Date(c.created_at).toLocaleDateString('pt-BR') }));
        columns = [{ header: 'Fornecedor', accessor: 'forn' }, { header: 'Total', accessor: 'total' }, { header: 'Status', accessor: 'status' }, { header: 'Data', accessor: 'data' }];
        stats = [{ label: 'Volume Compras', value: `R$ ${compras.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0).toLocaleString()}`, change: '+10%', trend: 'up' }, { label: 'Pedidos Pendentes', value: compras.filter(c => c.status === 'Pendente').length, change: '-2', trend: 'up' }, { label: 'Economia (Saving)', value: 'R$ 12.400', change: '+5%', trend: 'up' }];
        break;
      }

      case '4': { // Pecuária: Confinamento
        const { data: conf, error: confError } = await supabase.from('confinamento').select('*').eq('tenant_id', tenantId);
        if (confError) throw confError;
        data = conf.map(c => ({ id: c.id, lote: c.nome_curral, entrada: new Date(c.data_inicio).toLocaleDateString('pt-BR'), dias: c.dof_alvo, gmd: '1.25' }));
        columns = [{ header: 'Curral/Lote', accessor: 'lote' }, { header: 'Data Início', accessor: 'entrada' }, { header: 'DOF Alvo', accessor: 'dias' }, { header: 'GMD Médio', accessor: 'gmd' }];
        stats = [{ label: 'Animais Confinados', value: '450', change: '+50', trend: 'up' }, { label: 'Conversão Alimentar', value: '6.2:1', change: '-0.2', trend: 'up' }, { label: 'Custo Diária (R$)', value: 'R$ 14.50', change: '+2%', trend: 'down' }];
        break;
      }

      case '5': { // Pecuária: Reprodução
        const { data: reprod, error: repError } = await supabase.from('eventos_reprodutivos').select('*').eq('tenant_id', tenantId);
        if (repError) throw repError;
        data = reprod.map(r => ({ id: r.id, animal: r.animal_id, tipo: r.tipo_evento, data: new Date(r.data_evento).toLocaleDateString('pt-BR'), resultado: r.resultado || 'Pendente' }));
        columns = [{ header: 'Matriz', accessor: 'animal' }, { header: 'Evento', accessor: 'tipo' }, { header: 'Data', accessor: 'data' }, { header: 'Resultado', accessor: 'resultado' }];
        stats = [{ label: 'Taxa de Prenhez', value: '82%', change: '+2%', trend: 'up' }, { label: 'Inseminações (Mês)', value: reprod.length, change: '+10', trend: 'up' }, { label: 'Intervalo Partos', value: '13.2 meses', change: '-0.5', trend: 'up' }];
        break;
      }

      case '18': { // Vendas: Notas Fiscais
        const { data: notas, error: nError } = await supabase.from('notas_saida').select('*').eq('tenant_id', tenantId);
        if (nError) throw nError;
        data = notas.map(n => ({ id: n.id, numero: n.numero_nota, cliente: n.cliente_id, valor: n.valor_total, data: new Date(n.data_emissao).toLocaleDateString('pt-BR') }));
        columns = [{ header: 'Número NF', accessor: 'numero' }, { header: 'Cliente', accessor: 'cliente' }, { header: 'Valor', accessor: 'valor' }, { header: 'Emissão', accessor: 'data' }];
        stats = [{ label: 'Faturamento Total', value: `R$ ${notas.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0).toLocaleString()}`, change: '+15%', trend: 'up' }, { label: 'Impostos (Est.)', value: `R$ ${(notas.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0) * 0.12).toLocaleString()}`, change: '+15%', trend: 'down' }, { label: 'Notas Emitidas', value: notas.length, change: '+12', trend: 'up' }];
        break;
      }

      case '19': { // Comissões
        const { data: comVendas } = await supabase.from('pedidos_venda').select('*').eq('tenant_id', tenantId);
        const cData = comVendas?.map(v => ({ id: v.id, ref: `PED-${v.id}`, total: v.valor_total, comissao: (Number(v.valor_total) || 0) * 0.03, data: new Date(v.created_at).toLocaleDateString('pt-BR') })) || [];
        data = cData;
        columns = [{ header: 'Pedido Ref.', accessor: 'ref' }, { header: 'Valor Venda', accessor: 'total' }, { header: 'Comissão (3%)', accessor: 'comissao' }, { header: 'Data', accessor: 'data' }];
        stats = [{ label: 'Total Comissões', value: `R$ ${cData.reduce((acc, curr) => acc + curr.comissao, 0).toLocaleString()}`, change: '+5%', trend: 'up' }, { label: 'Vendedores', value: '4', change: '0', trend: 'neutral' }, { label: 'Média / Vendedor', value: `R$ ${(cData.reduce((acc, curr) => acc + curr.comissao, 0) / 4).toLocaleString()}`, change: '+5%', trend: 'up' }];
        break;
      }

      default:
        data = [];
        stats = [];
        columns = [];
    }

    return { data, stats, columns };
  } catch (err: any) {
    throw new Error(err.message);
  }
};

export const useReportData = (reportId: string | null) => {
  const { tenant } = useTenant();
  const [reportState, setReportState] = useState<ReportData>({
    data: [],
    stats: [],
    columns: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!reportId || !tenant?.id) return;

    const fetchReportData = async () => {
      setReportState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const result = await fetchReportDataById(reportId, tenant.id);
        setReportState({
          ...result,
          loading: false,
          error: null,
        });
      } catch (err: any) {
        setReportState(prev => ({ ...prev, loading: false, error: err.message }));
      }
    };

    fetchReportData();
  }, [reportId, tenant?.id]);

  return reportState;
};
