import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';

/**
 * Fluxo mínimo: toque em botão altera estado visível (substituto leve de modal CRUD com mocks pesados).
 */
function CounterDemo() {
  const [count, setCount] = useState(0);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="incrementar" onPress={() => setCount((c) => c + 1)}>
      <Text>contagem:{count}</Text>
    </Pressable>
  );
}

describe('fluxo de interação (happy path)', () => {
  test('pressionar botão atualiza texto', () => {
    render(<CounterDemo />);
    expect(screen.getByText('contagem:0')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('incrementar'));
    expect(screen.getByText('contagem:1')).toBeTruthy();
  });
});
