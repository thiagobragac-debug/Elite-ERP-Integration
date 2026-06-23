# Task 7.4 Completion Summary: Test Data Factories

**Task:** Create test data factories
**Status:** ✅ COMPLETED
**Date:** 2026-06-16
**Requirement:** 4.3 - Test Coverage Infrastructure

## Overview

Successfully implemented comprehensive test data factories using `@faker-js/faker` to generate realistic, consistent test data for unit and integration tests. The factories support the major domain entities in the Tauze ERP system.

## What Was Created

### 1. Factories Module (`src/test-utils/factories.ts`)

Created a comprehensive test data factory system with the following features:

#### **Animal Factory**

- `build()` - Generate single animal with realistic cattle data
- `buildList(count)` - Generate multiple animals
- `buildActive()` - Generate active animal
- `buildSold()` - Generate sold animal
- `buildWithRealisticWeight()` - Generate animal with age-appropriate weight

**Generated Fields:**

- UUIDs for IDs (id, tenant_id, fazenda_id, lote_id)
- 6-digit numeric brinco (tag)
- Realistic cattle breeds (Nelore, Angus, Brahman, etc.)
- Sex (Macho/Fêmea)
- Weight between 200-600 kg
- Birth and entry dates
- Status (Ativo, Vendido, Descartado, Morto)
- Categories (Bezerro, Novilho, Vaca, etc.)
- Optional fields with probability (nome, valor_compra, observacoes)

#### **Conta Pagar Factory**

- `build()` - Generate accounts payable record
- `buildList(count)` - Generate multiple records
- `buildPending()` - Generate pending (unpaid) account
- `buildPaid()` - Generate fully paid account
- `buildOverdue()` - Generate overdue account
- `buildPartial()` - Generate partially paid account

**Generated Fields:**

- UUIDs for IDs
- Realistic expense descriptions (Compra de ração, Serviços veterinários, etc.)
- Financial values (100-50,000 BRL)
- Payment status (PENDENTE, PAGO, VENCIDA, PARCIAL)
- Categories (Insumos, Manutenção, Veterinária, etc.)
- Payment methods (Dinheiro, PIX, Boleto, etc.)
- Relevant dates (emission, due, payment)

#### **User Factory**

- `build()` - Generate user record
- `buildList(count)` - Generate multiple users
- `buildAdmin()` - Generate admin user
- `buildRegular()` - Generate regular user
- `buildViewer()` - Generate read-only user
- `buildSuspended()` - Generate suspended user
- `buildAuthSession()` - Generate complete auth session with tokens

**Generated Fields:**

