export const getEnvVar = (key: string): string => {
  const value = process.env[key];

  if (value === undefined || value.length === 0) {
    throw new Error(`Variável de ambiente ausente: ${key}`);
  }

  return value;
};

