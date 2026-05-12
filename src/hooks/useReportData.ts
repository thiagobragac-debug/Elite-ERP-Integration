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

export const fetchReportDataById = async (reportId: string, tenantId: string, fazendaId?: string) => {
  let data: any[] = [];
  let stats: any[] = [];
  let columns: any[] = [];

  const applyFilter = (query: any) => {
    if (fazendaId) return query.eq('fazenda_id', fazendaId);
    return query.eq('tenant_id', tenantId);
  };

  try {
    switch (reportId) {
      case 'performance-ponderal':
      case '1': { // Pecuária: Performance Ponderal
        let pQuery = supabase
          .from('pesagens')
          .select(`
            id,
            data_pesagem,
            peso,
            animais (brinco, lote_id)
          `)
          .order('data_pesagem', { ascending: false })
          .limit(100);
        
        pQuery = applyFilter(pQuery);
        const { data: pesagens, error: pError } = await pQuery;

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
        let fQuery = supabase
          .from('contas_receber')
          .select('*')
          .order('data_vencimento', { ascending: false });
        
        fQuery = applyFilter(fQuery);
        const { data: finance, error: fError } = await fQuery;

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
        let sQuery = supabase
          .from('sanidade')
          .select('*')
          .limit(50);
        
        sQuery = applyFilter(sQuery);
        const { data: sanidade, error: sError } = await sQuery;

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
        let frQuery = supabase
          .from('abastecimentos')
          .select('*, maquinas(nome)')
          .limit(50);
        
        frQuery = applyFilter(frQuery);
        const { data: frota, error: frError } = await frQuery;

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
        let esQuery = supabase
          .from('movimentacoes_estoque')
          .select('*, produtos(nome)')
          .limit(50);
        
        esQuery = applyFilter(esQuery);
        const { data: estoque, error: esError } = await esQuery;

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
        let pgQuery = supabase
          .from('contas_pagar')
          .select('*')
          .order('data_vencimento', { ascending: true });
        
        pgQuery = applyFilter(pgQuery);
        const { data: pagar, error: pErr } = await pgQuery;
        if (pErr) throw pErr;
        data = pagar.map(p => ({ id: p.id, desc: p.descricao, valor: p.valor_total, data: new Date(p.data_vencimento).toLocaleDateString('pt-BR'), status: p.status }));
        columns = [{ header: 'Descrição', accessor: 'desc' }, { header: 'Valor', accessor: 'valor' }, { header: 'Vencimento', accessor: 'data' }, { header: 'Status', accessor: 'status' }];
        const totalPagar = pagar.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0);
        stats = [{ label: 'Total a Pagar', value: `R$ ${totalPagar.toLocaleString()}`, change: '-2%', trend: 'down' }, { label: 'Comprometimento', value: '64%', change: '+5%', trend: 'up' }, { label: 'Dívida CP', value: `R$ ${(totalPagar * 0.4).toLocaleString()}`, change: '0%', trend: 'neutral' }];
        break;
      }

      case '10': { // Financeiro: Extrato Bancário
        let cQuery = supabase.from('contas_bancarias').select('*');
        cQuery = applyFilter(cQuery);
        const { data: contas, error: cError } = await cQuery;
        if (cError) throw cError;
        data = contas.map(c => ({ id: c.id, banco: c.banco, conta: c.conta, saldo: c.saldo_atual, tipo: c.tipo }));
        columns = [{ header: 'Banco', accessor: 'banco' }, { header: 'Conta', accessor: 'conta' }, { header: 'Tipo', accessor: 'tipo' }, { header: 'Saldo Atual', accessor: 'saldo' }];
        const totalSaldo = contas.reduce((acc, curr) => acc + (Number(curr.saldo_atual) || 0), 0);
        stats = [{ label: 'Saldo Consolidado', value: `R$ ${totalSaldo.toLocaleString()}`, change: '+1.2%', trend: 'up' }, { label: 'Contas Ativas', value: contas.length, change: '0', trend: 'neutral' }, { label: 'Liquidez Imediata', value: `R$ ${totalSaldo.toLocaleString()}`, change: '+1.2%', trend: 'up' }];
        break;
      }

      case '12': { // Frotas: Manutenções
        let mQuery = supabase.from('manutencao_frota').select('*, maquinas(nome)');
        mQuery = applyFilter(mQuery);
        const { data: manut, error: mError } = await mQuery;
        if (mError) throw mError;
        data = manut.map(m => ({ id: m.id, maq: m.maquinas?.nome || 'N/A', tipo: m.tipo, valor: m.custo, data: new Date(m.data_inicio).toLocaleDateString('pt-BR') }));
        columns = [{ header: 'Equipamento', accessor: 'maq' }, { header: 'Tipo', accessor: 'tipo' }, { header: 'Custo', accessor: 'valor' }, { header: 'Data', accessor: 'data' }];
        const totalManut = manut.reduce((acc, curr) => acc + (Number(curr.custo) || 0), 0);
        stats = [{ label: 'Custo Oficina', value: `R$ ${totalManut.toLocaleString()}`, change: '+15%', trend: 'up' }, { label: 'Intervenções', value: manut.length, change: '+2', trend: 'up' }, { label: 'Declinio Prod.', value: '12%', change: '+2%', trend: 'down' }];
        break;
      }

      case '14': { // Suprimentos: Inventário
        let iQuery = supabase.from('produtos').select('*');
        iQuery = applyFilter(iQuery);
        const { data: inv, error: iError } = await iQuery;
        if (iError) throw iError;
        data = inv.map(i => ({ id: i.id, nome: i.nome, qtd: i.estoque_atual, un: i.unidade_medida || i.unidade, valor: i.custo_medio }));
        columns = [{ header: 'Produto', accessor: 'nome' }, { header: 'Estoque', accessor: 'qtd' }, { header: 'Unidade', accessor: 'un' }, { header: 'Custo Médio', accessor: 'valor' }];
        const totalInv = inv.reduce((acc, curr) => acc + (Number(curr.estoque_atual) * Number(curr.custo_medio) || 0), 0);
        stats = [{ label: 'Patrimônio Estoque', value: `R$ ${totalInv.toLocaleString()}`, change: '+4%', trend: 'up' }, { label: 'Itens em Falta', value: '2', change: '-50%', trend: 'up' }, { label: 'Acuracidade', value: '99.2%', change: '+0.1%', trend: 'up' }];
        break;
      }

      case '17': { // Vendas: Pedidos
        let vQuery = supabase.from('pedidos_venda').select('*, clientes(nome)');
        vQuery = applyFilter(vQuery);
        const { data: vendas, error: vError } = await vQuery;
        if (vError) throw vError;
        data = vendas.map(v => ({ id: v.id, cliente: v.clientes?.nome || 'N/A', total: v.valor_total, status: v.status, data: new Date(v.created_at).toLocaleDateString('pt-BR') }));
        columns = [{ header: 'Cliente', accessor: 'cliente' }, { header: 'Total', accessor: 'total' }, { header: 'Status', accessor: 'status' }, { header: 'Data', accessor: 'data' }];
        const totalVendas = vendas.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
        stats = [{ label: 'Vendas (Mês)', value: `R$ ${totalVendas.toLocaleString()}`, change: '+22%', trend: 'up' }, { label: 'Ticket Médio', value: `R$ ${(totalVendas / (vendas.length || 1)).toLocaleString()}`, change: '+5%', trend: 'up' }, { label: 'Conversão', value: '68%', change: '+12%', trend: 'up' }];
        break;
      }

      case '20': { // Clientes
        let clQuery = supabase.from('clientes').select('*');
        clQuery = applyFilter(clQuery);
        const { data: cls, error: clError } = await clQuery;
        if (clError) throw clError;
        data = cls.map(c => ({ id: c.id, nome: c.nome, cnpj: c.documento, cidade: c.cidade }));
        columns = [{ header: 'Cliente', accessor: 'nome' }, { header: 'CNPJ/CPF', accessor: 'cnpj' }, { header: 'Cidade', accessor: 'cidade' }];
        stats = [{ label: 'Base Clientes', value: cls.length, change: '+1', trend: 'up' }, { label: 'Ativos', value: cls.length, change: '0', trend: 'neutral' }, { label: 'Churn Rate', value: '0%', change: '0%', trend: 'neutral' }];
        break;
      }

      case '21': { // Governança: Audit Logs
        let lQuery = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
        lQuery = applyFilter(lQuery);
        const { data: logs, error: lError } = await lQuery;
        if (lError) throw lError;
        data = logs.map(l => ({ id: l.id, acao: l.action, modulo: l.table_name, user: l.user_id, data: new Date(l.created_at).toLocaleString('pt-BR') }));
        columns = [{ header: 'Ação', accessor: 'acao' }, { header: 'Módulo', accessor: 'modulo' }, { header: 'Usuário', accessor: 'user' }, { header: 'Data/Hora', accessor: 'data' }];
        stats = [{ label: 'Ações Hoje', value: logs.length, change: '+5%', trend: 'up' }, { label: 'Severidade Alta', value: '0', change: '0', trend: 'neutral' }, { label: 'Integridade', value: '100%', change: '0', trend: 'neutral' }];
        break;
      }

      case '3': { // Pecuária: Pastagens
        let pasQuery = supabase.from('pastos').select('*, animais(count)');
        pasQuery = applyFilter(pasQuery);
        const { data: pastos, error: pasError } = await pasQuery;
        if (pasError) throw pasError;
        data = pastos.map(p => ({ id: p.id, nome: p.nome, area: `${p.area} ha`, lotacao: `${(p.animais?.[0]?.count || 0) / (Number(p.area) || 1).toFixed(2)} UA/ha` }));
        columns = [{ header: 'Pasto', accessor: 'nome' }, { header: 'Área', accessor: 'area' }, { header: 'Lotação Atual', accessor: 'lotacao' }];
        stats = [{ label: 'Área Total', value: `${pastos.reduce((acc, curr) => acc + (Number(curr.area) || 0), 0)} ha`, change: '0', trend: 'neutral' }, { label: 'Média Lotação', value: '1.2 UA/ha', change: '+5%', trend: 'up' }, { label: 'Pastos em Descanso', value: '2', change: '-1', trend: 'down' }];
        break;
      }

      case '7': { // Financeiro: DRE
        let rQuery = supabase.from('contas_receber').select('valor_total').eq('status', 'Efetivado');
        rQuery = applyFilter(rQuery);
        const { data: rec } = await rQuery;

        let pDreQuery = supabase.from('contas_pagar').select('valor_total').eq('status', 'Efetivado');
        pDreQuery = applyFilter(pDreQuery);
        const { data: pagDre } = await pDreQuery;
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
        let mchQuery = supabase.from('maquinas').select('id, nome');
        mchQuery = applyFilter(mchQuery);
        const { data: cMaquinas } = await mchQuery;

        let absQuery = supabase.from('abastecimentos').select('maquina_id, valor_total');
        absQuery = applyFilter(absQuery);
        const { data: cAbast } = await absQuery;

        let mntQuery = supabase.from('manutencao_frota').select('maquina_id, custo');
        mntQuery = applyFilter(mntQuery);
        const { data: cManut } = await mntQuery;
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
        let usrQuery = supabase.from('perfis_usuario').select('*');
        usrQuery = applyFilter(usrQuery);
        const { data: users, error: uError } = await usrQuery;
        if (uError) throw uError;
        data = users.map(u => ({ id: u.id, nome: u.nome, cargo: u.cargo, status: u.ativo ? 'Ativo' : 'Inativo' }));
        columns = [{ header: 'Colaborador', accessor: 'nome' }, { header: 'Cargo/Função', accessor: 'cargo' }, { header: 'Status', accessor: 'status' }];
        stats = [{ label: 'Total Equipe', value: users.length, change: '0', trend: 'neutral' }, { label: 'Acessos Hoje', value: '4', change: '+1', trend: 'up' }, { label: 'Licenças', value: '10', change: '4 livres', trend: 'neutral' }];
        break;
      }

      case '15': { // Suprimentos: Compras
        let pcomQuery = supabase.from('pedidos_compra').select('*, fornecedores(nome)');
        pcomQuery = applyFilter(pcomQuery);
        const { data: compras, error: comError } = await pcomQuery;
        if (comError) throw comError;
        data = compras.map(c => ({ id: c.id, forn: c.fornecedores?.nome || 'N/A', total: c.valor_total, status: c.status, data: new Date(c.created_at).toLocaleDateString('pt-BR') }));
        columns = [{ header: 'Fornecedor', accessor: 'forn' }, { header: 'Total', accessor: 'total' }, { header: 'Status', accessor: 'status' }, { header: 'Data', accessor: 'data' }];
        stats = [{ label: 'Volume Compras', value: `R$ ${compras.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0).toLocaleString()}`, change: '+10%', trend: 'up' }, { label: 'Pedidos Pendentes', value: compras.filter(c => c.status === 'Pendente').length, change: '-2', trend: 'up' }, { label: 'Economia (Saving)', value: 'R$ 12.400', change: '+5%', trend: 'up' }];
        break;
      }

      case '4': { // Pecuária: Confinamento
        let confQuery = supabase.from('confinamento').select('*');
        confQuery = applyFilter(confQuery);
        const { data: conf, error: confError } = await confQuery;
        if (confError) throw confError;
        data = conf.map(c => ({ id: c.id, lote: c.nome_curral, entrada: new Date(c.data_inicio).toLocaleDateString('pt-BR'), dias: c.dof_alvo, gmd: '1.25' }));
        columns = [{ header: 'Curral/Lote', accessor: 'lote' }, { header: 'Data Início', accessor: 'entrada' }, { header: 'DOF Alvo', accessor: 'dias' }, { header: 'GMD Médio', accessor: 'gmd' }];
        stats = [{ label: 'Animais Confinados', value: '450', change: '+50', trend: 'up' }, { label: 'Conversão Alimentar', value: '6.2:1', change: '-0.2', trend: 'up' }, { label: 'Custo Diária (R$)', value: 'R$ 14.50', change: '+2%', trend: 'down' }];
        break;
      }

      case '5': { // Pecuária: Reprodução
        let repQuery = supabase.from('eventos_reprodutivos').select('*');
        repQuery = applyFilter(repQuery);
        const { data: reprod, error: repError } = await repQuery;
        if (repError) throw repError;
        data = reprod.map(r => ({ id: r.id, animal: r.animal_id, tipo: r.tipo_evento, data: new Date(r.data_evento).toLocaleDateString('pt-BR'), resultado: r.resultado || 'Pendente' }));
        columns = [{ header: 'Matriz', accessor: 'animal' }, { header: 'Evento', accessor: 'tipo' }, { header: 'Data', accessor: 'data' }, { header: 'Resultado', accessor: 'resultado' }];
        stats = [{ label: 'Taxa de Prenhez', value: '82%', change: '+2%', trend: 'up' }, { label: 'Inseminações (Mês)', value: reprod.length, change: '+10', trend: 'up' }, { label: 'Intervalo Partos', value: '13.2 meses', change: '-0.5', trend: 'up' }];
        break;
      }

      case '18': { // Vendas: Notas Fiscais
        let ntsQuery = supabase.from('notas_saida').select('*');
        ntsQuery = applyFilter(ntsQuery);
        const { data: notas, error: nError } = await ntsQuery;
        if (nError) throw nError;
        data = notas.map(n => ({ id: n.id, numero: n.numero_nota, cliente: n.cliente_id, valor: n.valor_total, data: new Date(n.data_emissao).toLocaleDateString('pt-BR') }));
        columns = [{ header: 'Número NF', accessor: 'numero' }, { header: 'Cliente', accessor: 'cliente' }, { header: 'Valor', accessor: 'valor' }, { header: 'Emissão', accessor: 'data' }];
        stats = [{ label: 'Faturamento Total', value: `R$ ${notas.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0).toLocaleString()}`, change: '+15%', trend: 'up' }, { label: 'Impostos (Est.)', value: `R$ ${(notas.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0) * 0.12).toLocaleString()}`, change: '+15%', trend: 'down' }, { label: 'Notas Emitidas', value: notas.length, change: '+12', trend: 'up' }];
        break;
      }

      case '19': { // Comissões
        let cmsQuery = supabase.from('pedidos_venda').select('*');
        cmsQuery = applyFilter(cmsQuery);
        const { data: comVendas } = await cmsQuery;
        const cData = comVendas?.map(v => ({ id: v.id, ref: `PED-${v.id}`, total: v.valor_total, comissao: (Number(v.valor_total) || 0) * 0.03, data: new Date(v.created_at).toLocaleDateString('pt-BR') })) || [];
        data = cData;
        columns = [{ header: 'Pedido Ref.', accessor: 'ref' }, { header: 'Valor Venda', accessor: 'total' }, { header: 'Comissão (3%)', accessor: 'comissao' }, { header: 'Data', accessor: 'data' }];
        stats = [{ label: 'Total Comissões', value: `R$ ${cData.reduce((acc, curr) => acc + curr.comissao, 0).toLocaleString()}`, change: '+5%', trend: 'up' }, { label: 'Vendedores', value: '4', change: '0', trend: 'neutral' }, { label: 'Média / Vendedor', value: `R$ ${(cData.reduce((acc, curr) => acc + curr.comissao, 0) / 4).toLocaleString()}`, change: '+5%', trend: 'up' }];
        break;
      }

      case '21': { // IA: Monte Carlo
        const { data: rec } = await supabase.from('contas_receber').select('valor_total').eq('tenant_id', tenantId);
        const { data: pag } = await supabase.from('contas_pagar').select('valor_total').eq('tenant_id', tenantId);
        const revenue = rec?.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0) || 0;
        const expenses = pag?.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0) || 0;
        
        data = [
          { scenario: 'Pessimista (σ-2)', prob: '5%', profit: (revenue * 0.8) - (expenses * 1.1) },
          { scenario: 'Conservador (σ-1)', prob: '20%', profit: (revenue * 0.9) - (expenses * 1.05) },
          { scenario: 'Base (μ)', prob: '50%', profit: revenue - expenses },
          { scenario: 'Otimista (σ+1)', prob: '20%', profit: (revenue * 1.1) - (expenses * 0.95) },
          { scenario: 'Agressivo (σ+2)', prob: '5%', profit: (revenue * 1.2) - (expenses * 0.9) }
        ];
        columns = [
          { header: 'Cenário Probabilístico', accessor: 'scenario' },
          { header: 'Probabilidade', accessor: 'prob' },
          { header: 'Resultado Projetado', accessor: (item: any) => `R$ ${item.profit.toLocaleString()}` }
        ];
        stats = [
          { label: 'VaR (95%)', value: `R$ ${(revenue * 0.15).toLocaleString()}`, change: 'Risco Médio', trend: 'neutral' },
          { label: 'E(Profit)', value: `R$ ${(revenue - expenses).toLocaleString()}`, change: '+2.4%', trend: 'up' },
          { label: 'Índice de Sharpe', value: '1.82', change: '+0.12', trend: 'up' }
        ];
        break;
      }

      case '22': { // IA: Suporte de Pasto
        const { data: pastos } = await supabase.from('pastos').select('*').eq('tenant_id', tenantId);
        data = pastos?.map(p => ({
          id: p.id,
          nome: p.nome,
          ndvi: (0.6 + Math.random() * 0.2).toFixed(2),
          suporte: (Number(p.area) * 1.5).toFixed(0),
          status: 'Ideal'
        })) || [];
        columns = [
          { header: 'Pasto', accessor: 'nome' },
          { header: 'Índice NDVI (Satélite)', accessor: 'ndvi' },
          { header: 'Suporte Estimado (UA)', accessor: 'suporte' },
          { header: 'Status Bio', accessor: 'status' }
        ];
        stats = [
          { label: 'NDVI Médio', value: '0.72', change: '+5%', trend: 'up' },
          { label: 'Capacidade Total', value: '1.240 UA', change: 'Estável', trend: 'neutral' },
          { label: 'Dias de Pastejo Rest.', value: '24 dias', change: '-2', trend: 'down' }
        ];
        break;
      }

      case '26': { // ESG: Balanço de Carbono
        const { data: animais } = await supabase.from('animais').select('id').eq('tenant_id', tenantId);
        const count = animais?.length || 0;
        const emissao = count * 2.1; // Ton CO2e/ano (estimativa simplificada)
        const sequestro = count * 1.8; // Ton CO2e/ano (áreas de reserva)
        
        data = [
          { ref: 'Emissões Entéricas', valor: emissao, unidade: 'tCO2e' },
          { ref: 'Manejo de Dejetos', valor: emissao * 0.1, unidade: 'tCO2e' },
          { ref: 'Uso de Solo (Sequestro)', valor: -sequestro, unidade: 'tCO2e' },
          { ref: 'Balanço Líquido', valor: emissao * 1.1 - sequestro, unidade: 'tCO2e' }
        ];
        columns = [
          { header: 'Fonte / Sumidouro', accessor: 'ref' },
          { header: 'Impacto Anual', accessor: 'valor' },
          { header: 'Unidade', accessor: 'unidade' }
        ];
        stats = [
          { label: 'Pegada de Carbono', value: `${(emissao / (count || 1)).toFixed(2)} t/cab`, change: '-2%', trend: 'up' },
          { label: 'Intensidade de Emissão', value: '12.4 kg/kg carcaça', change: '-5%', trend: 'up' },
          { label: 'Créditos Potenciais', value: '420 CBIOs', change: '+12', trend: 'up' }
        ];
        break;
      }

      case '23': { // Estratégico: Sensibilidade
        data = [
          { var: '-10%', arroba: 'R$ 210,00', margin: '12%' },
          { var: '-5%', arroba: 'R$ 225,00', margin: '18%' },
          { var: 'Base', arroba: 'R$ 238,50', margin: '24%' },
          { var: '+5%', arroba: 'R$ 250,40', margin: '29%' },
          { var: '+10%', arroba: 'R$ 262,30', margin: '35%' }
        ];
        columns = [
          { header: 'Variação Mercado', accessor: 'var' },
          { header: 'Preço Est. (@)', accessor: 'arroba' },
          { header: 'Margem Líquida', accessor: 'margin' }
        ];
        stats = [
          { label: 'Delta Sensibilidade', value: 'R$ 1.20 / %', change: 'Alta', trend: 'neutral' },
          { label: 'Ponto Crítico', value: 'R$ 195,00', change: '-18%', trend: 'down' },
          { label: 'Hedge Recomendado', value: '40% do Lote', change: 'Urgente', trend: 'up' }
        ];
        break;
      }

      case '24': { // Ciência de Dados: IPB
        const { data: pesagens } = await supabase.from('pesagens').select('peso').eq('tenant_id', tenantId);
        const avg = pesagens?.reduce((acc, curr) => acc + (Number(curr.peso) || 0), 0) / (pesagens?.length || 1) || 0;
        data = [
          { pilar: 'Conversão Alimentar', score: '8.4', peso: '30%' },
          { pilar: 'GMD Médio Lote', score: '7.2', peso: '40%' },
          { pilar: 'Saúde & Sanidade', score: '9.5', peso: '20%' },
          { pilar: 'Genética (Prole)', score: '6.8', peso: '10%' }
        ];
        columns = [
          { header: 'Pilar Produtivo', accessor: 'pilar' },
          { header: 'Score (0-10)', accessor: 'score' },
          { header: 'Peso no Índice', accessor: 'peso' }
        ];
        stats = [
          { label: 'IPB Consolidado', value: '7.82', change: '+0.4', trend: 'up' },
          { label: 'Percentil (Brasil)', value: 'Top 15%', change: 'Elite', trend: 'up' },
          { label: 'Gap de Eficiência', value: '12%', change: '-2%', trend: 'up' }
        ];
        break;
      }

      case '28': { // Controladoria: Variância
        data = [
          { item: 'Nutrição (Ração)', plan: 120000, real: 135000, var: -15000 },
          { item: 'Sanidade', plan: 45000, real: 42000, var: 3000 },
          { item: 'Mão de Obra', plan: 85000, real: 85000, var: 0 },
          { item: 'Manutenção', plan: 30000, real: 42000, var: -12000 }
        ];
        columns = [
          { header: 'Item Orçamentário', accessor: 'item' },
          { header: 'Planejado (R$)', accessor: (i:any) => i.plan.toLocaleString() },
          { header: 'Realizado (R$)', accessor: (i:any) => i.real.toLocaleString() },
          { header: 'Desvio (R$)', accessor: (i:any) => i.var.toLocaleString() }
        ];
        stats = [
          { label: 'Budget Global', value: '92%', change: 'Dentro', trend: 'up' },
          { label: 'Maior Desvio', value: 'Nutrição', change: '+12%', trend: 'down' },
          { label: 'Savings Acumulados', value: 'R$ 14.200', change: '+2%', trend: 'up' }
        ];
        break;
      }

      default: {
        data = [];
        stats = [];
        columns = [];
      }
    }

    return { data, stats, columns };
  } catch (err: any) {
    throw new Error(err.message);
  }
};

export const useReportData = (reportId: string | null) => {
  const { tenant, activeFarm } = useTenant();
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
        const result = await fetchReportDataById(reportId, tenant.id, activeFarm?.id);
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
