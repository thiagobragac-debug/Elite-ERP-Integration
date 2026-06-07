import { useEffect, useRef } from 'react';

/**
 * useFormReset
 *
 * Hook que reseta automaticamente o estado de um formulário
 * quando o SidePanel/Modal é fechado (isOpen muda de true → false).
 *
 * Uso:
 * ```tsx
 * useFormReset(isOpen, initialData, () => {
 *   setFormData(defaultFormData);
 *   setItems([]);
 *   // ... qualquer outro estado local
 * });
 * ```
 *
 * @param isOpen     - flag de visibilidade do painel
 * @param initialData - dados de edição. Se preenchido, NÃO reseta (modo edição)
 * @param resetFn    - função que executa o reset de todos os estados locais
 */
export function useFormReset(
  isOpen: boolean,
  initialData: any,
  resetFn: () => void
) {
  const wasOpen = useRef(false);

  useEffect(() => {
    // Detecta transição: estava aberto e agora fechou
    if (wasOpen.current && !isOpen && !initialData) {
      resetFn();
    }
    wasOpen.current = isOpen;
  }, [isOpen]);
}
