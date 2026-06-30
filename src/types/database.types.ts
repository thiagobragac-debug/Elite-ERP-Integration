export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      abastecimentos: {
        Row: {
          created_at: string | null
          data: string
          fazenda_id: string | null
          id: string
          litros: number
          maquina_id: string | null
          responsavel: string | null
          tanque_cheio: boolean | null
          tenant_id: string | null
          tipo_combustivel: string | null
          valor_medidor: number | null
          valor_total: number | null
        }
        Insert: {
          created_at?: string | null
          data?: string
          fazenda_id?: string | null
          id?: string
          litros: number
          maquina_id?: string | null
          responsavel?: string | null
          tanque_cheio?: boolean | null
          tenant_id?: string | null
          tipo_combustivel?: string | null
          valor_medidor?: number | null
          valor_total?: number | null
        }
        Update: {
          created_at?: string | null
          data?: string
          fazenda_id?: string | null
          id?: string
          litros?: number
          maquina_id?: string | null
          responsavel?: string | null
          tanque_cheio?: boolean | null
          tenant_id?: string | null
          tipo_combustivel?: string | null
          valor_medidor?: number | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "abastecimentos_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abastecimentos_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abastecimentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      animais: {
        Row: {
          brinco: string
          brinco_eletronico: string | null
          categoria: string | null
          created_at: string | null
          data_nascimento: string | null
          fase_atual: string | null
          fazenda_id: string | null
          finalidade: string | null
          id: string
          lote_id: string | null
          mae_brinco: string | null
          origem: string | null
          pai_brinco: string | null
          pasto_id: string | null
          pelagem: string | null
          peso_atual: number | null
          peso_inicial: number | null
          peso_objetivo: number | null
          raca: string | null
          romaneio_id: string | null
          sexo: string | null
          status: string | null
          tenant_id: string | null
          valor_compra: number | null
          valor_venda: number | null
          especie_id: string | null
          aptidao_id: string | null
        }
        Insert: {
          brinco: string
          brinco_eletronico?: string | null
          categoria?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          fase_atual?: string | null
          fazenda_id?: string | null
          finalidade?: string | null
          id?: string
          lote_id?: string | null
          mae_brinco?: string | null
          origem?: string | null
          pai_brinco?: string | null
          pasto_id?: string | null
          pelagem?: string | null
          peso_atual?: number | null
          peso_inicial?: number | null
          peso_objetivo?: number | null
          raca?: string | null
          romaneio_id?: string | null
          sexo?: string | null
          status?: string | null
          tenant_id?: string | null
          valor_compra?: number | null
          valor_venda?: number | null
          especie_id?: string | null
          aptidao_id?: string | null
        }
        Update: {
          brinco?: string
          brinco_eletronico?: string | null
          categoria?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          fase_atual?: string | null
          fazenda_id?: string | null
          finalidade?: string | null
          id?: string
          lote_id?: string | null
          mae_brinco?: string | null
          origem?: string | null
          pai_brinco?: string | null
          pasto_id?: string | null
          pelagem?: string | null
          peso_atual?: number | null
          peso_inicial?: number | null
          peso_objetivo?: number | null
          raca?: string | null
          romaneio_id?: string | null
          sexo?: string | null
          status?: string | null
          tenant_id?: string | null
          valor_compra?: number | null
          valor_venda?: number | null
          especie_id?: string | null
          aptidao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animais_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animais_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animais_pasto_id_fkey"
            columns: ["pasto_id"]
            isOneToOne: false
            referencedRelation: "pastos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animais_romaneio_id_fkey"
            columns: ["romaneio_id"]
            isOneToOne: false
            referencedRelation: "romaneios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animais_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          entity: string | null
          entity_id: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          tenant_id: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          tenant_id?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          tenant_id?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      auditorias_estoque: {
        Row: {
          accuracy: number | null
          categoria: string | null
          created_at: string | null
          data: string | null
          fazenda_id: string | null
          id: string
          items_count: number | null
          responsavel: string | null
          status: string | null
          tenant_id: string | null
          titulo: string
        }
        Insert: {
          accuracy?: number | null
          categoria?: string | null
          created_at?: string | null
          data?: string | null
          fazenda_id?: string | null
          id?: string
          items_count?: number | null
          responsavel?: string | null
          status?: string | null
          tenant_id?: string | null
          titulo: string
        }
        Update: {
          accuracy?: number | null
          categoria?: string | null
          created_at?: string | null
          data?: string | null
          fazenda_id?: string | null
          id?: string
          items_count?: number | null
          responsavel?: string | null
          status?: string | null
          tenant_id?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditorias_estoque_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditorias_estoque_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_sistema: {
        Row: {
          categoria_financeira_id: string | null
          cor: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          modulo: string
          modulo_vinculado: string | null
          nome: string
          parent_id: string | null
          tenant_id: string
          tipo_item: string | null
          updated_at: string | null
        }
        Insert: {
          categoria_financeira_id?: string | null
          cor?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          modulo: string
          modulo_vinculado?: string | null
          nome: string
          parent_id?: string | null
          tenant_id: string
          tipo_item?: string | null
          updated_at?: string | null
        }
        Update: {
          categoria_financeira_id?: string | null
          cor?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          modulo?: string
          modulo_vinculado?: string | null
          nome?: string
          parent_id?: string | null
          tenant_id?: string
          tipo_item?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categorias_sistema_categoria_financeira_id_fkey"
            columns: ["categoria_financeira_id"]
            isOneToOne: false
            referencedRelation: "categorias_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categorias_sistema_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categorias_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categorias_sistema_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      certificados_digitais: {
        Row: {
          cnpj_cpf: string
          company_id: string
          created_at: string
          data_vencimento: string
          id: string
          pfx_base64: string
          senha: string
          tenant_id: string
          titular: string
          updated_at: string
        }
        Insert: {
          cnpj_cpf: string
          company_id: string
          created_at?: string
          data_vencimento: string
          id?: string
          pfx_base64: string
          senha: string
          tenant_id: string
          titular: string
          updated_at?: string
        }
        Update: {
          cnpj_cpf?: string
          company_id?: string
          created_at?: string
          data_vencimento?: string
          id?: string
          pfx_base64?: string
          senha?: string
          tenant_id?: string
          titular?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificados_digitais_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificados_digitais_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      conciliacoes: {
        Row: {
          conta_bancaria_id: string | null
          created_at: string | null
          data_importacao: string | null
          fazenda_id: string | null
          id: string
          periodo_fim: string | null
          periodo_inicio: string | null
          status: string | null
          tenant_id: string | null
        }
        Insert: {
          conta_bancaria_id?: string | null
          created_at?: string | null
          data_importacao?: string | null
          fazenda_id?: string | null
          id?: string
          periodo_fim?: string | null
          periodo_inicio?: string | null
          status?: string | null
          tenant_id?: string | null
        }
        Update: {
          conta_bancaria_id?: string | null
          created_at?: string | null
          data_importacao?: string | null
          fazenda_id?: string | null
          id?: string
          periodo_fim?: string | null
          periodo_inicio?: string | null
          status?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conciliacoes_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conciliacoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      confinamento: {
        Row: {
          capacidade_animais: number | null
          created_at: string | null
          data_inicio: string
          dof_alvo: number | null
          fazenda_id: string | null
          id: string
          lote_id: string | null
          nome_curral: string
          peso_entrada: number | null
          tenant_id: string | null
          especie_id: string | null
          aptidao_id: string | null
        }
        Insert: {
          capacidade_animais?: number | null
          created_at?: string | null
          data_inicio?: string
          dof_alvo?: number | null
          fazenda_id?: string | null
          id?: string
          lote_id?: string | null
          nome_curral: string
          peso_entrada?: number | null
          tenant_id?: string | null
          especie_id?: string | null
          aptidao_id?: string | null
        }
        Update: {
          capacidade_animais?: number | null
          created_at?: string | null
          data_inicio?: string
          dof_alvo?: number | null
          fazenda_id?: string | null
          id?: string
          lote_id?: string | null
          nome_curral?: string
          peso_entrada?: number | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "confinamento_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confinamento_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confinamento_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_bancarias: {
        Row: {
          agencia: string | null
          banco: string
          conta: string | null
          created_at: string | null
          descricao: string | null
          fazenda_id: string | null
          id: string
          is_global: boolean | null
          saldo_atual: number | null
          tenant_id: string | null
          tipo: string | null
          unidade_id: string | null
        }
        Insert: {
          agencia?: string | null
          banco: string
          conta?: string | null
          created_at?: string | null
          descricao?: string | null
          fazenda_id?: string | null
          id?: string
          is_global?: boolean | null
          saldo_atual?: number | null
          tenant_id?: string | null
          tipo?: string | null
          unidade_id?: string | null
        }
        Update: {
          agencia?: string | null
          banco?: string
          conta?: string | null
          created_at?: string | null
          descricao?: string | null
          fazenda_id?: string | null
          id?: string
          is_global?: boolean | null
          saldo_atual?: number | null
          tenant_id?: string | null
          tipo?: string | null
          unidade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_bancarias_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_bancarias_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_bancarias_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_pagar: {
        Row: {
          categoria_id: string | null
          created_at: string | null
          data_pagamento: string | null
          data_vencimento: string
          descricao: string | null
          fazenda_id: string | null
          fornecedor_id: string | null
          id: string
          metodo_pagamento: string | null
          status: string | null
          tenant_id: string | null
          valor_total: number
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          descricao?: string | null
          fazenda_id?: string | null
          fornecedor_id?: string | null
          id?: string
          metodo_pagamento?: string | null
          status?: string | null
          tenant_id?: string | null
          valor_total: number
        }
        Update: {
          categoria_id?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string | null
          fazenda_id?: string | null
          fornecedor_id?: string | null
          id?: string
          metodo_pagamento?: string | null
          status?: string | null
          tenant_id?: string | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_pagar_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contas_pagar_fornecedor"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "parceiros"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_receber: {
        Row: {
          categoria_id: string | null
          cliente_id: string | null
          created_at: string | null
          data_recebimento: string | null
          data_vencimento: string
          descricao: string | null
          fazenda_id: string | null
          id: string
          metodo_recebimento: string | null
          status: string | null
          tenant_id: string | null
          valor_total: number
        }
        Insert: {
          categoria_id?: string | null
          cliente_id?: string | null
          created_at?: string | null
          data_recebimento?: string | null
          data_vencimento: string
          descricao?: string | null
          fazenda_id?: string | null
          id?: string
          metodo_recebimento?: string | null
          status?: string | null
          tenant_id?: string | null
          valor_total: number
        }
        Update: {
          categoria_id?: string | null
          cliente_id?: string | null
          created_at?: string | null
          data_recebimento?: string | null
          data_vencimento?: string
          descricao?: string | null
          fazenda_id?: string | null
          id?: string
          metodo_recebimento?: string | null
          status?: string | null
          tenant_id?: string | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contas_receber_cliente"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "parceiros"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          fazenda_id: string | null
          fornecedor_id: string | null
          id: string
          numero_contrato: string
          status: string | null
          tenant_id: string | null
          tipo: string | null
          valor_total: number | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          fazenda_id?: string | null
          fornecedor_id?: string | null
          id?: string
          numero_contrato: string
          status?: string | null
          tenant_id?: string | null
          tipo?: string | null
          valor_total?: number | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          fazenda_id?: string | null
          fornecedor_id?: string | null
          id?: string
          numero_contrato?: string
          status?: string | null
          tenant_id?: string | null
          tipo?: string | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "parceiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "parceiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      custos_animal: {
        Row: {
          animal_id: string | null
          created_at: string | null
          data_consumo: string | null
          dieta_id: string | null
          fase: string | null
          fazenda_id: string | null
          id: string
          lote_id: string | null
          produto_id: string | null
          quantidade_consumida: number | null
          tenant_id: string | null
          valor_total_aplicado: number | null
          valor_unitario_aplicado: number | null
        }
        Insert: {
          animal_id?: string | null
          created_at?: string | null
          data_consumo?: string | null
          dieta_id?: string | null
          fase?: string | null
          fazenda_id?: string | null
          id?: string
          lote_id?: string | null
          produto_id?: string | null
          quantidade_consumida?: number | null
          tenant_id?: string | null
          valor_total_aplicado?: number | null
          valor_unitario_aplicado?: number | null
        }
        Update: {
          animal_id?: string | null
          created_at?: string | null
          data_consumo?: string | null
          dieta_id?: string | null
          fase?: string | null
          fazenda_id?: string | null
          id?: string
          lote_id?: string | null
          produto_id?: string | null
          quantidade_consumida?: number | null
          tenant_id?: string | null
          valor_total_aplicado?: number | null
          valor_unitario_aplicado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "custos_animal_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custos_animal_dieta_id_fkey"
            columns: ["dieta_id"]
            isOneToOne: false
            referencedRelation: "dietas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custos_animal_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custos_animal_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custos_animal_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custos_animal_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      deposito_categorias_permitidas: {
        Row: {
          categoria_permitida: string
          id: string
          tenant_id: string
          tipo_deposito: string
        }
        Insert: {
          categoria_permitida: string
          id?: string
          tenant_id: string
          tipo_deposito: string
        }
        Update: {
          categoria_permitida?: string
          id?: string
          tenant_id?: string
          tipo_deposito?: string
        }
        Relationships: []
      }
      depositos: {
        Row: {
          capacidade_maxima: number | null
          created_at: string
          descricao: string | null
          fazenda_id: string
          id: string
          localizacao_tecnica: string | null
          nome: string
          status: string
          tenant_id: string
          tipo: string | null
          unidade_capacidade: string | null
        }
        Insert: {
          capacidade_maxima?: number | null
          created_at?: string
          descricao?: string | null
          fazenda_id: string
          id?: string
          localizacao_tecnica?: string | null
          nome: string
          status?: string
          tenant_id: string
          tipo?: string | null
          unidade_capacidade?: string | null
        }
        Update: {
          capacidade_maxima?: number | null
          created_at?: string
          descricao?: string | null
          fazenda_id?: string
          id?: string
          localizacao_tecnica?: string | null
          nome?: string
          status?: string
          tenant_id?: string
          tipo?: string | null
          unidade_capacidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "depositos_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
        ]
      }
      dietas: {
        Row: {
          created_at: string | null
          custo_por_kg: number | null
          data_registro: string | null
          descricao: string | null
          fazenda_id: string | null
          id: string
          ingredientes: Json | null
          nome: string
          percentual_ms: number | null
          status: string | null
          tenant_id: string | null
          tipo: string | null
        }
        Insert: {
          created_at?: string | null
          custo_por_kg?: number | null
          data_registro?: string | null
          descricao?: string | null
          fazenda_id?: string | null
          id?: string
          ingredientes?: Json | null
          nome: string
          percentual_ms?: number | null
          status?: string | null
          tenant_id?: string | null
          tipo?: string | null
        }
        Update: {
          created_at?: string | null
          custo_por_kg?: number | null
          data_registro?: string | null
          descricao?: string | null
          fazenda_id?: string | null
          id?: string
          ingredientes?: Json | null
          nome?: string
          percentual_ms?: number | null
          status?: string | null
          tenant_id?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dietas_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dietas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_ncms: {
        Row: {
          codigo: string
          created_at: string | null
          descricao: string
          id: string
          is_active: boolean | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          codigo: string
          created_at?: string | null
          descricao: string
          id?: string
          is_active?: boolean | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          codigo?: string
          created_at?: string | null
          descricao?: string
          id?: string
          is_active?: boolean | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_ncms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_reprodutivos: {
        Row: {
          animal_id: string | null
          created_at: string | null
          custo: number | null
          data_evento: string
          fazenda_id: string | null
          id: string
          observacoes: string | null
          resultado: string | null
          status: string | null
          tenant_id: string | null
          tipo_evento: string | null
          especie_id: string | null
          aptidao_id: string | null
        }
        Insert: {
          animal_id?: string | null
          created_at?: string | null
          custo?: number | null
          data_evento?: string
          fazenda_id?: string | null
          id?: string
          observacoes?: string | null
          resultado?: string | null
          status?: string | null
          tenant_id?: string | null
          tipo_evento?: string | null
          especie_id?: string | null
          aptidao_id?: string | null
        }
        Update: {
          animal_id?: string | null
          created_at?: string | null
          custo?: number | null
          data_evento?: string
          fazenda_id?: string | null
          id?: string
          observacoes?: string | null
          resultado?: string | null
          status?: string | null
          tenant_id?: string | null
          tipo_evento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_reprodutivos_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_reprodutivos_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_reprodutivos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fazendas: {
        Row: {
          area_ha: number | null
          area_total: number | null
          created_at: string | null
          id: string
          ie_produtor: string | null
          localizacao: string | null
          municipio: string | null
          nirf: string | null
          nome: string
          tenant_id: string | null
          uf: string | null
          unidade_id: string | null
          configuracoes: Json | null
        }
        Insert: {
          area_ha?: number | null
          area_total?: number | null
          created_at?: string | null
          id?: string
          ie_produtor?: string | null
          localizacao?: string | null
          municipio?: string | null
          nirf?: string | null
          nome: string
          tenant_id?: string | null
          uf?: string | null
          unidade_id?: string | null
          configuracoes?: Json | null
        }
        Update: {
          area_ha?: number | null
          area_total?: number | null
          created_at?: string | null
          id?: string
          ie_produtor?: string | null
          localizacao?: string | null
          municipio?: string | null
          nirf?: string | null
          nome?: string
          tenant_id?: string | null
          uf?: string | null
          unidade_id?: string | null
          configuracoes?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fazendas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fazendas_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_movimentacao_animal: {
        Row: {
          animal_id: string | null
          created_at: string | null
          data_movimentacao: string | null
          fazenda_id: string | null
          id: string
          lote_destino_id: string | null
          lote_origem_id: string | null
          motivo: string | null
          tenant_id: string | null
        }
        Insert: {
          animal_id?: string | null
          created_at?: string | null
          data_movimentacao?: string | null
          fazenda_id?: string | null
          id?: string
          lote_destino_id?: string | null
          lote_origem_id?: string | null
          motivo?: string | null
          tenant_id?: string | null
        }
        Update: {
          animal_id?: string | null
          created_at?: string | null
          data_movimentacao?: string | null
          fazenda_id?: string | null
          id?: string
          lote_destino_id?: string | null
          lote_origem_id?: string | null
          motivo?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_movimentacao_animal_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_movimentacao_animal_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_movimentacao_animal_lote_destino_id_fkey"
            columns: ["lote_destino_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_movimentacao_animal_lote_origem_id_fkey"
            columns: ["lote_origem_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_movimentacao_animal_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lcdpr_lancamentos: {
        Row: {
          ano_calendario: number
          cod_conta_bancaria: string | null
          cod_imovel: string
          cod_natureza: string
          cpf_cnpj_participante: string | null
          created_at: string | null
          data_lancamento: string
          descricao: string | null
          fazenda_id: string | null
          id: string
          nome_participante: string | null
          num_documento: string | null
          origem: string | null
          origem_id: string | null
          tenant_id: string | null
          tipo: string
          unidade_id: string | null
          valor: number
        }
        Insert: {
          ano_calendario: number
          cod_conta_bancaria?: string | null
          cod_imovel: string
          cod_natureza: string
          cpf_cnpj_participante?: string | null
          created_at?: string | null
          data_lancamento: string
          descricao?: string | null
          fazenda_id?: string | null
          id?: string
          nome_participante?: string | null
          num_documento?: string | null
          origem?: string | null
          origem_id?: string | null
          tenant_id?: string | null
          tipo: string
          unidade_id?: string | null
          valor?: number
        }
        Update: {
          ano_calendario?: number
          cod_conta_bancaria?: string | null
          cod_imovel?: string
          cod_natureza?: string
          cpf_cnpj_participante?: string | null
          created_at?: string | null
          data_lancamento?: string
          descricao?: string | null
          fazenda_id?: string | null
          id?: string
          nome_participante?: string | null
          num_documento?: string | null
          origem?: string | null
          origem_id?: string | null
          tenant_id?: string | null
          tipo?: string
          unidade_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lcdpr_lancamentos_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lcdpr_lancamentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lcdpr_lancamentos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      lotes: {
        Row: {
          capacidade: number | null
          cor: string | null
          created_at: string | null
          custo_diario: number | null
          data_fim_prevista: string | null
          data_inicio: string | null
          descricao: string | null
          dias_ciclo: number | null
          exige_rastreabilidade: boolean | null
          fazenda_id: string | null
          finalidade: string | null
          gmd_alvo: number | null
          id: string
          meta_rendimento_carcaca: number | null
          nome: string
          pasto_id: string | null
          peso_alvo: number | null
          peso_carcaca_alvo: number | null
          peso_entrada: number | null
          programa_bonificacao: string | null
          regime_alimentar: string | null
          sexo_permitido: string | null
          status: string | null
          tenant_id: string | null
          especie_id: string | null
          aptidao_id: string | null
        }
        Insert: {
          capacidade?: number | null
          cor?: string | null
          created_at?: string | null
          custo_diario?: number | null
          data_fim_prevista?: string | null
          data_inicio?: string | null
          descricao?: string | null
          dias_ciclo?: number | null
          exige_rastreabilidade?: boolean | null
          fazenda_id?: string | null
          finalidade?: string | null
          gmd_alvo?: number | null
          id?: string
          meta_rendimento_carcaca?: number | null
          nome: string
          pasto_id?: string | null
          peso_alvo?: number | null
          peso_carcaca_alvo?: number | null
          peso_entrada?: number | null
          programa_bonificacao?: string | null
          regime_alimentar?: string | null
          sexo_permitido?: string | null
          status?: string | null
          tenant_id?: string | null
          especie_id?: string | null
          aptidao_id?: string | null
        }
        Update: {
          capacidade?: number | null
          cor?: string | null
          created_at?: string | null
          custo_diario?: number | null
          data_fim_prevista?: string | null
          data_inicio?: string | null
          descricao?: string | null
          dias_ciclo?: number | null
          exige_rastreabilidade?: boolean | null
          fazenda_id?: string | null
          finalidade?: string | null
          gmd_alvo?: number | null
          id?: string
          meta_rendimento_carcaca?: number | null
          nome?: string
          pasto_id?: string | null
          peso_alvo?: number | null
          peso_carcaca_alvo?: number | null
          peso_entrada?: number | null
          programa_bonificacao?: string | null
          regime_alimentar?: string | null
          sexo_permitido?: string | null
          status?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lotes_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotes_pasto_id_fkey"
            columns: ["pasto_id"]
            isOneToOne: false
            referencedRelation: "pastos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      manutencao_frota: {
        Row: {
          created_at: string | null
          custo: number | null
          data_inicio: string
          descricao: string | null
          fazenda_id: string | null
          id: string
          maquina_id: string | null
          responsavel: string | null
          status: string | null
          tenant_id: string | null
          tipo: string | null
        }
        Insert: {
          created_at?: string | null
          custo?: number | null
          data_inicio?: string
          descricao?: string | null
          fazenda_id?: string | null
          id?: string
          maquina_id?: string | null
          responsavel?: string | null
          status?: string | null
          tenant_id?: string | null
          tipo?: string | null
        }
        Update: {
          created_at?: string | null
          custo?: number | null
          data_inicio?: string
          descricao?: string | null
          fazenda_id?: string | null
          id?: string
          maquina_id?: string | null
          responsavel?: string | null
          status?: string | null
          tenant_id?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manutencao_frota_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manutencao_frota_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manutencao_frota_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mapas_cotacao: {
        Row: {
          created_at: string | null
          dados_fornecedores: Json | null
          fazenda_id: string | null
          id: string
          produto_id: string | null
          quantidade: number | null
          status: string | null
          tenant_id: string | null
          unidade: string | null
        }
        Insert: {
          created_at?: string | null
          dados_fornecedores?: Json | null
          fazenda_id?: string | null
          id?: string
          produto_id?: string | null
          quantidade?: number | null
          status?: string | null
          tenant_id?: string | null
          unidade?: string | null
        }
        Update: {
          created_at?: string | null
          dados_fornecedores?: Json | null
          fazenda_id?: string | null
          id?: string
          produto_id?: string | null
          quantidade?: number | null
          status?: string | null
          tenant_id?: string | null
          unidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mapas_cotacao_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mapas_cotacao_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mapas_cotacao_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      maquinas: {
        Row: {
          ano: number | null
          ano_modelo: number | null
          capacidade_tanque: number | null
          chassi: string | null
          combustivel: string | null
          consumo_estimado: number | null
          created_at: string | null
          data_proxima_revisao: string | null
          fazenda_id: string | null
          horimetro_atual: number | null
          id: string
          intervalo_revisao: number | null
          marca: string | null
          modelo: string | null
          nome: string
          observacoes: string | null
          patrimonio: string | null
          peso_operacional: number | null
          placa: string | null
          potencia: number | null
          quilometragem_atual: number | null
          status: string | null
          tenant_id: string | null
          tipo: string | null
          tipo_medidor: string | null
          ultimo_medidor_revisao: number | null
          valor_compra: number | null
        }
        Insert: {
          ano?: number | null
          ano_modelo?: number | null
          capacidade_tanque?: number | null
          chassi?: string | null
          combustivel?: string | null
          consumo_estimado?: number | null
          created_at?: string | null
          data_proxima_revisao?: string | null
          fazenda_id?: string | null
          horimetro_atual?: number | null
          id?: string
          intervalo_revisao?: number | null
          marca?: string | null
          modelo?: string | null
          nome: string
          observacoes?: string | null
          patrimonio?: string | null
          peso_operacional?: number | null
          placa?: string | null
          potencia?: number | null
          quilometragem_atual?: number | null
          status?: string | null
          tenant_id?: string | null
          tipo?: string | null
          tipo_medidor?: string | null
          ultimo_medidor_revisao?: number | null
          valor_compra?: number | null
        }
        Update: {
          ano?: number | null
          ano_modelo?: number | null
          capacidade_tanque?: number | null
          chassi?: string | null
          combustivel?: string | null
          consumo_estimado?: number | null
          created_at?: string | null
          data_proxima_revisao?: string | null
          fazenda_id?: string | null
          horimetro_atual?: number | null
          id?: string
          intervalo_revisao?: number | null
          marca?: string | null
          modelo?: string | null
          nome?: string
          observacoes?: string | null
          patrimonio?: string | null
          peso_operacional?: number | null
          placa?: string | null
          potencia?: number | null
          quilometragem_atual?: number | null
          status?: string | null
          tenant_id?: string | null
          tipo?: string | null
          tipo_medidor?: string | null
          ultimo_medidor_revisao?: number | null
          valor_compra?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "maquinas_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maquinas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      market_alerts: {
        Row: {
          created_at: string | null
          direction: string
          id: string
          indicator: string
          is_active: boolean | null
          target_price: number
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          direction: string
          id?: string
          indicator: string
          is_active?: boolean | null
          target_price: number
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          direction?: string
          id?: string
          indicator?: string
          is_active?: boolean | null
          target_price?: number
          tenant_id?: string | null
        }
        Relationships: []
      }
      market_import_logs: {
        Row: {
          details: Json | null
          error_message: string | null
          executed_at: string | null
          id: string
          indicators_failed: number | null
          indicators_ok: number | null
          indicators_skipped: number | null
          job_name: string
          status: string
        }
        Insert: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          indicators_failed?: number | null
          indicators_ok?: number | null
          indicators_skipped?: number | null
          job_name: string
          status: string
        }
        Update: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          indicators_failed?: number | null
          indicators_ok?: number | null
          indicators_skipped?: number | null
          job_name?: string
          status?: string
        }
        Relationships: []
      }
      market_quotes: {
        Row: {
          created_at: string
          date: string
          id: string
          indicator: string
          value: number
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          indicator: string
          value: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          indicator?: string
          value?: number
        }
        Relationships: []
      }
      movimentacoes_estoque: {
        Row: {
          animal_id: string | null
          created_at: string | null
          custo_unitario: number | null
          data_movimentacao: string
          data_validade: string | null
          deposito_id: string | null
          fazenda_id: string | null
          id: string
          lote: string | null
          lote_pecuario_id: string | null
          origem: string | null
          origem_destino: string | null
          produto_id: string | null
          quantidade: number
          responsavel: string | null
          saldo_fifo: number | null
          tenant_id: string | null
          tipo: string | null
          especie_id: string | null
          aptidao_id: string | null
        }
        Insert: {
          animal_id?: string | null
          created_at?: string | null
          custo_unitario?: number | null
          data_movimentacao?: string
          data_validade?: string | null
          deposito_id?: string | null
          fazenda_id?: string | null
          id?: string
          lote?: string | null
          lote_pecuario_id?: string | null
          origem?: string | null
          origem_destino?: string | null
          produto_id?: string | null
          quantidade: number
          responsavel?: string | null
          saldo_fifo?: number | null
          tenant_id?: string | null
          tipo?: string | null
          especie_id?: string | null
          aptidao_id?: string | null
        }
        Update: {
          animal_id?: string | null
          created_at?: string | null
          custo_unitario?: number | null
          data_movimentacao?: string
          data_validade?: string | null
          deposito_id?: string | null
          fazenda_id?: string | null
          id?: string
          lote?: string | null
          lote_pecuario_id?: string | null
          origem?: string | null
          origem_destino?: string | null
          produto_id?: string | null
          quantidade?: number
          responsavel?: string | null
          saldo_fifo?: number | null
          tenant_id?: string | null
          tipo?: string | null
          especie_id?: string | null
          aptidao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_deposito_id_fkey"
            columns: ["deposito_id"]
            isOneToOne: false
            referencedRelation: "depositos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_lote_pecuario_id_fkey"
            columns: ["lote_pecuario_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      nota_fiscal_itens: {
        Row: {
          created_at: string | null
          deposito_id: string | null
          id: string
          ncm: string | null
          nota_fiscal_id: string
          preco_unitario: number
          produto_id: string | null
          quantidade: number
          tenant_id: string
          total: number
        }
        Insert: {
          created_at?: string | null
          deposito_id?: string | null
          id?: string
          ncm?: string | null
          nota_fiscal_id: string
          preco_unitario?: number
          produto_id?: string | null
          quantidade?: number
          tenant_id: string
          total?: number
        }
        Update: {
          created_at?: string | null
          deposito_id?: string | null
          id?: string
          ncm?: string | null
          nota_fiscal_id?: string
          preco_unitario?: number
          produto_id?: string | null
          quantidade?: number
          tenant_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "nota_fiscal_itens_deposito_id_fkey"
            columns: ["deposito_id"]
            isOneToOne: false
            referencedRelation: "depositos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nota_fiscal_itens_nota_fiscal_id_fkey"
            columns: ["nota_fiscal_id"]
            isOneToOne: false
            referencedRelation: "notas_fiscais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nota_fiscal_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nota_fiscal_itens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_entrada: {
        Row: {
          chave_xml: string | null
          cofins_retido: number | null
          created_at: string | null
          csll_retido: number | null
          data_emissao: string | null
          data_entrada: string | null
          fazenda_id: string | null
          fornecedor_id: string | null
          id: string
          inss_retido: number | null
          irrf_retido: number | null
          iss_retido: number | null
          modelo_fiscal: string | null
          numero_nota: string
          observacoes: string | null
          pis_retido: number | null
          serie: string | null
          tenant_id: string | null
          valor_liquido: number | null
          valor_total: number | null
        }
        Insert: {
          chave_xml?: string | null
          cofins_retido?: number | null
          created_at?: string | null
          csll_retido?: number | null
          data_emissao?: string | null
          data_entrada?: string | null
          fazenda_id?: string | null
          fornecedor_id?: string | null
          id?: string
          inss_retido?: number | null
          irrf_retido?: number | null
          iss_retido?: number | null
          modelo_fiscal?: string | null
          numero_nota: string
          observacoes?: string | null
          pis_retido?: number | null
          serie?: string | null
          tenant_id?: string | null
          valor_liquido?: number | null
          valor_total?: number | null
        }
        Update: {
          chave_xml?: string | null
          cofins_retido?: number | null
          created_at?: string | null
          csll_retido?: number | null
          data_emissao?: string | null
          data_entrada?: string | null
          fazenda_id?: string | null
          fornecedor_id?: string | null
          id?: string
          inss_retido?: number | null
          irrf_retido?: number | null
          iss_retido?: number | null
          modelo_fiscal?: string | null
          numero_nota?: string
          observacoes?: string | null
          pis_retido?: number | null
          serie?: string | null
          tenant_id?: string | null
          valor_liquido?: number | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_entrada_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "parceiros"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_fiscais: {
        Row: {
          chave_acesso: string | null
          company_id: string | null
          created_at: string | null
          data_emissao: string | null
          data_entrada: string | null
          id: string
          numero_nota: string | null
          parceiro_id: string | null
          serie: string | null
          status: string | null
          tenant_id: string
          tipo: string
          updated_at: string | null
          valor_total: number | null
          xml_raw: string | null
        }
        Insert: {
          chave_acesso?: string | null
          company_id?: string | null
          created_at?: string | null
          data_emissao?: string | null
          data_entrada?: string | null
          id?: string
          numero_nota?: string | null
          parceiro_id?: string | null
          serie?: string | null
          status?: string | null
          tenant_id: string
          tipo: string
          updated_at?: string | null
          valor_total?: number | null
          xml_raw?: string | null
        }
        Update: {
          chave_acesso?: string | null
          company_id?: string | null
          created_at?: string | null
          data_emissao?: string | null
          data_entrada?: string | null
          id?: string
          numero_nota?: string | null
          parceiro_id?: string | null
          serie?: string | null
          status?: string | null
          tenant_id?: string
          tipo?: string
          updated_at?: string | null
          valor_total?: number | null
          xml_raw?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_fiscais_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_fiscais_parceiro_id_fkey"
            columns: ["parceiro_id"]
            isOneToOne: false
            referencedRelation: "parceiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_fiscais_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_saida: {
        Row: {
          cliente_id: string | null
          cofins_retido: number | null
          created_at: string | null
          csll_retido: number | null
          data_emissao: string | null
          fazenda_id: string | null
          id: string
          inss_retido: number | null
          irrf_retido: number | null
          iss_retido: number | null
          modelo_fiscal: string | null
          natureza_operacao: string | null
          numero_nota: string
          observacoes: string | null
          pis_retido: number | null
          serie: string | null
          status: string | null
          tenant_id: string | null
          transportadora: string | null
          valor_liquido: number | null
          valor_total: number | null
        }
        Insert: {
          cliente_id?: string | null
          cofins_retido?: number | null
          created_at?: string | null
          csll_retido?: number | null
          data_emissao?: string | null
          fazenda_id?: string | null
          id?: string
          inss_retido?: number | null
          irrf_retido?: number | null
          iss_retido?: number | null
          modelo_fiscal?: string | null
          natureza_operacao?: string | null
          numero_nota: string
          observacoes?: string | null
          pis_retido?: number | null
          serie?: string | null
          status?: string | null
          tenant_id?: string | null
          transportadora?: string | null
          valor_liquido?: number | null
          valor_total?: number | null
        }
        Update: {
          cliente_id?: string | null
          cofins_retido?: number | null
          created_at?: string | null
          csll_retido?: number | null
          data_emissao?: string | null
          fazenda_id?: string | null
          id?: string
          inss_retido?: number | null
          irrf_retido?: number | null
          iss_retido?: number | null
          modelo_fiscal?: string | null
          natureza_operacao?: string | null
          numero_nota?: string
          observacoes?: string | null
          pis_retido?: number | null
          serie?: string | null
          status?: string | null
          tenant_id?: string | null
          transportadora?: string | null
          valor_liquido?: number | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_saida_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "parceiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_saida_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_saida_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      nutricao_animais: {
        Row: {
          animal_id: string | null
          created_at: string | null
          data_consumo: string | null
          dieta_id: string | null
          fase: string | null
          fazenda_id: string | null
          id: string
          lote_id: string | null
          quantidade_kg: number | null
          tenant_id: string | null
          trato_id: string | null
          valor_total_consumido: number | null
          valor_unitario_kg: number | null
          especie_id: string | null
          aptidao_id: string | null
        }
        Insert: {
          animal_id?: string | null
          created_at?: string | null
          data_consumo?: string | null
          dieta_id?: string | null
          fase?: string | null
          fazenda_id?: string | null
          id?: string
          lote_id?: string | null
          quantidade_kg?: number | null
          tenant_id?: string | null
          trato_id?: string | null
          valor_total_consumido?: number | null
          valor_unitario_kg?: number | null
          especie_id?: string | null
          aptidao_id?: string | null
        }
        Update: {
          animal_id?: string | null
          created_at?: string | null
          data_consumo?: string | null
          dieta_id?: string | null
          fase?: string | null
          fazenda_id?: string | null
          id?: string
          lote_id?: string | null
          quantidade_kg?: number | null
          tenant_id?: string | null
          trato_id?: string | null
          valor_total_consumido?: number | null
          valor_unitario_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nutricao_animais_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutricao_animais_dieta_id_fkey"
            columns: ["dieta_id"]
            isOneToOne: false
            referencedRelation: "dietas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutricao_animais_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutricao_animais_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutricao_animais_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      parceiros: {
        Row: {
          bairro: string | null
          categoria_id: string | null
          cep: string | null
          cidade: string | null
          cnpj_cpf: string | null
          complemento: string | null
          contato: string | null
          created_at: string | null
          email: string | null
          estado: string | null
          fantasia: string | null
          fazendas_vinculadas: string[] | null
          id: string
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          is_customer: boolean | null
          is_global: boolean | null
          is_supplier: boolean | null
          logradouro: string | null
          nome: string
          numero: string | null
          pais: string | null
          status: string | null
          telefone: string | null
          tenant_id: string | null
          tipo_logradouro: string | null
          updated_at: string | null
        }
        Insert: {
          bairro?: string | null
          categoria_id?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj_cpf?: string | null
          complemento?: string | null
          contato?: string | null
          created_at?: string | null
          email?: string | null
          estado?: string | null
          fantasia?: string | null
          fazendas_vinculadas?: string[] | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          is_customer?: boolean | null
          is_global?: boolean | null
          is_supplier?: boolean | null
          logradouro?: string | null
          nome: string
          numero?: string | null
          pais?: string | null
          status?: string | null
          telefone?: string | null
          tenant_id?: string | null
          tipo_logradouro?: string | null
          updated_at?: string | null
        }
        Update: {
          bairro?: string | null
          categoria_id?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj_cpf?: string | null
          complemento?: string | null
          contato?: string | null
          created_at?: string | null
          email?: string | null
          estado?: string | null
          fantasia?: string | null
          fazendas_vinculadas?: string[] | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          is_customer?: boolean | null
          is_global?: boolean | null
          is_supplier?: boolean | null
          logradouro?: string | null
          nome?: string
          numero?: string | null
          pais?: string | null
          status?: string | null
          telefone?: string | null
          tenant_id?: string | null
          tipo_logradouro?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parceiros_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parceiros_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pastos: {
        Row: {
          agua: string | null
          area: number | null
          capacidade_ua: number | null
          created_at: string | null
          data_ultima_fertilizacao: string | null
          estado_cerca: string | null
          fazenda_id: string | null
          id: string
          nome: string
          observacoes: string | null
          plantas_daninhas: string | null
          sombreamento: string | null
          status: string | null
          tenant_id: string | null
          tipo_capim: string | null
          tipo_solo: string | null
          topografia: string | null
          especie_id: string | null
          aptidao_id: string | null
        }
        Insert: {
          agua?: string | null
          area?: number | null
          capacidade_ua?: number | null
          created_at?: string | null
          data_ultima_fertilizacao?: string | null
          estado_cerca?: string | null
          fazenda_id?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          plantas_daninhas?: string | null
          sombreamento?: string | null
          status?: string | null
          tenant_id?: string | null
          tipo_capim?: string | null
          tipo_solo?: string | null
          topografia?: string | null
          especie_id?: string | null
          aptidao_id?: string | null
        }
        Update: {
          agua?: string | null
          area?: number | null
          capacidade_ua?: number | null
          created_at?: string | null
          data_ultima_fertilizacao?: string | null
          estado_cerca?: string | null
          fazenda_id?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          plantas_daninhas?: string | null
          sombreamento?: string | null
          status?: string | null
          tenant_id?: string | null
          tipo_capim?: string | null
          tipo_solo?: string | null
          topografia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pastos_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pastos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_compra: {
        Row: {
          created_at: string | null
          data_pedido: string
          fazenda_id: string | null
          forma_pagamento: string | null
          fornecedor_id: string | null
          id: string
          numero_pedido: string
          observacoes: string | null
          previsao_entrega: string | null
          status: string | null
          tenant_id: string | null
          valor_total: number | null
        }
        Insert: {
          created_at?: string | null
          data_pedido?: string
          fazenda_id?: string | null
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          id?: string
          numero_pedido: string
          observacoes?: string | null
          previsao_entrega?: string | null
          status?: string | null
          tenant_id?: string | null
          valor_total?: number | null
        }
        Update: {
          created_at?: string | null
          data_pedido?: string
          fazenda_id?: string | null
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          id?: string
          numero_pedido?: string
          observacoes?: string | null
          previsao_entrega?: string | null
          status?: string | null
          tenant_id?: string | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_pedidos_compra_fornecedor"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "parceiros"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_venda: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          data_pedido: string
          fazenda_id: string | null
          id: string
          numero_pedido: string
          produto_id: string | null
          quantidade: number | null
          status: string | null
          tenant_id: string | null
          unidade: string | null
          valor_total: number | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          data_pedido?: string
          fazenda_id?: string | null
          id?: string
          numero_pedido: string
          produto_id?: string | null
          quantidade?: number | null
          status?: string | null
          tenant_id?: string | null
          unidade?: string | null
          valor_total?: number | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          data_pedido?: string
          fazenda_id?: string | null
          id?: string
          numero_pedido?: string
          produto_id?: string | null
          quantidade?: number | null
          status?: string | null
          tenant_id?: string | null
          unidade?: string | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_venda_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "parceiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_venda_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_venda_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis_usuario: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          permissoes: Json | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          permissoes?: Json | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          permissoes?: Json | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perfis_usuario_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      periodos_contabeis: {
        Row: {
          ano: number
          created_at: string | null
          data_bloqueio_automatico: string | null
          fazenda_id: string | null
          fechado_em: string | null
          fechado_por: string | null
          id: string
          mes: number
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          data_bloqueio_automatico?: string | null
          fazenda_id?: string | null
          fechado_em?: string | null
          fechado_por?: string | null
          id?: string
          mes: number
          status: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          data_bloqueio_automatico?: string | null
          fazenda_id?: string | null
          fechado_em?: string | null
          fechado_por?: string | null
          id?: string
          mes?: number
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "periodos_contabeis_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "periodos_contabeis_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pesagens: {
        Row: {
          animal_id: string | null
          created_at: string | null
          custo: number | null
          data_pesagem: string
          fazenda_id: string | null
          id: string
          observacao: string | null
          peso: number
          tenant_id: string | null
          especie_id: string | null
          aptidao_id: string | null
        }
        Insert: {
          animal_id?: string | null
          created_at?: string | null
          custo?: number | null
          data_pesagem?: string
          fazenda_id?: string | null
          id?: string
          observacao?: string | null
          peso: number
          tenant_id?: string | null
          especie_id?: string | null
          aptidao_id?: string | null
        }
        Update: {
          animal_id?: string | null
          created_at?: string | null
          custo?: number | null
          data_pesagem?: string
          fazenda_id?: string | null
          id?: string
          observacao?: string | null
          peso?: number
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pesagens_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pesagens_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pesagens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      produto_embalagens: {
        Row: {
          created_at: string | null
          descricao: string
          fator: number
          fazenda_id: string | null
          id: string
          produto_id: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          descricao: string
          fator: number
          fazenda_id?: string | null
          id?: string
          produto_id: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string
          fator?: number
          fazenda_id?: string | null
          id?: string
          produto_id?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produto_embalagens_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produto_embalagens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produto_embalagens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      produto_fornecedor_de_para: {
        Row: {
          created_at: string
          id: string
          internal_product_id: string
          match_count: number
          supplier_id: string | null
          supplier_product_code: string | null
          supplier_product_name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          internal_product_id: string
          match_count?: number
          supplier_id?: string | null
          supplier_product_code?: string | null
          supplier_product_name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          internal_product_id?: string
          match_count?: number
          supplier_id?: string | null
          supplier_product_code?: string | null
          supplier_product_name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produto_fornecedor_de_para_internal_product_id_fkey"
            columns: ["internal_product_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produto_fornecedor_de_para_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "parceiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produto_fornecedor_de_para_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          carencia_dias: number | null
          categoria_id: string | null
          cnae_associado: string | null
          codigo_servico_lc116: string | null
          codigo_tributacao_nacional: string | null
          created_at: string | null
          deleted_at: string | null
          custo_medio: number | null
          custo_padrao: number | null
          custo_ultima_compra: number | null
          descricao: string | null
          ean: string | null
          estoque_atual: number | null
          estoque_minimo: number | null
          fazenda_id: string | null
          id: string
          is_active: boolean | null
          is_purchasable: boolean | null
          is_sellable: boolean | null
          is_storable: boolean | null
          localizacao: string | null
          marca: string | null
          ncm: string | null
          nome: string
          preco_custo: number | null
          subcategoria_id: string | null
          tenant_id: string | null
          tipo: string | null
          unidade: string | null
          unidade_medida: string | null
        }
        Insert: {
          carencia_dias?: number | null
          categoria_id?: string | null
          cnae_associado?: string | null
          codigo_servico_lc116?: string | null
          codigo_tributacao_nacional?: string | null
          created_at?: string | null
          custo_medio?: number | null
          custo_padrao?: number | null
          custo_ultima_compra?: number | null
          descricao?: string | null
          ean?: string | null
          estoque_atual?: number | null
          estoque_minimo?: number | null
          fazenda_id?: string | null
          id?: string
          is_active?: boolean | null
          is_purchasable?: boolean | null
          is_sellable?: boolean | null
          is_storable?: boolean | null
          localizacao?: string | null
          marca?: string | null
          ncm?: string | null
          nome: string
          preco_custo?: number | null
          subcategoria_id?: string | null
          tenant_id?: string | null
          tipo?: string | null
          unidade?: string | null
          unidade_medida?: string | null
        }
        Update: {
          carencia_dias?: number | null
          categoria_id?: string | null
          cnae_associado?: string | null
          codigo_servico_lc116?: string | null
          codigo_tributacao_nacional?: string | null
          created_at?: string | null
          custo_medio?: number | null
          custo_padrao?: number | null
          custo_ultima_compra?: number | null
          descricao?: string | null
          ean?: string | null
          estoque_atual?: number | null
          estoque_minimo?: number | null
          fazenda_id?: string | null
          id?: string
          is_active?: boolean | null
          is_purchasable?: boolean | null
          is_sellable?: boolean | null
          is_storable?: boolean | null
          localizacao?: string | null
          marca?: string | null
          ncm?: string | null
          nome?: string
          preco_custo?: number | null
          subcategoria_id?: string | null
          tenant_id?: string | null
          tipo?: string | null
          unidade?: string | null
          unidade_medida?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_subcategoria_id_fkey"
            columns: ["subcategoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          perfil_id: string | null
          role: string | null
          settings: Json | null
          tenant_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          perfil_id?: string | null
          role?: string | null
          settings?: Json | null
          tenant_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          perfil_id?: string | null
          role?: string | null
          settings?: Json | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis_usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      protocolos: {
        Row: {
          categoria: string
          created_at: string | null
          fazenda_id: string | null
          id: string
          nome: string
          passos: Json
          status: string | null
          tenant_id: string | null
        }
        Insert: {
          categoria: string
          created_at?: string | null
          fazenda_id?: string | null
          id?: string
          nome: string
          passos?: Json
          status?: string | null
          tenant_id?: string | null
        }
        Update: {
          categoria?: string
          created_at?: string | null
          fazenda_id?: string | null
          id?: string
          nome?: string
          passos?: Json
          status?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "protocolos_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
        ]
      }
      record_locks: {
        Row: {
          expires_at: string | null
          id: string
          locked_at: string | null
          record_id: string | null
          table_name: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          expires_at?: string | null
          id?: string
          locked_at?: string | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          expires_at?: string | null
          id?: string
          locked_at?: string | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      reforma_etapas: {
        Row: {
          created_at: string | null
          created_by: string | null
          custo_etapa: number | null
          custo_hora: number | null
          data_registro: string
          horas_trabalhadas: number | null
          id: string
          itens_consumidos: Json | null
          maquina_id: string | null
          observacoes: string | null
          reforma_id: string
          tenant_id: string
          tipo_etapa: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          custo_etapa?: number | null
          custo_hora?: number | null
          data_registro: string
          horas_trabalhadas?: number | null
          id?: string
          itens_consumidos?: Json | null
          maquina_id?: string | null
          observacoes?: string | null
          reforma_id: string
          tenant_id: string
          tipo_etapa: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          custo_etapa?: number | null
          custo_hora?: number | null
          data_registro?: string
          horas_trabalhadas?: number | null
          id?: string
          itens_consumidos?: Json | null
          maquina_id?: string | null
          observacoes?: string | null
          reforma_id?: string
          tenant_id?: string
          tipo_etapa?: string
        }
        Relationships: [
          {
            foreignKeyName: "reforma_etapas_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reforma_etapas_reforma_id_fkey"
            columns: ["reforma_id"]
            isOneToOne: false
            referencedRelation: "reformas_pasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reforma_etapas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reformas_pasto: {
        Row: {
          analise_ca_cmolc: number | null
          analise_p_mgdm3: number | null
          analise_v_percent: number | null
          created_at: string | null
          created_by: string | null
          custo_insumos: number | null
          custo_maquinario: number | null
          custo_total: number | null
          data_fim: string | null
          data_inicio: string
          fazenda_id: string
          foto_antes_url: string | null
          foto_depois_url: string | null
          id: string
          objetivo: string | null
          observacoes: string | null
          pasto_id: string
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          analise_ca_cmolc?: number | null
          analise_p_mgdm3?: number | null
          analise_v_percent?: number | null
          created_at?: string | null
          created_by?: string | null
          custo_insumos?: number | null
          custo_maquinario?: number | null
          custo_total?: number | null
          data_fim?: string | null
          data_inicio: string
          fazenda_id: string
          foto_antes_url?: string | null
          foto_depois_url?: string | null
          id?: string
          objetivo?: string | null
          observacoes?: string | null
          pasto_id: string
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          analise_ca_cmolc?: number | null
          analise_p_mgdm3?: number | null
          analise_v_percent?: number | null
          created_at?: string | null
          created_by?: string | null
          custo_insumos?: number | null
          custo_maquinario?: number | null
          custo_total?: number | null
          data_fim?: string | null
          data_inicio?: string
          fazenda_id?: string
          foto_antes_url?: string | null
          foto_depois_url?: string | null
          id?: string
          objetivo?: string | null
          observacoes?: string | null
          pasto_id?: string
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reformas_pasto_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reformas_pasto_pasto_id_fkey"
            columns: ["pasto_id"]
            isOneToOne: false
            referencedRelation: "pastos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reformas_pasto_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      romaneios: {
        Row: {
          animais_qtd: number
          codigo: string
          comprador: string
          comprador_cnpj: string | null
          composicao_carga: Json | null
          data_chegada: string | null
          created_at: string | null
          data: string
          destino: string
          fazenda_id: string
          gta_numero: string | null
          gta_serie: string | null
          id: string
          motorista: string | null
          nfe: string | null
          observacoes: string | null
          placa: string | null
          status: string
          tenant_id: string
          tipo_destino: string | null
          tipo_veiculo: string | null
          updated_at: string | null
          preco_por_arroba: number | null
          valor_estimado: number
          especie_id: string | null
          aptidao_id: string | null
        }
        Insert: {
          animais_qtd?: number
          codigo?: string
          comprador: string
          comprador_cnpj?: string | null
          composicao_carga?: Json | null
          data_chegada?: string | null
          created_at?: string | null
          data?: string
          destino: string
          fazenda_id: string
          gta_numero?: string | null
          gta_serie?: string | null
          id?: string
          motorista?: string | null
          nfe?: string | null
          observacoes?: string | null
          placa?: string | null
          status?: string
          tenant_id: string
          tipo_destino?: string | null
          tipo_veiculo?: string | null
          updated_at?: string | null
          preco_por_arroba?: number | null
          valor_estimado?: number
          especie_id?: string | null
          aptidao_id?: string | null
        }
        Update: {
          animais_qtd?: number
          codigo?: string
          comprador?: string
          comprador_cnpj?: string | null
          composicao_carga?: Json | null
          data_chegada?: string | null
          created_at?: string | null
          data?: string
          destino?: string
          fazenda_id?: string
          gta_numero?: string | null
          gta_serie?: string | null
          id?: string
          motorista?: string | null
          nfe?: string | null
          observacoes?: string | null
          placa?: string | null
          status?: string
          tenant_id?: string
          tipo_destino?: string | null
          tipo_veiculo?: string | null
          updated_at?: string | null
          preco_por_arroba?: number | null
          valor_estimado?: number
        }
        Relationships: [
          {
            foreignKeyName: "romaneios_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "romaneios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_audit_logs: {
        Row: {
          action_type: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          target_tenant_id: string | null
        }
        Insert: {
          action_type: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_tenant_id?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saas_audit_logs_target_tenant_id_fkey"
            columns: ["target_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_campaigns: {
        Row: {
          created_at: string
          discount_percentage: number
          end_date: string
          id: string
          is_active: boolean | null
          name: string
          start_date: string
          target_plan_ids: string[] | null
        }
        Insert: {
          created_at?: string
          discount_percentage: number
          end_date: string
          id?: string
          is_active?: boolean | null
          name: string
          start_date: string
          target_plan_ids?: string[] | null
        }
        Update: {
          created_at?: string
          discount_percentage?: number
          end_date?: string
          id?: string
          is_active?: boolean | null
          name?: string
          start_date?: string
          target_plan_ids?: string[] | null
        }
        Relationships: []
      }
      saas_gateway_settings: {
        Row: {
          api_key: string | null
          encryption_key: string | null
          environment: string | null
          gateway_name: string
          id: string
          is_active: boolean | null
          secret_key: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          api_key?: string | null
          encryption_key?: string | null
          environment?: string | null
          gateway_name: string
          id?: string
          is_active?: boolean | null
          secret_key?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          api_key?: string | null
          encryption_key?: string | null
          environment?: string | null
          gateway_name?: string
          id?: string
          is_active?: boolean | null
          secret_key?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      saas_invoices: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string
          id: string
          paid_at: string | null
          payment_link: string | null
          plan_name: string
          status: string
          tenant_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_date: string
          id?: string
          paid_at?: string | null
          payment_link?: string | null
          plan_name: string
          status: string
          tenant_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string
          id?: string
          paid_at?: string | null
          payment_link?: string | null
          plan_name?: string
          status?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saas_invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_plans: {
        Row: {
          created_at: string | null
          features: string[] | null
          id: string
          name: string
          price: number
          storage_gb: number
          users_limit: number
        }
        Insert: {
          created_at?: string | null
          features?: string[] | null
          id?: string
          name: string
          price: number
          storage_gb: number
          users_limit: number
        }
        Update: {
          created_at?: string | null
          features?: string[] | null
          id?: string
          name?: string
          price?: number
          storage_gb?: number
          users_limit?: number
        }
        Relationships: []
      }
      saldos_estoque: {
        Row: {
          created_at: string | null
          custo_medio: number
          deposito_id: string
          fazenda_id: string | null
          id: string
          produto_id: string
          quantidade: number
          tenant_id: string
          updated_at: string | null
          valor_total: number
        }
        Insert: {
          created_at?: string | null
          custo_medio?: number
          deposito_id: string
          fazenda_id?: string | null
          id?: string
          produto_id: string
          quantidade?: number
          tenant_id: string
          updated_at?: string | null
          valor_total?: number
        }
        Update: {
          created_at?: string | null
          custo_medio?: number
          deposito_id?: string
          fazenda_id?: string | null
          id?: string
          produto_id?: string
          quantidade?: number
          tenant_id?: string
          updated_at?: string | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "saldos_estoque_deposito_id_fkey"
            columns: ["deposito_id"]
            isOneToOne: false
            referencedRelation: "depositos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saldos_estoque_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saldos_estoque_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saldos_estoque_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sanidade: {
        Row: {
          animal_id: string | null
          carencia_dias: number | null
          created_at: string | null
          custo: number | null
          data_manejo: string
          dose: string | null
          fazenda_id: string | null
          id: string
          local_aplicacao: string | null
          lote_id: string | null
          observacao: string | null
          produto: string | null
          status: string | null
          tenant_id: string | null
          tipo: string | null
          titulo: string | null
          via_aplicacao: string | null
        }
        Insert: {
          animal_id?: string | null
          carencia_dias?: number | null
          created_at?: string | null
          custo?: number | null
          data_manejo?: string
          dose?: string | null
          fazenda_id?: string | null
          id?: string
          local_aplicacao?: string | null
          lote_id?: string | null
          observacao?: string | null
          produto?: string | null
          status?: string | null
          tenant_id?: string | null
          tipo?: string | null
          titulo?: string | null
          via_aplicacao?: string | null
        }
        Update: {
          animal_id?: string | null
          carencia_dias?: number | null
          created_at?: string | null
          custo?: number | null
          data_manejo?: string
          dose?: string | null
          fazenda_id?: string | null
          id?: string
          local_aplicacao?: string | null
          lote_id?: string | null
          observacao?: string | null
          produto?: string | null
          status?: string | null
          tenant_id?: string | null
          tipo?: string | null
          titulo?: string | null
          via_aplicacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sanidade_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sanidade_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sanidade_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sanidade_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sanidade_animais: {
        Row: {
          animal_id: string | null
          created_at: string | null
          data_aplicacao: string | null
          fase: string | null
          fazenda_id: string | null
          id: string
          produto_id: string | null
          quantidade_dose: number | null
          sanidade_id: string | null
          tenant_id: string | null
          valor_total_aplicado: number | null
          valor_unitario_aplicado: number | null
          especie_id: string | null
          aptidao_id: string | null
        }
        Insert: {
          animal_id?: string | null
          created_at?: string | null
          data_aplicacao?: string | null
          fase?: string | null
          fazenda_id?: string | null
          id?: string
          produto_id?: string | null
          quantidade_dose?: number | null
          sanidade_id?: string | null
          tenant_id?: string | null
          valor_total_aplicado?: number | null
          valor_unitario_aplicado?: number | null
          especie_id?: string | null
          aptidao_id?: string | null
        }
        Update: {
          animal_id?: string | null
          created_at?: string | null
          data_aplicacao?: string | null
          fase?: string | null
          fazenda_id?: string | null
          id?: string
          produto_id?: string | null
          quantidade_dose?: number | null
          sanidade_id?: string | null
          tenant_id?: string | null
          valor_total_aplicado?: number | null
          valor_unitario_aplicado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sanidade_animais_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sanidade_animais_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sanidade_animais_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sanidade_animais_sanidade_id_fkey"
            columns: ["sanidade_id"]
            isOneToOne: false
            referencedRelation: "sanidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sanidade_animais_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes_compra: {
        Row: {
          created_at: string | null
          departamento: string | null
          descricao: string | null
          fazenda_id: string | null
          id: string
          prioridade: string | null
          solicitante: string | null
          status: string | null
          tenant_id: string | null
          titulo: string
          valor_estimado: number | null
        }
        Insert: {
          created_at?: string | null
          departamento?: string | null
          descricao?: string | null
          fazenda_id?: string | null
          id?: string
          prioridade?: string | null
          solicitante?: string | null
          status?: string | null
          tenant_id?: string | null
          titulo: string
          valor_estimado?: number | null
        }
        Update: {
          created_at?: string | null
          departamento?: string | null
          descricao?: string | null
          fazenda_id?: string | null
          id?: string
          prioridade?: string | null
          solicitante?: string | null
          status?: string | null
          tenant_id?: string | null
          titulo?: string
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_compra_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_compra_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          document: string | null
          email: string | null
          id: string
          is_demo: boolean | null
          is_template: boolean | null
          nome: string
          plano: string | null
          settings: Json | null
          status: string | null
          type: Database["public"]["Enums"]["tenantsType"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          is_demo?: boolean | null
          is_template?: boolean | null
          nome: string
          plano?: string | null
          settings?: Json | null
          status?: string | null
          type?: Database["public"]["Enums"]["tenantsType"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          is_demo?: boolean | null
          is_template?: boolean | null
          nome?: string
          plano?: string | null
          settings?: Json | null
          status?: string | null
          type?: Database["public"]["Enums"]["tenantsType"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      unidades: {
        Row: {
          ativo: boolean | null
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          complemento: string | null
          contador_cpf: string | null
          contador_crc: string | null
          contador_nome: string | null
          created_at: string | null
          documento: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          logradouro: string | null
          nome: string
          numero: string | null
          pais: string | null
          razao_social: string | null
          socio_cpf: string | null
          socio_ind_sit_esp: number | null
          socio_nome: string | null
          telefone: string | null
          tenant_id: string | null
          tipo: string | null
          tipo_documento: string | null
          tipo_logradouro: string | null
        }
        Insert: {
          ativo?: boolean | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          contador_cpf?: string | null
          contador_crc?: string | null
          contador_nome?: string | null
          created_at?: string | null
          documento?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          logradouro?: string | null
          nome: string
          numero?: string | null
          pais?: string | null
          razao_social?: string | null
          socio_cpf?: string | null
          socio_ind_sit_esp?: number | null
          socio_nome?: string | null
          telefone?: string | null
          tenant_id?: string | null
          tipo?: string | null
          tipo_documento?: string | null
          tipo_logradouro?: string | null
        }
        Update: {
          ativo?: boolean | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          contador_cpf?: string | null
          contador_crc?: string | null
          contador_nome?: string | null
          created_at?: string | null
          documento?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          logradouro?: string | null
          nome?: string
          numero?: string | null
          pais?: string | null
          razao_social?: string | null
          socio_cpf?: string | null
          socio_ind_sit_esp?: number | null
          socio_nome?: string | null
          telefone?: string | null
          tenant_id?: string | null
          tipo?: string | null
          tipo_documento?: string | null
          tipo_logradouro?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unidades_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_drafts: {
        Row: {
          draft_key: string
          id: string
          payload: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          draft_key: string
          id?: string
          payload?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          draft_key?: string
          id?: string
          payload?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_views: {
        Row: {
          created_at: string | null
          filters: Json
          id: string
          name: string
          page_identifier: string
          tenant_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          filters?: Json
          id?: string
          name: string
          page_identifier: string
          tenant_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          filters?: Json
          id?: string
          name?: string
          page_identifier?: string
          tenant_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_views_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_view: {
        Row: {
          base_role: string | null
          created_at: string | null
          email: string | null
          id: string | null
          name: string | null
          perfil_id: string | null
          profile_name: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis_usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_estoque_deposito_saldo: {
        Row: {
          deposito_id: string | null
          fazenda_id: string | null
          produto_id: string | null
          saldo: number | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_deposito_id_fkey"
            columns: ["deposito_id"]
            isOneToOne: false
            referencedRelation: "depositos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_cash_flow_summary: {
        Args: { p_fazenda_id?: string; p_tenant_id: string }
        Returns: Json
      }
      calculate_ebitda: {
        Args: { p_fazenda_id?: string; p_tenant_id: string }
        Returns: number
      }
      calculate_fleet_consumption: {
        Args: { p_fazenda_id?: string; p_tenant_id: string }
        Returns: Json
      }
      calculate_herd_gmd: {
        Args: { p_fazenda_id?: string; p_tenant_id: string }
        Returns: number
      }
      check_deposito_compatibilidade: {
        Args: { p_deposito_id: string; p_produto_id: string }
        Returns: boolean
      }
      clone_tenant_from_template:
        | { Args: { p_new_tenant_id: string }; Returns: undefined }
        | {
            Args: {
              p_documento: string
              p_is_demo?: boolean
              p_new_tenant_id: string
              p_nome: string
            }
            Returns: undefined
          }
      delete_demo_tenant: {
        Args: { target_tenant_id: string }
        Returns: undefined
      }
      get_animal_stats: {
        Args: { p_fazenda_id?: string; p_tenant_id: string }
        Returns: Json
      }
      get_auth_tenant: { Args: never; Returns: string }
      get_banking_consolidated_balance: {
        Args: { p_fazenda_id?: string; p_tenant_id: string }
        Returns: Json
      }
      get_certificados_digitais: {
        Args: { p_tenant_id: string }
        Returns: {
          cnpj_cpf: string
          company_id: string
          created_at: string
          data_vencimento: string
          id: string
          pfx_base64: string
          senha: string
          tenant_id: string
          titular: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "certificados_digitais"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_default_tenant: { Args: never; Returns: string }
      get_esg_carbon_balance: {
        Args: { p_fazenda_id?: string; p_tenant_id: string }
        Returns: Json
      }
      get_finance_summary:
        | {
            Args: {
              p_fazenda_id?: string
              p_table_name: string
              p_tenant_id: string
            }
            Returns: {
              record_count: number
              status: string
              total_value: number
            }[]
          }
        | {
            Args: { p_fazenda_id?: string; p_tenant_id: string }
            Returns: Json
          }
      get_herd_total_weight: {
        Args: { p_fazenda_id?: string; p_tenant_id: string }
        Returns: number
      }
      get_ia_monte_carlo_projection: {
        Args: { p_fazenda_id?: string; p_tenant_id: string }
        Returns: Json
      }
      get_inventory_health: {
        Args: { p_fazenda_id?: string; p_tenant_id: string }
        Returns: Json
      }
      get_manutencao_stats: {
        Args: { p_fazenda_id?: string; p_tenant_id: string }
        Returns: Json
      }
      get_my_tenant_id: { Args: never; Returns: string }
      get_paddock_lotation_summary: {
        Args: { p_fazenda_id?: string; p_tenant_id: string }
        Returns: Json
      }
      get_paddock_support_capacity: {
        Args: { p_fazenda_id?: string; p_tenant_id: string }
        Returns: Json
      }
      get_purchase_summary: {
        Args: { p_fazenda_id?: string; p_tenant_id: string }
        Returns: Json
      }
      get_reproductive_stats: {
        Args: { p_fazenda_id?: string; p_tenant_id: string }
        Returns: Json
      }
      get_sales_performance: {
        Args: { p_fazenda_id?: string; p_tenant_id: string }
        Returns: Json
      }
      get_sanitary_coverage: {
        Args: { p_fazenda_id?: string; p_tenant_id: string }
        Returns: Json
      }
      is_admin_check: { Args: never; Returns: boolean }
      process_fifo_movement: {
        Args: {
          p_deposito_id: string
          p_fazenda_id: string
          p_origem_destino: string
          p_produto_id: string
          p_quantidade: number
          p_responsavel: string
          p_tenant_id: string
          p_tipo: string
          p_valor_unitario: number
        }
        Returns: undefined
      }
      processar_entrada_nfe: { Args: { payload: Json }; Returns: string }
      rebuild_kardex_fn: {
        Args: {
          p_deposito_id: string
          p_produto_id: string
          p_tenant_id: string
        }
        Returns: undefined
      }
      recalcular_custos_animal: {
        Args: {
          p_data_inicio: string
          p_novo_custo_medio: number
          p_produto_id: string
        }
        Returns: undefined
      }
      recalcular_sanidade_animais_batch: {
        Args: { p_tenant_id?: string }
        Returns: Json
      }
      upsert_certificado_digital: {
        Args: {
          p_cnpj_cpf: string
          p_company_id: string
          p_data_vencimento: string
          p_existing_id?: string
          p_pfx_base64: string
          p_senha: string
          p_tenant_id: string
          p_titular: string
        }
        Returns: string
      }
    }
    Enums: {
      tenantsType: "CPF" | "CNPJ"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      tenantsType: ["CPF", "CNPJ"],
    },
  },
} as const
