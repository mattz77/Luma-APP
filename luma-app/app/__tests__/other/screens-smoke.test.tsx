import LandingScreen from '@/app/landing';
import ActivityHistoryScreen from '@/app/activity-history';
import NotFoundScreen from '@/app/+not-found';

describe('Other screens smoke (module load)', () => {
  test('landing module exporta componente', () => {
    expect(typeof LandingScreen).toBe('function');
  });

  test('activity history module exporta componente', () => {
    expect(typeof ActivityHistoryScreen).toBe('function');
  });

  test('not-found module exporta componente', () => {
    expect(typeof NotFoundScreen).toBe('function');
  });
});
