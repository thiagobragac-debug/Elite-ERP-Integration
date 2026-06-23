# Settings Actions Reference - Command Palette

## Complete List of Administration Actions

This document provides a comprehensive reference for all settings and administrative actions available in the Command Palette.

---

## Administration Category

All actions below are categorized under **"Administração"** in the Command Palette.

---

### 1. Intelligence Hub

**Action ID**: `admin-intelligence`

**Title**: Intelligence Hub

**Path**: `/admin/intelligence`

**Icon**: Settings (⚙️)

**Description**: Administrative dashboard providing overview of system metrics, pending approvals, recent activities, and key insights.

**Keywords**:
- intelligence
- hub
- dashboard
- admin
- administração
- painel

**Use Cases**:
- View administrative dashboard
- Monitor system health
- Access admin overview
- Check pending items

---

### 2. Aprovações

**Action ID**: `admin-aprovacoes`

**Title**: Aprovações

**Path**: `/admin/aprovacoes`

**Icon**: Settings (⚙️)

**Description**: Manage approval workflows and authorization requests.

**Keywords**:
- aprovações
- approvals
- aprovar
- autorizar
- workflow

**Use Cases**:
- Review pending approvals
- Authorize requests
- Manage workflow steps
- Track approval history

---

### 3. Gestão de Usuários

**Action ID**: `admin-usuarios`

**Title**: Gestão de Usuários

**Path**: `/admin/usuarios`

**Icon**: Users (👥)

**Description**: Comprehensive user management including user creation, role assignment, permissions, and team organization.

**Keywords**:
- usuários
- users
- gestão
- gerenciar
- pessoas
- equipe
- perfis
- permissões

**Use Cases**:
- Add new users
- Edit user profiles
- Assign roles and permissions
- Manage team members
- Deactivate users
- View user activity

**Alternative Titles**:
- Gerenciar usuários
- User Management
- Manage Users

---

### 4. Empresas & Fazendas

**Action ID**: `admin-empresa`

**Title**: Empresas & Fazendas

**Path**: `/admin/config`

**Icon**: Building2 (🏢)

**Description**: Configure company information, farm properties, and organizational units.

**Keywords**:
- empresas
- fazendas
- propriedades
- unidades
- config
- configuração
- organização

**Use Cases**:
- Add new farms
- Edit company details
- Configure properties
- Manage organizational units
- Set up locations

**Alternative Titles**:
- Companies & Farms
- Organization Setup

---

### 5. Configurações

**Action ID**: `admin-config`

**Title**: Configurações

**Path**: `/admin/configuracoes`

**Icon**: Settings (⚙️)

**Description**: General system settings and preferences.

**Keywords**:
- configurações
- settings
- config
- ajustes
- preferências
- sistema

**Use Cases**:
- Configure system settings
- Set preferences
- Adjust system parameters
- Customize behavior
- Update general settings

**Alternative Titles**:
- Settings
- System Configuration
- Preferences

---

### 6. Assinatura & Planos

**Action ID**: `admin-assinatura`

**Title**: Assinatura & Planos

**Path**: `/admin/assinatura`

**Icon**: Settings (⚙️)

**Description**: Manage subscription, billing, and plan information.

**Keywords**:
- assinatura
- subscription
- planos
- plans
- billing
- faturamento
- pagamento

**Use Cases**:
- View current subscription
- Upgrade/downgrade plan
- Manage billing
- View payment history
- Update payment method

**Alternative Titles**:
- Subscription & Plans
- Billing Management

---

### 7. Logs de Auditoria

**Action ID**: `admin-auditoria`

**Title**: Logs de Auditoria

**Path**: `/admin/auditoria`

**Icon**: FileText (📄)

**Description**: View comprehensive audit logs of all system activities, user actions, and security events.

**Keywords**:
- auditoria
- audit
- logs
- histórico
- registro
- atividades
- rastreamento

**Use Cases**:
- View audit trail
- Track user activities
- Review security events
- Investigate incidents
- Compliance reporting
- Export logs

**Alternative Titles**:
- Audit Logs
- Activity Logs
- Audit Trail

---

## Quick Navigation Actions

### Abrir Administração

**Action ID**: `nav-admin`

**Title**: Abrir Administração

**Path**: `/admin/intelligence`

**Icon**: Settings (⚙️)

**Category**: Navegação Rápida

**Keyboard Shortcut**: `⌘+9` (Mac) or `Ctrl+9` (Windows/Linux)

**Keywords**:
- admin
- administração
- configurações
- usuários
- settings

**Description**: Quick access to the administration hub. This is a shortcut action that provides fast navigation to the Intelligence Hub.

---

## Search Examples

### Example 1: Finding Settings
```
User types: "config"
Results shown:
1. Configurações (Admin)
2. Empresas & Fazendas (Admin)
```

