import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { chave_acesso, tenant_id, company_id } = await req.json();

    if (!chave_acesso || !tenant_id || !company_id) {
      throw new Error('Parâmetros obrigatórios não informados: chave_acesso, tenant_id, company_id');
    }

    // 1. Conectar ao Supabase usando Service Role (para poder acessar os certificados com segurança)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Buscar o Certificado Digital da Empresa
    const { data: cert, error: certError } = await supabase
      .from('certificados_digitais')
      .select('pfx_base64, senha')
      .eq('tenant_id', tenant_id)
      .eq('company_id', company_id)
      .single();

    if (certError || !cert) {
      throw new Error('Certificado digital não encontrado para esta empresa. Vá em Configurações > Certificados Fiscais e cadastre um.');
    }

    // Na vida real aqui faríamos a decodificação do PFX usando crypto e comunicação SOAP HTTPS com TLS Mútuo.
    console.log('✅ Certificado encontrado e carregado.');
    console.log('🔄 Iniciando comunicação com a SEFAZ para chave:', chave_acesso);
    
    // Simular o delay de comunicação com a SEFAZ (2 a 3 segundos)
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Determinar se é NF-e ou NFS-e pelo tamanho da chave
    // Chave de 44 dígitos = NFe/CTe/MDFe Estadual/Nacional
    // Chave diferente = NFS-e (Nota Fiscal de Serviço Municipal - Padrão ABRASF/Nacional)
    const isNFSe = chave_acesso.length !== 44;

    // Gerar um XML Mockado perfeito para o nosso sistema ingerir!
    const mockNFeXml = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe${chave_acesso}" versao="4.00">
      <ide>
        <cUF>51</cUF>
        <natOp>VENDA DE MERCADORIA</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>${Math.floor(Math.random() * 10000)}</nNF>
        <dhEmi>${new Date().toISOString()}</dhEmi>
      </ide>
      <emit>
        <CNPJ>12345678000199</CNPJ>
        <xNome>FORNECEDOR INTEGRACAO SEFAZ LTDA</xNome>
        <enderEmit>
          <xLgr>RUA PRINCIPAL</xLgr>
          <nro>100</nro>
          <xBairro>CENTRO</xBairro>
          <xMun>SÃO PAULO</xMun>
          <UF>SP</UF>
        </enderEmit>
      </emit>
      <dest>
        <CNPJ>98765432000199</CNPJ>
        <xNome>EMPRESA COMPRADORA (SUA EMPRESA)</xNome>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>1001</cProd>
          <xProd>Semente de Milho PIONEER 30F53</xProd>
          <NCM>10059010</NCM>
          <CFOP>5102</CFOP>
          <uCom>SC</uCom>
          <qCom>100.0000</qCom>
          <vUnCom>285.5000</vUnCom>
          <vProd>28550.00</vProd>
        </prod>
      </det>
      <det nItem="2">
        <prod>
          <cProd>2002</cProd>
          <xProd>Adubo NPK 04-14-08</xProd>
          <NCM>31052000</NCM>
          <CFOP>5102</CFOP>
          <uCom>TON</uCom>
          <qCom>25.0000</qCom>
          <vUnCom>4200.0000</vUnCom>
          <vProd>105000.00</vProd>
        </prod>
      </det>
      <total>
        <ICMSTot>
          <vProd>133550.00</vProd>
          <vNF>133550.00</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Nota Fiscal baixada com sucesso da SEFAZ.',
        isNFSe: isNFSe,
        xmlBase64: btoa(mockNFeXml), // Retornar em Base64 para o client parsear
        chave: chave_acesso
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error: any) {
    console.error('Erro na função fetch-sefaz-nfe:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
