# Loading Skeleton Routes Mapping

**Task**: 30.3 Add skeletons to lazy-loaded routes  
**Date**: 2024  
**Related Requirements**: 15.4 - Display skeleton loaders for all lazy-loaded routes

## Overview

All lazy-loaded routes in `App.tsx` now use appropriate `LoadingSkeleton` variants with `fullScreen={true}` to provide better user experience during route transitions.

## Skeleton Variant Guidelines

- **table**: List/table pages (management screens with data grids)
- **card**: Dashboard pages (card-based layouts)
- **form**: Form pages (registration, configuration, calculators)
- **chart**: Report/analytics pages (heavy chart content)

## Routes by Module

### Auth & Landing
| Route | Component | Variant | Rationale |
|-------|-----------|---------|-----------|
| `/` (non-auth) | LandingPage | `card` | Card-based landing page |
| `/cadastro` | TenantRegistration | `form` | Registration form |
| `/mfa-enroll` | MFAEnroll | `form` | MFA enrollment form |
| `/select-role` | RoleSelector | `card` | Card-based role selection |

### SaaS Admin
| Route | Component | Variant | Rationale |
|-------|-----------|---------|-----------|
| `/saas/*` | SaaSAdminPanel | `table` | Admin table with tenant list |

### Admin Module
| Route | Component | Variant | Rationale |
|-------|-----------|---------|-----------|
| `/admin/usuarios` | UserManagement | `table` | User list table |
| `/admin/perfil` | ProfilePage | `form` | Profile edit form |
| `/admin/config` | CompanyManagement | `form` | Company settings form |
| `/admin/intelligence` | AdminIntelligenceHub | `card` | Dashboard with KPI cards |
| `/admin/configuracoes` | ModuleSettings | `form` | Module configuration form |
| `/admin/assinatura` | TenantBilling | `card` | Billing cards and plans |
| `/admin/auditoria` | AuditLog | `table` | Audit log table |
| `/admin/aprovacoes` | ApprovalCenter | `table` | Approval requests table |
| `/admin/sentry-test` | SentryErrorTest | `card` | Test card layout |

### Market Module
| Route | Component | Variant | Rationale |
|-------|-----------|---------|-----------|
| `/mercado/indicadores` | MarketIntelligenceDashboard | `chart` | Market charts and graphs |
| `/mercado/analise` | MarketAdvancedAnalytics | `chart` | Advanced analytics charts |
| `/mercado/sazonalidade` | MarketSeasonality | `chart` | Seasonality charts |
| `/mercado/b3` | MarketB3Calculator | `form` | Calculator form |

### Pecuária (Livestock) Module
| Route | Component | Variant | Rationale |
|-------|-----------|---------|-----------|
| `/pecuaria/dashboard` | LivestockDashboard | `card` | Dashboard with metric cards |
| `/pecuaria/animal` | AnimalManagement | `table` | Animal list table |
| `/pecuaria/romaneios` | RomaneioManagement | `table` | Shipping manifest table |
| `/pecuaria/animal/:id` | AnimalDetail | `card` | Animal detail cards |
| `/pecuaria/lote` | LotManagement | `table` | Lot list table |
| `/pecuaria/pasto` | PastureManagement | `table` | Pasture list table |
| `/pecuaria/pesagem` | WeightManagement | `table` | Weighing records table |
| `/pecuaria/reproducao` | ReproductionManagement | `table` | Reproduction records table |
| `/pecuaria/nutricao` | NutritionManagement | `table` | Nutrition plans table |
| `/pecuaria/sanidade` | HealthManagement | `table` | Health records table |
| `/pecuaria/confinamento` | ConfinementManagement | `table` | Confinement records table |

