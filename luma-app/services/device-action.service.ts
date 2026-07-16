import type { IoTFeedInput } from '@/types/activity-feed';
import { deviceService } from '@/services/device.service';

/**
 * Leituras de ações em dispositivos IoT para o feed de atividade.
 * Consulta `device_actions` ⋈ `devices` filtrando pela casa; o solicitante
 * ainda não é persistido (coluna `requested_by_id` futura), então as ações
 * aparecem como automação da casa.
 */
export const deviceActionService = {
  async listRecentByHouse(houseId: string): Promise<IoTFeedInput[]> {
    try {
      const actions = await deviceService.listRecentActions(houseId, 20);
      return actions.map((a) => ({
        id: a.id,
        actionKey: a.action,
        deviceName: a.device?.name ?? 'Dispositivo',
        requestedByName: 'Casa',
        avatarUrl: null,
        executedAt: new Date(a.executed_at),
      }));
    } catch {
      // Tabela ainda não provisionada ou sem acesso: feed segue sem IoT.
      return [];
    }
  },
};
