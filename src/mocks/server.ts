import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Define default mock handlers for Supabase client endpoints
export const handlers = [
  // Mock check on table structure or dynamic data queries (Supabase URL is dynamic)
  http.get('*/rest/v1/*', ({ request }) => {
    const url = new URL(request.url);
    const path = url.pathname;

    // Return empty results/mock statistics for tests to verify loading and error bounds
    if (path.includes('lotes')) {
      return HttpResponse.json([{ id: 'mock-lot-1', status: 'PENDENTE' }]);
    }
    if (path.includes('contas_pagar') || path.includes('contas_receber')) {
      return HttpResponse.json([{ id: 'mock-account-1', status: 'ABERTO' }]);
    }
    if (path.includes('sanidade')) {
      return HttpResponse.json([]);
    }

    return HttpResponse.json([]);
  }),
];

export const server = setupServer(...handlers);
