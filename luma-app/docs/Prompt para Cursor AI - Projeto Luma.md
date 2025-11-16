<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Prompt para Cursor AI - Projeto Luma

```markdown
# CONTEXTO DO PROJETO: Luma - Assistente Inteligente para Gestão de Casa

Você é um desenvolvedor sênior especializado em React Native, Expo, TypeScript, Supabase e arquitetura de aplicativos mobile-first. Seu objetivo é implementar o aplicativo **Luma** seguindo rigorosamente o PRD, schema Prisma e flowcharts fornecidos.

## VISÃO GERAL TÉCNICA

**Stack Principal:**
- Frontend: Expo SDK 54 + Expo Router v6 + React Native 0.81 + TypeScript
- Backend: Supabase (Auth, Database, Storage, Realtime, Edge Functions)
- Database: PostgreSQL com PostGIS e Prisma ORM
- AI Layer: n8n para orquestração de workflows AI
- UI: React Native Reanimated v4 + NativeUI Components
- Estado: Zustand + React Query (TanStack Query)

**Arquitetura:** Mobile-first com suporte web via React Native Web, padrão multi-tenant com Row Level Security (RLS)

---

## REGRAS FUNDAMENTAIS DE DESENVOLVIMENTO

### 1. ESTRUTURA DE PROJETO
```

luma-app/
├── app/                    \# Expo Router (file-based routing)
│   ├── (auth)/            \# Grupo de rotas de autenticação
│   ├── (tabs)/            \# Rotas com bottom tabs
│   ├── (modals)/          \# Rotas modais
│   └── _layout.tsx        \# Root layout
├── components/            \# Componentes reutilizáveis
│   ├── ui/               \# Componentes de UI base
│   ├── features/         \# Componentes específicos de features
│   └── shared/           \# Componentes compartilhados
├── lib/                  \# Configurações e utilitários
│   ├── supabase.ts       \# Cliente Supabase
│   ├── n8n.ts            \# Cliente n8n
│   └── utils.ts          \# Funções auxiliares
├── hooks/                \# Custom hooks
├── stores/               \# Zustand stores
├── types/                \# TypeScript types
├── constants/            \# Constantes e configs
├── services/             \# Camada de serviços (API calls)
├── prisma/               \# Schema Prisma
│   └── schema.prisma
└── supabase/             \# Supabase configs
├── migrations/
└── functions/        \# Edge Functions

```

### 2. PADRÕES DE CÓDIGO OBRIGATÓRIOS

#### TypeScript
- **SEMPRE** use tipos explícitos, NUNCA `any`
- Crie interfaces para todos os modelos de dados
- Use `type` para unions e intersections
- Habilite `strict: true` no tsconfig.json

```

// ✅ CORRETO
interface User {
id: string;
email: string;
name: string | null;
}

const fetchUser = async (id: string): Promise<User> => {
// implementação
}

// ❌ ERRADO
const fetchUser = async (id: any): Promise<any> => {
// implementação
}

```

#### Componentes React Native
- Use componentes funcionais com hooks
- Aplique `React.memo()` em componentes que recebem props complexas
- Separe lógica de apresentação

```

// ✅ CORRETO
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TaskCardProps {
title: string;
status: 'PENDING' | 'COMPLETED';
onPress: () => void;
}

export const TaskCard = React.memo<TaskCardProps>(({ title, status, onPress }) => {
return (
<View style={styles.container}>
<Text style={styles.title}>{title}</Text>
</View>
);
});

const styles = StyleSheet.create({
container: {
padding: 16,
backgroundColor: '\#fff',
},
title: {
fontSize: 16,
fontWeight: '600',
},
});

```

#### Estado e Data Fetching
- Use **Zustand** para estado global (auth, user, house)
- Use **React Query** para data fetching e cache
- NUNCA misture useState com dados de API

```

// ✅ CORRETO - Zustand Store
import { create } from 'zustand';

interface AuthState {
user: User | null;
house: House | null;
setUser: (user: User) => void;
setHouse: (house: House) => void;
logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
user: null,
house: null,
setUser: (user) => set({ user }),
setHouse: (house) => set({ house }),
logout: () => set({ user: null, house: null }),
}));

