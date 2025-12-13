import React from 'react';
import { FlatIllustration, IllustrationType } from '@/components/illustrations/FlatIllustration';
import { VStack } from '@/components/ui/vstack';

interface AuthIllustrationProps {
  type: IllustrationType;
}

export function AuthIllustration({ type }: AuthIllustrationProps) {
  return (
    <VStack className="items-center mb-8">
      <FlatIllustration type={type} width={200} height={200} />
    </VStack>
  );
}

