# 🔧 Troubleshooting - Servidor não Carrega no Navegador

## ✅ Status Atual

**O servidor está funcionando perfeitamente!**

```
✅ Servidor rodando na porta 5173
✅ HTTP respondendo com status 200
✅ Arquivo .env configurado
✅ HTML sendo servido corretamente (2046 bytes)
✅ Scripts Vite carregados
```

## 🎯 Problema Identificado

O servidor está OK, mas o **navegador pode não estar conseguindo renderizar a aplicação**. Isso geralmente acontece por:

1. **Cache do navegador** (causa mais comum)
2. **Erro de JavaScript no console**
3. **Extensões do navegador interferindo**
4. **Firewall bloqueando conexões locais**

---

## 🛠️ Soluções (Execute Nesta Ordem)

### 1️⃣ Limpar Cache do Navegador (MAIS IMPORTANTE)

**Google Chrome / Edge:**
```
1. Pressione: Ctrl + Shift + Delete
2. Selecione:
   ☑ Imagens e arquivos em cache
   ☑ Cookies e dados de sites
3. Período: "Todo o período"
4. Clique em "Limpar dados"
5. Feche e reabra o navegador
```

**Firefox:**
```
1. Pressione: Ctrl + Shift + Delete
2. Selecione tudo
3. Clique em "Limpar agora"
```

### 2️⃣ Testar em Modo Anônimo/Privado

**Chrome/Edge:** `Ctrl + Shift + N`
**Firefox:** `Ctrl + Shift + P`

Acesse: `http://localhost:5173/`

✅ **Se funcionar no modo anônimo** = problema é cache/extensões
❌ **Se não funcionar** = vá para próxima solução

### 3️⃣ Verificar Console do Navegador

1. Pressione **F12** ou **Ctrl + Shift + I**
2. Vá na aba **Console**
3. Recarregue a página (**F5**)
4. Procure por erros em vermelho

**Erros comuns:**
- `Failed to fetch` → Problema de rede
- `validateEnv` → Variáveis de ambiente
- `Module not found` → Dependência faltando
- `CORS error` → Configuração do Supabase

**Se encontrar erros, tire um print e me envie!**

### 4️⃣ Testar pela URL da Rede (Bypass do localhost)

Acesse: **`http://192.168.0.7:5173/`**

Isso força o navegador a usar o IP real ao invés do localhost.

### 5️⃣ Reiniciar o Servidor Vite

```bash
# No terminal onde está rodando npm run dev
1. Pressione: Ctrl + C
2. Aguarde parar
3. Execute: npm run dev
4. Aguarde aparecer: "ready in X ms"
5. Tente acessar novamente
```

### 6️⃣ Limpar Cache do Vite

```bash
npm run clean
npm run dev
```

Isso remove compilações antigas que podem estar causando conflito.

### 7️⃣ Reinstalar Dependências (Última Opção)

```bash
# Deletar node_modules e cache
Remove-Item -Recurse -Force node_modules, .vite
npm install
npm run dev
```

---

## 🔍 Verificação Rápida

Execute este comando para diagnóstico:

```bash
powershell -ExecutionPolicy Bypass -File check-server.ps1
```

---

## 📊 O Que Deve Aparecer no Navegador

Quando funcionar, você verá:

1. **Tela de Login** (se não estiver autenticado)
2. **Dashboard Executivo** (se já estiver logado)
3. **LandingPage** (página inicial para novos usuários)

---

## 🐛 Erros Conhecidos e Soluções

### Erro: "Variáveis de ambiente não encontradas"

**Solução:**
```bash
# Verificar se .env existe
Get-Content .env

# Deve conter:
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

### Erro: "Failed to fetch dynamically imported module"

**Solução:**
```bash
# Limpar cache do Vite
npm run clean
npm run dev
```

### Página em Branco + Console sem Erros

**Solução:**
1. Verificar se `#root` existe no HTML
2. Limpar cache do navegador
3. Desabilitar extensões (AdBlock, etc)

### Erro: "CORS policy"

**Solução:**
- Verificar configuração do Supabase
- Checar se URL está correta no .env

---

## 🆘 Se Nada Funcionar

**Me envie:**

1. **Screenshot do console do navegador (F12)**
2. **Output do comando:**
   ```bash
   npm run dev
   ```
3. **Resultado do script de diagnóstico:**
   ```bash
   powershell -File check-server.ps1
   ```

---

## ✨ URLs Disponíveis

- **Local:** http://localhost:5173/
- **Rede:** http://192.168.0.7:5173/
- **Todas interfaces:** http://0.0.0.0:5173/ (se configurado)

---

## 📱 Testar no Celular (Mesma Rede Wi-Fi)

Acesse no celular: `http://192.168.0.7:5173/`

Se funcionar no celular mas não no PC = problema no navegador/firewall do PC.

---

## 🔒 Verificar Firewall Windows

```powershell
# Verificar se Node.js está bloqueado
Get-NetFirewallRule -DisplayName "*Node*" | Format-Table

# Se não aparecer nada, adicionar regra:
New-NetFirewallRule -DisplayName "Node.js" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow
```

---

## 📝 Checklist Final

- [ ] Cache do navegador limpo
- [ ] Testado em modo anônimo
- [ ] Console do navegador verificado
- [ ] Servidor Vite reiniciado
- [ ] Cache do Vite limpo
- [ ] .env existe e está preenchido
- [ ] Testado pela URL da rede (192.168.0.7)
- [ ] Testado em outro navegador

---

## 🎯 Próximos Passos (Quando Funcionar)

1. ✅ Login no sistema
2. ✅ Testar módulos principais
3. ✅ Verificar integrações (Supabase)
4. ✅ Configurar feature flags
5. ✅ Executar testes E2E

---

**Última atualização:** $(Get-Date -Format "yyyy-MM-dd HH:mm")