// ✅ CORRETO - React Query
import { useQuery } from '@tanstack/react-query';

export const useExpenses = (houseId: string) => {
return useQuery({
queryKey: ['expenses', houseId],
queryFn: () => expenseService.getAll(houseId),
enabled: !!houseId,
});
};

```

### 3. INTEGRAÇÃO SUPABASE

#### Configuração com RLS (Row Level Security)
- **OBRIGATÓRIO:** Todas as queries devem respeitar `house_id`
- Configure políticas RLS para cada tabela
- Use `auth.uid()` para identificar usuário

```

-- ✅ EXEMPLO DE POLÍTICA RLS
CREATE POLICY "Users can only see expenses from their house"
ON expenses
FOR SELECT
USING (
house_id IN (
SELECT house_id
FROM house_members
WHERE user_id = auth.uid() AND is_active = true
)
);

```

#### Cliente Supabase Tipado
```

// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

```

#### Serviços de Dados
```

// services/expense.service.ts
import { supabase } from '@/lib/supabase';
import type { Expense, ExpenseInsert } from '@/types/models';

export const expenseService = {
async getAll(houseId: string): Promise<Expense[]> {
const { data, error } = await supabase
.from('expenses')
.select('*, category:expense_categories(*), created_by:users(*)')
.eq('house_id', houseId)
.order('expense_date', { ascending: false });

    if (error) throw error;
    return data;
    },

async create(expense: ExpenseInsert): Promise<Expense> {
const { data, error } = await supabase
.from('expenses')
.insert(expense)
.select()
.single();

    if (error) throw error;
    return data;
    },

```
async update(id: string, updates: Partial<ExpenseInsert>): Promise<Expense> {
```

    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
    },

async delete(id: string): Promise<void> {
const { error } = await supabase
.from('expenses')
.delete()
.eq('id', id);

    if (error) throw error;
    },
};

```

### 4. INTEGRAÇÃO N8N (LUMA AI)

#### Cliente N8N
```

// lib/n8n.ts
import axios from 'axios';

const N8N_WEBHOOK_URL = process.env.EXPO_PUBLIC_N8N_WEBHOOK_URL!;

interface LumaMessage {
house_id: string;
user_id: string;
message: string;
context?: Record<string, any>;
}

interface LumaResponse {
response: string;
metadata?: {
processing_time_ms: number;
sources_used: string[];
};
}

export const n8nClient = {
async sendMessage(payload: LumaMessage): Promise<LumaResponse> {
try {
const response = await axios.post<LumaResponse>(
`${N8N_WEBHOOK_URL}/luma/chat`,
payload,
{
timeout: 30000, // 30s timeout
headers: {
'Content-Type': 'application/json',
},
}
);
return response.data;
} catch (error) {
console.error('N8N API Error:', error);
throw new Error('Falha ao comunicar com Luma');
}
},
};

```

#### Hook para Chat com Luma
```

// hooks/useLumaChat.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { n8nClient } from '@/lib/n8n';
import { supabase } from '@/lib/supabase';

export const useLumaChat = (houseId: string, userId: string) => {
const queryClient = useQueryClient();

return useMutation({
mutationFn: async (message: string) => {
// 1. Enviar mensagem para n8n
const response = await n8nClient.sendMessage({
house_id: houseId,
user_id: userId,
message,
context: {
current_month: new Date().toISOString().slice(0, 7),
},
});

      // 2. Salvar conversa no banco
      await supabase.from('conversations').insert({
        house_id: houseId,
        user_id: userId,
        message,
        response: response.response,
        metadata: response.metadata,
      });
    
      return response;
    },
    onSuccess: () => {
      // Invalidar cache de conversas
      queryClient.invalidateQueries({ queryKey: ['conversations', houseId] });
    },
    });
};

```

### 5. NAVEGAÇÃO COM EXPO ROUTER

#### Root Layout
```

// app/_layout.tsx
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';

export default function RootLayout() {
return (
<QueryClientProvider client={queryClient}>
<Stack screenOptions={{ headerShown: false }}>
<Stack.Screen name="(auth)" />
<Stack.Screen name="(tabs)" />
<Stack.Screen name="(modals)" options={{ presentation: 'modal' }} />
</Stack>
</QueryClientProvider>
);
}

