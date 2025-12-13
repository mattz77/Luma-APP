import { Platform } from 'react-native';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';

interface SocialLoginButtonProps {
  provider: 'google' | 'apple' | 'facebook';
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function SocialLoginButton({ provider, onPress, loading = false, disabled = false }: SocialLoginButtonProps) {
  const isGoogle = provider === 'google';
  const isApple = provider === 'apple';
  const isFacebook = provider === 'facebook';

  // Apple Sign In só disponível no iOS
  if (isApple && Platform.OS !== 'ios') {
    return null;
  }

  const getIcon = () => {
    if (isGoogle) return 'G';
    if (isFacebook) return 'f';
    return '🍎';
  };

  const getText = () => {
    if (isGoogle) return 'Google';
    if (isFacebook) return 'Facebook';
    return 'Apple';
  };

  return (
    <Button
      variant="outline"
      size="lg"
      action="default"
      onPress={onPress}
      isDisabled={loading || disabled}
      className="flex-1 bg-white border-gray-200"
    >
      <HStack space="sm" className="items-center">
        <Text className="text-base font-semibold text-gray-700">{getIcon()}</Text>
        <ButtonText className="text-base font-medium text-gray-700">
          {getText()}
        </ButtonText>
      </HStack>
    </Button>
  );
}

