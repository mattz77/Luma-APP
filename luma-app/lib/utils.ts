import Constants from 'expo-constants';

export const getEnvVar = (key: string): string => {
  // Try process.env first (works in native + dev server)
  let value = process.env[key];

  // Fallback: expo-constants expoConfig.extra (works in web production builds)
  if ((value === undefined || value.length === 0) && Constants.expoConfig?.extra) {
    value = (Constants.expoConfig.extra as Record<string, string>)[key];
  }

  if (value === undefined || value.length === 0) {
    const errorMessage = `Variável de ambiente ausente: ${key}

Para corrigir:
1. Crie o arquivo luma-app/.env.local
2. Execute: .\\generate-secrets.ps1 (na raiz do projeto)
3. Ou adicione manualmente: ${key}=seu-valor-aqui
4. Reinicie o servidor: npx expo start --clear

Consulte env.example para ver todas as variáveis necessárias.`;

    throw new Error(errorMessage);
  }

  return value;
};