```

#### Tabs Layout
```

// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Home, DollarSign, CheckSquare, MessageCircle, Settings } from 'lucide-react-native';

export default function TabsLayout() {
return (
<Tabs screenOptions={{ headerShown: false }}>
<Tabs.Screen
name="index"
options={{
title: 'Início',
tabBarIcon: ({ color }) => <Home size={24} color={color} />,
}}
/>
<Tabs.Screen
name="finances"
options={{
title: 'Finanças',
tabBarIcon: ({ color }) => <DollarSign size={24} color={color} />,
}}
/>
<Tabs.Screen
name="tasks"
options={{
title: 'Tarefas',
tabBarIcon: ({ color }) => <CheckSquare size={24} color={color} />,
}}
/>
<Tabs.Screen
name="luma"
options={{
title: 'Luma',
tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} />,
}}
/>
<Tabs.Screen
name="house"
options={{
title: 'Casa',
tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
}}
/>
</Tabs>
);
}

```

### 6. ANIMAÇÕES COM REANIMATED

#### Exemplo de Animação de Entrada
```

// components/ui/AnimatedCard.tsx
import Animated, {
FadeInDown,
FadeOutUp,
Layout,
} from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';

interface AnimatedCardProps {
children: React.ReactNode;
index: number;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({ children, index }) => {
return (
<Animated.View
entering={FadeInDown.delay(index * 100).springify()}
exiting={FadeOutUp.springify()}
layout={Layout.springify()}
style={styles.card}
>
{children}
</Animated.View>
);
};

const styles = StyleSheet.create({
card: {
backgroundColor: '\#fff',
borderRadius: 12,
padding: 16,
marginBottom: 12,
shadowColor: '\#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.1,
shadowRadius: 4,
elevation: 3,
},
});

```

### 7. TRATAMENTO DE ERROS

#### Error Boundary
```

// components/ErrorBoundary.tsx
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

interface Props {
children: React.ReactNode;
}

interface State {
hasError: boolean;
error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
constructor(props: Props) {
super(props);
this.state = { hasError: false };
}

static getDerivedStateFromError(error: Error): State {
return { hasError: true, error };
}

componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
console.error('Error caught by boundary:', error, errorInfo);
// Enviar para serviço de logging (Sentry, etc)
}

render() {
if (this.state.hasError) {
return (
<View style={styles.container}>
<Text style={styles.title}>Oops! Algo deu errado 😔</Text>
<Text style={styles.message}>
{this.state.error?.message || 'Erro desconhecido'}
</Text>
<Button
title="Tentar Novamente"
onPress={() => this.setState({ hasError: false })}
/>
</View>
);
}

    return this.props.children;
    }
}

const styles = StyleSheet.create({
container: {
flex: 1,
justifyContent: 'center',
alignItems: 'center',
padding: 20,
},
title: {
fontSize: 20,
fontWeight: 'bold',
marginBottom: 10,
},
message: {
fontSize: 14,
color: '\#666',
marginBottom: 20,
textAlign: 'center',
},
});

```

### 8. TESTES

#### Configuração Jest
```

// jest.config.js
module.exports = {
preset: 'jest-expo',
transformIgnorePatterns: [
'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
],
setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};

```

#### Exemplo de Teste
```

// __tests__/services/expense.service.test.ts
import { expenseService } from '@/services/expense.service';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase');

describe('ExpenseService', () => {
const mockHouseId = 'test-house-id';

beforeEach(() => {
jest.clearAllMocks();
});

it('should fetch all expenses for a house', async () => {
const mockExpenses = [
{ id: '1', amount: 100, description: 'Test' },
];

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockExpenses, error: null }),
    });
    
    const result = await expenseService.getAll(mockHouseId);
    expect(result).toEqual(mockExpenses);
    });
});

```

---

## PASSO A PASSO DE IMPLEMENTAÇÃO

### FASE 1: Setup Inicial (Semana 1)

#### 1.1 Criar Projeto
```


# Criar projeto Expo

npx create-expo-app@latest luma-app --template tabs

cd luma-app

# Instalar dependências principais

npx expo install expo-router react-native-safe-area-context react-native-screens

# Instalar Supabase

