import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Image } from '@/components/ui/image';
import { Colors } from '@/constants/Colors';
import type { LucideIcon } from 'lucide-react-native';

export type ActivityFeedListItemProps = {
  title: string;
  subtitle: string;
  time: string;
  icon: LucideIcon;
  avatarUrl?: string | null;
  onPress?: () => void;
  /** Lista dentro do card branco (home) vs cartão solto (histórico). */
  variant?: 'embedded' | 'card';
};

export function ActivityFeedListItem({
  title,
  subtitle,
  time,
  icon: Icon,
  avatarUrl,
  onPress,
  variant = 'embedded',
}: ActivityFeedListItemProps) {
  const containerStyle: ViewStyle[] = [
    variant === 'embedded' ? styles.embeddedItem : styles.cardItem,
  ];

  return (
    <Pressable
      style={containerStyle}
      onPress={onPress}
      disabled={!onPress}
    >
      <HStack className="items-center flex-1 gap-4">
        <Box style={styles.activityIconBg}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              alt=""
              size="none"
              className="h-9 w-9 rounded-[10px]"
            />
          ) : (
            <Icon size={18} color={Colors.primary} />
          )}
        </Box>
        <Box className="flex-1 justify-center gap-0.5">
          <Text size="sm" className="font-semibold text-typography-900 leading-tight" numberOfLines={1}>
            {title}
          </Text>
          <Text size="xs" className="text-typography-500" numberOfLines={2}>
            {subtitle}
          </Text>
        </Box>
        <Box className="items-end justify-center pl-2">
          <Text size="xs" className="font-medium text-typography-400 text-[10px]">
            {time}
          </Text>
        </Box>
      </HStack>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  embeddedItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  cardItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  activityIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + '08',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
