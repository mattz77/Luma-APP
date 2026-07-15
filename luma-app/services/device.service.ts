import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

export type DeviceRow = Database['public']['Tables']['devices']['Row'];
export type DeviceInsert = Database['public']['Tables']['devices']['Insert'];
export type DeviceType = Database['public']['Enums']['device_type'];
export type DeviceActionRow = Database['public']['Tables']['device_actions']['Row'];

export interface DeviceActionWithDevice extends DeviceActionRow {
  device: Pick<DeviceRow, 'id' | 'name' | 'type' | 'room'> | null;
}

/** Ação primária por tipo de dispositivo (tap no tile). */
export const PRIMARY_ACTION: Record<string, { on: string; off: string }> = {
  LIGHT: { on: 'turn_on', off: 'turn_off' },
  THERMOSTAT: { on: 'turn_on', off: 'turn_off' },
  LOCK: { on: 'turn_on', off: 'turn_off' },
  CAMERA: { on: 'turn_on', off: 'turn_off' },
  VOICE_ASSISTANT: { on: 'turn_on', off: 'turn_off' },
  VACUUM_ROBOT: { on: 'start_cleaning', off: 'stop' },
  SENSOR: { on: 'turn_on', off: 'turn_off' },
  OTHER: { on: 'turn_on', off: 'turn_off' },
};

export const deviceService = {
  async listByHouse(houseId: string): Promise<DeviceRow[]> {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('house_id', houseId)
      .order('room', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true });

    if (error) throw error;
    return (data ?? []) as DeviceRow[];
  },

  async create(input: DeviceInsert): Promise<DeviceRow> {
    const { data, error } = await supabase
      .from('devices')
      .insert(input as never)
      .select('*')
      .single();
    if (error) throw error;
    return data as DeviceRow;
  },

  async remove(deviceId: string): Promise<void> {
    const { error } = await supabase.from('devices').delete().eq('id', deviceId);
    if (error) throw error;
  },

  /**
   * Registra uma ação para o dispositivo. O estado "ligado" do app é
   * refletido otimisticamente em `devices.metadata.power`; a execução real
   * acontece via n8n (Tool: Execute Device Action) consumindo a fila.
   */
  async executeAction(
    device: DeviceRow,
    action: string,
    parameters?: Record<string, unknown>,
  ): Promise<DeviceActionRow> {
    const { data, error } = await supabase
      .from('device_actions')
      .insert({
        device_id: device.id,
        action,
        parameters: parameters ?? null,
        status: 'pending',
      } as never)
      .select('*')
      .single();
    if (error) throw error;

    // Estado percebido: power on/off + últimos parâmetros no metadata.
    const primary = PRIMARY_ACTION[device.type] ?? PRIMARY_ACTION.OTHER;
    const metadata = {
      ...((device.metadata as Record<string, unknown> | null) ?? {}),
      ...(action === primary.on ? { power: 'on' } : {}),
      ...(action === primary.off ? { power: 'off' } : {}),
      ...(parameters ?? {}),
      last_action: action,
    };
    const { error: updateError } = await supabase
      .from('devices')
      .update({ metadata, last_seen_at: new Date().toISOString() } as never)
      .eq('id', device.id);
    if (updateError) throw updateError;

    return data as DeviceActionRow;
  },

  async listRecentActions(houseId: string, limit = 20): Promise<DeviceActionWithDevice[]> {
    const { data, error } = await supabase
      .from('device_actions')
      .select('*, device:devices!inner(id, name, type, room, house_id)')
      .eq('device.house_id', houseId)
      .order('executed_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as unknown as DeviceActionWithDevice[];
  },
};

export function isDevicePoweredOn(device: DeviceRow): boolean {
  const metadata = device.metadata as Record<string, unknown> | null;
  return metadata?.power === 'on';
}
