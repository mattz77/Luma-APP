# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Luma is a mobile-first home management app (React Native / Expo) with an AI assistant ("Luma") for managing shared finances, tasks, and household members. All code lives in `luma-app/`. The repository root also contains `n8n-backups/`, `mvp_plan/`, and `docs/` for project planning artifacts.

## Commands

All commands must be run from inside `luma-app/`. The project uses **Bun** as runtime and package manager.

```bash
cd luma-app

bun install              # Install dependencies
bun start                # Start Expo dev server
bun run android          # Run on Android
bun run ios              # Run on iOS (macOS only)
bun run web              # Run on web browser

bun test                 # Run all Jest tests
bun run test:watch       # Watch mode
bun run test:coverage    # Coverage report
bun run test:ci          # CI mode (--ci --coverage --maxWorkers=2)
bun run test:rls         # Run Supabase RLS policy checks

bun run mcp:n8n          # Start n8n MCP server for workflow integration

bunx tsc --noEmit        # Type-check without emitting
bunx prisma generate     # Regenerate Prisma client (schema reference only)
```

**E2E tests:**
```bash
bun run test:e2e:mobile  # Maestro flows (mobile device required)
bun run test:e2e:web     # Playwright (web)
```

**Single test file:**
```bash
bun test path/to/file.test.ts
bun test --testNamePattern "pattern"
```

## Environment Setup

Copy `luma-app/env.example` to `luma-app/.env.local` and fill in values. Required vars:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=   # preferred (new Supabase dashboard)
EXPO_PUBLIC_SUPABASE_ANON_KEY=          # legacy fallback
EXPO_PUBLIC_N8N_WEBHOOK_URL=            # base URL, not including /webhook/...
```

## Architecture

### Directory Layout

```
luma-app/
├── app/                   # Expo Router v6 file-based routing
│   ├── _layout.tsx        # Root layout: providers, auth init, onboarding guard
│   ├── landing.tsx
│   ├── (auth)/            # login, register, forgot-password, verify-email, onboarding, tutorial
│   ├── (tabs)/            # Bottom-tab screens: index (dashboard), finances/, tasks/, luma/, house/
│   ├── (modals)/          # Modal screens
│   └── activity-history.tsx
├── services/              # All Supabase calls — pure async functions, no React
├── hooks/                 # React Query wrappers around services + Supabase Realtime
├── stores/                # Zustand stores (auth.store.ts, i18n.store.ts, dashboard-search.store.ts)
├── lib/                   # Shared utilities, clients, config
├── components/            # UI components
│   └── ui/                # Design system primitives (Gluestack-based, do NOT modify)
├── types/                 # supabase.ts (generated), models.ts (domain), rag.types.ts, env.d.ts
├── constants/Colors.ts    # Design tokens / palette
├── test/                  # Jest setup, mocks, RLS checks
└── prisma/schema.prisma   # Reference schema only — not used at runtime
```

### Data Flow

```
Supabase (DB + Auth + Realtime + Edge Functions)
    ↕