npm install @supabase/supabase-js

# Instalar Prisma

npm install prisma @prisma/client
npx prisma init

# Instalar gerenciamento de estado

npm install zustand @tanstack/react-query

# Instalar animações

npx expo install react-native-reanimated

# Instalar UI/UX

npm install lucide-react-native
npx expo install expo-haptics expo-blur

# Instalar utilitários

npm install axios zod date-fns

```

#### 1.2 Configurar TypeScript
```

// tsconfig.json
{
"extends": "expo/tsconfig.base",
"compilerOptions": {
"strict": true,
"baseUrl": ".",
"paths": {
"@/*": ["./*"]
}
}
}

```

#### 1.3 Configurar Variáveis de Ambiente
```


# .env.local

EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook

```

#### 1.4 Implementar Schema Prisma
- Copie o schema Prisma fornecido para `prisma/schema.prisma`
- Execute `npx prisma generate` para gerar o cliente

#### 1.5 Setup Supabase
- Crie projeto no Supabase
- Execute as migrations baseadas no schema Prisma
- Configure políticas RLS para cada tabela
- Configure autenticação (Email, Google, Apple)

### FASE 2: Autenticação (Semana 1-2)

#### 2.1 Criar Auth Store
```

// stores/auth.store.ts
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface AuthState {
user: User | null;
house: House | null;
loading: boolean;
signIn: (email: string, password: string) => Promise<void>;
signUp: (email: string, password: string, name: string) => Promise<void>;
signOut: () => Promise<void>;
setHouse: (house: House) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
user: null,
house: null,
loading: true,

signIn: async (email, password) => {
const { data, error } = await supabase.auth.signInWithPassword({
email,
password,
});
if (error) throw error;
set({ user: data.user });
},

signUp: async (email, password, name) => {
const { data, error } = await supabase.auth.signUp({
email,
password,
options: {
data: { name },
},
});
if (error) throw error;
set({ user: data.user });
},

signOut: async () => {
await supabase.auth.signOut();
set({ user: null, house: null });
},

setHouse: (house) => set({ house }),
}));

```

#### 2.2 Implementar Telas de Auth
- `app/(auth)/login.tsx`
- `app/(auth)/register.tsx`
- `app/(auth)/forgot-password.tsx`

### FASE 3: Dashboard e Navegação (Semana 2)

#### 3.1 Implementar Dashboard
```

// app/(tabs)/index.tsx
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAuthStore } from '@/stores/auth.store';
import { useExpenses } from '@/hooks/useExpenses';
import { useTasks } from '@/hooks/useTasks';

export default function DashboardScreen() {
const house = useAuthStore((state) => state.house);
const { data: expenses } = useExpenses(house?.id);
const { data: tasks } = useTasks(house?.id);

const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.amount, 0) ?? 0;
const pendingTasks = tasks?.filter(t => t.status === 'PENDING').length ?? 0;

return (
<ScrollView style={styles.container}>
```      <Text style={styles.greeting}>Olá, {house?.name}! 👋</Text>      ```

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Despesas deste mês</Text>
        <Text style={styles.cardValue}>R$ {totalExpenses.toFixed(2)}</Text>
      </View>
    
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tarefas pendentes</Text>
        <Text style={styles.cardValue}>{pendingTasks}</Text>
      </View>
    </ScrollView>
    );
}

```

### FASE 4: Gestão Financeira (Semana 3-4)

#### 4.1 Implementar Serviço de Despesas
- `services/expense.service.ts` (já exemplificado acima)

#### 4.2 Criar Hooks
```

// hooks/useExpenses.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseService } from '@/services/expense.service';

export const useExpenses = (houseId: string) => {
return useQuery({
queryKey: ['expenses', houseId],
queryFn: () => expenseService.getAll(houseId),
enabled: !!houseId,
});
};

export const useCreateExpense = () => {
const queryClient = useQueryClient();

return useMutation({
mutationFn: expenseService.create,
onSuccess: (_, variables) => {
queryClient.invalidateQueries({
queryKey: ['expenses', variables.house_id]
});
},
});
};

