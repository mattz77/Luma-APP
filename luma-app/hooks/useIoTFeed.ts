import { useQuery } from '@tanstack/react-query';

import { deviceActionService } from '@/services/device-action.service';

/** Ações IoT recentes normalizadas para o feed de atividade. */
export const useIoTFeed = (houseId: string | null | undefined) => {
  return useQuery({
    queryKey: ['iot-feed', houseId],
    queryFn: () => (houseId ? deviceActionService.listRecentByHouse(houseId) : Promise.resolve([])),
    enabled: Boolean(houseId),
  });
};
