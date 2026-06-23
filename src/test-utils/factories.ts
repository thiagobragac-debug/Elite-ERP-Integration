import { faker } from '@faker-js/faker';

/**
 * Test data factory for Animal entities
 *
 * Generates realistic animal data for testing purposes
 */
export const animalFactory = {
  /**
   * Build a single animal object with default or overridden values
   * @param overrides - Partial animal object to override default values
   * @returns Complete animal object with test data
   */
  build: (overrides: Record<string, any> = {}) => ({
    id: faker.string.uuid(),
    tenant_id: faker.string.uuid(),
    brinco: faker.string.numeric(6),
    nome: faker.helpers.maybe(() => faker.person.firstName(), { probability: 0.3 }) || null,
    raca: faker.helpers.arrayElement([
      'Nelore',
      'Angus',
      'Brahman',
      'Hereford',
      'Senepol',
      'Canchim',
      'Brangus',
      'Charolês',
      'Limousin',
      'Gir',
      'Girolando',
    ]),
    sexo: faker.helpers.arrayElement(['Macho', 'Fêmea']),
    peso_atual: faker.number.float({ min: 200, max: 600, fractionDigits: 2 }),
    data_nascimento: faker.date.past({ years: 3 }),
    data_entrada: faker.date.past({ years: 1 }),
    status: faker.helpers.arrayElement(['Ativo', 'Vendido', 'Descartado', 'Morto']),
    fazenda_id: faker.string.uuid(),
    lote_id: faker.helpers.maybe(() => faker.string.uuid(), { probability: 0.7 }),
    categoria: faker.helpers.arrayElement([
      'Bezerro',
      'Novilho',
      'Garrote',
      'Touro',
      'Bezerra',
      'Novilha',
      'Vaca',
    ]),
    origem: faker.helpers.arrayElement(['Nascido na fazenda', 'Comprado', 'Arrendado']),
    valor_compra: faker.helpers.maybe(
      () => faker.number.float({ min: 1000, max: 8000, fractionDigits: 2 }),
      { probability: 0.5 }
    ),
    observacoes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
    created_at: faker.date.past({ years: 2 }),
    updated_at: faker.date.recent({ days: 30 }),
    ...overrides,
  }),

  /**
   * Build a list of animal objects
   * @param count - Number of animals to generate
   * @param overrides - Partial animal object to override default values for all animals
   * @returns Array of animal objects
   */
  buildList: (count: number, overrides: Record<string, any> = {}) =>
    Array.from({ length: count }, () => animalFactory.build(overrides)),

  /**
   * Build an animal with specific status
   */
  buildActive: (overrides: Record<string, any> = {}) =>
    animalFactory.build({ status: 'Ativo', ...overrides }),

  buildSold: (overrides: Record<string, any> = {}) =>
    animalFactory.build({ status: 'Vendido', ...overrides }),

  /**
   * Build an animal with realistic weight progression based on age
   */
  buildWithRealisticWeight: (overrides: Record<string, any> = {}) => {
    const birthDate = overrides.data_nascimento || faker.date.past({ years: 3 });
    const ageInMonths = Math.floor(
      (new Date().getTime() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    // Average weight gain: ~0.7 kg/day for cattle
    const estimatedWeight = Math.min(
      600,
      Math.max(30, 40 + ageInMonths * 21) // ~21kg per month average
    );

    return animalFactory.build({
      data_nascimento: birthDate,
      peso_atual: faker.number.float({
        min: estimatedWeight * 0.85,
        max: estimatedWeight * 1.15,
        fractionDigits: 2,
      }),
      ...overrides,
    });
  },
};

/**
 * Test data factory for ContaPagar (Accounts Payable) entities
 *
 * Generates realistic financial data for testing purposes
 */
export const contaPagarFactory = {
  /**
   * Build a single conta pagar object with default or overridden values
   * @param overrides - Partial conta pagar object to override default values
   * @returns Complete conta pagar object with test data
   */
  build: (overrides: Record<string, any> = {}) => ({
    id: faker.string.uuid(),
    tenant_id: faker.string.uuid(),
    descricao: faker.helpers.arrayElement([
      'Compra de ração',
      'Compra de insumos',
      'Manutenção de veículos',
      'Manutenção de equipamentos',
      'Serviços veterinários',
      'Medicamentos',
      'Energia elétrica',
      'Telefone e internet',
      'Combustível',
      'Salários',
      'Impostos',
      'Aluguel de pasto',
    ]),
    valor_total: faker.number.float({ min: 100, max: 50000, fractionDigits: 2 }),
    valor_pago:
      faker.helpers.maybe(() => faker.number.float({ min: 0, max: 50000, fractionDigits: 2 }), {
        probability: 0.4,
      }) || 0,
    data_emissao: faker.date.past({ years: 1 }),
    data_vencimento: faker.date.future({ years: 1 }),
    data_pagamento: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
      probability: 0.3,
    }),
    status: faker.helpers.arrayElement(['PENDENTE', 'PAGO', 'VENCIDA', 'PARCIAL']),
    categoria: faker.helpers.arrayElement([
      'Insumos',
      'Manutenção',
      'Veterinária',
      'Administrativa',
      'Combustível',
      'Pessoal',
      'Impostos',
      'Outros',
    ]),
    fornecedor_id: faker.string.uuid(),
    forma_pagamento: faker.helpers.arrayElement([
      'Dinheiro',
      'Transferência',
      'PIX',
      'Boleto',
      'Cheque',
      'Cartão de Crédito',
      'Cartão de Débito',
    ]),
    numero_documento: faker.helpers.maybe(() => faker.string.numeric(8), { probability: 0.6 }),
    observacoes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
    created_at: faker.date.past({ years: 1 }),
    updated_at: faker.date.recent({ days: 30 }),
    ...overrides,
  }),

  /**
   * Build a list of conta pagar objects
   * @param count - Number of records to generate
   * @param overrides - Partial conta pagar object to override default values for all records
   * @returns Array of conta pagar objects
   */
  buildList: (count: number, overrides: Record<string, any> = {}) =>
    Array.from({ length: count }, () => contaPagarFactory.build(overrides)),

  /**
   * Build a pending (unpaid) conta pagar
   */
  buildPending: (overrides: Record<string, any> = {}) =>
    contaPagarFactory.build({
      status: 'PENDENTE',
      valor_pago: 0,
      data_pagamento: null,
      data_vencimento: faker.date.future({ years: 1 }),
      ...overrides,
    }),

  /**
   * Build a paid conta pagar
   */
  buildPaid: (overrides: Record<string, any> = {}) => {
    const valor_total =
      overrides.valor_total || faker.number.float({ min: 100, max: 50000, fractionDigits: 2 });
    return contaPagarFactory.build({
      status: 'PAGO',
      valor_total,
      valor_pago: valor_total,
      data_pagamento: faker.date.recent({ days: 30 }),
      ...overrides,
    });
  },

  /**
   * Build an overdue conta pagar
   */
  buildOverdue: (overrides: Record<string, any> = {}) =>
    contaPagarFactory.build({
      status: 'VENCIDA',
      valor_pago: 0,
      data_pagamento: null,
      data_vencimento: faker.date.recent({ days: 30 }),
      ...overrides,
    }),

  /**
   * Build a partially paid conta pagar
   */
  buildPartial: (overrides: Record<string, any> = {}) => {
    const valor_total =
      overrides.valor_total || faker.number.float({ min: 100, max: 50000, fractionDigits: 2 });
    const valor_pago = faker.number.float({ min: 1, max: valor_total * 0.9, fractionDigits: 2 });
    return contaPagarFactory.build({
      status: 'PARCIAL',
      valor_total,
      valor_pago,
      data_pagamento: faker.date.recent({ days: 15 }),
      ...overrides,
    });
  },
};

