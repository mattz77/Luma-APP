import React from 'react';
import { TouchableOpacity } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';

import { AuthInput } from '@/components/auth/AuthInput';

// Mocks dos primitivos GlueStack -> componentes RN simples, para querys estáveis.
jest.mock('@/components/ui/input', () => {
  const ReactLib = require('react');
  const { View, TextInput } = require('react-native');
  return {
    Input: ({ children }: { children?: React.ReactNode }) =>
      ReactLib.createElement(View, null, children),
    InputSlot: ({ children }: { children?: React.ReactNode }) =>
      ReactLib.createElement(View, null, children),
    InputIcon: ({ children }: { children?: React.ReactNode }) =>
      ReactLib.createElement(View, null, children),
    InputField: (props: Record<string, unknown>) =>
      ReactLib.createElement(TextInput, props),
  };
});

jest.mock('@/components/ui/icon', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  return { Icon: () => ReactLib.createElement(View, null) };
});

jest.mock('@/components/ui/vstack', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  return {
    VStack: ({ children }: { children?: React.ReactNode }) =>
      ReactLib.createElement(View, null, children),
  };
});

jest.mock('lucide-react-native', () => ({
  User: 'User',
  Mail: 'Mail',
  Lock: 'Lock',
  Eye: 'Eye',
  EyeOff: 'EyeOff',
}));

const baseProps = {
  label: 'E-mail',
  value: '',
  onChangeText: jest.fn(),
  testID: 'auth-input',
};

describe('AuthInput', () => {
  test('usa o label como placeholder padrão', () => {
    render(<AuthInput {...baseProps} />);
    expect(screen.getByPlaceholderText('E-mail')).toBeTruthy();
  });

  test('respeita placeholder explícito quando fornecido', () => {
    render(<AuthInput {...baseProps} placeholder="seu@email.com" />);
    expect(screen.getByPlaceholderText('seu@email.com')).toBeTruthy();
  });

  test('propaga onChangeText', () => {
    const onChangeText = jest.fn();
    render(<AuthInput {...baseProps} onChangeText={onChangeText} />);
    fireEvent.changeText(screen.getByTestId('auth-input'), 'novo@email.com');
    expect(onChangeText).toHaveBeenCalledWith('novo@email.com');
  });

  test('campo de senha começa com secureTextEntry e alterna ao tocar no olho', () => {
    render(<AuthInput {...baseProps} label="Senha" type="password" testID="pwd" />);
    const field = screen.getByTestId('pwd');
    expect(field.props.secureTextEntry).toBe(true);

    fireEvent.press(screen.UNSAFE_getByType(TouchableOpacity));
    expect(screen.getByTestId('pwd').props.secureTextEntry).toBe(false);
  });

  test('campos não-senha não renderizam o toggle de visibilidade', () => {
    render(<AuthInput {...baseProps} type="email" />);
    expect(screen.UNSAFE_queryByType(TouchableOpacity)).toBeNull();
  });

  test('email define keyboardType email-address por padrão', () => {
    render(<AuthInput {...baseProps} type="email" />);
    expect(screen.getByTestId('auth-input').props.keyboardType).toBe('email-address');
  });

  test('keyboardType explícito sobrepõe o derivado do type', () => {
    render(<AuthInput {...baseProps} type="email" keyboardType="numeric" />);
    expect(screen.getByTestId('auth-input').props.keyboardType).toBe('numeric');
  });

  test('variant authDark renderiza o label em texto', () => {
    render(<AuthInput {...baseProps} label="E-mail" variant="authDark" />);
    expect(screen.getByText('E-mail')).toBeTruthy();
    expect(screen.getByTestId('auth-input')).toBeTruthy();
  });

  test('variant authDark com senha também alterna a visibilidade', () => {
    render(
      <AuthInput {...baseProps} label="Senha" type="password" variant="authDark" testID="pwd-dark" />
    );
    const field = screen.getByTestId('pwd-dark');
    expect(field.props.secureTextEntry).toBe(true);
    fireEvent.press(screen.UNSAFE_getByType(TouchableOpacity));
    expect(screen.getByTestId('pwd-dark').props.secureTextEntry).toBe(false);
  });
});
