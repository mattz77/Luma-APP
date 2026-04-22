import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
      })),
    },
  },
}));

jest.mock('@/lib/storage', () => ({
  pickImageFromGallery: jest.fn(),
  takePhoto: jest.fn(),
  uploadImageToStorage: jest.fn(),
  deleteImageFromStorage: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'SUCCESS' },
}));

jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
  Gesture: {
    Pan: () => ({
      activeOffsetY: () => ({
        onUpdate: () => ({
          onEnd: () => ({}),
        }),
      }),
    }),
  },
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/components/forms/DatePickerBrazilianField', () => ({
  DatePickerBrazilianField: ({
    valueIso,
    onChangeIso,
  }: {
    valueIso: string;
    onChangeIso: (v: string) => void;
  }) => {
    const { TextInput } = jest.requireActual('react-native');
    return (
      <TextInput
        testID="date-picker"
        value={valueIso}
        onChangeText={onChangeIso}
        accessibilityLabel="Data da despesa"
      />
    );
  },
}));

jest.mock('@/lib/useBottomSheetBackdropFadeStyle', () => ({
  useBottomSheetBackdropFadeStyle: () => ({}),
}));

jest.mock('@/components/ui/luma-modal-overlay', () => ({
  LumaModalOverlay: () => null,
}));

import { ExpenseFormModal, ExpenseFormResult } from '../ExpenseFormModal';
import type { ExpenseCategory, HouseMemberWithUser } from '@/types/models';

const mockCategories: ExpenseCategory[] = [
  { id: 'cat-1', houseId: 'house-1', name: 'Alimentação', icon: 'utensils', color: '#ff0000', createdAt: '2024-01-01' },
  { id: 'cat-2', houseId: 'house-1', name: 'Transporte', icon: 'car', color: '#00ff00', createdAt: '2024-01-01' },
];

const mockMembers: HouseMemberWithUser[] = [
  {
    id: 'member-1',
    houseId: 'house-1',
    userId: 'user-1',
    role: 'admin',
    status: 'active',
    invitedBy: null,
    joinedAt: '2024-01-01',
    leftAt: null,
    createdAt: '2024-01-01',
    user: { id: 'user-1', email: 'user1@test.com', name: 'User 1', avatarUrl: null, phone: null },
  },
  {
    id: 'member-2',
    houseId: 'house-1',
    userId: 'user-2',
    role: 'member',
    status: 'active',
    invitedBy: 'user-1',
    joinedAt: '2024-01-02',
    leftAt: null,
    createdAt: '2024-01-02',
    user: { id: 'user-2', email: 'user2@test.com', name: 'User 2', avatarUrl: null, phone: null },
  },
];