```

#### 4.3 Implementar Telas
- `app/(tabs)/finances/index.tsx` - Lista de despesas
- `app/(modals)/add-expense.tsx` - Modal adicionar despesa
- `app/(modals)/expense-detail.tsx` - Detalhes da despesa

### FASE 5: Gestão de Tarefas (Semana 5-6)

#### 5.1 Implementar Board Kanban
```

// app/(tabs)/tasks.tsx
import { View, ScrollView } from 'react-native';
import { useTasks } from '@/hooks/useTasks';
import { TaskColumn } from '@/components/features/tasks/TaskColumn';

export default function TasksScreen() {
const { data: tasks } = useTasks(houseId);

const pendingTasks = tasks?.filter(t => t.status === 'PENDING');
const inProgressTasks = tasks?.filter(t => t.status === 'IN_PROGRESS');
const completedTasks = tasks?.filter(t => t.status === 'COMPLETED');

return (
<ScrollView horizontal>
<TaskColumn title="Pendentes" tasks={pendingTasks} />
<TaskColumn title="Em Progresso" tasks={inProgressTasks} />
<TaskColumn title="Concluídas" tasks={completedTasks} />
</ScrollView>
);
}

```

#### 5.2 Implementar Drag & Drop (Opcional)
- Usar `react-native-gesture-handler` + `react-native-reanimated`

### FASE 6: Chat com Luma (Semana 7-8)

#### 6.1 Implementar Tela de Chat
```

// app/(tabs)/luma.tsx
import { useState } from 'react';
import { View, FlatList, TextInput, TouchableOpacity, Text } from 'react-native';
import { useLumaChat } from '@/hooks/useLumaChat';
import { useConversations } from '@/hooks/useConversations';

export default function LumaChatScreen() {
const [message, setMessage] = useState('');
const { data: conversations } = useConversations(houseId);
const { mutate: sendMessage, isPending } = useLumaChat(houseId, userId);

const handleSend = () => {
if (!message.trim()) return;
sendMessage(message);
setMessage('');
};

return (
<View style={{ flex: 1 }}>
<FlatList
data={conversations}
renderItem={({ item }) => (
<View>
<Text>{item.message}</Text>
<Text>{item.response}</Text>
</View>
)}
/>
<View style={{ flexDirection: 'row', padding: 10 }}>
<TextInput
value={message}
onChangeText={setMessage}
placeholder="Pergunte algo à Luma..."
style={{ flex: 1 }}
/>
<TouchableOpacity onPress={handleSend} disabled={isPending}>
<Text>Enviar</Text>
</TouchableOpacity>
</View>
</View>
);
}

```

### FASE 7: Gestão de Casa (Semana 9-10)

#### 7.1 Implementar CRUD de Membros
- Adicionar membro via código de convite
- Remover membro
- Alterar permissões

#### 7.2 Configurações da Casa
- Editar nome, foto, endereço
- Orçamento mensal
- Preferências de notificações

### FASE 8: Notificações e Real-time (Semana 11)

#### 8.1 Configurar Expo Notifications
```

// lib/notifications.ts
import * as Notifications from 'expo-notifications';

export const setupNotifications = async () => {
const { status } = await Notifications.requestPermissionsAsync();
if (status !== 'granted') return;

const token = await Notifications.getExpoPushTokenAsync();
// Salvar token no banco de dados
};

Notifications.setNotificationHandler({
handleNotification: async () => ({
shouldShowAlert: true,
shouldPlaySound: true,
shouldSetBadge: true,
}),
});

```

#### 8.2 Implementar Subscriptions Realtime
```

// hooks/useRealtimeExpenses.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useRealtimeExpenses = (houseId: string) => {
const queryClient = useQueryClient();

useEffect(() => {
const subscription = supabase
.channel(`expenses:${houseId}`)
.on('postgres_changes', {
event: '*',
schema: 'public',
table: 'expenses',
filter: `house_id=eq.${houseId}`,
}, () => {
queryClient.invalidateQueries({ queryKey: ['expenses', houseId] });
})
.subscribe();

    return () => {
      subscription.unsubscribe();
    };
    }, [houseId]);
};

