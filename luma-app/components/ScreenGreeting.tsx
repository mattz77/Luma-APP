import React from 'react';
import { Text } from '@/components/ui/text';

type ScreenGreetingProps = {
  /** Primeiro nome (ou string vazia para usar "Usuário"). */
  firstName: string;
  variant: 'ola' | 'bomDia';
};

function formatFirstName(raw: string): string {
  const t = raw.trim();
  if (!t) return 'Usuário';
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

/**
 * Saudação do cabeçalho (Finanças / Tarefas / Orçamento): legível, sem caps lock,
 * com o nome em destaque.
 */
export function ScreenGreeting({ firstName, variant }: ScreenGreetingProps) {
  const name = formatFirstName(firstName);
  const prefix = variant === 'bomDia' ? 'Bom dia,' : 'Olá,';
  return (
    <Text className="text-sm text-slate-600 font-medium mb-1.5 leading-5">
      {prefix}{' '}
      <Text className="font-semibold text-slate-900">{name}</Text>!
    </Text>
  );
}