describe('ExpenseFormModal', () => {
  const defaultProps = {
    visible: true,
    mode: 'create' as const,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    categories: mockCategories,
    members: mockMembers,
    currentUserId: 'user-1',
    isSubmitting: false,
    isDeleting: false,
    onCreateCategory: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validação de inputs', () => {
    test('exibe erro quando descrição está vazia', async () => {
      const onSubmit = jest.fn();
      render(<ExpenseFormModal {...defaultProps} onSubmit={onSubmit} />);

      const submitButton = screen.getByText('Adicionar despesa');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Descreva a despesa.')).toBeTruthy();
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    test('exibe erro quando valor é zero ou inválido', async () => {
      const onSubmit = jest.fn();
      render(<ExpenseFormModal {...defaultProps} onSubmit={onSubmit} />);

      const descriptionInput = screen.getByPlaceholderText('Ex: Mercado do mês');
      fireEvent.changeText(descriptionInput, 'Teste');

      const submitButton = screen.getByText('Adicionar despesa');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Informe um valor válido.')).toBeTruthy();
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    test('exibe erro quando data é inválida', async () => {
      const onSubmit = jest.fn();
      render(<ExpenseFormModal {...defaultProps} onSubmit={onSubmit} />);

      const descriptionInput = screen.getByPlaceholderText('Ex: Mercado do mês');
      fireEvent.changeText(descriptionInput, 'Teste');

      const valueInput = screen.getByLabelText('Valor da despesa em reais');
      fireEvent.changeText(valueInput, '10000'); // R$ 100,00

      const dateInput = screen.getByTestId('date-picker');
      fireEvent.changeText(dateInput, 'invalid-date');

      const submitButton = screen.getByText('Adicionar despesa');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Informe uma data válida.')).toBeTruthy();
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    test('exibe erro quando soma das cotas é diferente do total', async () => {
      const onSubmit = jest.fn();
      render(<ExpenseFormModal {...defaultProps} onSubmit={onSubmit} />);

      const descriptionInput = screen.getByPlaceholderText('Ex: Mercado do mês');
      fireEvent.changeText(descriptionInput, 'Teste');

      const valueInput = screen.getByLabelText('Valor da despesa em reais');
      fireEvent.changeText(valueInput, '10000'); // R$ 100,00

      const memberButtons = screen.getAllByText('User 2');
      fireEvent.press(memberButtons[0]);

      const user1ShareInput = screen.getByLabelText('Cota em reais de User 1');
      fireEvent.changeText(user1ShareInput, '3000'); // R$ 30,00

      const user2ShareInput = screen.getByLabelText('Cota em reais de User 2');
      fireEvent.changeText(user2ShareInput, '5000'); // R$ 50,00 (soma = 80, deveria ser 100)

      const submitButton = screen.getByText('Adicionar despesa');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('A soma das cotas deve ser igual ao valor total da despesa.')).toBeTruthy();
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Proteção contra double-submit', () => {
    test('desabilita botão durante submissão', () => {
      render(<ExpenseFormModal {...defaultProps} isSubmitting={true} />);

      const submitButton = screen.getByText('Salvando...');
      expect(submitButton).toBeTruthy();
    });

    test('desabilita botão durante upload de imagem', () => {
      const { rerender } = render(<ExpenseFormModal {...defaultProps} />);

      rerender(<ExpenseFormModal {...defaultProps} isSubmitting={true} />);

      expect(screen.getByText('Salvando...')).toBeTruthy();
    });
  });

  describe('Happy path', () => {
    test('submete formulário com dados válidos e cotas iguais', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      render(<ExpenseFormModal {...defaultProps} onSubmit={onSubmit} />);

      const descriptionInput = screen.getByPlaceholderText('Ex: Mercado do mês');
      fireEvent.changeText(descriptionInput, 'Compras do mês');

      const valueInput = screen.getByLabelText('Valor da despesa em reais');
      fireEvent.changeText(valueInput, '15000'); // R$ 150,00

      const shareInput = screen.getByLabelText('Cota em reais de User 1');
      fireEvent.changeText(shareInput, '15000'); // R$ 150,00

      const submitButton = screen.getByText('Adicionar despesa');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Compras do mês',
            amount: 150,
          }),
        );
      });
    });
  });

  describe('Tratamento de erros', () => {
    test('callback onSubmit é chamado quando dados são válidos', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      render(<ExpenseFormModal {...defaultProps} onSubmit={onSubmit} />);

      const descriptionInput = screen.getByPlaceholderText('Ex: Mercado do mês');
      fireEvent.changeText(descriptionInput, 'Teste');

      const valueInput = screen.getByLabelText('Valor da despesa em reais');
      fireEvent.changeText(valueInput, '10000'); // R$ 100,00

      const shareInput = screen.getByLabelText('Cota em reais de User 1');
      fireEvent.changeText(shareInput, '10000'); // R$ 100,00

      const submitButton = screen.getByText('Adicionar despesa');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Modal de exclusão', () => {
    test('botão excluir aparece em modo edição', async () => {
      const onDelete = jest.fn();
      render(
        <ExpenseFormModal
          {...defaultProps}
          mode="edit"
          initialExpense={{
            id: 'exp-1',
            houseId: 'house-1',
            description: 'Despesa teste',
            amount: 100,
            expenseDate: '2024-01-15',
            categoryId: 'cat-1',
            isPaid: false,
            notes: null,
            receiptUrl: null,
            createdAt: '2024-01-01',
            createdBy: 'user-1',
            splits: [],
          }}
          onDelete={onDelete}
        />,
      );

      expect(screen.getByText('Excluir')).toBeTruthy();
    });
  });

  describe('Seleção de membros', () => {
    test('adicionar segundo membro cria campo de cota para ele', async () => {
      render(<ExpenseFormModal {...defaultProps} />);

      expect(screen.getByLabelText('Cota em reais de User 1')).toBeTruthy();
      expect(screen.queryByLabelText('Cota em reais de User 2')).toBeNull();

      const memberButtons = screen.getAllByText('User 2');
      fireEvent.press(memberButtons[0]);

      expect(screen.getByLabelText('Cota em reais de User 2')).toBeTruthy();
    });

    test('distribui valores igualmente ao clicar no botão', async () => {
      render(<ExpenseFormModal {...defaultProps} />);

      const valueInput = screen.getByLabelText('Valor da despesa em reais');
      fireEvent.changeText(valueInput, '10000'); // R$ 100,00

      const memberButtons = screen.getAllByText('User 2');
      fireEvent.press(memberButtons[0]);

      const distributeButton = screen.getByText('Distribuir igualmente');
      fireEvent.press(distributeButton);

      expect(screen.getByLabelText('Cota em reais de User 1')).toBeTruthy();
      expect(screen.getByLabelText('Cota em reais de User 2')).toBeTruthy();
    });
  });
});
