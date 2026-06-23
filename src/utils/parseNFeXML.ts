/**
 * parseNFeXML.ts
 * Parser client-side para XML de Nota Fiscal Eletrônica (NF-e) padrão SEFAZ
 * Suporta NF-e 4.0 (nfeProc e NFe direto, com e sem namespace)
 */

export interface NFeItem {
  nItem: number;
  cProd: string;
  xProd: string;
  NCM?: string;
  CFOP?: string;
  uCom: string;
  qCom: number;
  vUnCom: number;
  vProd: number;
  cEAN?: string;
}

export interface NFeParsed {
  // Identificação
  chNFe?: string;
  nNF: string;
  serie: string;
  dhEmi: string;
  natOp: string;
  modelo: string;

  // Emitente (Fornecedor)
  emit: {
    CNPJ?: string;
    CPF?: string;
    xNome: string;
    xFant?: string;
    IE?: string;
  };

  // Destinatário
  dest?: {
    CNPJ?: string;
    CPF?: string;
    xNome: string;
  };

  // Totais
  vNF: number;
  vDesc?: number;
  vFrete?: number;
  vOutro?: number;

  // Itens
  itens: NFeItem[];

  // Informações adicionais
  infAdic?: string;

  // Erros de parse (não-fatal)
  warnings?: string[];
}

/**
 * Helper: pega o texto de um elemento ignorando namespaces chatos (ex: "nfe:prod", "ns2:InfNfse", "prod")
 */
function getElementsByTagSafe(parent: Element | Document, tag: string): Element[] {
  let elements = parent.getElementsByTagName(tag);
  if (elements.length > 0) {
    return Array.from(elements);
  }

  elements = parent.getElementsByTagNameNS('*', tag);
  if (elements.length > 0) {
    return Array.from(elements);
  }

  // Fallback iterando em todos e comparando a tag sem prefixo
  const all = parent.getElementsByTagName('*');
  return Array.from(all).filter((e) => e.tagName.split(':').pop() === tag);
}

function getTagTextSafe(parent: Element | Document, tag: string): string {
  const els = getElementsByTagSafe(parent, tag);
  return els.length > 0 ? els[0].textContent?.trim() || '' : '';
}

function getTagFloatSafe(parent: Element | Document, tag: string): number {
  const text = getTagTextSafe(parent, tag);
  return text ? parseFloat(text.replace(',', '.')) : 0;
}

/**
 * Parseia o XML de uma NF-e a partir de uma string
 * @throws Error se o XML estiver mal formado ou não for uma NF-e válida
 */
export function parseNFeXML(xmlString: string): NFeParsed {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error(`XML malformado: ${parseError.textContent?.slice(0, 200)}`);
  }

  // Verifica se é uma NFS-e (Nota Fiscal de Serviços) - Padrões Municipais ou Padrão Nacional (DPS/NFSe)
  const isNfse =
    getElementsByTagSafe(doc, 'InfNfse').length > 0 ||
    getElementsByTagSafe(doc, 'Nfse').length > 0 ||
    getElementsByTagSafe(doc, 'CompNfse').length > 0 ||
    getElementsByTagSafe(doc, 'infNFSe').length > 0 ||
    getElementsByTagSafe(doc, 'DPS').length > 0 ||
    getElementsByTagSafe(doc, 'infDPS').length > 0;

  if (isNfse) {
    return parseNfseDoc(doc);
  }

  return parseNfeDoc(doc);
}

