# 📦 Dependency Management Guide

## Overview

Este documento descreve a estratégia de gerenciamento de dependências do Tauze ERP v5.0, incluindo políticas de atualização, processos de revisão e configuração do Dependabot.

---

## 🤖 Automated Updates with Dependabot

### Configuration

O projeto utiliza **GitHub Dependabot** para atualizações automáticas de dependências. A configuração está localizada em `.github/dependabot.yml`.

### Update Schedule

- **Frequência:** Semanal
- **Dia:** Segunda-feira
- **Horário:** 09:00 (America/Sao_Paulo)
- **Ecosistemas Monitorados:**
  - npm (dependências Node.js)
  - GitHub Actions (workflows CI/CD)

### Grouping Strategy

Para reduzir o ruído de PRs, as atualizações são agrupadas:

#### Production Dependencies
- **Group:** `production-dependencies`
- **Include:** Atualizações `minor` e `patch`
- **Exemplo:** React 19.2.0 → 19.2.5, Supabase 2.100.0 → 2.105.1

#### Development Dependencies
- **Group:** `development-dependencies`
- **Include:** Atualizações `minor` e `patch`
- **Exemplo:** Vitest 4.1.0 → 4.1.8, Playwright 1.60.0 → 1.61.0

#### Major Updates
- **Strategy:** **Separados** (não agrupados)
- **Reason:** Requerem revisão cuidadosa e podem ter breaking changes
- **Exemplo:** React 19.x.x → 20.0.0 (nova versão major)

### Pull Request Configuration

- **Limite:** Máximo de 5 PRs npm + 3 PRs GitHub Actions abertos simultaneamente
- **Labels:** 
  - `dependencies` (todas as PRs)
  - `automated` (PRs automáticos)
  - `github-actions` (para atualizações de workflows)
- **Commit Prefix:**
  - `chore:` para dependências de produção
  - `chore(dev):` para dependências de desenvolvimento
  - `ci:` para GitHub Actions
- **Rebase Strategy:** Automático

---

## 🔍 Manual Dependency Management

### Checking for Updates

```bash
# Listar todas as dependências desatualizadas
npm outdated

# Ver detalhes de uma dependência específica
npm outdated <package-name>
```

### Updating Dependencies

#### Patch and Minor Updates (Safe)
```bash
# Atualizar todas as dependências respeitando o semver do package.json
npm update

# Atualizar dependência específica
npm update <package-name>
```

#### Major Updates (Requires Review)
```bash
# Instalar nova versão major
npm install <package-name>@latest

# Ou especificar versão exata
npm install <package-name>@<version>
```

### Security Audits

```bash
# Verificar vulnerabilidades conhecidas
npm audit

# Corrigir vulnerabilidades automaticamente (safe)
npm audit fix

# Forçar correção mesmo com breaking changes (USE WITH CAUTION)
npm audit fix --force

# Ver relatório detalhado em JSON
npm audit --json
```

---

## ✅ Review Process for Dependabot PRs

### Step 1: Automated Checks
- CI pipeline deve passar (lint, type-check, tests, build)
- Coverage não deve diminuir abaixo de 60%
- Nenhuma nova vulnerabilidade crítica introduzida

### Step 2: Manual Review

#### For Patch Updates (1.2.3 → 1.2.4)
- ✅ **Auto-merge candidato** (após CI passar)
- Revisar changelog para bug fixes críticos
- Merge sem testes manuais extensivos

#### For Minor Updates (1.2.x → 1.3.0)
- ⚠️ **Revisão rápida recomendada**
- Verificar changelog para novas features e deprecations
- Testar funcionalidades afetadas localmente
- Merge após smoke test

#### For Major Updates (1.x.x → 2.0.0)
- 🔴 **Revisão completa obrigatória**
- Ler migration guide completo
- Verificar breaking changes
- Atualizar código se necessário
- Rodar test suite completo localmente
- Testar em ambiente de staging
- Merge apenas após aprovação do tech lead

### Step 3: Post-Merge Monitoring

Após merge, monitorar por 24-48h:
- Logs de erro no Sentry
- Métricas de performance (Web Vitals)
- Feedback de usuários
- Rollback imediato se problemas críticos

---

## 🚫 Ignored Dependencies

Algumas dependências podem ser ignoradas do Dependabot para versões específicas.

### Current Ignored List

```yaml
# Exemplo (descomente em .github/dependabot.yml se necessário):
# ignore:
#   - dependency-name: "react"
#     update-types: ["version-update:semver-major"]
```

**Why ignore?**
- Breaking changes incompatíveis com o projeto
- Problemas conhecidos em versões específicas
- Dependências que requerem migração complexa

### Adding to Ignore List

1. Abra `.github/dependabot.yml`
2. Adicione à seção `ignore:` do npm
3. Especifique `dependency-name` e `update-types`
4. Documente o motivo neste arquivo

---

## 📊 Dependency Health Metrics

### Monitoring

