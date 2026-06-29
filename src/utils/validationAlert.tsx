import React from 'react';
import toast from 'react-hot-toast';
import { z } from 'zod';

/**
 * Exibe um toast de erro customizado com fundo branco e contraste alto
 * listando todos os erros de validação retornados pelo Zod ou uma lista de strings.
 * Utilizado em todo o módulo de Pecuária para padronizar a UX.
 *
 * @param error Objeto ZodError contendo os erros de validação ou um array de strings
 */
export const showValidationAlert = (error: z.ZodError | string[] | string) => {
  let messages: string[] = [];

  if (typeof error === 'string') {
    messages = [error];
  } else if (Array.isArray(error)) {
    messages = error;
  } else if ((error instanceof z.ZodError || (error && (error as any).name === 'ZodError')) && Array.isArray((error as any).errors)) {
    messages = (error as any).errors.map((e: any) => e.message);
  } else if (error && typeof error === 'object' && Array.isArray((error as any).errors)) {
    messages = (error as any).errors.map((e: any) => e.message || String(e));
  } else if (error instanceof Error) {
    // Se for um ZodError disfarçado, a mensagem pode ser um JSON
    try {
      if (error.message.startsWith('[') && error.message.endsWith(']')) {
        const parsed = JSON.parse(error.message);
        messages = parsed.map((e: any) => e.message);
      } else {
        messages = [error.message];
      }
    } catch {
      messages = [error.message];
    }
  } else {
    messages = ['Erro de validação desconhecido. Verifique os campos.'];
  }

  toast.error(
    <div style={{ padding: '8px', minWidth: '250px' }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: '#dc2626' }}>
        Campos Obrigatórios Pendentes:
      </h4>
      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#1f2937' }}>
        {messages.map((msg, idx) => (
          <li key={idx} style={{ marginBottom: '4px' }}>{msg}</li>
        ))}
      </ul>
    </div>,
    {
      duration: 5000,
      style: {
        background: '#ffffff',
        border: '1px solid #ef4444',
        color: '#1f2937',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      }
    }
  );
};