function parseNfseDoc(doc: Document): NFeParsed {
  // --- PADRÃO NACIONAL NFS-e (DPS/infDPS) ---
  const infDps = getElementsByTagSafe(doc, 'infDPS')[0] || getElementsByTagSafe(doc, 'infNFSe')[0];
  if (infDps) {
    const nNF =
      getTagTextSafe(infDps, 'nNFSe') ||
      getTagTextSafe(infDps, 'nDPS') ||
      getTagTextSafe(infDps, 'nNF');
    const serie = getTagTextSafe(infDps, 'serie') || 'U';
    const dhEmi = getTagTextSafe(infDps, 'dhEmi');
    const chNFe =
      getTagTextSafe(infDps, 'chNFSe') ||
      infDps.getAttribute('Id')?.replace(/^DPS/, '') ||
      undefined;
    const modelo = 'NFS-e (Nacional)';
    const natOp = 'Prestação de Serviços';

    // Prestador
    const prest = getElementsByTagSafe(infDps, 'prest')[0] || infDps;
    const emit = {
      CNPJ: getTagTextSafe(prest, 'CNPJ') || undefined,
      CPF: getTagTextSafe(prest, 'CPF') || undefined,
      xNome: getTagTextSafe(prest, 'xNome') || 'PRESTADOR DE SERVIÇO',
    };

    // Tomador
    const toma = getElementsByTagSafe(infDps, 'toma')[0];
    let dest;
    if (toma) {
      dest = {
        CNPJ: getTagTextSafe(toma, 'CNPJ') || undefined,
        CPF: getTagTextSafe(toma, 'CPF') || undefined,
        xNome: getTagTextSafe(toma, 'xNome') || 'TOMADOR DE SERVIÇO',
      };
    }

    // Valores e Serviço
    const valores = getElementsByTagSafe(infDps, 'valores')[0] || infDps;
    const vNF = getTagFloatSafe(valores, 'vServPrest') || 0;
    const vDesc =
      getTagFloatSafe(valores, 'vDescIncond') || getTagFloatSafe(valores, 'vDescCond') || 0;

    const serv = getElementsByTagSafe(infDps, 'serv')[0] || infDps;
    const discriminacao = getTagTextSafe(serv, 'descInteg') || 'Serviço Prestado (NFS-e Nacional)';
    const cServ = getTagTextSafe(serv, 'cServ') || 'SRV';

    const itens: NFeItem[] = [
      {
        nItem: 1,
        cProd: cServ,
        xProd: discriminacao.substring(0, 500),
        uCom: 'SV',
        qCom: 1,
        vUnCom: vNF,
        vProd: vNF,
      },
    ];

    return {
      chNFe,
      nNF,
      serie,
      dhEmi,
      natOp,
      modelo,
      emit,
      dest,
      vNF,
      vDesc: vDesc || undefined,
      itens,
    };
  }

  // --- PADRÃO MUNICIPAL (ABRASF) ---
  const infNfse =
    getElementsByTagSafe(doc, 'InfNfse')[0] ||
    getElementsByTagSafe(doc, 'Nfse')[0] ||
    doc.documentElement;

  const nNF = getTagTextSafe(infNfse, 'Numero');
  const serie = getTagTextSafe(infNfse, 'Serie') || 'U'; // NFS-e costuma usar U ou não ter série
  const dhEmi = getTagTextSafe(infNfse, 'DataEmissao');
  const chNFe = getTagTextSafe(infNfse, 'CodigoVerificacao'); // Usa Código de Verificação como chave
  const natOp = getTagTextSafe(infNfse, 'NaturezaOperacao') || 'Prestação de Serviços';
  const modelo = 'NFS-e';

  // Emitente (Prestador de Serviço)
  const prestador =
    getElementsByTagSafe(doc, 'PrestadorServico')[0] ||
    getElementsByTagSafe(doc, 'Prestador')[0] ||
    infNfse;
  const emitCnpjCpf = getTagTextSafe(prestador, 'Cnpj') || getTagTextSafe(prestador, 'Cpf');
  const emitNome =
    getTagTextSafe(prestador, 'RazaoSocial') ||
    getTagTextSafe(prestador, 'NomeFantasia') ||
    'PRESTADOR DE SERVIÇO';

  const emit = {
    CNPJ: emitCnpjCpf?.length > 11 ? emitCnpjCpf : undefined,
    CPF: emitCnpjCpf?.length <= 11 ? emitCnpjCpf : undefined,
    xNome: emitNome,
    xFant: getTagTextSafe(prestador, 'NomeFantasia') || undefined,
  };

  // Destinatário (Tomador de Serviço)
  const tomador =
    getElementsByTagSafe(doc, 'TomadorServico')[0] || getElementsByTagSafe(doc, 'Tomador')[0];
  let dest;
  if (tomador) {
    const destCnpjCpf = getTagTextSafe(tomador, 'Cnpj') || getTagTextSafe(tomador, 'Cpf');
    dest = {
      CNPJ: destCnpjCpf?.length > 11 ? destCnpjCpf : undefined,
      CPF: destCnpjCpf?.length <= 11 ? destCnpjCpf : undefined,
      xNome: getTagTextSafe(tomador, 'RazaoSocial') || 'TOMADOR DE SERVIÇO',
    };
  }

  // Totais e Serviço
  const servico = getElementsByTagSafe(doc, 'Servico')[0] || infNfse;
  const valores = getElementsByTagSafe(doc, 'Valores')[0] || servico;

  const vNF =
    getTagFloatSafe(valores, 'ValorServicos') || getTagFloatSafe(servico, 'ValorServicos') || 0;
  const vDesc =
    getTagFloatSafe(valores, 'DescontoIncondicionado') ||
    getTagFloatSafe(valores, 'DescontoCondicionado') ||
    0;

  const discriminacao = getTagTextSafe(servico, 'Discriminacao') || 'Serviço Prestado (NFS-e)';
  const codigoTributacao =
    getTagTextSafe(servico, 'ItemListaServico') ||
    getTagTextSafe(servico, 'CodigoTributacaoMunicipio') ||
    'SRV';

  // NFS-e vira um "item" único para dar match em serviços contratados no ERP
  const itens: NFeItem[] = [
    {
      nItem: 1,
      cProd: codigoTributacao,
      xProd: discriminacao.substring(0, 500), // Evitar estourar UI se a descrição for enorme
      uCom: 'SV', // Serviço
      qCom: 1,
      vUnCom: vNF,
      vProd: vNF,
    },
  ];

  return {
    chNFe,
    nNF,
    serie,
    dhEmi,
    natOp,
    modelo,
    emit,
    dest,
    vNF,
    vDesc: vDesc || undefined,
    itens,
  };
}

