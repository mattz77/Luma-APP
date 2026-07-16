import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { render, screen, act } from '@testing-library/react-native';

import { AuthHeader } from '@/components/auth/AuthHeader';

// Flusha o efeito assíncrono (AccessibilityInfo.isReduceMotionEnabled().then(setState))
// dentro de act() para evitar update fora de act após o render.
const flushEffects = () => act(async () => {});

// react-native-reanimated já é mockado globalmente em test/setup/jest-setup.ts.
jest.mock('react-native-svg', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  const passthrough = (name: string) => {
    const C = ({ children }: { children?: React.ReactNode }) =>
      ReactLib.createElement(View, null, children);
    C.displayName = name;
    return C;
  };
  const Svg = passthrough('Svg');
  return {
    __esModule: true,
    default: Svg,
    Svg,
    Circle: passthrough('Circle'),
    Defs: passthrough('Defs'),
    LinearGradient: passthrough('LinearGradient'),
    Stop: passthrough('Stop'),
  };
});

describe('AuthHeader', () => {
  // jest-expo expõe isReduceMotionEnabled como fn que retorna undefined; o componente
  // chama `.then(...)` sobre o retorno, entao garantimos uma Promise resolvida.
  beforeEach(() => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  });

  test('renderiza brandName e tagline', async () => {
    render(<AuthHeader brandName="Luma" tagline="Sua vida financeira, clara" />);
    await flushEffects();
    expect(screen.getByText('Luma')).toBeTruthy();
    expect(screen.getByText('Sua vida financeira, clara')).toBeTruthy();
  });

  test('brandName tem accessibilityRole header', async () => {
    render(<AuthHeader brandName="Luma" tagline="tag" />);
    await flushEffects();
    expect(screen.getByRole('header', { name: 'Luma' })).toBeTruthy();
  });

  test('renderiza o logo (Image acessível)', async () => {
    render(<AuthHeader brandName="Luma" tagline="tag" />);
    await flushEffects();
    const images = screen.UNSAFE_getAllByType(require('react-native').Image);
    expect(images.length).toBeGreaterThan(0);
  });
});
