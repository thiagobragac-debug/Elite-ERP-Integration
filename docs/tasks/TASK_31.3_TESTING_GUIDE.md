# Task 31.3 Testing Guide: Settings Actions in Command Palette

## Quick Testing Checklist

### Prerequisites
1. ✅ Dev server is running (`npm run dev`)
2. ✅ Application is accessible at http://localhost:5173
3. ✅ User is logged in

---

## Test Scenarios

### Scenario 1: Open Command Palette
**Steps:**
1. Press `Cmd+K` (Mac) or `Ctrl+K` (Windows)
2. Command Palette should open with search input focused

**Expected Result:**
- Modal overlay appears with blur effect
- Search input is auto-focused and ready for typing
- Footer shows keyboard shortcuts (↵ Selecionar, ↑↓ Navegar)

---

### Scenario 2: Browse Administration Category
**Steps:**
1. Open Command Palette
2. Scroll through results or type "administração"

**Expected Result:**
Should see all 7 administration actions:
- Intelligence Hub
- Aprovações
- Gestão de Usuários
- Empresas & Fazendas
- Configurações
- Assinatura & Planos
- Logs de Auditoria

---

### Scenario 3: Search for "Configurações"

| Test | Search Term | Expected Results |
|------|-------------|------------------|
| 3.1 | "config" | Configurações, Empresas & Fazendas |
| 3.2 | "configurações" | Configurações, Empresas & Fazendas, Abrir Administração |
| 3.3 | "settings" | Configurações |
| 3.4 | "ajustes" | Configurações |
| 3.5 | "sistema" | Configurações |

**Steps for each test:**
1. Open Command Palette
2. Type the search term
3. Verify expected actions appear
4. Press Enter or click on "Configurações"
5. Verify navigation to `/admin/configuracoes`

---

### Scenario 4: Search for User Management

| Test | Search Term | Expected Results |
|------|-------------|------------------|
| 4.1 | "usuarios" | Gestão de Usuários, Abrir Administração |
| 4.2 | "usuários" | Gestão de Usuários, Abrir Administração |
| 4.3 | "users" | Gestão de Usuários |
| 4.4 | "gerenciar" | Gestão de Usuários |
| 4.5 | "pessoas" | Gestão de Usuários |
| 4.6 | "equipe" | Gestão de Usuários |
| 4.7 | "permissões" | Gestão de Usuários |

**Steps:**
1. Open Command Palette
2. Type search term
3. Verify "Gestão de Usuários" appears
4. Select and verify navigation to `/admin/usuarios`

---

### Scenario 5: Search for Audit Logs

| Test | Search Term | Expected Results |
|------|-------------|------------------|
| 5.1 | "auditoria" | Logs de Auditoria |
| 5.2 | "audit" | Logs de Auditoria |
| 5.3 | "logs" | Logs de Auditoria |
| 5.4 | "histórico" | Logs de Auditoria |
| 5.5 | "registro" | Logs de Auditoria |
| 5.6 | "rastreamento" | Logs de Auditoria |

**Steps:**
1. Open Command Palette
2. Type search term
3. Verify "Logs de Auditoria" appears
4. Select and verify navigation to `/admin/auditoria`

---

### Scenario 6: Search for Subscription

| Test | Search Term | Expected Results |
|------|-------------|------------------|
| 6.1 | "assinatura" | Assinatura & Planos |
| 6.2 | "subscription" | Assinatura & Planos |
| 6.3 | "planos" | Assinatura & Planos |
| 6.4 | "plans" | Assinatura & Planos |
| 6.5 | "billing" | Assinatura & Planos |
| 6.6 | "faturamento" | Assinatura & Planos |

**Steps:**
1. Open Command Palette
2. Type search term
3. Verify "Assinatura & Planos" appears
4. Select and verify navigation to `/admin/assinatura`

---

### Scenario 7: Search for Companies & Farms

| Test | Search Term | Expected Results |
|------|-------------|------------------|
| 7.1 | "empresas" | Empresas & Fazendas |
| 7.2 | "fazendas" | Empresas & Fazendas, Alternar fazenda |
| 7.3 | "propriedades" | Empresas & Fazendas |
| 7.4 | "unidades" | Empresas & Fazendas |
| 7.5 | "organização" | Empresas & Fazendas |

**Steps:**
1. Open Command Palette
2. Type search term
3. Verify "Empresas & Fazendas" appears
4. Select and verify navigation to `/admin/config`

---

### Scenario 8: Search for Approvals

| Test | Search Term | Expected Results |
|------|-------------|------------------|
| 8.1 | "aprovações" | Aprovações |
| 8.2 | "approvals" | Aprovações |
| 8.3 | "aprovar" | Aprovações |
| 8.4 | "autorizar" | Aprovações |
| 8.5 | "workflow" | Aprovações |

**Steps:**
1. Open Command Palette
2. Type search term
3. Verify "Aprovações" appears
4. Select and verify navigation to `/admin/aprovacoes`

---

### Scenario 9: Quick Navigation with Keyboard Shortcut

**Steps:**
1. Press `⌘+9` (Mac) or `Ctrl+9` (Windows)
2. Verify immediate navigation to `/admin/intelligence`