services/*.service.ts       ← raw Supabase queries, typed with Database['public']
    ↕
hooks/use*.ts               ← React Query (useQuery / useMutation) wrapping services
    ↕
stores/auth.store.ts        ← Zustand: user session + active houseId
    ↕
app/(tabs)/ screens         ← consume hooks and stores
```

**App bootstrap sequence** (`app/_layout.tsx`):
1. Load fonts → hide splash screen
2. `initializeI18n()` then `useAuthStore.initialize()` (sets user from existing Supabase session)
3. `HouseInitializer` (headless component) sets the active `houseId` from the user's houses
4. `OnboardingGuard` routes unauthenticated users → landing, unconfirmed → verify-email, no house → house tab, incomplete tutorial → tutorial screen

### Multi-Tenancy (Critical)

Every database query **must** filter by `house_id`. RLS policies in Supabase enforce this server-side, but queries must also include the filter client-side for correctness and performance. The active house ID comes from `useAuthStore(state => state.houseId)`.

```typescript
// Correct pattern
const { data } = await supabase
  .from('expenses')
  .select('*, category:expense_categories(*)')
  .eq('house_id', houseId)
  .order('expense_date', { ascending: false });
```

### AI Integration (n8n)

The app **never** calls an LLM directly. All AI interactions go through `lib/n8n.ts → n8nClient.sendMessage()` which POSTs to the n8n webhook. The webhook URL is `${EXPO_PUBLIC_N8N_WEBHOOK_URL}/webhook/luma-chat-enhanced`.

Error codes thrown by `n8nClient`: `N8N_TIMEOUT`, `N8N_RATE_LIMIT`, `N8N_GENERIC_ERROR` — handle all three in UI.

RAG (Retrieval Augmented Generation) context is indexed via `RAGService` (calls Supabase Edge Functions `add-to-rag` and `hybrid-search`). Services call `RAGService.addDocument()` fire-and-forget after mutations.

### Realtime Subscriptions

Hooks in `hooks/useRealtime*.ts` subscribe to Supabase Realtime channels and call `queryClient.invalidateQueries()` on changes. Pattern:

```typescript
supabase.channel(`expenses:${houseId}`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `house_id=eq.${houseId}` }, () => {
    queryClient.invalidateQueries({ queryKey: ['expenses', houseId] });
  })
  .subscribe();
```

## Key Conventions

### Commits

**All commit messages must be in Brazilian Portuguese** using Conventional Commits format with UTF-8 encoding. Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`.

```
feat: adiciona filtro por categoria nas despesas
fix: corrige erro de autenticação no login com Google
```

### TypeScript

- Avoid `any`; use types from `types/supabase.ts` (generated from DB schema) and `types/models.ts` (domain interfaces).
- Run `bunx prisma generate` after schema changes to regenerate the Prisma client (used only as type reference).
- `Expense.amount` and `ExpenseSplit.amount` are `string` (decimal from Postgres) — convert with `Number()` for arithmetic.

### Modals and Confirmations

- **All modals**: use React Native `Modal` (`transparent`, `animationType="none"`) as root, wrapped in `KeyboardAvoidingView`. Use `LumaModalOverlay` (`components/ui/luma-modal-overlay.tsx`) for the backdrop — a single full-screen `BlurView` overlay.
- **Destructive confirmations**: use Gluestack `AlertDialog` — never `Alert.alert` (no-op on web) or `window.confirm`.
- **Success/error feedback**: use `components/ui/Toast.tsx`.
- Modal overlay tokens (blur intensity, durations, layer styles) come from `lib/modalOverlayTokens.ts`.

### Animations

Use Reanimated v4 over the legacy `Animated` API. Always include the `'worklet'` directive inside `useAnimatedStyle`:

```typescript
const style = useAnimatedStyle(() => {
  'worklet';
  return { opacity: withSpring(opacity.value) };
});
```

### Date Handling

- Display format: `DD/MM/AAAA` (pt-BR).
- API / Postgres format: `YYYY-MM-DD` (local date, never use `toISOString()` to derive date).
- Use `DatePickerBrazilianField` component (`components/forms/DatePickerBrazilianField.tsx`) for all date inputs.
- Date utilities: `lib/dateLocale.ts` (`isoYmdToBrazilian`, `dateToIsoYmdLocal`, `localIsoDateToday`, `isValidIsoYmd`).

### Design System

Colors are defined in `constants/Colors.ts`. Key semantic tokens:
- `Colors.primary` — deep purple `#352352` (main text/buttons)
- `Colors.accent` — yellow `#fbf469` (highlights/active states)
- `Colors.secondary` — pink `#e5015c` (secondary actions)
- `Colors.background` — cream `#F9F5F0`

UI primitives are Gluestack UI V3 components in `components/ui/` — do not modify these generated files. Custom app components live in `components/shared/`, `components/finances/`, etc.

### Cross-Platform

Every screen and component must work on iOS, Android, and Web. Use `Platform.OS` / `Platform.select` or platform-specific file extensions (`.web.tsx`, `.native.tsx`) for unavoidable divergences. All Supabase/n8n/service logic is naturally cross-platform.

### Testing

Jest is configured with `jest-expo` preset. Coverage thresholds: 50% lines/functions/statements, 40% branches. The pre-commit hook (`luma-app/.husky/pre-commit`) checks coverage for newly added files.

Test files go in `__tests__/` subdirectories or alongside source files as `*.test.ts(x)`. TDD order: write failing tests first → implement → verify green.

Query keys follow the pattern `['resource', houseId]` for list queries and `['resource', id, houseId]` for single-item queries.
