import { createElement, useCallback, useMemo, useState, type ChangeEvent } from 'react';
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Calendar } from 'lucide-react-native';

import {
  dateToIsoYmdLocal,
  isoYmdToBrazilian,
  parseIsoYmdToLocalDate,
} from '@/lib/dateLocale';

export interface DatePickerBrazilianFieldProps {
  /** `YYYY-MM-DD` ou `''` quando ainda não há data (ex.: “sem prazo”). */
  valueIso: string;
  onChangeIso: (iso: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
}

/**
 * Campo de data: exibição DD/MM/AAAA; toque abre calendário nativo (Android/iOS) ou `input type="date"` na web.
 */
export function DatePickerBrazilianField({
  valueIso,
  onChangeIso,
  placeholder = 'DD/MM/AAAA',
  accessibilityLabel = 'Abrir calendário para escolher a data',
}: DatePickerBrazilianFieldProps) {
  const insets = useSafeAreaInsets();
  const [iosOpen, setIosOpen] = useState(false);

  const selectedDate = useMemo(() => parseIsoYmdToLocalDate(valueIso), [valueIso]);

  const displayText = useMemo(() => {
    const head = valueIso.trim().slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(head)) {
      return isoYmdToBrazilian(head);
    }
    return '';
  }, [valueIso]);

  const applyDate = useCallback(
    (d: Date) => {
      onChangeIso(dateToIsoYmdLocal(d));
    },
    [onChangeIso]
  );

  const openPicker = useCallback(() => {
    Keyboard.dismiss();
    const base = parseIsoYmdToLocalDate(valueIso);

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: base,
        mode: 'date',
        display: 'calendar',
        onChange: (event, date) => {
          if (event.type === 'set' && date) {
            void Haptics.selectionAsync();
            applyDate(date);
          }
        },
      });
      return;
    }

    setIosOpen(true);
  }, [applyDate, valueIso]);

  if (Platform.OS === 'web') {
    const isoForInput = /^\d{4}-\d{2}-\d{2}$/.test(valueIso.trim().slice(0, 10))
      ? valueIso.trim().slice(0, 10)
      : '';

    return (
      <View className="relative h-14 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <View
          className="pointer-events-none absolute inset-0 z-0 flex-row items-center justify-between px-3"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Text
            className={`flex-1 text-base font-medium ${displayText ? 'text-slate-900' : 'text-slate-400'}`}
            numberOfLines={1}
          >
            {displayText || placeholder}
          </Text>
          <Calendar size={18} color="#94a3b8" />
        </View>
        {createElement('input', {
          type: 'date',
          value: isoForInput,
          'aria-label': accessibilityLabel,
          onChange: (e: ChangeEvent<HTMLInputElement>) => {
            const v = e.currentTarget.value;
            if (v) {
              void Haptics.selectionAsync();
              onChangeIso(v);
            }
          },
          style: {
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
            zIndex: 1,
          },
        })}
      </View>
    );
  }

  return (
    <>
      <Pressable
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        className="h-14 w-full flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 active:bg-slate-50"
      >
        <Text
          className={`flex-1 text-base font-medium ${displayText ? 'text-slate-900' : 'text-slate-400'}`}
          numberOfLines={1}
        >
          {displayText || placeholder}
        </Text>
        <Calendar size={18} color="#94a3b8" />
      </Pressable>

      {Platform.OS === 'ios' && (
        <Modal
          visible={iosOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setIosOpen(false)}
        >
          <View className="flex-1 justify-end bg-black/40">
            <Pressable className="flex-1" onPress={() => setIosOpen(false)} accessibilityLabel="Fechar calendário" />
            <View
              className="rounded-t-[28px] bg-white px-4 pt-3"
              style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            >
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="inline"
                locale="pt_BR"
                themeVariant="light"
                onChange={(_, date) => {
                  if (date) {
                    applyDate(date);
                  }
                }}
              />
              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  setIosOpen(false);
                }}
                className="mt-3 items-center rounded-2xl bg-slate-900 py-3.5 active:opacity-90"
              >
                <Text className="text-base font-bold text-white">Concluir</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}
