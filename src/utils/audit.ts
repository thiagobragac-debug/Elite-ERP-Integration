import { supabase } from '../lib/supabase';

interface AuditLogOptions {
  tenant_id: string;
  user_id?: string;
  action: string;
  entity: string;
  entity_id?: string;
  old_data?: any;
  new_data?: any;
}

export const logAudit = async (options: AuditLogOptions) => {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert([
        {
          tenant_id: options.tenant_id,
          user_id: options.user_id,
          action: options.action,
          entity: options.entity,
          entity_id: options.entity_id,
          old_data: options.old_data,
          new_data: options.new_data
        }
      ]);

    if (error) {
      console.error('Error logging audit:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Fatal error logging audit:', err);
    return false;
  }
};
