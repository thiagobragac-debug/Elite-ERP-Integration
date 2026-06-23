# Diretrizes de UI/UX - Tauze ERP Integration

Este documento define as regras de negócio e padrões de interface (Design System) aplicados no **Tauze ERP Integration**. O objetivo é manter a consistência, previsibilidade e escalabilidade do sistema.

## 1. Regra de Negócio para Componentes de Formulário e Cadastro

Para lidar com o volume de dados e complexidade típicos de um ERP, adotamos uma estratégia híbrida baseada na complexidade da ação do usuário. 

Siga esta regra de ouro ao criar novas telas e fluxos:

### Regras de Uso:

| Complexidade da Ação | Componente Ideal | Exemplo de Uso |
| :--- | :--- | :--- |
| **Ação Simples/Rápida** (< 5 campos) | **Modal Centralizado** | Adicionar nova categoria, cadastrar cidade faltante, confirmações (exclusão). |
| **Ação a partir de Lista** (6 a 15 campos) | **Side-Panel (Gaveta Lateral)** | Editar um parceiro a partir da tabela, visualizar detalhes rápidos de um pedido. |
| **Entidade Complexa** (> 15 campos) | **Página Dedicada** | Perfil completo do Cliente, Cadastro detalhado de Animal, com múltiplas abas (Financeiro, Histórico). |
| **Processo Cronológico** (Passo a passo) | **Wizards (Steps)** | Fechamento de Faturamento (Passo 1 -> Passo 2 -> Passo 3). |

---

## 2. Detalhamento dos Padrões

### 2.1 Side-panel (Gaveta Lateral)
*   **Contexto:** O padrão ouro para edições e visualizações de média complexidade.
*   **Por que usar:** Permite que o usuário abra um formulário sem perder o contexto da tela principal (a listagem ao fundo).
*   **Vantagem:** Maior altura útil vertical que um modal centralizado. Dispensam paginação interna e são menos intrusivos.
*   **Organização interna:** Se houver necessidade, utilize **Abas** dentro do side-panel.

### 2.2 Página Dedicada
*   **Contexto:** Utilizado para as Entidades Núcleo (Core Entities) do sistema que são ricas em detalhes e relacionamentos.
*   **Por que usar:** Formulários muito longos com muitos relacionamentos sufocam modais e gavetas. A página dedicada permite "Deep Work" (foco total).
*   **Vantagem:** Facilita o roteamento (criação de URLs específicas como `/clientes/123/editar`), que é essencial para compartilhamento de links no ambiente corporativo.
*   **Organização interna:** Sempre divida a página usando **Abas (Tabs)** ou **Cartões (Cards)** agrupados por afinidade lógica (ex: Dados Pessoais, Endereços, Parâmetros Financeiros).

### 2.3 Modais Simples
*   **Contexto:** Ações rápidas, secundárias e de interrupção.
*   **Anatomia:** Devem conter Título, Ícone de contexto, Corpo dividido em seções claras e um **Rodapé Fixo** com botões de ação (Cancelar/Salvar).
*   **Evitar:** Formulários que exigem rolagem infinita. 

### 2.4 Abas (Tabs) vs. Wizards (Steps)
*   **Abas:** Utilize quando as informações forem **independentes**. O usuário pode preencher a aba "Dados Financeiros" sem ter preenchido a aba "Endereços" antes.
*   **Wizards:** Utilize apenas quando o processo for estritamente **linear e dependente**. O Passo 2 não pode ser preenchido sem o Passo 1 concluído. Use de preferência em Páginas Dedicadas.

## 3. Padrão Visual (Anatomia Base)
Independentemente do contêiner (Modal, Gaveta ou Página), todos os agrupamentos de informações devem seguir:
1.  **Agrupamento Lógico:** Separar blocos de campos relacionados com títulos de seção coloridos (ex: Verde para headers de seção).
2.  **Grid:** Uso de múltiplas colunas para maximizar espaço (ex: CEP, Tipo de Logradouro e Endereço na mesma linha).
3.  **Rodapé de Ações:** Botões de ação devem estar sempre visíveis no rodapé, usando cores de contraste (ex: Verde para salvar, e botões "ghost/outline" para cancelar).
