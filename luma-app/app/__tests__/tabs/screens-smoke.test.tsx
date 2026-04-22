import DashboardScreen from '@/app/(tabs)/index';
import NotificationsScreen from '@/app/(tabs)/notifications';
import TasksScreen from '@/app/(tabs)/tasks/index';
import TaskDetailsScreen from '@/app/(tabs)/tasks/[id]';
import FinancesScreen from '@/app/(tabs)/finances/index';
import FinanceDetailsScreen from '@/app/(tabs)/finances/[id]';
import FinancesReportsScreen from '@/app/(tabs)/finances/reports';
import FinancesBudgetScreen from '@/app/(tabs)/finances/budget';
import LumaScreen from '@/app/(tabs)/luma/index';
import ProfileScreen from '@/app/(tabs)/profile/index';
import HouseScreen from '@/app/(tabs)/house/index';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@/lib/n8n', () => ({
  n8nClient: {
    sendMessage: jest.fn().mockResolvedValue({ success: true, response: 'ok' }),
  },
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Error: 'error', Warning: 'warning' },
}));

jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

describe('Tabs screens smoke (module load)', () => {
  test('dashboard module exporta componente', () => {
    expect(typeof DashboardScreen).toBe('function');
  });

  test('notifications module exporta componente', () => {
    expect(typeof NotificationsScreen).toBe('function');
  });

  test('tasks index module exporta componente', () => {
    expect(typeof TasksScreen).toBe('function');
  });

  test('tasks detail module exporta componente', () => {
    expect(typeof TaskDetailsScreen).toBe('function');
  });

  test('finances index module exporta componente', () => {
    expect(typeof FinancesScreen).toBe('function');
  });

  test('finances detail module exporta componente', () => {
    expect(typeof FinanceDetailsScreen).toBe('function');
  });

  test('finances reports module exporta componente', () => {
    expect(typeof FinancesReportsScreen).toBe('function');
  });

  test('finances budget module exporta componente', () => {
    expect(typeof FinancesBudgetScreen).toBe('function');
  });

  test('luma module exporta componente', () => {
    expect(typeof LumaScreen).toBe('function');
  });

  test('profile module exporta componente', () => {
    expect(typeof ProfileScreen).toBe('function');
  });

  test('house module exporta componente', () => {
    expect(typeof HouseScreen).toBe('function');
  });
});
