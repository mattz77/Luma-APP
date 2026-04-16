import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { ScreenGreeting } from '@/components/ScreenGreeting';

jest.mock('@/components/ui/text', () => {
  const React = require('react');
  const { Text: RNText } = require('react-native');
  return {
    Text: ({ children, ...props }: { children?: React.ReactNode }) => <RNText {...props}>{children}</RNText>,
  };
});

describe('ScreenGreeting', () => {
  test('exibe Bom dia e nome formatado', () => {
    render(<ScreenGreeting firstName="maria" variant="bomDia" />);
    expect(screen.getByText(/Bom dia/)).toBeTruthy();
    expect(screen.getByText('Maria')).toBeTruthy();
  });

  test('usa Usuário quando nome vazio', () => {
    render(<ScreenGreeting firstName="   " variant="ola" />);
    expect(screen.getByText(/Olá/)).toBeTruthy();
    expect(screen.getByText('Usuário')).toBeTruthy();
  });
});
