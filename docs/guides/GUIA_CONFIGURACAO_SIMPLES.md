# 🎯 Guia Simplificado de Configuração

**Você precisa fazer apenas 3 coisas simples:**

---

## ✅ 1. Configurar o Arquivo `.env` (5 minutos)

### O Que Fazer:

1. **Copiar o arquivo de exemplo:**
   ```bash
   # No terminal do projeto
   copy .env.example .env
   ```

2. **Abrir o arquivo `.env` criado:**
   ```bash
   notepad .env
   ```

3. **Preencher apenas 2 linhas:**
   
   Você precisa de 2 informações do Supabase:
   
   **a) Project URL:**
   - Acesse: https://app.supabase.com
   - Faça login
   - Clique no seu projeto "Tauze"
   - Vá em "Settings" (menu lateral)
   - Clique em "API"
   - Copie o texto que aparece em **"Project URL"**
   - Cole no .env assim:
   ```
   VITE_SUPABASE_URL=cole_aqui_a_url
   ```

   **b) Anon Key:**
   - Na mesma página (Settings → API)
   - Procure **"anon public"** key
   - Clique no ícone de copiar (ao lado da chave)
   - Cole no .env assim:
   ```
   VITE_SUPABASE_ANON_KEY=cole_aqui_a_chave
   ```

4. **Salvar e fechar** o arquivo `.env`

5. **Testar se funcionou:**
   ```bash
   npm run healthcheck
   ```
   
   **Deve aparecer:**
   ```
   ✅ Variáveis de ambiente: OK
   ✅ Conexão com banco de dados: OK
   ✅ Todos os serviços estão funcionando!
   ```

---

## ✅ 2. GitHub Secrets (OPCIONAL - só se quiser CI/CD)

**Para que serve:** Fazer builds automáticos quando você fizer push

**Como fazer:**

1. Vá em: `https://github.com/seu-usuario/seu-repo/settings/secrets/actions`

2. Clique em "New repository secret" **2 vezes** e adicione:

   **Secret 1:**
   - Name: `VITE_SUPABASE_URL`
   - Secret: (mesma URL que você colocou no .env)

   **Secret 2:**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Secret: (mesma key que você colocou no .env)

3. Pronto! Na próxima vez que fizer `git push`, o GitHub vai rodar testes automaticamente.

**⏭️ Pode pular isso se não entender - não é obrigatório!**

---

## ✅ 3. Renovate Bot (OPCIONAL - atualização automática de dependências)

**Para que serve:** Bot que avisa quando há atualizações de bibliotecas

**Como fazer:**

1. Vá em: https://github.com/marketplace/renovate

2. Clique em "Install it for free"

3. Escolha seu repositório

4. Clique em "Install"

5. Pronto! O bot vai criar PRs automaticamente quando houver updates.

**⏭️ Pode pular isso - é apenas conveniência!**

---

## 🎯 Resumo: O Que É OBRIGATÓRIO?

### ✅ Obrigatório (para o app funcionar):
- **Apenas 1:** Configurar o `.env` com suas credenciais Supabase

### ⭕ Opcional (melhorias):
- **2:** GitHub Secrets (só se quiser CI/CD)
- **3:** Renovate Bot (só se quiser updates automáticos)

---

## 🆘 Problemas Comuns

### "Não sei onde encontrar minhas credenciais do Supabase"

**Solução passo a passo:**

1. Abra o navegador
2. Acesse: https://app.supabase.com
3. Faça login (se não lembrar da senha, clique em "Forgot password")
4. Clique no projeto "Tauze" (ou como você nomeou)
5. No menu lateral esquerdo, clique no ícone de **engrenagem** (Settings)
6. Clique em **"API"**
7. Você verá:
   ```
   Project URL: https://xxxxxxx.supabase.co
   anon public: eyJhbGciOi...
   ```
8. Copie esses 2 valores para o `.env`

---

### "Não tenho conta no Supabase"

**Você precisa criar uma!** O projeto usa Supabase como banco de dados.

1. Vá em: https://supabase.com
2. Clique em "Start your project"
3. Faça login com GitHub (mais fácil)
4. Crie um novo projeto:
   - Name: Tauze ERP
   - Database Password: (anote isso!)
   - Region: South America (São Paulo)
5. Aguarde ~2 minutos para o projeto ser criado
6. Depois siga o guia acima para pegar as credenciais

---

### "O healthcheck falha"

**Possíveis causas:**

1. **Credenciais erradas:**
   - Verifique se copiou TODA a key (ela é bem longa)
   - Verifique se não tem espaços extras

2. **Internet:**
   - Verifique sua conexão
   - Tente desabilitar VPN/Proxy

3. **Projeto Supabase pausado:**
   - Projetos grátis pausam após inatividade
   - Vá no dashboard e clique em "Resume project"

---

## 📞 Precisa de Ajuda Específica?

Execute este comando para diagnóstico automático:

```bash
.\scripts\check-config.ps1
```

Ele vai te dizer **exatamente** o que está faltando!

---

## ✅ Checklist Simples

Marque conforme for fazendo:

- [ ] Copiei o arquivo `.env.example` para `.env`
- [ ] Abri o `.env` no notepad
- [ ] Entrei no Supabase e peguei minhas credenciais
- [ ] Colei as credenciais no `.env`
- [ ] Salvei o arquivo
- [ ] Executei `npm run healthcheck`
- [ ] Deu tudo certo! ✅

**Se todos os checks estão OK, você pode usar o app!**

```bash
npm run dev
```

Acesse: http://localhost:5173

---

**Dúvidas?** Execute o diagnóstico:
```bash
.\scripts\check-config.ps1
```
