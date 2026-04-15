import type { IoTFeedInput } from '@/types/activity-feed';

/**
 * Leituras de ações em dispositivos IoT para o feed de atividade.
 *
 * ## Migração futura (quando IoT estiver ativo no app)
 *
 * 1. **Coluna `requested_by_id`** em `device_actions` (FK → `users.id`, nullable para jobs automáticos).
 * 2. **RLS:** políticas que garantem acesso só a linhas cujo `devices.house_id` pertence a um membro
 *    da casa (via `house_members` + `auth.uid()`), sem vazar ações de outro tenant.
 * 3. **Query típica:** `device_actions` ⋈ `devices` ⋈ `users` (solicitante), filtrando `devices.house_id = :houseId`,
 *    ordenando por `executed_at` desc.
 * 4. Mapear cada linha para {@link IoTFeedInput} e passar para `buildActivityFeed` em `iotFeedItems`.
 *
 * Até lá, `listRecentByHouse` retorna lista vazia.
 */
export const deviceActionService = {
  async listRecentByHouse(_houseId: string): Promise<IoTFeedInput[]> {
    return [];
  },
};