/**
 * Test data factory for User entities
 *
 * Generates realistic user/auth data for testing purposes
 */
export const userFactory = {
  /**
   * Build a single user object with default or overridden values
   * @param overrides - Partial user object to override default values
   * @returns Complete user object with test data
   */
  build: (overrides: Record<string, any> = {}) => ({
    id: faker.string.uuid(),
    email: faker.internet.email().toLowerCase(),
    nome: faker.person.fullName(),
    cpf: faker.helpers.replaceSymbols('###.###.###-##'),
    telefone: faker.helpers.replaceSymbols('(##) #####-####'),
    role: faker.helpers.arrayElement(['admin', 'user', 'viewer', 'operator']),
    tenant_id: faker.string.uuid(),
    avatar_url: faker.helpers.maybe(() => faker.image.avatar(), { probability: 0.5 }),
    status: faker.helpers.arrayElement(['active', 'inactive', 'suspended']),
    last_login: faker.helpers.maybe(() => faker.date.recent({ days: 7 }), { probability: 0.7 }),
    created_at: faker.date.past({ years: 2 }),
    updated_at: faker.date.recent({ days: 30 }),
    preferences: {
      theme: faker.helpers.arrayElement(['light', 'dark', 'auto']),
      language: 'pt-BR',
      notifications_enabled: faker.datatype.boolean(),
    },
    ...overrides,
  }),

  /**
   * Build a list of user objects
   * @param count - Number of users to generate
   * @param overrides - Partial user object to override default values for all users
   * @returns Array of user objects
   */
  buildList: (count: number, overrides: Record<string, any> = {}) =>
    Array.from({ length: count }, () => userFactory.build(overrides)),

  /**
   * Build an admin user
   */
  buildAdmin: (overrides: Record<string, any> = {}) =>
    userFactory.build({
      role: 'admin',
      status: 'active',
      ...overrides,
    }),

  /**
   * Build a regular user
   */
  buildRegular: (overrides: Record<string, any> = {}) =>
    userFactory.build({
      role: 'user',
      status: 'active',
      ...overrides,
    }),

  /**
   * Build a viewer (read-only) user
   */
  buildViewer: (overrides: Record<string, any> = {}) =>
    userFactory.build({
      role: 'viewer',
      status: 'active',
      ...overrides,
    }),

  /**
   * Build a suspended user
   */
  buildSuspended: (overrides: Record<string, any> = {}) =>
    userFactory.build({
      status: 'suspended',
      ...overrides,
    }),

  /**
   * Build an auth session object for authenticated tests
   */
  buildAuthSession: (userOverrides: Record<string, any> = {}) => {
    const user = userFactory.build(userOverrides);
    return {
      user,
      session: {
        access_token: faker.string.alphanumeric(40),
        refresh_token: faker.string.alphanumeric(40),
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
        user,
      },
    };
  },
};