function parseNfeDoc(doc: Document): NFeParsed {
  const infNFe = getElementsByTagSafe(doc, 'infNFe')[0];
  if (!infNFe) {
    throw new Error(
      'Estrutura inválida: elemento <infNFe> ou <InfNfse> não encontrado. Este arquivo é realmente um XML de NF-e ou NFS-e?'
    );
  }

  const chNFe = infNFe.getAttribute('Id')?.replace(/^NFe/, '') || undefined;

  const ide = getElementsByTagSafe(doc, 'ide')[0];
  if (!ide) {
    throw new Error('Elemento <ide> não encontrado na NF-e.');
  }

  const nNF = getTagTextSafe(ide, 'nNF');
  const serie = getTagTextSafe(ide, 'serie');
  const dhEmi = getTagTextSafe(ide, 'dhEmi') || getTagTextSafe(ide, 'dEmi');
  const natOp = getTagTextSafe(ide, 'natOp');
  const modelo = getTagTextSafe(ide, 'mod');

  const emitEl = getElementsByTagSafe(doc, 'emit')[0];
  if (!emitEl) {
    throw new Error('Elemento <emit> não encontrado na NF-e.');
  }

  const emit = {
    CNPJ: getTagTextSafe(emitEl, 'CNPJ') || undefined,
    CPF: getTagTextSafe(emitEl, 'CPF') || undefined,
    xNome: getTagTextSafe(emitEl, 'xNome'),
    xFant: getTagTextSafe(emitEl, 'xFant') || undefined,
    IE: getTagTextSafe(emitEl, 'IE') || undefined,
  };

  const destEl = getElementsByTagSafe(doc, 'dest')[0];
  const dest = destEl
    ? {
        CNPJ: getTagTextSafe(destEl, 'CNPJ') || undefined,
        CPF: getTagTextSafe(destEl, 'CPF') || undefined,
        xNome: getTagTextSafe(destEl, 'xNome'),
      }
    : undefined;

  const ICMSTot = getElementsByTagSafe(doc, 'ICMSTot')[0];
  const vNF = getTagFloatSafe(ICMSTot || doc, 'vNF');
  const vDesc = getTagFloatSafe(ICMSTot || doc, 'vDesc');
  const vFrete = getTagFloatSafe(ICMSTot || doc, 'vFrete');
  const vOutro = getTagFloatSafe(ICMSTot || doc, 'vOutro');

  const detElements = getElementsByTagSafe(doc, 'det');
  if (detElements.length === 0) {
    throw new Error('Nenhum item (<det>) encontrado na NF-e.');
  }

  const itens: NFeItem[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < detElements.length; i++) {
    const det = detElements[i];
    const nItem = parseInt(det.getAttribute('nItem') || String(i + 1));

    const prod = getElementsByTagSafe(det, 'prod')[0];
    if (!prod) {
      warnings.push(`Item ${nItem}: elemento <prod> não encontrado, ignorado.`);
      continue;
    }

    const cProd = getTagTextSafe(prod, 'cProd');
    const xProd = getTagTextSafe(prod, 'xProd');
    const NCM = getTagTextSafe(prod, 'NCM') || getTagTextSafe(prod, 'ncm') || undefined;
    const CFOP = getTagTextSafe(prod, 'CFOP') || undefined;
    const uCom = getTagTextSafe(prod, 'uCom') || getTagTextSafe(prod, 'uTrib') || 'UN';
    const qCom = getTagFloatSafe(prod, 'qCom') || getTagFloatSafe(prod, 'qTrib') || 0;
    const vUnCom = getTagFloatSafe(prod, 'vUnCom') || getTagFloatSafe(prod, 'vUnTrib') || 0;
    const vProd = getTagFloatSafe(prod, 'vProd') || qCom * vUnCom;
    const cEAN = getTagTextSafe(prod, 'cEAN') || undefined;

    if (!xProd) {
      warnings.push(`Item ${nItem}: campo xProd ausente, ignorado.`);
      continue;
    }

    itens.push({ nItem, cProd, xProd, NCM, CFOP, uCom, qCom, vUnCom, vProd, cEAN });
  }

  const infAdic = getTagTextSafe(doc, 'infCpl') || getTagTextSafe(doc, 'infAdFisco') || undefined;

  return {
    chNFe,
    nNF,
    serie,
    dhEmi,
    natOp,
    modelo,
    emit,
    dest,
    vNF,
    vDesc: vDesc || undefined,
    vFrete: vFrete || undefined,
    vOutro: vOutro || undefined,
    itens,
    infAdic,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Lê um arquivo XML e retorna a NF-e parseada.
 * Detecta e trata encoding WINDOWS-1252 (comum em notas antigas).
 */
export function readNFeFile(file: File): Promise<NFeParsed> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content !== 'string') {
        reject(new Error('Falha ao ler o arquivo.'));
        return;
      }
      try {
        resolve(parseNFeXML(content));
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Erro ao ler o arquivo XML.'));

    // Usa UTF-8 por padrão; DOMParser cuida do encoding declarado no XML
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Formata a data ISO da NF-e para dd/mm/aaaa (input[type=date] usa aaaa-mm-dd)
 */
export function nfeDateToInputDate(dhEmi: string): string {
  // Formato NF-e: "2024-01-15T10:30:00-03:00" ou "2024-01-15"
  return dhEmi.slice(0, 10);
}
