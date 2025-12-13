import React from 'react';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { View } from 'react-native';
import Svg, { Path, G, Rect } from 'react-native-svg';

interface GoogleSignInButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

/**
 * Botão "Fazer login com o Google" seguindo as diretrizes oficiais:
 * https://developers.google.com/identity/branding-guidelines
 * 
 * Especificações conforme diretrizes:
 * - Tema: Claro (light)
 * - Formato: Retangular (square)
 * - Tamanho: Grande (large)
 * - Cor do ícone: Padrão do Google (#4285F4)
 * - Background: Branco (#FFFFFF)
 * - Borda: Cinza claro (#DADCE0)
 * - Padding: 10px à direita do logo, 12px à direita do texto
 * - Altura mínima: 40px (recomendado 48px)
 */
export function GoogleSignInButton({ 
  onPress, 
  loading = false, 
  disabled = false 
}: GoogleSignInButtonProps) {
  // Ícone "G" do Google conforme diretrizes oficiais
  // Cores: #4285F4 (azul), #FFFFFF (branco)
  const GoogleIcon = () => (
    <View style={{ width: 18, height: 18, marginRight: 10 }}>
      <Svg width="18" height="18" viewBox="0 0 18 18">
        <G>
          {/* Background azul do Google */}
          <Path
            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
            fill="#4285F4"
          />
          <Path
            d="M9 18c2.43 0 4.467-.806 5.965-2.184l-2.908-2.258c-.806.54-1.837.86-3.057.86-2.35 0-4.34-1.587-5.053-3.72H.957v2.332C2.438 15.983 5.482 18 9 18z"
            fill="#34A853"
          />
          <Path
            d="M3.947 10.698c-.18-.54-.282-1.117-.282-1.698s.102-1.158.282-1.698V4.97H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.03l2.99-2.332z"
            fill="#FBBC05"
          />
          <Path
            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.97L3.947 7.302C4.66 5.167 6.65 3.58 9 3.58z"
            fill="#EA4335"
          />
        </G>
      </Svg>
    </View>
  );

  return (
    <Button
      variant="outline"
      size="lg"
      action="default"
      onPress={onPress}
      isDisabled={loading || disabled}
      className="w-full bg-white border-gray-300 h-12 rounded-lg"
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: '#DADCE0',
        borderWidth: 1,
        minHeight: 48,
        paddingHorizontal: 16,
      }}
    >
      <HStack space="sm" className="items-center justify-center">
        {loading ? (
          <ButtonSpinner />
        ) : (
          <>
            <GoogleIcon />
            <ButtonText 
              className="text-gray-700 text-base font-medium"
              style={{ 
                color: '#3C4043',
                fontSize: 14,
                fontWeight: '500',
                marginLeft: 0, // Padding já está no ícone
              }}
            >
              Fazer login com o Google
            </ButtonText>
          </>
        )}
      </HStack>
    </Button>
  );
}