### Finance Module
| Route | Component | Variant | Rationale |
|-------|-----------|---------|-----------|
| `/financeiro/intelligence` | FinanceIntelligenceHub | `card` | Financial dashboard with KPIs |
| `/financeiro/contas` | BankAccounts | `table` | Bank accounts table |
| `/financeiro/fluxo` | CashFlow | `chart` | Cash flow charts |
| `/financeiro/pagar` | AccountsPayable | `table` | Payables table |
| `/financeiro/receber` | AccountsReceivable | `table` | Receivables table |
| `/financeiro/conciliacao` | BankReconciliation | `table` | Reconciliation table |
| `/financeiro/lcdpr` | LCDPRPage | `form` | LCDPR tax form |

### Fleet Module
| Route | Component | Variant | Rationale |
|-------|-----------|---------|-----------|
| `/frota/dashboard` | FleetDashboard | `card` | Fleet dashboard with cards |
| `/frota/maquina` | FleetManagement | `table` | Vehicle/machinery table |
| `/frota/abastecimento` | FuelManagement | `table` | Fuel records table |
| `/frota/manutencao` | MaintenanceManagement | `table` | Maintenance records table |

### Inventory Module
| Route | Component | Variant | Rationale |
|-------|-----------|---------|-----------|
| `/estoque/dashboard` | InventoryDashboard | `card` | Inventory dashboard |
| `/estoque/insumo` | InventoryManagement | `table` | Supplies/items table |
| `/estoque/deposito` | WarehouseManagement | `table` | Warehouse list table |
| `/estoque/deposito/:id` | WarehouseDetails | `card` | Warehouse detail cards |
| `/estoque/movimentacao` | MovementManagement | `table` | Movement records table |
| `/estoque/inventario` | AuditManagement | `table` | Inventory audit table |

### Purchasing Module
| Route | Component | Variant | Rationale |
|-------|-----------|---------|-----------|
| `/compras/dashboard` | PurchasingDashboard | `card` | Purchasing dashboard |
| `/compras/solicitacao` | PurchaseRequest | `table` | Purchase requests table |
| `/compras/cotacao` | QuotationMap | `table` | Quotations table |
| `/compras/pedido` | PurchaseOrder | `table` | Purchase orders table |
| `/compras/nota` | EntryInvoice | `table` | Entry invoices table |
| `/compras/fornecedores` | SupplierManagement | `table` | Suppliers table |

### Sales Module
| Route | Component | Variant | Rationale |
|-------|-----------|---------|-----------|
| `/vendas/dashboard` | SalesDashboard | `card` | Sales dashboard |
| `/vendas/parceiros` | ClientManagement | `table` | Clients/partners table |
| `/vendas/pedido` | SalesOrders | `table` | Sales orders table |
| `/vendas/contrato` | Contracts | `table` | Contracts table |
| `/vendas/notas` | Invoices | `table` | Invoices table |

### Reports
| Route | Component | Variant | Rationale |
|-------|-----------|---------|-----------|
| `/relatorios` | Reports | `chart` | Reports with charts |

## Summary Statistics

- **Total lazy-loaded routes**: 53
- **Table variants**: 35 (66%)
- **Card variants**: 12 (23%)
- **Form variants**: 5 (9%)
- **Chart variants**: 5 (9%)
- **All routes use**: `fullScreen={true}`

## Testing Verification

To verify the skeleton loaders:

1. **Enable network throttling** in DevTools (Slow 3G or custom throttle)
2. **Navigate between routes** to see skeleton transitions
3. **Check each variant** displays appropriate structure:
   - Tables show header, search bar, and row skeletons
   - Cards show grid of card placeholders
   - Forms show field label and input skeletons
   - Charts show KPI cards and chart placeholder

## Benefits

✅ **Consistent UX**: All lazy-loaded routes provide visual feedback  
✅ **Reduced perceived load time**: Skeletons appear instantly  
✅ **Content-aware**: Skeleton matches final page structure  
✅ **Accessibility**: Proper ARIA labels and roles  
✅ **Maintainable**: Centralized LoadingSkeleton component  

## Related Files

- `src/App.tsx` - Route configuration with skeleton fallbacks
- `src/components/Feedback/LoadingSkeleton.tsx` - Skeleton component implementation
- `src/components/Feedback/Skeleton.tsx` - Base skeleton primitive
