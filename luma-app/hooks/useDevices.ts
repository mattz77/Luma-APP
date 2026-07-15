import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  deviceService,
  PRIMARY_ACTION,
  isDevicePoweredOn,
  type DeviceRow,
  type DeviceInsert,
} from '@/services/device.service';

export const useDevices = (houseId: string | null | undefined) => {
  return useQuery({
    queryKey: ['devices', houseId],
    queryFn: () => (houseId ? deviceService.listByHouse(houseId) : Promise.resolve([])),
    enabled: Boolean(houseId),
  });
};

export const useDeviceActions = (houseId: string | null | undefined) => {
  return useQuery({
    queryKey: ['device-actions', houseId],
    queryFn: () => (houseId ? deviceService.listRecentActions(houseId) : Promise.resolve([])),
    enabled: Boolean(houseId),
  });
};

export const useCreateDevice = (houseId: string | null | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeviceInsert) => deviceService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices', houseId] });
    },
  });
};

export const useRemoveDevice = (houseId: string | null | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deviceId: string) => deviceService.remove(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices', houseId] });
    },
  });
};

export const useExecuteDeviceAction = (houseId: string | null | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      device,
      action,
      parameters,
    }: {
      device: DeviceRow;
      action: string;
      parameters?: Record<string, unknown>;
    }) => deviceService.executeAction(device, action, parameters),
    // Otimista: alterna power no cache imediatamente (feedback < 100ms).
    onMutate: async ({ device, action }) => {
      await queryClient.cancelQueries({ queryKey: ['devices', houseId] });
      const previous = queryClient.getQueryData<DeviceRow[]>(['devices', houseId]);
      const primary = PRIMARY_ACTION[device.type] ?? PRIMARY_ACTION.OTHER;
      if (previous && (action === primary.on || action === primary.off)) {
        queryClient.setQueryData<DeviceRow[]>(
          ['devices', houseId],
          previous.map((d) =>
            d.id === device.id
              ? {
                  ...d,
                  metadata: {
                    ...((d.metadata as Record<string, unknown> | null) ?? {}),
                    power: action === primary.on ? 'on' : 'off',
                  },
                }
              : d,
          ),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['devices', houseId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['devices', houseId] });
      queryClient.invalidateQueries({ queryKey: ['device-actions', houseId] });
    },
  });
};

export { isDevicePoweredOn };
