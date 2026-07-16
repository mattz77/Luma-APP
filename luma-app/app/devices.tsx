/**
 * Dispositivos — módulo IoT (Luma DS v2, "Paper & Light").
 *
 * Uma tela, uma ideia: a casa na palma da mão. Tiles por cômodo, tap liga e
 * desliga (otimista, feedback imediato), sheet de detalhe para ações finas,
 * atividade recente no rodapé. Conexão nova em um passo.
 */
import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  Modal,
  TextInput,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Plus,
  Lightbulb,
  Thermometer,
  Lock,
  Camera,
  Speaker,
  Bot,
  Radio,
  Cpu,
  Trash2,
  Power,
} from 'lucide-react-native';

import { useAuthStore } from '@/stores/auth.store';
import {
  useDevices,
  useDeviceActions,
  useCreateDevice,
  useRemoveDevice,
  useExecuteDeviceAction,
  isDevicePoweredOn,
} from '@/hooks/useDevices';
import { PRIMARY_ACTION, type DeviceRow, type DeviceType } from '@/services/device.service';
import { getIoTActionLabelPt } from '@/lib/iotActionLabels';
import { light, dark, radius, space, type as typo, shadow } from '@/constants/theme';
import { Tx, LumaButton, LumaChip, LumaEmpty, SectionTitle, useLumaTheme } from '@/components/shared/luma';

const DEVICE_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  LIGHT: Lightbulb,
  THERMOSTAT: Thermometer,
  LOCK: Lock,
  CAMERA: Camera,
  VOICE_ASSISTANT: Speaker,
  VACUUM_ROBOT: Bot,
  SENSOR: Radio,
  OTHER: Cpu,
};

const DEVICE_TYPE_LABELS: Record<string, string> = {
  LIGHT: 'Luz',
  THERMOSTAT: 'Termostato',
  LOCK: 'Fechadura',
  CAMERA: 'Câmera',
  VOICE_ASSISTANT: 'Assistente',
  VACUUM_ROBOT: 'Robô aspirador',
  SENSOR: 'Sensor',
  OTHER: 'Outro',
};

const ADDABLE_TYPES: DeviceType[] = [
  'LIGHT',
  'THERMOSTAT',
  'LOCK',
  'CAMERA',
  'VOICE_ASSISTANT',
  'VACUUM_ROBOT',
  'SENSOR',
  'OTHER',
];