```

### FASE 9: Testes e Otimizações (Semana 12)

#### 9.1 Implementar Testes Unitários
- Testar serviços
- Testar hooks
- Testar componentes

#### 9.2 Otimizar Performance
- Code splitting com lazy loading
- Memoização de componentes
- Virtualização de listas longas
- Otimização de imagens

#### 9.3 Preparar para Produção
- Configurar app.json
- Criar ícones e splash screens
- Configurar EAS Build
- Configurar CI/CD

---

## CHECKLIST DE QUALIDADE

Antes de considerar cada feature completa, verifique:

- [ ] TypeScript sem erros (sem `any`)
- [ ] Componentes com tratamento de loading e erro
- [ ] Animações suaves e responsivas
- [ ] Acessibilidade (labels, contrast ratio)
- [ ] Suporte a tema claro/escuro
- [ ] Testes unitários com cobertura > 70%
- [ ] RLS configurado corretamente
- [ ] Validação de formulários com Zod
- [ ] Feedback visual para ações do usuário
- [ ] Tratamento de edge cases
- [ ] Documentação inline (JSDoc)
- [ ] Performance (FPS > 60, bundle size otimizado)

---

## RECURSOS ADICIONAIS

### Documentação Oficial
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Supabase JavaScript](https://supabase.com/docs/reference/javascript/introduction)
- [React Query](https://tanstack.com/query/latest/docs/react/overview)
- [Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [Prisma](https://www.prisma.io/docs)

### Bibliotecas Recomendadas
- `zod` - Validação de schemas
- `react-hook-form` - Gerenciamento de formulários
- `date-fns` - Manipulação de datas
- `lucide-react-native` - Ícones
- `@gorhom/bottom-sheet` - Modais e bottom sheets

---

## COMANDOS ÚTEIS

```


# Desenvolvimento

npx expo start

# Build

eas build --platform ios
eas build --platform android

# Prisma

npx prisma generate
npx prisma migrate dev
npx prisma studio

# Supabase

supabase start
supabase db push
supabase functions deploy

# Testes

npm test
npm run test:coverage

# Lint

npm run lint
npm run lint:fix

```

---

## PRÓXIMOS PASSOS

Após implementar o MVP, priorize:

1. **Analytics**: Integrar Mixpanel/Amplitude
2. **Monitoring**: Configurar Sentry para error tracking
3. **Performance**: Implementar lazy loading de rotas
4. **Offline**: Adicionar suporte offline com AsyncStorage
5. **IoT**: Preparar infraestrutura para Phase 2
6. **Internacionalização**: i18n para múltiplos idiomas
7. **Temas**: Permitir customização de cores

---

# IMPORTANTE: COMO PROCEDER

1. **Leia TODO o prompt antes de começar**
2. **Siga a ordem das fases rigorosamente**
3. **Não pule etapas de configuração**
4. **Teste cada feature antes de prosseguir**
5. **Commit frequentemente com mensagens descritivas**
6. **Consulte os flowcharts para entender fluxos complexos**
7. **Priorize qualidade sobre velocidade**
8. **Documente decisões técnicas importantes**

Quando estiver pronto, comece pela **FASE 1: Setup Inicial**. Boa sorte! 🚀
```


***

## Arquivo `.cursorrules` (Opcional)

Para reforçar as regras no Cursor AI, crie um arquivo `.cursorrules` na raiz do projeto:

```yaml
# .cursorrules
rules:
  typescript:
    - No implicit any
    - Always use explicit return types for functions
    - Use interfaces for data models
    - Enable strict mode
  
  react-native:
    - Use functional components only
    - Apply React.memo for performance
    - Use hooks instead of class components
    - StyleSheet.create for all styles
  
  architecture:
    - Services layer for API calls
    - Zustand for global state
    - React Query for server state
    - Expo Router for navigation
  
  naming:
    - PascalCase for components
    - camelCase for functions and variables
    - UPPER_SNAKE_CASE for constants
    - kebab-case for file names
  
  security:
    - Never commit .env files
    - Always validate user input
    - Use RLS for all database queries
    - Sanitize data before rendering
  
  testing:
    - Write tests for all services
    - Mock external dependencies
    - Aim for >70% code coverage
```

Este prompt é completo e estruturado para guiar o Cursor AI através de todo o processo de desenvolvimento do aplicativo Luma de forma organizada e seguindo as melhores práticas da indústria.

