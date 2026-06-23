/**
 * Test Utilities - Centralized Exports
 *
 * This file provides a single entry point for all test utilities,
 * making imports cleaner and more consistent across test files.
 *
 * @example
 * ```typescript
 * import { animalFactory, userFactory, renderWithProviders } from '@/test-utils';
 * ```
 */

// Export all factories
export { animalFactory, contaPagarFactory, userFactory, relatedDataFactory } from './factories';

// Export render utilities (to be created in task 7.3)
// export { renderWithProviders, AllTheProviders } from './render';

// Export MSW utilities (to be created in task 7.5)
// export { server, handlers } from '@/__mocks__/browser';
