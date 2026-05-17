import { computeAge } from '../user.service';

describe('computeAge', () => {
  const RealDate = Date;

  beforeEach(() => {
    // Fix "now" to 2026-06-15 for deterministic tests
    jest.useFakeTimers({ now: new Date('2026-06-15T12:00:00Z') });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns correct age for adult', () => {
    expect(computeAge('1990-03-01')).toBe(36);
  });

  it('returns correct age for minor', () => {
    expect(computeAge('2012-06-15')).toBe(14);
  });

  it('returns age-1 if birthday has not passed yet this year', () => {
    // born Dec 1 2010 → on June 15 2026, still 15 (birthday in Dec)
    expect(computeAge('2010-12-01')).toBe(15);
  });

  it('returns exact age on birthday', () => {
    // born June 15 2008 → exactly 18
    expect(computeAge('2008-06-15')).toBe(18);
  });

  it('returns null for invalid date', () => {
    expect(computeAge('not-a-date')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(computeAge('')).toBeNull();
  });

  it('returns 0 for newborn born today', () => {
    expect(computeAge('2026-06-15')).toBe(0);
  });

  it('returns 0 for baby born recently', () => {
    expect(computeAge('2026-01-01')).toBe(0);
  });
});
