import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

/**
 * useFormDraft — Persistência de rascunho para formulários do Tauze ERP
 *
 * Resolve dois problemas críticos do padrão anterior (usePersistentState):
 * 1. Chaves estáticas → dados compartilhados entre tenants na mesma máquina
 * 2. useEffect([isOpen]) sobrescrevia o estado restaurado com INITIAL_FORM
 *
 * Uso:
 * ```tsx
 * const { formData, setFormData, clearDraft } = useFormDraft({
 *   key: `client_${activeTenantId}`,   // chave SEMPRE com tenantId
 *   initialState: INITIAL_FORM,
 *   isOpen,
 *   isEditMode: !!initialData,          // desativa draft em modo edição
 * });
 * ```
 *
 * Ao fechar o SidePanel com sucesso, chamar clearDraft() no handler de submit.
 */

const DRAFT_PREFIX = 'tauze_draft_';

/**
 * Verifica se existe um rascunho salvo para a chave informada.
 * Use nas páginas para auto-abrir o formulário ao retornar:
 * ```tsx
 * const [isFormOpen, setIsFormOpen] = useState(() =>
 *   hasDraftForKey(`client_form_${activeTenantId}`)
 * );
 * ```
 */
export function hasDraftForKey(key: string): boolean {
  try {
    const raw = sessionStorage.getItem(`${DRAFT_PREFIX}${key}`);
    if (!raw) return false;
    const { data } = JSON.parse(raw);
    return hasContent(data);
  } catch {
    return false;
  }
}

/**
 * Versão sem prefixo — use para AnimalForm e LotForm que usam chaves customizadas.
 * Ex: hasDraftForFullKey(`draft_animal_${activeTenantId}_new`)
 */
export function hasDraftForFullKey(fullKey: string): boolean {
  try {
    const raw = sessionStorage.getItem(fullKey);
    if (!raw) return false;
    const { data } = JSON.parse(raw);
    return hasContent(data);
  } catch {
    return false;
  }
}

export interface UseFormDraftOptions<T> {
  /** Chave única do rascunho — DEVE incluir activeTenantId para isolamento multi-tenant */
  key: string;
  /** Estado inicial do formulário (constante INITIAL_FORM) */
  initialState: T;
  /** Controla abertura/fechamento do formulário (isOpen do SidePanel) */
  isOpen: boolean;
  /**
   * Se true (modo edição), o hook não toca no estado — o formulário
   * gerencia sua própria inicialização via useEffect([isOpen, initialData]).
   * Default: false
   */
  isEditMode?: boolean;
  /**
   * Desativa toda a lógica de draft para formulários transacionais
   * (ex: RelocateForm, AssignAnimalForm). Default: true
   */
  enabled?: boolean;
}

export interface UseFormDraftReturn<T> {
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  /** Limpar rascunho — chamar SEMPRE no submit bem-sucedido */
  clearDraft: () => void;
  /** true quando há rascunho restaurado — útil para UI opcional */
  hasDraft: boolean;
}

/** Verifica se o objeto tem ao menos um campo preenchido pelo usuário */
function hasContent<T>(data: T): boolean {
  if (!data || typeof data !== 'object') return false;
  return Object.values(data as Record<string, unknown>).some((v) => {
    if (v === null || v === undefined || v === '' || v === false) return false;
    if (typeof v === 'number') return v !== 0;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  });
}

export function useFormDraft<T>({
  key,
  initialState,
  isOpen,
  isEditMode = false,
  enabled = true,
}: UseFormDraftOptions<T>): UseFormDraftReturn<T> {
  const [formData, setFormData] = useState<T>(initialState);
  const [hasDraft, setHasDraft] = useState(false);

  // Ref estável para initialState — evita re-triggers desnecessários nos effects
  const initialStateRef = useRef(initialState);
  useEffect(() => {
    initialStateRef.current = initialState;
  });

  const storageKey = `${DRAFT_PREFIX}${key}`;
  const toastId = `draft-restore-${key}`;

  // ── Inicialização ao abrir o formulário ──────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      // Garante que o toast seja dispensado ao fechar o form sem submeter
      toast.dismiss(toastId);
      return;
    }

    // Em modo edição: o componente pai gerencia a inicialização com os dados
    // existentes. O hook não interfere para não sobrescrever initialData.
    if (!enabled || isEditMode) return;

    try {
      const raw = sessionStorage.getItem(storageKey);

      if (!raw) {
        setFormData(initialStateRef.current);
        setHasDraft(false);
        return;
      }

      const { data, savedAt } = JSON.parse(raw) as {
        data: T;
        savedAt: string;
      };

      if (!hasContent(data)) {
        setFormData(initialStateRef.current);
        setHasDraft(false);
        return;
      }

      // Rascunho válido encontrado — restaurar e notificar o usuário
      setFormData(data);
      setHasDraft(true);

      const minutesAgo = Math.round(
        (Date.now() - new Date(savedAt).getTime()) / 60_000
      );
      const label =
        minutesAgo < 1
          ? 'agora mesmo'
          : minutesAgo === 1
          ? 'há 1 minuto'
          : `há ${minutesAgo} minutos`;

      toast(
        (t) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>📋</span>
              <div>
                <p
                  style={{
                    fontWeight: 800,
                    fontSize: '13px',
                    margin: 0,
                    color: '#1e293b',
                  }}
                >
                  Rascunho restaurado
                </p>
                <p
                  style={{
                    fontSize: '11px',
                    color: '#64748b',
                    margin: 0,
                  }}
                >
                  Campos preenchidos {label}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => toast.dismiss(t.id)}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#10b981',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Manter
              </button>
              <button
                onClick={() => {
                  sessionStorage.removeItem(storageKey);
                  setFormData(initialStateRef.current);
                  setHasDraft(false);
                  toast.dismiss(t.id);
                }}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  color: '#64748b',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Descartar
              </button>
            </div>
          </div>
        ),
        {
          id: toastId,
          duration: 8000,
          style: {
            maxWidth: '320px',
            padding: '16px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
          },
        }
      );
    } catch {
      // sessionStorage corrompido — limpar e inicializar com padrão
      sessionStorage.removeItem(storageKey);
      setFormData(initialStateRef.current);
      setHasDraft(false);
    }
  }, [isOpen, isEditMode, enabled, storageKey, toastId]);

  // ── Auto-save com debounce ───────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !enabled || isEditMode) return;
    if (!hasContent(formData)) return;

    const timeout = setTimeout(() => {
      try {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({ data: formData, savedAt: new Date().toISOString() })
        );
      } catch {
        // sessionStorage cheio ou indisponível — silent fail
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [formData, isOpen, enabled, isEditMode, storageKey]);

  // ── clearDraft — chamar no submit bem-sucedido ───────────────────────────
  const clearDraft = useCallback(() => {
    sessionStorage.removeItem(storageKey);
    setHasDraft(false);
    toast.dismiss(toastId);
  }, [storageKey, toastId]);

  return { formData, setFormData, clearDraft, hasDraft };
}
