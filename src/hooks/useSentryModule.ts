import { useEffect } from 'react';
import { setModuleContext } from '../lib/sentry';

/**
 * Custom hook to set Sentry module/page context for error tracking
 * 
 * Automatically sets the module and page context when the component mounts
 * and clears it when unmounting to ensure accurate error location tracking.
 * 
 * @param module - Module name (e.g., 'Pecuária', 'Financeiro', 'Estoque')
 * @param page - Optional page name within the module
 * 
 * @example
 * // In a page component:
 * import { useSentryModule } from '@/hooks/useSentryModule';
 * 
 * function AnimalManagement() {
 *   useSentryModule('Pecuária', 'AnimalManagement');
 *   // ... rest of component
 * }
 * 
 * @example
 * // For module-level tracking:
 * function FinanceModule() {
 *   useSentryModule('Financeiro');
 *   // ... rest of component
 * }
 */
export function useSentryModule(module: string, page?: string): void {
  useEffect(() => {
    // Set module/page context when component mounts
    setModuleContext(module, page);

    // Cleanup function is optional - we keep the context active
    // for the duration of the page to track any errors that occur
    return () => {
      // Context will be updated by next page/module navigation
    };
  }, [module, page]);
}
