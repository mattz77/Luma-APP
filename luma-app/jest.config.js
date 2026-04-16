/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/*.test.[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/index.tsx', 'StyledText-test\\.js'],
  setupFilesAfterEnv: ['<rootDir>/test/setup/jest-setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@gluestack-ui/.*|@legendapp/.*|moti)',
  ],
  collectCoverageFrom: [
    'services/**/*.ts',
    'hooks/**/*.ts',
    '!**/__tests__/**',
    '!**/node_modules/**',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '\\.expo/',
    'expo-env\\.d\\.ts',
    '\\+html\\.tsx',
  ],
  /** Baseline: subir gradualmente em direção a ≥90% nos serviços/hooks conforme o plano. */
  coverageThreshold: {
    global: {
      branches: 25,
      functions: 40,
      lines: 40,
      statements: 40,
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
