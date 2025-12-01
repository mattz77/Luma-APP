import { useState } from 'react';
import type { ExpenseCategory } from '@/types/models';

// Gluestack UI v3 imports
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalBody,
  ModalHeader,
  ModalFooter,
} from '@/components/ui/modal';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText } from '@/components/ui/button';
import { ScrollView } from '@/components/ui/scroll-view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Alert, AlertText } from '@/components/ui/alert';

interface CategoryManagerModalProps {
  visible: boolean;
  categories: ExpenseCategory[];
  onClose: () => void;
  onCreate: (name: string) => Promise<unknown>;
  onUpdate: (id: string, name: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

export function CategoryManagerModal({
  visible,
  categories,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: CategoryManagerModalProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleCreate = async () => {
    if (!newCategoryName.trim()) {
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      await onCreate(newCategoryName.trim());
      setNewCategoryName('');
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    const name = editing[id];
    if (!name || !name.trim()) {
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      await onUpdate(id, name.trim());
      setEditing((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setCategoryToDelete({ id, name });
    setShowDeleteAlert(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      await onDelete(categoryToDelete.id);
      setShowDeleteAlert(false);
      setCategoryToDelete(null);
    } catch (error) {
      setErrorMessage((error as Error).message);
      setShowDeleteAlert(false);
      setCategoryToDelete(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={visible} onClose={onClose} size="md">
        <ModalBackdrop />
        <ModalContent className="bg-background-0 rounded-[18px] p-5 max-h-[85%]">
          <ModalHeader>
            <Heading size="lg" className="text-center">
              Categorias de despesa
            </Heading>
          </ModalHeader>
          <ModalBody>
            <ScrollView>
              <VStack space="md" className="pb-2">
                {categories.length === 0 ? (
                  <Text size="sm" className="text-typography-500 text-center">
                    Nenhuma categoria cadastrada.
                  </Text>
                ) : (
                  categories.map((category) => {
                    const isEditing = editing[category.id] !== undefined;
                    return (
                      <HStack key={category.id} space="sm" className="items-center">
                        <Input className="flex-1">
                          <InputField
                            value={isEditing ? editing[category.id] : category.name}
                            onChangeText={(value) =>
                              setEditing((prev) => ({
                                ...prev,
                                [category.id]: value,
                              }))
                            }
                            editable={!loading}
                          />
                        </Input>
                        {isEditing ? (
                          <Button
                            size="sm"
                            action="positive"
                            onPress={() => handleUpdate(category.id)}
                            disabled={loading}
                          >
                            <ButtonText>Salvar</ButtonText>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            action="primary"
                            onPress={() =>
                              setEditing((prev) => ({
                                ...prev,
                                [category.id]: category.name,
                              }))
                            }
                            disabled={loading}
                          >
                            <ButtonText>Editar</ButtonText>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          action="negative"
                          variant="outline"
                          onPress={() => handleDelete(category.id, category.name)}
                          disabled={loading}
                        >
                          <ButtonText>Excluir</ButtonText>
                        </Button>
                      </HStack>
                    );
                  })
                )}
              </VStack>
            </ScrollView>
          </ModalBody>
          <ModalFooter>
            <VStack space="md" className="w-full">
              <HStack space="sm" className="items-center">
                <Input className="flex-1">
                  <InputField
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    placeholder="Nova categoria"
                    editable={!loading}
                  />
                </Input>
                <Button
                  size="sm"
                  action="positive"
                  onPress={handleCreate}
                  disabled={loading}
                >
                  <ButtonText>Adicionar</ButtonText>
                </Button>
              </HStack>
              {errorMessage && (
                <Alert action="error" variant="solid">
                  <AlertText>{errorMessage}</AlertText>
                </Alert>
              )}
              <Button variant="outline" action="secondary" onPress={onClose} disabled={loading} className="w-full">
                <ButtonText>Fechar</ButtonText>
              </Button>
            </VStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Alert Dialog for Delete Confirmation */}
      <AlertDialog isOpen={showDeleteAlert} onClose={() => setShowDeleteAlert(false)}>
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Heading size="lg">Excluir categoria</Heading>
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text>
              Deseja remover a categoria "{categoryToDelete?.name}"?
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button variant="outline" action="secondary" onPress={() => setShowDeleteAlert(false)}>
              <ButtonText>Cancelar</ButtonText>
            </Button>
            <Button action="negative" onPress={confirmDelete} disabled={loading}>
              <ButtonText>{loading ? 'Removendo...' : 'Remover'}</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
