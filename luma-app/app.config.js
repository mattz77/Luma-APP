// Extends app.json and injects EXPO_PUBLIC_* env vars into extra
// so they're accessible via Constants.expoConfig.extra on web builds.
// Reads from process.env (set by @expo/env from .env.local) and
// falls back to reading .env.local directly if needed.
const fs = require('fs');
const path = require('path');
const appJson = require('./app.json');

// Collect EXPO_PUBLIC_* from process.env (populated by @expo/env)
const expoPublicEnv = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => key.startsWith('EXPO_PUBLIC_'))
);

// Fallback: read .env.local directly if process.env is empty
if (Object.keys(expoPublicEnv).length === 0) {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=');
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (key.startsWith('EXPO_PUBLIC_')) {
          expoPublicEnv[key] = val;
        }
      }
    });
  }
}

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      ...expoPublicEnv,
    },
  },
};
