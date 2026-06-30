-- Migração: Fleet Enterprise Phase 2
-- Data: 2026-07-06

-- 1. Adicionar novas colunas para telemetria precisa
ALTER TABLE public.abastecimentos
ADD COLUMN IF NOT EXISTS tanque_cheio BOOLEAN DEFAULT false;

ALTER TABLE public.maquinas
ADD COLUMN IF NOT EXISTS ultimo_medidor_revisao NUMERIC DEFAULT 0;

-- 2. Gatilho para atualizar o hodômetro/horímetro da máquina ao abastecer
CREATE OR REPLACE FUNCTION public.update_machine_meter_on_fueling()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.valor_medidor IS NOT NULL THEN
        UPDATE public.maquinas
        SET 
            -- Atualiza quilometragem se for caminhão/picape, ou horímetro se for trator/implemento
            quilometragem_atual = CASE 
                WHEN tipo_medidor = 'Odômetro' AND NEW.valor_medidor > COALESCE(quilometragem_atual, 0) THEN NEW.valor_medidor 
                ELSE quilometragem_atual 
            END,
            horimetro_atual = CASE 
                WHEN tipo_medidor = 'Horômetro' AND NEW.valor_medidor > COALESCE(horimetro_atual, 0) THEN NEW.valor_medidor 
                ELSE horimetro_atual 
            END
        WHERE id = NEW.maquina_id AND tenant_id = NEW.tenant_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tg_update_machine_meter_on_fueling ON public.abastecimentos;
CREATE TRIGGER tg_update_machine_meter_on_fueling
AFTER INSERT OR UPDATE OF valor_medidor ON public.abastecimentos
FOR EACH ROW
EXECUTE FUNCTION public.update_machine_meter_on_fueling();


-- 3. Gatilho para atualizar o status da máquina em manutenção
CREATE OR REPLACE FUNCTION public.update_machine_status_on_maintenance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.status != 'CONCLUIDO' AND NEW.status != 'FINALIZADO' AND NEW.status != 'completed' THEN
            -- Máquina entra em manutenção
            UPDATE public.maquinas SET status = 'maintenance' WHERE id = NEW.maquina_id AND tenant_id = NEW.tenant_id;
        ELSE
            -- Máquina volta a ficar ativa e atualiza a última revisão se for preventiva
            UPDATE public.maquinas 
            SET 
                status = 'active',
                ultimo_medidor_revisao = CASE 
                    WHEN LOWER(NEW.tipo_manutencao) = 'preventiva' OR LOWER(NEW.tipo) = 'preventiva' THEN 
                        CASE WHEN tipo_medidor = 'Odômetro' THEN COALESCE(quilometragem_atual, 0) ELSE COALESCE(horimetro_atual, 0) END
                    ELSE ultimo_medidor_revisao
                END
            WHERE id = NEW.maquina_id AND tenant_id = NEW.tenant_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        -- Se deletar a OS, volta para ativo (simplificação)
        UPDATE public.maquinas SET status = 'active' WHERE id = OLD.maquina_id AND tenant_id = OLD.tenant_id;
    END IF;
    
    RETURN NULL; -- AFTER trigger
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tg_update_machine_status_on_maintenance ON public.manutencao_frota;
CREATE TRIGGER tg_update_machine_status_on_maintenance
AFTER INSERT OR UPDATE OF status OR DELETE ON public.manutencao_frota
FOR EACH ROW
EXECUTE FUNCTION public.update_machine_status_on_maintenance();


-- 4. Função RPC para calcular KPIs do Dashboard de forma escalável
CREATE OR REPLACE FUNCTION public.calculate_fleet_kpis(p_tenant_id UUID, p_fazenda_id UUID DEFAULT NULL)
RETURNS jsonb AS $$
DECLARE
    v_total_machines INT;
    v_machines_in_maint INT;
    v_total_fuel_cost NUMERIC;
    v_total_maint_cost NUMERIC;
    v_depreciation NUMERIC;
    v_total_tco NUMERIC;
    v_availability NUMERIC;
    v_mtbf NUMERIC;
    v_corretivas INT;
    v_total_worked_hours NUMERIC;
BEGIN
    -- Base count
    SELECT COUNT(*) INTO v_total_machines
    FROM public.maquinas
    WHERE tenant_id = p_tenant_id AND (p_fazenda_id IS NULL OR fazenda_id = p_fazenda_id);

    IF v_total_machines = 0 THEN
        RETURN '{"availability": 0, "total_tco": 0, "mtbf": 0, "fuel_cost": 0, "maint_cost": 0, "total_machines": 0}'::jsonb;
    END IF;

    -- Em manutenção
    SELECT COUNT(*) INTO v_machines_in_maint
    FROM public.maquinas
    WHERE tenant_id = p_tenant_id AND (p_fazenda_id IS NULL OR fazenda_id = p_fazenda_id) AND status = 'maintenance';

    -- Availability simplificada: % de máquinas operacionais
    v_availability := ((v_total_machines - v_machines_in_maint)::NUMERIC / v_total_machines) * 100.0;

    -- TCO (Custo Combustível + Manutenção + Depreciação Mensal)
    SELECT COALESCE(SUM(valor_total), 0) INTO v_total_fuel_cost
    FROM public.abastecimentos
    WHERE tenant_id = p_tenant_id AND (p_fazenda_id IS NULL OR fazenda_id = p_fazenda_id);

    SELECT COALESCE(SUM(custo), 0) INTO v_total_maint_cost
    FROM public.manutencao_frota
    WHERE tenant_id = p_tenant_id AND (p_fazenda_id IS NULL OR fazenda_id = p_fazenda_id);

    SELECT COALESCE(SUM(valor_compra / GREATEST(vida_util_anos, 1) / 12), 0) INTO v_depreciation
    FROM public.maquinas
    WHERE tenant_id = p_tenant_id AND (p_fazenda_id IS NULL OR fazenda_id = p_fazenda_id);

    v_total_tco := v_total_fuel_cost + v_total_maint_cost + v_depreciation;

    -- MTBF
    SELECT COUNT(*) INTO v_corretivas
    FROM public.manutencao_frota
    WHERE tenant_id = p_tenant_id AND (p_fazenda_id IS NULL OR fazenda_id = p_fazenda_id) 
      AND (LOWER(tipo_manutencao) = 'corretiva' OR LOWER(tipo) = 'corretiva');

    SELECT COALESCE(SUM(GREATEST(hodometro_virtual, horimetro_atual, quilometragem_atual)), 0) INTO v_total_worked_hours
    FROM public.maquinas
    WHERE tenant_id = p_tenant_id AND (p_fazenda_id IS NULL OR fazenda_id = p_fazenda_id);

    IF v_corretivas > 0 THEN
        v_mtbf := v_total_worked_hours / v_corretivas;
    ELSE
        v_mtbf := v_total_worked_hours;
    END IF;

    RETURN jsonb_build_object(
        'availability', ROUND(v_availability, 1),
        'total_tco', ROUND(v_total_tco, 2),
        'mtbf', ROUND(v_mtbf, 0),
        'fuel_cost', ROUND(v_total_fuel_cost, 2),
        'maint_cost', ROUND(v_total_maint_cost, 2),
        'total_machines', v_total_machines
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