/**
 * Utility function to create a batch of related test data
 * Useful for integration tests that need consistent relationships
 */
export const relatedDataFactory = {
  /**
   * Create a complete tenant setup with users, animals, and financial data
   */
  buildTenantSetup: (
    config: {
      userCount?: number;
      animalCount?: number;
      contasPagarCount?: number;
    } = {}
  ) => {
    const tenant_id = faker.string.uuid();
    const fazenda_id = faker.string.uuid();
    const lote_id = faker.string.uuid();

    const users = userFactory.buildList(config.userCount || 3, { tenant_id });
    const animals = animalFactory.buildList(config.animalCount || 10, {
      tenant_id,
      fazenda_id,
      lote_id,
    });
    const contasPagar = contaPagarFactory.buildList(config.contasPagarCount || 5, {
      tenant_id,
    });

    return {
      tenant_id,
      fazenda_id,
      lote_id,
      users,
      animals,
      contasPagar,
    };
  },

  /**
   * Create a batch of animals for the same tenant and farm
   */
  buildAnimalBatch: (count: number, tenantId?: string, fazendaId?: string) => {
    const tenant_id = tenantId || faker.string.uuid();
    const fazenda_id = fazendaId || faker.string.uuid();
    const lote_id = faker.string.uuid();

    return {
      tenant_id,
      fazenda_id,
      lote_id,
      animals: animalFactory.buildList(count, { tenant_id, fazenda_id, lote_id }),
    };
  },
};
