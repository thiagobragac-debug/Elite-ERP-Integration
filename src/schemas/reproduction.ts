import { z } from 'zod';

export const reproductionEventSchema = z.object({
  animal_id: z.string().min(1, 'Selecione um animal.'),
  tipo_evento: z.enum(['IATF', 'Palpação', 'Parto', 'Monta', 'Secagem']),
  data_evento: z.string().min(1, 'A data do evento é obrigatória.'),
  status: z.enum(['pending', 'completed', 'cancelled', 'draft']),
  tecnico: z.string().optional(),
  observacoes: z.string().optional(),

  // Mutating fields based on tipo_evento
  resultado: z.string().optional(),
  resultado_diagnostico: z.string().optional(),
  dias_gestacao: z.string().optional(),
  numero_fetos: z.string().optional(),
  metodo_diagnostico: z.string().optional(),
  touro: z.string().optional(),
  partida_semen: z.string().optional(),
  ecc: z.string().optional(),
  sexo_cria: z.string().optional(),
  id_cria: z.string().optional(),
  peso_nascimento: z.string().optional(),
  retencao_placenta: z.boolean().optional(),
  dificuldade_parto: z.number().optional(),
  periodo_secagem: z.union([z.string(), z.number()]).optional(),
  teat_sealant: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.status === 'completed' && new Date(data.data_evento) > new Date()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Não é possível concluir um evento com data no futuro.',
      path: ['data_evento'],
    });
  }

  if (data.tipo_evento === 'IATF' || data.tipo_evento === 'Monta') {
    if (!data.resultado) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'O Protocolo Hormonal é obrigatório.',
        path: ['resultado'],
      });
    }
  }

  if (data.tipo_evento === 'Palpação') {
    if (!data.resultado_diagnostico) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'O diagnóstico é obrigatório.',
        path: ['resultado_diagnostico'],
      });
    }
  }

  if (data.tipo_evento === 'Parto') {
    if (!data.resultado) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A condição do parto é obrigatória.',
        path: ['resultado'],
      });
    }
  }
});

export type ReproductionEventData = z.infer<typeof reproductionEventSchema>;
