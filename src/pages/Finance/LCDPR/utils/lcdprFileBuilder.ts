/**
 * LCDPR File Builder — Gera o arquivo .txt conforme leiaute oficial da Receita Federal
 * Blocos: 0 (Abertura/Identificação) + Q (Lançamentos) + 9 (Encerramento)
 * Encoding: UTF-8 | Delimitador: | (pipe) | Fim de linha: CRLF
 */

export interface LCDPRConfig {
  anoCalendario: number;
  // Produtor (pessoa física) — quando CPF, usa direto; quando CNPJ, usa sócio
  cpfProdutor: string; // 11 dígitos sem formatação
  nomeProdutor: string;
  indSitEsp: number; // 0=Normal,1=Falecimento,2=Espólio,3=Saída país
  // Contador
  cpfContador?: string;
  nomeContador?: string;
  crcContador?: string;
}

export interface LCDPRImovel {
  codImovel: string; // Ex: '001'
  nomeImovel: string;
  nirf?: string;
  municipio?: string;
  uf?: string;
  areaHa?: number;
}

export interface LCDPRContaBancaria {
  codConta: string; // Ex: '001', '999' = numerário
  banco?: string;
  agencia?: string;
  conta?: string;
  descricao?: string;
}

export interface LCDPRLancamento {
  dataLancamento: string; // DDMMAAAA
  codImovel: string;
  codContaBancaria: string; // '999' se não bancário
  tipo: 'R' | 'D';
  codNatureza: string;
  descricao?: string;
  cpfCnpjParticipante?: string;
  nomeParticipante?: string;
  numDocumento?: string;
  valor: number;
}

const VERSAO_LEIAUTE = '0007';
const NOME_ESCRITURACAO = 'LCDPR';

const fmt = (v: string | number | undefined | null, size?: number): string => {
  const s = String(v ?? '');
  return size ? s.slice(0, size) : s;
};

const fmtValor = (v: number): string => v.toFixed(2).replace('.', ',');

const fmtData = (iso: string): string => {
  // Accepts YYYY-MM-DD → DDMMAAAA
  const [y, m, d] = iso.split('-');
  return `${d}${m}${y}`;
};

const CRLF = '\r\n';

export const buildLCDPRFile = (
  config: LCDPRConfig,
  imoveis: LCDPRImovel[],
  contas: LCDPRContaBancaria[],
  lancamentos: LCDPRLancamento[]
): string => {
  const lines: string[] = [];
  const ano = config.anoCalendario;
  const dtIni = `01011${ano}`; // 01/01/AAAA
  const dtFin = `3112${ano}`; // 31/12/AAAA
  const cpf = config.cpfProdutor.replace(/\D/g, '').padStart(11, '0');

  // ─── BLOCO 0 ───────────────────────────────────────────────────────────────

  // 0000 — Abertura
  lines.push(
    [
      '|0000',
      NOME_ESCRITURACAO,
      VERSAO_LEIAUTE,
      `01${String(ano).slice(2)}01`, // COD_VER simplificado
      `01/01/${ano}`, // DT_INI
      `31/12/${ano}`, // DT_FIN
      cpf,
      config.nomeProdutor.toUpperCase(),
      '0', // IND_SIT_INI_PER: 0=Regular
      String(config.indSitEsp ?? 0), // IND_SIT_ESP
      '', // DT_SIT_ESP vazio quando 0
      '|',
    ].join('|')
  );

  // 0010 — Parâmetros tributação
  lines.push(`|0010|1|${ano}|1||`);

  // 0040 — Imóveis rurais
  imoveis.forEach((im, idx) => {
    lines.push(
      [
        '|0040',
        fmt(im.codImovel),
        fmt(im.nomeImovel).toUpperCase(),
        fmt(im.nirf),
        '', // IND_INCRA
        fmt(im.municipio).toUpperCase(),
        fmt(im.uf).toUpperCase(),
        im.areaHa ? fmtValor(im.areaHa) : '',
        '|',
      ].join('|')
    );
  });

  // 0050 — Contas bancárias
  // Adiciona automaticamente a conta 999 (numerário) se não existir
  const todasContas = [...contas];
  if (!todasContas.find((c) => c.codConta === '999')) {
    todasContas.push({ codConta: '999', descricao: 'Numerário em Trânsito / Espécie' });
  }
  todasContas.forEach((c) => {
    lines.push(
      [
        '|0050',
        fmt(c.codConta),
        fmt(c.banco),
        fmt(c.agencia),
        fmt(c.conta),
        fmt(c.descricao).toUpperCase() || 'CONTA CORRENTE',
        '|',
      ].join('|')
    );
  });

  // ─── BLOCO Q ───────────────────────────────────────────────────────────────

  // Q100 — Lançamentos (ordenados por data)
  const sorted = [...lancamentos].sort((a, b) => a.dataLancamento.localeCompare(b.dataLancamento));

  sorted.forEach((l) => {
    const data = l.dataLancamento.includes('-') ? fmtData(l.dataLancamento) : l.dataLancamento;
    lines.push(
      [
        '|Q100',
        data,
        fmt(l.codImovel),
        fmt(l.codContaBancaria || '999'),
        l.tipo,
        fmt(l.codNatureza),
        fmt(l.descricao).toUpperCase(),
        fmt(l.cpfCnpjParticipante?.replace(/\D/g, '')),
        fmt(l.nomeParticipante).toUpperCase(),
        fmt(l.numDocumento),
        fmtValor(l.valor),
        '|',
      ].join('|')
    );
  });

  // Q200 — Resumo mensal (agrupa por mês)
  const meses = Array.from({ length: 12 }, (_, i) => i + 1);
  let saldoAcumulado = 0;

  meses.forEach((mes) => {
    const mm = String(mes).padStart(2, '0');
    const lancMes = sorted.filter((l) => {
      const d = l.dataLancamento;
      const month = d.includes('-') ? d.substring(5, 7) : d.substring(2, 4);
      return parseInt(month) === mes;
    });

    if (lancMes.length === 0) {
      return;
    }

    const totalReceitas = lancMes
      .filter((l) => l.tipo === 'R')
      .reduce((acc, l) => acc + l.valor, 0);
    const totalDespesas = lancMes
      .filter((l) => l.tipo === 'D')
      .reduce((acc, l) => acc + l.valor, 0);

    const saldoInicio = saldoAcumulado;
    saldoAcumulado = saldoInicio + totalReceitas - totalDespesas;

    lines.push(
      [
        '|Q200',
        `${mm}/${ano}`,
        fmtValor(saldoInicio),
        fmtValor(totalReceitas),
        fmtValor(totalDespesas),
        fmtValor(saldoAcumulado),
        '|',
      ].join('|')
    );
  });

  // ─── BLOCO 9 ───────────────────────────────────────────────────────────────

  // 9999 — Encerramento e identificação do contador
  const cpfCont = (config.cpfContador || '').replace(/\D/g, '').padStart(11, '0');
  lines.push(
    [
      '|9999',
      cpfCont || '00000000000',
      fmt(config.nomeContador || 'NAO INFORMADO').toUpperCase(),
      fmt(config.crcContador || '').toUpperCase(),
      String(lines.length + 1), // Total de linhas
      '|',
    ].join('|')
  );

  return lines.join(CRLF) + CRLF;
};

/** Força download do arquivo .txt no browser */
export const downloadLCDPRFile = (content: string, ano: number, cpf: string) => {
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `LCDPR_${cpf}_${ano}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
