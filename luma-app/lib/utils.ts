export const getEnvVar = (key: string): string => {
  // No Expo, variáveis EXPO_PUBLIC_* são expostas automaticamente via process.env
  const value = process.env[key];

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

