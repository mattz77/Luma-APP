import React from 'react';
import { Image } from '@/components/ui/image';
import { View } from 'react-native';

export type IllustrationType = 'sign-in' | 'sign-up' | 'forgot-password';

interface FlatIllustrationProps {
  type: IllustrationType;
  width?: number;
  height?: number;
  className?: string;
}

// Função helper para tentar carregar asset local
const getIllustrationSource = (type: IllustrationType): any => {
  try {
    // Tenta carregar asset local
    switch (type) {
      case 'sign-in':
        return require('@/assets/illustrations/sign-in.png');
      case 'sign-up':
        return require('@/assets/illustrations/sign-up.png');
      case 'forgot-password':
        return require('@/assets/illustrations/forgot-password.png');
      default:
        throw new Error('Unknown illustration type');
    }
  } catch (error) {
    // Se o asset local não existir, retorna null para usar placeholder
    console.warn(`Ilustração local não encontrada para ${type}. Adicione o arquivo em assets/illustrations/`);
    return null;
  }
};

// Fallback: URLs temporárias caso as imagens locais não existam
// Estas serão usadas até que os assets sejam baixados do Figma
const ILLUSTRATION_URLS: Record<IllustrationType, string> = {
  'sign-in': 'https://www.figma.com/api/mcp/asset/13029056-ce29-487d-947d-9cc113dee802',
  'sign-up': 'https://www.figma.com/api/mcp/asset/13029056-ce29-487d-947d-9cc113dee802',
  'forgot-password': 'https://www.figma.com/api/mcp/asset/13029056-ce29-487d-947d-9cc113dee802',
};

export function FlatIllustration({
  type,
  width = 200,
  height = 200,
  className,
}: FlatIllustrationProps) {
  // Tenta usar asset local primeiro
  const localAsset = getIllustrationSource(type);
  const imageSource = localAsset || { uri: ILLUSTRATION_URLS[type] };

  return (
    <View style={{ width, height }} className={className}>
      <Image
        source={imageSource}
        alt={`${type} illustration`}
        size="none"
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
      />
    </View>
  );
}
