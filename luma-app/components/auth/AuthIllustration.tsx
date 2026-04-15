import React from 'react';
import { useWindowDimensions } from 'react-native';
import { FlatIllustration, IllustrationType } from '@/components/illustrations/FlatIllustration';
import { VStack } from '@/components/ui/vstack';

interface AuthIllustrationProps {
  type: IllustrationType;
}

/** Tamanho reativo: telas estreitas (iPhone) não devem roubar altura do formulário. */
export function AuthIllustration({ type }: AuthIllustrationProps) {
  const { width } = useWindowDimensions();
  const size = Math.min(Math.round(width * 0.34), 132);

  return (
    <VStack className="items-center mb-4">
      <FlatIllustration type={type} width={size} height={size} />
    </VStack>
  );
}

