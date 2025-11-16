import { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type { ExpenseCategory } from '@/types/models';

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

  const handleCreate = async () => {
    if (!newCategoryName.trim()) {
      return;
    }
    setLoading(true);
    try {
      await onCreate(newCategoryName.trim());
      setNewCategoryName('');
    } catch (error) {
      Alert.alert('Erro', (error as Error).message);
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
    try {
      await onUpdate(id, name.trim());
      setEditing((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (error) {
      Alert.alert('Erro', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Excluir categoria', `Deseja remover a categoria "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await onDelete(id);
          } catch (error) {
            Alert.alert('Erro', (error as Error).message);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <Modal animationType="slide" visible={visible} transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <Text style={styles.title}>Categorias de despesa</Text>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {categories.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma categoria cadastrada.</Text>
            ) : (
              categories.map((category) => {
                const isEditing = editing[category.id] !== undefined;
                return (
                  <View key={category.id} style={styles.categoryRow}>
                    <TextInput
                      value={isEditing ? editing[category.id] : category.name}
                      onChangeText={(value) =>
                        setEditing((prev) => ({
                          ...prev,
                          [category.id]: value,
                        }))
                      }
                      style={[styles.input, styles.flex1]}
                      editable={!loading}
                    />
                    {isEditing ? (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.saveButton]}
                        onPress={() => handleUpdate(category.id)}
                        disabled={loading}
                      >
                        <Text style={styles.saveButtonText}>Salvar</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() =>
                          setEditing((prev) => ({
                            ...prev,
                            [category.id]: category.name,
                          }))
                        }
                        disabled={loading}
                      >
                        <Text style={styles.editButtonText}>Editar</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDelete(category.id, category.name)}
                      disabled={loading}
                    >
                      <Text style={styles.deleteButtonText}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>

          <View style={styles.newCategoryRow}>
            <TextInput
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              style={[styles.input, styles.flex1]}
              placeholder="Nova categoria"
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleCreate}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>Adicionar</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose} disabled={loading}>
            <Text style={styles.closeButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    maxHeight: '85%',
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    fontSize: 14,
  },
  flex1: {
    flex: 1,
  },
  actionButton: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  editButton: {
    backgroundColor: '#dbeafe',
  },
  editButtonText: {
    color: '#1d4ed8',
    fontWeight: '600',
    fontSize: 13,
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  deleteButtonText: {
    color: '#b91c1c',
    fontWeight: '600',
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: '#22c55e',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  newCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeButton: {
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
});