- UUIDs for IDs
- Valid email addresses (lowercase)
- Full names
- Formatted CPF (###.###.###-##)
- Formatted phone numbers
- Roles (admin, user, viewer, operator)
- Status (active, inactive, suspended)
- User preferences (theme, language, notifications)

#### **Related Data Factory**

- `buildTenantSetup()` - Generate complete tenant setup with users, animals, and financial data
- `buildAnimalBatch()` - Generate batch of animals sharing tenant/farm IDs

**Use Case:** Integration tests requiring consistent relationships between entities

### 2. Factory Tests (`src/test-utils/factories.test.ts`)

Created comprehensive unit tests for all factories:

- ✅ 24 tests, all passing
- Tests verify default field generation
- Tests verify override functionality
- Tests verify specialized builders
- Tests verify list generation
- Tests verify related data consistency

### 3. Documentation (`src/test-utils/README.md`)

Created comprehensive documentation including:

- Overview of all factories
- Complete API reference for each factory
- Usage examples for unit tests
- Usage examples for integration tests with MSW
- Best practices and guidelines
- Instructions for adding new factories

### 4. Index Module (`src/test-utils/index.ts`)

Created centralized export point for test utilities:

- Exports all factories from single import
- Includes comments for future additions (render utils, MSW handlers)
- Enables clean imports: `import { animalFactory } from '@/test-utils'`

### 5. Dependencies

Installed `@faker-js/faker` v10.4.0:

```bash
npm install --save-dev @faker-js/faker --legacy-peer-deps
```

## Test Results

All factory tests passing:

```
Test Files  1 passed (1)
Tests      24 passed (24)
Duration   1.30s
```

## Files Created

1. `src/test-utils/factories.ts` (452 lines) - Main factory implementations
2. `src/test-utils/factories.test.ts` (363 lines) - Comprehensive unit tests
3. `src/test-utils/README.md` (465 lines) - Complete documentation
4. `src/test-utils/index.ts` (20 lines) - Centralized exports
5. `src/test-utils/TASK_7.4_COMPLETION_SUMMARY.md` - This file

## Key Features

### 1. **Realistic Data Generation**

- Uses faker.js for authentic-looking data
- Brazilian-specific formats (CPF, phone numbers)
- Appropriate probability distributions for optional fields
- Realistic value ranges for financial and weight data

### 2. **Flexible Override System**

All factories support overriding any field:

```typescript
const animal = animalFactory.build({
  brinco: '123456',
  peso_atual: 450,
  status: 'Ativo',
});
```

### 3. **Specialized Builders**

Common scenarios have dedicated builders:

```typescript
const pendingBill = contaPagarFactory.buildPending();
const adminUser = userFactory.buildAdmin();
const activeAnimal = animalFactory.buildActive();
```

### 4. **Relationship Management**

Related data factory maintains consistent IDs across entities:

```typescript
const setup = relatedDataFactory.buildTenantSetup({
  userCount: 3,
  animalCount: 10,
  contasPagarCount: 5,
});
// All entities share the same tenant_id
```

### 5. **Type Safety**

All factories maintain TypeScript type safety with proper return types and parameter types.

## Integration with Existing Test Infrastructure

The factories integrate seamlessly with:

- ✅ Vitest test runner
- ✅ MSW (Mock Service Worker) for API mocking
- ✅ Testing Library for component testing
- ✅ Existing test setup in `src/__tests__/setup.ts`

## Usage Examples

### Unit Test Example

```typescript
import { animalFactory } from '@/test-utils/factories';
import { calculateAverageWeight } from './utils';

describe('calculateAverageWeight', () => {
  it('should calculate average correctly', () => {
    const animals = animalFactory.buildList(5);
    const result = calculateAverageWeight(animals);
    expect(result).toBeGreaterThan(0);
  });
});
```

### Integration Test Example

```typescript
import { server } from '@/__mocks__/browser';
import { http, HttpResponse } from 'msw';
import { animalFactory } from '@/test-utils/factories';

it('should display animals', async () => {
  const mockAnimals = animalFactory.buildList(10);

  server.use(
    http.get('*/rest/v1/animais', () => {
      return HttpResponse.json(mockAnimals);
    })
  );

  // Test component that fetches animals...
});
```

## Benefits

1. **Consistency** - All tests use the same data generation patterns
2. **Maintainability** - Single source of truth for test data structure
3. **Readability** - Tests focus on logic, not data construction
4. **Flexibility** - Easy to generate any combination of test data
5. **Realism** - Faker generates authentic-looking data
6. **Type Safety** - TypeScript catches errors at compile time
7. **Documentation** - Comprehensive README guides developers

## Next Steps

This task enables:

- ✅ Task 7.5: Setup MSW for API mocking (can use factories in handlers)
- ✅ Task 8.x: Write unit tests for utilities (can use factories for test data)
- ✅ Task 9.x: Write unit tests for hooks (can use factories for hook inputs)
- ✅ Task 10.x: Write integration tests (can use factories for complex scenarios)

## Notes

- The factories generate random data on each invocation, ensuring test isolation
- Override any field to create specific test scenarios
- Use `buildList()` for bulk data generation
- Use specialized builders (`buildPending()`, `buildAdmin()`, etc.) for common cases
- Use `relatedDataFactory` when you need consistent relationships between entities

## Verification

To verify the implementation:

```bash
# Run factory tests
npm run test:run -- src/test-utils/factories.test.ts

# Check for import errors
npm run type-check

# Run all tests (factories won't break existing tests)
npm run test:run
```

---

**Task 7.4 Status:** ✅ COMPLETE

All deliverables completed:

- ✅ Created `src/test-utils/factories.ts` with data builders
- ✅ Implemented `animalFactory` with realistic test data
- ✅ Implemented `contaPagarFactory` for financial tests
- ✅ Implemented `userFactory` for auth tests
- ✅ Used `@faker-js/faker` for dynamic data generation
- ✅ Created comprehensive tests (24 passing)
- ✅ Created detailed documentation
- ✅ Created centralized export module

The test data factory infrastructure is ready for use in all subsequent testing tasks.