### Example 2: Finding User Management
```
User types: "users"
Results shown:
1. Gestão de Usuários (Admin)
2. Fornecedores (Compras) - if suppliers page exists
3. Clientes (Vendas) - if clients page exists
```

### Example 3: Finding Audit Logs
```
User types: "audit"
Results shown:
1. Logs de Auditoria (Admin)
```

### Example 4: Finding Admin Hub
```
User types: "admin"
Results shown:
1. Intelligence Hub (Admin)
2. Abrir Administração (Quick Nav)
```

### Example 5: Portuguese Search
```
User types: "usuários"
Results shown:
1. Gestão de Usuários (Admin)
2. Abrir Administração (Quick Nav)
```

---

## Navigation Patterns

### Pattern 1: Direct Navigation
1. Open Command Palette (`Cmd+K` or `Ctrl+K`)
2. Type search term
3. Select action with arrow keys or mouse
4. Press Enter or click
5. Navigate to target page
6. Command Palette closes automatically

### Pattern 2: Keyboard Shortcut
1. Press `⌘+9` (or `Ctrl+9`)
2. Immediately navigate to `/admin/intelligence`

### Pattern 3: Category Browsing
1. Open Command Palette
2. Type "administração" or scroll
3. Browse all admin actions
4. Select desired action

---

## Icon Legend

| Icon | Type | Used For |
|------|------|----------|
| ⚙️ Settings | Configuration | General settings, admin hub, subscription |
| 👥 Users | People | User management |
| 🏢 Building2 | Organization | Companies, farms, properties |
| 📄 FileText | Documents | Audit logs, reports |

---

## Accessibility

### Keyboard Navigation
- `Cmd+K` or `Ctrl+K`: Open Command Palette
- `↑` / `↓`: Navigate through results
- `Enter`: Execute selected action
- `ESC`: Close Command Palette

### Screen Reader Support
- All actions have descriptive titles
- Category labels provide context
- Icon types are semantically meaningful

---

## Multi-language Support

### Portuguese (Primary)
All titles and primary keywords are in Portuguese:
- Configurações
- Gestão de Usuários
- Logs de Auditoria
- Assinatura & Planos
- Empresas & Fazendas

### English (Secondary)
English keywords are included for:
- Technical terms (settings, config, admin)
- International users
- Common abbreviations (users, audit, logs)

### Bilingual Search
Users can search in either language:
- "configurações" or "settings" → Configurações
- "usuários" or "users" → Gestão de Usuários
- "auditoria" or "audit" → Logs de Auditoria

---

## Frequently Searched Terms

Based on common user behavior patterns:

| Rank | Term | Most Relevant Action |
|------|------|---------------------|
| 1 | "config" | Configurações |
| 2 | "users" | Gestão de Usuários |
| 3 | "settings" | Configurações |
| 4 | "admin" | Intelligence Hub |
| 5 | "audit" | Logs de Auditoria |
| 6 | "logs" | Logs de Auditoria |
| 7 | "subscription" | Assinatura & Planos |
| 8 | "billing" | Assinatura & Planos |
| 9 | "fazendas" | Empresas & Fazendas |
| 10 | "aprovações" | Aprovações |

---

## Related Actions

### Other Admin-Related Actions
While not in the "Administração" category, these actions may also be relevant:

- **Alternar fazenda** (Quick Actions): Switch between farms
- **Modo escuro/claro** (Quick Actions): Toggle theme

---

## Developer Notes

### Code Location
File: `src/components/Navigation/CommandPalette.tsx`

### Data Structure
```typescript
interface CommandItem {
  id: string;              // Unique identifier
  title: string;           // Display title
  icon: React.ComponentType; // Lucide icon component
  path?: string;           // Navigation path
  action?: CommandAction;  // Custom action function
  category: string;        // Category label
  keywords?: string[];     // Search keywords
  shortcut?: string;       // Keyboard shortcut
}
```

### Adding New Actions
To add a new settings action:

1. Add entry to `COMMANDS` array:
```typescript
{
  id: 'admin-newaction',
  title: 'New Action',
  icon: IconComponent,
  path: '/admin/newaction',
  category: 'Administração',
  keywords: ['keyword1', 'keyword2', 'keyword3'],
}
```

2. Ensure route exists in routing configuration
3. Test search functionality with various keywords
4. Update this reference document

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024 | Initial implementation with 7 admin actions |
| 1.1 | 2024 | Added comprehensive keywords for all actions |

---

## Support

For issues or questions:
1. Check the Testing Guide (TASK_31.3_TESTING_GUIDE.md)
2. Review the Completion Summary (TASK_31.3_COMPLETION_SUMMARY.md)
3. Inspect CommandPalette.tsx source code

---

**Last Updated**: 2024
**Task**: 31.3 Add settings actions
**Status**: Complete
