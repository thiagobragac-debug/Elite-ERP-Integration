/**
 * Valida se uma string é um UUID válido (v4 ou similar).
 * Essencial para evitar erros "invalid input syntax for type uuid" no Supabase.
 */
export const isValidUUID = (uuid: string | null | undefined): boolean => {
  if (!uuid) return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Filtra parâmetros de consulta para garantir que apenas UUIDs válidos sejam enviados.
 * Retorna null se o ID for inválido.
 */
export const cleanUUID = (id: string | null | undefined): string | null => {
  if (isValidUUID(id)) return id as string;
  return null;
};