export default function DevicesScreen() {
  const router = useRouter();
  const t = useLumaTheme();
  const houseId = useAuthStore((s) => s.houseId);

  const { data: devices = [], isLoading, refetch, isRefetching } = useDevices(houseId);
  const { data: actions = [] } = useDeviceActions(houseId);
  const executeAction = useExecuteDeviceAction(houseId);
  const createDevice = useCreateDevice(houseId);
  const removeDevice = useRemoveDevice(houseId);

  const [selected, setSelected] = useState<DeviceRow | null>(null);
  const [adding, setAdding] = useState(false);

  const rooms = useMemo(() => {
    const map = new Map<string, DeviceRow[]>();
    devices.forEach((d) => {
      const room = d.room?.trim() || 'Sem cômodo';
      map.set(room, [...(map.get(room) ?? []), d]);
    });
    return [...map.entries()];
  }, [devices]);

  const onCount = devices.filter(isDevicePoweredOn).length;
  const offlineCount = devices.filter((d) => !d.is_online).length;

  const toggleDevice = (device: DeviceRow) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const primary = PRIMARY_ACTION[device.type] ?? PRIMARY_ACTION.OTHER;
    const action = isDevicePoweredOn(device) ? primary.off : primary.on;
    executeAction.mutate({ device, action });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.paper }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable testID="devices-back" onPress={() => router.back()} hitSlop={12} style={styles.headerBtn}>
          <ArrowLeft size={22} color={t.ink} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Tx variant="title">Dispositivos</Tx>
          {devices.length > 0 ? (
            <Tx variant="caption" color="soft">
              {`${onCount} ligado${onCount === 1 ? '' : 's'}${offlineCount ? ` · ${offlineCount} offline` : ''}`}
            </Tx>
          ) : null}
        </View>
        <Pressable
          testID="devices-add"
          onPress={() => setAdding(true)}
          hitSlop={12}
          style={[styles.headerBtn, { backgroundColor: t.accent }]}
        >
          <Plus size={20} color={t.onAccent} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={t.inkSoft} />}
      >
        {!isLoading && devices.length === 0 ? (
          <LumaEmpty
            icon={<Cpu size={40} color={t.inkFaint} />}
            title="Sua casa ainda não fala com você"
            body="Conecte o primeiro dispositivo e controle luzes, clima e limpeza daqui."
            cta={<LumaButton testID="devices-empty-add" label="Conectar dispositivo" onPress={() => setAdding(true)} />}
          />
        ) : (
          rooms.map(([room, roomDevices]) => (
            <View key={room}>
              <SectionTitle title={room} />
              <View style={styles.grid}>
                {roomDevices.map((device) => (
                  <DeviceTile
                    key={device.id}
                    device={device}
                    onToggle={() => toggleDevice(device)}
                    onOpen={() => setSelected(device)}
                  />
                ))}
              </View>
            </View>
          ))
        )}

        {actions.length > 0 ? (
          <>
            <SectionTitle title="Atividade recente" />
            <View style={[styles.feed, { backgroundColor: t.surface, borderColor: t.line }]}>
              {actions.slice(0, 8).map((a, i, arr) => (
                <View
                  key={a.id}
                  style={[
                    styles.feedRow,
                    i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.line },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Tx variant="bodyMedium" numberOfLines={1}>
                      {`${getIoTActionLabelPt(a.action)} · ${a.device?.name ?? 'Dispositivo'}`}
                    </Tx>
                    <Tx variant="caption" color="soft">
                      {new Date(a.executed_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Tx>
                  </View>
                  <Tx variant="micro" color={a.status === 'failed' ? 'danger' : a.status === 'success' ? 'good' : 'soft'}>
                    {a.status === 'failed' ? 'FALHOU' : a.status === 'success' ? 'OK' : 'PENDENTE'}
                  </Tx>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <View style={{ height: space.section }} />
      </ScrollView>

      <DeviceSheet
        device={selected}
        onClose={() => setSelected(null)}
        onAction={(action, parameters) => {
          if (!selected) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          executeAction.mutate({ device: selected, action, parameters });
        }}
        onRemove={() => {
          if (!selected) return;
          removeDevice.mutate(selected.id);
          setSelected(null);
        }}
      />

      <AddDeviceSheet
        visible={adding}
        onClose={() => setAdding(false)}
        saving={createDevice.isPending}
        onSave={(input) => {
          if (!houseId) return;
          createDevice.mutate(
            { ...input, house_id: houseId, is_online: true },
            { onSuccess: () => setAdding(false) },
          );
        }}
      />
    </SafeAreaView>
  );
}

/* ---------- Tile ---------- */
function DeviceTile({ device, onToggle, onOpen }: { device: DeviceRow; onToggle: () => void; onOpen: () => void }) {
  const t = useLumaTheme();
  const Icon = DEVICE_ICONS[device.type] ?? Cpu;
  const on = isDevicePoweredOn(device);
  const offline = !device.is_online;

  return (
    <Pressable
      testID={`device-tile-${device.id}`}
      onPress={offline ? onOpen : onToggle}
      onLongPress={onOpen}
      style={({ pressed }) => [
        styles.tile,
        shadow.card,
        {
          backgroundColor: on ? t.accent : t.surface,
          borderColor: on ? t.accent : t.line,
          opacity: offline ? 0.55 : 1,
        },
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      <View style={styles.tileTop}>
        <Icon size={22} color={on ? t.onAccent : t.inkSoft} />
        <Pressable onPress={onOpen} hitSlop={10}>
          <View style={[styles.dot, { backgroundColor: offline ? t.inkFaint : on ? t.onAccent : t.good }]} />
        </Pressable>
      </View>
      <View>
        <Tx variant="bodyMedium" color={on ? 'onAccent' : 'ink'} numberOfLines={1}>
          {device.name}
        </Tx>
        <Tx variant="caption" color={on ? 'onAccent' : 'soft'} numberOfLines={1}>
          {offline ? 'Offline' : on ? 'Ligado' : 'Desligado'}
        </Tx>
      </View>
    </Pressable>
  );
}

/* ---------- Sheet de detalhe ---------- */
function DeviceSheet({
  device,
  onClose,
  onAction,
  onRemove,
}: {
  device: DeviceRow | null;
  onClose: () => void;
  onAction: (action: string, parameters?: Record<string, unknown>) => void;
  onRemove: () => void;
}) {
  const t = useLumaTheme();
  const [temp, setTemp] = useState(22);
  if (!device) return null;

  const on = isDevicePoweredOn(device);
  const primary = PRIMARY_ACTION[device.type] ?? PRIMARY_ACTION.OTHER;
  const isVacuum = device.type === 'VACUUM_ROBOT';
  const isThermostat = device.type === 'THERMOSTAT';

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: t.overlay }]} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: t.paper }]}>
        <View style={[styles.grabber, { backgroundColor: t.line }]} />
        <View style={styles.sheetHeader}>
          <View style={{ flex: 1 }}>
            <Tx variant="title">{device.name}</Tx>
            <Tx variant="caption" color="soft">
              {`${DEVICE_TYPE_LABELS[device.type] ?? device.type}${device.room ? ` · ${device.room}` : ''}${device.brand ? ` · ${device.brand}` : ''}`}
            </Tx>
          </View>
          <Pressable testID="device-sheet-remove" onPress={onRemove} hitSlop={10} style={[styles.headerBtn, { backgroundColor: t.dangerSoft }]}>
            <Trash2 size={18} color={t.danger} />
          </Pressable>
        </View>

        {isThermostat ? (
          <View style={[styles.tempCard, { backgroundColor: t.surface, borderColor: t.line }]}>
            <View style={styles.tempRow}>
              <Pressable testID="temp-minus" onPress={() => setTemp((v) => Math.max(16, v - 1))} style={[styles.tempBtn, { backgroundColor: t.surfaceSunken }]}>
                <Tx variant="title">−</Tx>
              </Pressable>
              <Tx variant="display">{`${temp}°`}</Tx>
              <Pressable testID="temp-plus" onPress={() => setTemp((v) => Math.min(30, v + 1))} style={[styles.tempBtn, { backgroundColor: t.surfaceSunken }]}>
                <Tx variant="title">+</Tx>
              </Pressable>
            </View>
            <LumaButton
              testID="temp-apply"
              label="Ajustar temperatura"
              onPress={() => onAction('set_temperature', { temperature: temp })}
            />
          </View>
        ) : null}

        <View style={{ gap: space.sm, marginTop: space.lg }}>
          <LumaButton
            testID="device-primary-action"
            label={on ? getIoTActionLabelPt(primary.off) : getIoTActionLabelPt(primary.on)}
            icon={<Power size={18} color={t.onAccent} />}
            onPress={() => onAction(on ? primary.off : primary.on)}
          />
          {isVacuum ? (
            <LumaButton
              testID="device-goto-room"
              variant="quiet"
              label="Ir ao cômodo"
              onPress={() => onAction('go_to_room', { room: device.room ?? 'sala' })}
            />
          ) : null}
          <LumaButton variant="quiet" label="Fechar" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

/* ---------- Sheet de conexão ---------- */
function AddDeviceSheet({
  visible,
  onClose,
  onSave,
  saving,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (input: { name: string; type: DeviceType; room: string | null }) => void;
  saving: boolean;
}) {
  const t = useLumaTheme();
  const scheme = useColorScheme();
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [type, setType] = useState<DeviceType>('LIGHT');

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: t.overlay }]} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: t.paper }]}>
        <View style={[styles.grabber, { backgroundColor: t.line }]} />
        <Tx variant="title">Conectar dispositivo</Tx>
        <Tx variant="body" color="soft" style={{ marginTop: 2 }}>
          Dê um nome, escolha o tipo e o cômodo. Pronto.
        </Tx>

        <TextInput
          testID="add-device-name"
          placeholder="Nome (ex.: Luz da sala)"
          placeholderTextColor={t.inkFaint}
          value={name}
          onChangeText={setName}
          style={[styles.input, { backgroundColor: t.surfaceSunken, color: t.ink, borderColor: t.line }]}
          keyboardAppearance={scheme === 'dark' ? 'dark' : 'light'}
        />
        <TextInput
          testID="add-device-room"
          placeholder="Cômodo (ex.: Sala)"
          placeholderTextColor={t.inkFaint}
          value={room}
          onChangeText={setRoom}
          style={[styles.input, { backgroundColor: t.surfaceSunken, color: t.ink, borderColor: t.line }]}
          keyboardAppearance={scheme === 'dark' ? 'dark' : 'light'}
        />

        <View style={styles.typeWrap}>
          {ADDABLE_TYPES.map((dt) => (
            <LumaChip
              key={dt}
              testID={`add-device-type-${dt}`}
              label={DEVICE_TYPE_LABELS[dt]}
              active={type === dt}
              onPress={() => setType(dt)}
            />
          ))}
        </View>

        <View style={{ gap: space.sm, marginTop: space.lg }}>
          <LumaButton
            testID="add-device-save"
            label="Conectar"
            loading={saving}
            disabled={!name.trim()}
            onPress={() => onSave({ name: name.trim(), type, room: room.trim() || null })}
          />
          <LumaButton variant="quiet" label="Cancelar" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
    paddingBottom: space.md,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingHorizontal: space.xl },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
  },
  tile: {
    width: '47.5%',
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.lg,
    gap: space.xxl,
  },
  tileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  feed: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.lg,
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
  },
  backdrop: { flex: 1 },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: space.xl,
    paddingBottom: space.section,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: space.lg,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  tempCard: {
    marginTop: space.lg,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.lg,
    gap: space.lg,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
  },
  tempBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    marginTop: space.md,
    height: 50,
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.lg,
    fontSize: 15,
  },
  typeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: space.lg,
  },
});