**Expected Result:**
- Direct navigation without opening Command Palette
- Intelligence Hub page loads

---

### Scenario 10: Keyboard Navigation

**Steps:**
1. Open Command Palette
2. Type "admin" to filter results
3. Press `↓` arrow key multiple times
4. Verify selection moves through results
5. Press `↑` arrow key
6. Verify selection moves backward
7. Press `Enter` on selected item
8. Verify navigation occurs

**Expected Result:**
- Arrow keys navigate through filtered results
- Selected item has highlight/accent color
- Enter executes the selected action
- Command Palette closes after navigation

---

### Scenario 11: Search with No Results

**Steps:**
1. Open Command Palette
2. Type "xyz123nonexistent"

**Expected Result:**
- Shows "Nenhum comando encontrado para 'xyz123nonexistent'"
- Empty state icon (X) displayed
- No crashes or errors

---

### Scenario 12: Close Command Palette

**Test all close methods:**

| Method | Steps | Expected Result |
|--------|-------|----------------|
| 12.1 ESC key | Open palette, press ESC | Palette closes |
| 12.2 Overlay click | Open palette, click outside modal | Palette closes |
| 12.3 After selection | Open palette, select action | Palette closes after navigation |

---

## Visual Verification

### Icons
Verify correct icons are displayed for each action:
- ✅ Intelligence Hub: Settings icon
- ✅ Aprovações: Settings icon
- ✅ Gestão de Usuários: Users icon
- ✅ Empresas & Fazendas: Building2 icon
- ✅ Configurações: Settings icon
- ✅ Assinatura & Planos: Settings icon
- ✅ Logs de Auditoria: FileText icon

### Styling
- ✅ Selected item has brand color background (accent/highlight)
- ✅ Icons have proper spacing and alignment
- ✅ Text is readable in both light and dark themes
- ✅ Hover states work correctly
- ✅ Animations are smooth (no jank)

---

## Browser Testing

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (Mac only)

---

## Theme Testing

Test in both themes:
- [ ] Light mode
- [ ] Dark mode

Verify:
- Text contrast is sufficient
- Colors are appropriate for theme
- Highlights are visible
- Icons are visible

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Can open with keyboard shortcut
- [ ] Can navigate with arrow keys
- [ ] Can select with Enter
- [ ] Can close with ESC
- [ ] Focus is managed correctly
- [ ] No keyboard traps

### Screen Reader
- [ ] Aria labels are present (if implemented)
- [ ] Actions are announced correctly
- [ ] Search input is labeled

---

## Performance Testing

### Search Speed
1. Type rapidly in search input
2. Verify no lag or stuttering
3. Results update immediately

### Memory
1. Open and close Command Palette multiple times
2. Verify no memory leaks in DevTools

---

## Edge Cases

### Test Case 1: Unicode Search
- Search with accented characters: "configuração", "administração"
- Verify search works correctly

### Test Case 2: Partial Matches
- Search "conf" → Should find "Configurações"
- Search "user" → Should find "Gestão de Usuários"

### Test Case 3: Case Insensitivity
- Search "CONFIG" → Should find "Configurações"
- Search "USERS" → Should find "Gestão de Usuários"

---

## Common Issues & Solutions

### Issue: Command Palette doesn't open
**Solution:** Check if keyboard shortcut is conflicting with browser/OS shortcuts

### Issue: Search returns no results
**Solution:** Verify keywords array is properly formatted in code

### Issue: Navigation doesn't work
**Solution:** Check if routes are properly defined in routing configuration

### Issue: Icons not displaying
**Solution:** Verify lucide-react icons are imported correctly

---

## Success Criteria

Task 31.3 is considered complete when:
- ✅ All 7 settings/admin actions are searchable
- ✅ Keywords work for both Portuguese and English
- ✅ Navigation works correctly for all actions
- ✅ No TypeScript or linting errors
- ✅ Command Palette closes after action execution
- ✅ Visual styling is consistent with design system
- ✅ Keyboard navigation works smoothly
- ✅ No console errors or warnings

---

## Reporting Issues

If you find any issues during testing:

1. **Document the issue:**
   - What action were you testing?
   - What search term did you use?
   - What was the expected result?
   - What actually happened?

2. **Check console:**
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Copy any error messages

3. **Provide context:**
   - Browser and version
   - Operating system
   - Theme (light/dark)
   - Screenshot if visual issue

---

## Testing Sign-off

| Test Category | Status | Tester | Date | Notes |
|--------------|--------|--------|------|-------|
| Basic Navigation | ⏳ Pending | | | |
| Keyword Search | ⏳ Pending | | | |
| Visual/Styling | ⏳ Pending | | | |
| Keyboard Nav | ⏳ Pending | | | |
| Browser Compat | ⏳ Pending | | | |
| Theme Support | ⏳ Pending | | | |
| Accessibility | ⏳ Pending | | | |
| Performance | ⏳ Pending | | | |

---

**Task**: 31.3 Add settings actions
**Status**: Implementation Complete - Ready for Testing
**Last Updated**: 2024