| Metric | Target | How to Check |
|--------|--------|--------------|
| Outdated Dependencies | <10 | `npm outdated` |
| Security Vulnerabilities | 0 critical, 0 high | `npm audit` |
| Dependabot PRs Response Time | <7 days | GitHub PR list |
| Failed Dependency Updates | 0 | CI/CD logs |

### Monthly Review Checklist

- [ ] Run `npm outdated` e revisar lista
- [ ] Run `npm audit` e verificar vulnerabilidades
- [ ] Revisar PRs do Dependabot pendentes
- [ ] Atualizar major versions planejadas
- [ ] Verificar deprecation warnings no build
- [ ] Atualizar este documento se necessário

---

## 🔐 Security-First Approach

### Priority Rules

1. **Critical Vulnerabilities:** Corrigir imediatamente (mesmo que seja breaking change)
2. **High Vulnerabilities:** Corrigir dentro de 7 dias
3. **Medium/Low Vulnerabilities:** Incluir no próximo ciclo de atualizações
4. **No Vulnerabilities:** Seguir cronograma normal de updates

### Security Audit Process

```bash
# 1. Identificar vulnerabilidades
npm audit

# 2. Tentar correção automática
npm audit fix

# 3. Se correção automática falhar, revisar manualmente
npm audit --json > audit-report.json

# 4. Para cada vulnerabilidade crítica/high:
#    - Verificar se há versão corrigida
#    - Testar localmente
#    - Atualizar e commitar

# 5. Documentar vulnerabilidades que não podem ser corrigidas
#    (dependências transitivas sem fix disponível)
```

### CI/CD Security Gates

O pipeline de CI falha se:
- Vulnerabilidades **critical** são encontradas em produção
- Dependências desatualizadas há mais de 6 meses (major versions antigas)

---

## 📚 Best Practices

### DO ✅

- ✅ Revisar changelogs antes de mergear major updates
- ✅ Testar localmente atualizações major
- ✅ Manter dependencies atualizadas (pelo menos minor versions)
- ✅ Responder a PRs do Dependabot dentro de 1 semana
- ✅ Usar versões exatas (`1.2.3`) para dependências críticas
- ✅ Documentar breaking changes encontrados

### DON'T ❌

- ❌ Ignorar PRs do Dependabot por mais de 1 mês
- ❌ Mergear major updates sem testar
- ❌ Usar `npm audit fix --force` sem revisar impacto
- ❌ Deixar vulnerabilidades críticas sem correção
- ❌ Atualizar múltiplas major versions simultaneamente
- ❌ Commitar `package-lock.json` conflicts sem resolver

---

## 🔄 Update Strategy by Dependency Type

### React & Core Libraries
- **Strategy:** Conservative
- **Major Updates:** Aguardar 2-3 semanas após release para estabilização
- **Testing:** Full regression testing required

### TypeScript
- **Strategy:** Semi-aggressive
- **Major Updates:** Atualizar dentro de 1 mês após release
- **Testing:** Type-check + smoke tests

### Build Tools (Vite, ESBuild)
- **Strategy:** Aggressive
- **Minor/Patch:** Auto-merge após CI
- **Major:** Testar localmente e mergear dentro de 1 semana

### UI Libraries (Lucide, Recharts)
- **Strategy:** Standard
- **All Updates:** Revisar changelog e testar visualmente

### Testing Tools (Vitest, Playwright)
- **Strategy:** Aggressive
- **All Updates:** Auto-merge após CI passar

---

## 🛠️ Troubleshooting

### Dependabot PR Failed CI

**Causes:**
- Breaking changes em minor/patch (raro mas acontece)
- Type errors após atualização do TypeScript
- Test failures devido a mudanças de API

**Solutions:**
1. Verificar logs de CI para identificar erro
2. Reproduzir localmente: `npm install <package>@<version>`
3. Corrigir código se necessário
4. Commitar fix no branch do Dependabot PR
5. CI re-run automaticamente

### Dependabot Stopped Creating PRs

**Causes:**
- Limite de PRs abertos atingido (5 para npm)
- Configuração inválida no `dependabot.yml`
- Permissões insuficientes

**Solutions:**
1. Mergear ou fechar PRs antigos
2. Validar syntax do `.github/dependabot.yml`
3. Verificar permissões do Dependabot no repositório

### Conflicting Dependency Updates

**Scenario:** Dois PRs do Dependabot atualizam a mesma dependência (transitive)

**Solution:**
1. Mergear o PR mais crítico primeiro (geralmente patch > minor > major)
2. Fechar o outro PR (Dependabot criará um novo atualizado)
3. Ou mergear manualmente em um único commit

---

## 📈 Future Improvements

### Planned Enhancements

- [ ] Configurar Renovate como alternativa (mais features que Dependabot)
- [ ] Implementar automated regression testing para major updates
- [ ] Dashboard de métricas de dependências
- [ ] Alertas Slack para vulnerabilidades críticas
- [ ] Scheduled updates em horários de baixo tráfego

---

## 📞 Support

**Questions?** Contate o tech lead ou abra uma issue no repositório.

**Last Updated:** Janeiro 2025
