
# Script: apply-hasDraftForKey.ps1
# Adiciona useEffect com hasDraftForKey em todas as páginas do Tauze ERP
# para auto-reabrir formulários quando o usuário retorna à página com rascunho pendente.

$pages = @(
  @{ File = "c:\Saas\src\pages\Pecuaria\AnimalManagement.tsx";    SearchPattern = "usePersistentState\('AnimalManagement_isModalOpen'";     DraftFn = "hasDraftForFullKey"; DraftKey = 'draft_animal_${activeTenantId}_new' },
  @{ File = "c:\Saas\src\pages\Pecuaria\LotManagement.tsx";       SearchPattern = "usePersistentState\('LotManagement_isModalOpen'";        DraftFn = "hasDraftForFullKey"; DraftKey = 'draft_lot_${activeTenantId}_new' },
  @{ File = "c:\Saas\src\pages\Pecuaria\HealthManagement.tsx";    SearchPattern = "usePersistentState\('HealthManagement_isModalOpen'";     DraftFn = "hasDraftForKey";     DraftKey = 'health_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Pecuaria\WeightManagement.tsx";    SearchPattern = "usePersistentState\('WeightManagement_isModalOpen'";     DraftFn = "hasDraftForKey";     DraftKey = 'weight_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Pecuaria\PastureManagement.tsx";   SearchPattern = "usePersistentState\('PastureManagement_isFormOpen'";     DraftFn = "hasDraftForKey";     DraftKey = 'pasture_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Pecuaria\ConfinementManagement.tsx"; SearchPattern = "usePersistentState\('ConfinementManagement_isModalOpen'"; DraftFn = "hasDraftForKey"; DraftKey = 'confinement_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Pecuaria\NutritionManagement.tsx"; SearchPattern = "usePersistentState\('NutritionManagement_isModalOpen'";  DraftFn = "hasDraftForKey";     DraftKey = 'diet_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Pecuaria\ReproductionManagement.tsx"; SearchPattern = "useState\(false\).*// isModalOpen placeholder";  DraftFn = "hasDraftForKey";     DraftKey = 'reproduction_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Fleet\FleetManagement.tsx";        SearchPattern = "usePersistentState\('FleetManagement_isModalOpen'";      DraftFn = "hasDraftForKey";     DraftKey = 'machine_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Fleet\MaintenanceManagement.tsx";  SearchPattern = "usePersistentState\('MaintenanceManagement_isModalOpen'"; DraftFn = "hasDraftForKey";    DraftKey = 'maintenance_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Fleet\FuelManagement.tsx";         SearchPattern = "usePersistentState\('FuelManagement_isModalOpen'";       DraftFn = "hasDraftForKey";     DraftKey = 'fuel_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Finance\BankAccounts.tsx";         SearchPattern = "usePersistentState\('BankAccounts_isModalOpen'";         DraftFn = "hasDraftForKey";     DraftKey = 'bank_account_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Finance\BankReconciliation.tsx";   SearchPattern = "usePersistentState\('BankReconciliation_isModalOpen'";   DraftFn = "hasDraftForKey";     DraftKey = 'reconciliation_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Finance\AccountsReceivable.tsx";   SearchPattern = "usePersistentState\('AccountsReceivable_isModalOpen'";   DraftFn = "hasDraftForKey";     DraftKey = 'charge_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Finance\CashFlow.tsx";             SearchPattern = "usePersistentState\('CashFlow_isModalOpen'";             DraftFn = "hasDraftForKey";     DraftKey = 'transaction_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Finance\AccountsPayable\index.tsx"; SearchPattern = "usePersistentState\('AccountsPayable_isModalOpen'";    DraftFn = "hasDraftForKey";     DraftKey = 'transaction_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Finance\AccountsReceivable\index.tsx"; SearchPattern = "usePersistentState\('AccountsReceivable_isModalOpen'"; DraftFn = "hasDraftForKey"; DraftKey = 'charge_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Inventory\MovementManagement.tsx"; SearchPattern = "usePersistentState\('MovementManagement_isModalOpen'";   DraftFn = "hasDraftForKey";     DraftKey = 'movement_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Inventory\AuditManagement.tsx";    SearchPattern = "usePersistentState\('AuditManagement_isModalOpen'";      DraftFn = "hasDraftForKey";     DraftKey = 'audit_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Inventory\InventoryManagement.tsx"; SearchPattern = "usePersistentState\('InventoryManagement_isModalOpen'"; DraftFn = "hasDraftForKey";    DraftKey = 'product_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Purchasing\PurchaseRequest.tsx";   SearchPattern = "usePersistentState\('PurchaseRequest_isModalOpen'";      DraftFn = "hasDraftForKey";     DraftKey = 'purchase_request_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Purchasing\PurchaseOrder.tsx";     SearchPattern = "usePersistentState\('PurchaseOrder_isModalOpen'";        DraftFn = "hasDraftForKey";     DraftKey = 'purchase_order_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Purchasing\QuotationMap.tsx";      SearchPattern = "usePersistentState\('QuotationMap_isModalOpen'";         DraftFn = "hasDraftForKey";     DraftKey = 'quotation_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Purchasing\EntryInvoice.tsx";      SearchPattern = "usePersistentState\('EntryInvoice_isModalOpen'";         DraftFn = "hasDraftForKey";     DraftKey = 'entry_invoice_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Purchasing\SupplierManagement.tsx"; SearchPattern = "usePersistentState\('SupplierManagement_isModalOpen'";  DraftFn = "hasDraftForKey";    DraftKey = 'supplier_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Sales\ClientManagement.tsx";       SearchPattern = "usePersistentState\('ClientManagement_isModalOpen'";     DraftFn = "hasDraftForKey";     DraftKey = 'client_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Sales\Contracts.tsx";              SearchPattern = "usePersistentState\('Contracts_isModalOpen'";            DraftFn = "hasDraftForKey";     DraftKey = 'contract_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Sales\Invoices.tsx";               SearchPattern = "usePersistentState\('Invoices_isModalOpen'";             DraftFn = "hasDraftForKey";     DraftKey = 'output_invoice_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Sales\SalesOrders\index.tsx";      SearchPattern = "usePersistentState\('SalesOrders_isModalOpen'";          DraftFn = "hasDraftForKey";     DraftKey = 'sales_order_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Admin\CompanyManagement.tsx";      SearchPattern = "usePersistentState\('CompanyManagement_isCompanyModalOpen'"; DraftFn = "hasDraftForKey"; DraftKey = 'company_form_${activeTenantId}' },
  @{ File = "c:\Saas\src\pages\Admin\UserManagement\hooks\useUserManagementState.tsx"; SearchPattern = "usePersistentState\('UserManagement_isUserModalOpen'"; DraftFn = "hasDraftForKey"; DraftKey = 'user_form_${activeTenantId}' }
)

$importLine = "import { hasDraftForKey, hasDraftForFullKey } from '../../hooks/useFormDraft';"
$importLineAdmin = "import { hasDraftForKey, hasDraftForFullKey } from '../../../../hooks/useFormDraft';"
$importLineAdminHook = "import { hasDraftForKey, hasDraftForFullKey } from '../../../../hooks/useFormDraft';"

$successCount = 0
$skipCount = 0
$errors = @()

foreach ($page in $pages) {
  if (-not (Test-Path $page.File)) {
    $errors += "NAO ENCONTRADO: $($page.File)"
    continue
  }

  $content = [System.IO.File]::ReadAllText($page.File)
  
  # Verificar se já tem hasDraftForKey (não reaplicar)
  if ($content -match 'hasDraftForKey|hasDraftForFullKey') {
    Write-Output "SKIP (já tem): $(Split-Path $page.File -Leaf)"
    $skipCount++
    continue
  }

  # 1. Adicionar import
  $needsFullKey = $content -match "hasDraftForFullKey" -or $page.DraftFn -eq "hasDraftForFullKey"
  
  # Determinar caminho relativo do import baseado na profundidade do arquivo
  $depth = ($page.File.Split('\').Count - "c:\Saas\src\".Split('\').Count)
  if ($page.File -match '\\Admin\\') {
    if ($page.File -match '\\hooks\\') {
      $imp = "import { hasDraftForKey, hasDraftForFullKey } from '../../../../hooks/useFormDraft';"
    } else {
      $imp = "import { hasDraftForKey, hasDraftForFullKey } from '../../../hooks/useFormDraft';"
    }
  } elseif ($page.File -match '\\AccountsPayable\\|\\AccountsReceivable\\|\\SalesOrders\\|\\LCDPR\\') {
    $imp = "import { hasDraftForKey, hasDraftForFullKey } from '../../../../hooks/useFormDraft';"
  } else {
    $imp = "import { hasDraftForKey, hasDraftForFullKey } from '../../hooks/useFormDraft';"
  }
  
  # Adicionar import após a última linha de import existente
  if ($content -notmatch 'hasDraftForKey') {
    # Inserir import após o último import do arquivo
    $content = [regex]::Replace($content, "(import [^\n]+useFormDraft[^\n]+\n)", '$1' + $imp + "`r`n")
    if ($content -notmatch [regex]::Escape($imp)) {
      # Se não havia import de useFormDraft, adicionar após o último import
      $content = [regex]::Replace($content, "^((?:import[^\n]+\n)+)", '$1' + $imp + "`r`n", [System.Text.RegularExpressions.RegexOptions]::Multiline)
    }
  }

  # 2. Adicionar useEffect após a linha do usePersistentState/useState para isModalOpen
  # Gerar o useEffect code
  $key = $page.DraftKey
  $fn = $page.DraftFn
  
  # Buscar o nome exato da variável set (pode ser setIsModalOpen, setIsFormOpen, etc.)
  $setterMatch = [regex]::Match($content, 'const \[(\w+), (set\w+)\] = usePersistentState\(')
  $setter = "setIsModalOpen"  # default
  
  $useEffectCode = @"
  // Auto-reabrir: restaura o formulário se existir rascunho pendente (usuário navegou sem cancelar)
  useEffect(() => {
    if (!activeTenantId || isModalOpen) return;
    if ($fn(`$`{activeTenantId}`)) $setter(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTenantId]);
"@

  # Substituir o template literal
  $useEffectCode = $useEffectCode -replace '\$`\{activeTenantId`\}', '${activeTenantId}'
  $useEffectCode = $useEffectCode -replace "fn\(`\\\$", "$fn(``"
  $useEffectCode = $useEffectCode.Replace('$fn', $fn)
  $useEffectCode = $useEffectCode.Replace('DRAFT_KEY', $key)

  Write-Output "Processando: $(Split-Path $page.File -Leaf) → draft: $($page.DraftKey)"
  $successCount++
}

Write-Output ""
Write-Output "Processados: $successCount | Pulados: $skipCount"
if ($errors) { $errors | ForEach-Object { Write-Output "ERRO: $_" } }
