import { describe, it, expect } from 'vitest';
import { animalFactory, contaPagarFactory, userFactory, relatedDataFactory } from './factories';

describe('Test Data Factories', () => {
  describe('animalFactory', () => {
    it('should build a single animal with required fields', () => {
      const animal = animalFactory.build();

      expect(animal).toHaveProperty('id');
      expect(animal).toHaveProperty('tenant_id');
      expect(animal).toHaveProperty('brinco');
      expect(animal).toHaveProperty('raca');
      expect(animal).toHaveProperty('sexo');
      expect(animal).toHaveProperty('peso_atual');
      expect(animal).toHaveProperty('status');
      expect(animal.sexo).toMatch(/^(Macho|Fêmea)$/);
      expect(animal.peso_atual).toBeGreaterThan(0);
    });

    it('should build a list of animals', () => {
      const animals = animalFactory.buildList(5);

      expect(animals).toHaveLength(5);
      animals.forEach((animal) => {
        expect(animal).toHaveProperty('id');
        expect(animal).toHaveProperty('brinco');
      });
    });

    it('should allow overriding default values', () => {
      const animal = animalFactory.build({
        brinco: '999999',
        raca: 'Nelore',
        status: 'Ativo',
      });

      expect(animal.brinco).toBe('999999');
      expect(animal.raca).toBe('Nelore');
      expect(animal.status).toBe('Ativo');
    });

    it('should build an active animal', () => {
      const animal = animalFactory.buildActive();

      expect(animal.status).toBe('Ativo');
    });

    it('should build a sold animal', () => {
      const animal = animalFactory.buildSold();

      expect(animal.status).toBe('Vendido');
    });

    it('should build an animal with realistic weight based on age', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 2); // 2 years old

      const animal = animalFactory.buildWithRealisticWeight({
        data_nascimento: birthDate,
      });

      // 2-year-old cattle should weigh between 300-600kg typically
      expect(animal.peso_atual).toBeGreaterThan(300);
      expect(animal.peso_atual).toBeLessThanOrEqual(600);
    });
  });

  describe('contaPagarFactory', () => {
    it('should build a single conta pagar with required fields', () => {
      const conta = contaPagarFactory.build();

      expect(conta).toHaveProperty('id');
      expect(conta).toHaveProperty('tenant_id');
      expect(conta).toHaveProperty('descricao');
      expect(conta).toHaveProperty('valor_total');
      expect(conta).toHaveProperty('data_vencimento');
      expect(conta).toHaveProperty('status');
      expect(conta.valor_total).toBeGreaterThan(0);
    });

    it('should build a list of contas pagar', () => {
      const contas = contaPagarFactory.buildList(3);

      expect(contas).toHaveLength(3);
      contas.forEach((conta) => {
        expect(conta).toHaveProperty('id');
        expect(conta).toHaveProperty('valor_total');
      });
    });

    it('should build a pending conta pagar', () => {
      const conta = contaPagarFactory.buildPending();

      expect(conta.status).toBe('PENDENTE');
      expect(conta.valor_pago).toBe(0);
      expect(conta.data_pagamento).toBeNull();
    });

    it('should build a paid conta pagar', () => {
      const conta = contaPagarFactory.buildPaid();

      expect(conta.status).toBe('PAGO');
      expect(conta.valor_pago).toBe(conta.valor_total);
      expect(conta.data_pagamento).toBeTruthy();
    });

    it('should build an overdue conta pagar', () => {
      const conta = contaPagarFactory.buildOverdue();

      expect(conta.status).toBe('VENCIDA');
      expect(conta.valor_pago).toBe(0);
      expect(new Date(conta.data_vencimento).getTime()).toBeLessThan(Date.now());
    });

    it('should build a partially paid conta pagar', () => {
      const conta = contaPagarFactory.buildPartial();

      expect(conta.status).toBe('PARCIAL');
      expect(conta.valor_pago).toBeGreaterThan(0);
      expect(conta.valor_pago).toBeLessThan(conta.valor_total);
    });

    it('should allow overriding default values', () => {
      const conta = contaPagarFactory.build({
        descricao: 'Test Description',
        valor_total: 1000.5,
        status: 'PAGO',
      });

      expect(conta.descricao).toBe('Test Description');
      expect(conta.valor_total).toBe(1000.5);
      expect(conta.status).toBe('PAGO');
    });
  });

  describe('userFactory', () => {
    it('should build a single user with required fields', () => {
      const user = userFactory.build();

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('nome');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('tenant_id');
      expect(user.email).toContain('@');
      expect(['admin', 'user', 'viewer', 'operator']).toContain(user.role);
    });

    it('should build a list of users', () => {
      const users = userFactory.buildList(4);

      expect(users).toHaveLength(4);
      users.forEach((user) => {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
      });
    });

    it('should build an admin user', () => {
      const user = userFactory.buildAdmin();

      expect(user.role).toBe('admin');
      expect(user.status).toBe('active');
    });

    it('should build a regular user', () => {
      const user = userFactory.buildRegular();

      expect(user.role).toBe('user');
      expect(user.status).toBe('active');
    });

    it('should build a viewer user', () => {
      const user = userFactory.buildViewer();

      expect(user.role).toBe('viewer');
      expect(user.status).toBe('active');
    });

    it('should build a suspended user', () => {
      const user = userFactory.buildSuspended();

      expect(user.status).toBe('suspended');
    });

    it('should build an auth session', () => {
      const { user, session } = userFactory.buildAuthSession();

      expect(user).toHaveProperty('id');
      expect(session).toHaveProperty('access_token');
      expect(session).toHaveProperty('refresh_token');
      expect(session.token_type).toBe('bearer');
      expect(session.user).toEqual(user);
    });

    it('should allow overriding default values', () => {
      const user = userFactory.build({
        email: 'test@example.com',
        role: 'admin',
      });

      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('admin');
    });
  });

  describe('relatedDataFactory', () => {
    it('should build a complete tenant setup', () => {
      const setup = relatedDataFactory.buildTenantSetup({
        userCount: 2,
        animalCount: 5,
        contasPagarCount: 3,
      });

      expect(setup).toHaveProperty('tenant_id');
      expect(setup).toHaveProperty('fazenda_id');
      expect(setup).toHaveProperty('lote_id');
      expect(setup.users).toHaveLength(2);
      expect(setup.animals).toHaveLength(5);
      expect(setup.contasPagar).toHaveLength(3);

      // Verify all entities share the same tenant_id
      setup.users.forEach((user) => {
        expect(user.tenant_id).toBe(setup.tenant_id);
      });
      setup.animals.forEach((animal) => {
        expect(animal.tenant_id).toBe(setup.tenant_id);
        expect(animal.fazenda_id).toBe(setup.fazenda_id);
        expect(animal.lote_id).toBe(setup.lote_id);
      });
      setup.contasPagar.forEach((conta) => {
        expect(conta.tenant_id).toBe(setup.tenant_id);
      });
    });

    it('should build an animal batch with consistent IDs', () => {
      const batch = relatedDataFactory.buildAnimalBatch(7);

      expect(batch.animals).toHaveLength(7);
      batch.animals.forEach((animal) => {
        expect(animal.tenant_id).toBe(batch.tenant_id);
        expect(animal.fazenda_id).toBe(batch.fazenda_id);
        expect(animal.lote_id).toBe(batch.lote_id);
      });
    });

    it('should respect provided tenant and farm IDs', () => {
      const tenantId = 'test-tenant-123';
      const fazendaId = 'test-farm-456';
      const batch = relatedDataFactory.buildAnimalBatch(3, tenantId, fazendaId);

      expect(batch.tenant_id).toBe(tenantId);
      expect(batch.fazenda_id).toBe(fazendaId);
      batch.animals.forEach((animal) => {
        expect(animal.tenant_id).toBe(tenantId);
        expect(animal.fazenda_id).toBe(fazendaId);
      });
    });
  });
});
