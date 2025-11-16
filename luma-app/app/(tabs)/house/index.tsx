import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useCreateHouse,
  useHouseMembers,
  useJoinHouse,
  useLeaveHouse,
  useRemoveMember,
  useUpdateMemberRole,
  useUserHouses,
} from '@/hooks/useHouses';
import { cardShadowStyle } from '@/lib/styles';
import { useAuthStore } from '@/stores/auth.store';
import type { HouseMemberRole, HouseMemberWithUser } from '@/types/models';

const ROLE_LABELS: Record<HouseMemberRole, string> = {
  ADMIN: 'Admin',
  MEMBER: 'Membro',
  VIEWER: 'Visualizador',
};

const formatRole = (role: HouseMemberRole) => ROLE_LABELS[role] ?? 'Membro';

export default function HouseScreen() {
  const user = useAuthStore((state) => state.user);
  const houseId = useAuthStore((state) => state.houseId);
  const setHouseId = useAuthStore((state) => state.setHouseId);
  const signOut = useAuthStore((state) => state.signOut);
  const { top } = useSafeAreaInsets();
  const router = useRouter();

  const { data: houses = [], isLoading: housesLoading } = useUserHouses(user?.id);
  const { data: members = [], isLoading: membersLoading } = useHouseMembers(houseId);

  const createHouseMutation = useCreateHouse(user?.id);
  const joinHouseMutation = useJoinHouse(user?.id);
  const removeMemberMutation = useRemoveMember(houseId, user?.id);
  const leaveHouseMutation = useLeaveHouse(houseId, user?.id);
  const updateMemberRoleMutation = useUpdateMemberRole(houseId, user?.id);

  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [isJoinModalVisible, setJoinModalVisible] = useState(false);
  const [houseNameInput, setHouseNameInput] = useState('');
  const [houseAddressInput, setHouseAddressInput] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');

  const currentHouse = useMemo(
    () => houses.find((item) => item.house.id === houseId) ?? null,
    [houses, houseId],
  );

  const isAdmin = currentHouse?.membership.role === 'ADMIN';

  useEffect(() => {
    if (!houses.length) {
      setHouseId(null);
      return;
    }

    if (!houseId) {
      setHouseId(houses[0].house.id);
      return;
    }

    const exists = houses.some((item) => item.house.id === houseId);
    if (!exists) {
      setHouseId(houses[0].house.id);
    }
  }, [houses, houseId, setHouseId]);

  const handleRemoveMember = (member: HouseMemberWithUser) => {
    if (member.userId === user?.id) {
      handleLeaveHouse();
      return;
    }

    Alert.alert(
      'Remover membro',
      `Deseja remover ${member.user.name ?? member.user.email} da casa?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMemberMutation.mutateAsync(member.id);
            } catch (error) {
              Alert.alert('Erro', (error as Error).message);
            }
          },
        },
      ],
    );
  };

  const handleUpdateRole = (member: HouseMemberWithUser) => {
    const currentRole = member.role;
    const newRole = currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN';

    Alert.alert(
      'Alterar permissão',
      `Deseja alterar a permissão de ${member.user.name ?? member.user.email} para ${ROLE_LABELS[newRole]}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await updateMemberRoleMutation.mutateAsync({
                membershipId: member.id,
                role: newRole,
              });
            } catch (error) {
              Alert.alert('Erro', (error as Error).message);
            }
          },
        },
      ],
    );
  };

  const handleLeaveHouse = () => {
    if (!houseId) {
      return;
    }

    Alert.alert('Sair da casa', 'Tem certeza que deseja sair desta casa?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveHouseMutation.mutateAsync();
            setHouseId(null);
          } catch (error) {
            Alert.alert('Erro', (error as Error).message);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingTop: top + 16 }]}
    >
      <Text style={styles.title}>Casa & Membros</Text>
      <Text style={styles.subtitle}>
        Gerencie convites, papéis, dispositivos e configurações gerais da residência.
      </Text>

      <View style={[styles.sectionCard, cardShadowStyle]}>
        <Text style={styles.sectionTitle}>Minhas casas</Text>
        {housesLoading ? (
          <ActivityIndicator />
        ) : houses.length === 0 ? (
          <Text style={styles.helperText}>
            Você ainda não faz parte de nenhuma casa. Crie uma nova ou entre com um código de convite.
          </Text>
        ) : (
          <View style={styles.houseList}>
            {houses.map(({ house, membership }) => (
              <TouchableOpacity
                key={house.id}
                style={[
                  styles.houseListItem,
                  house.id === houseId && styles.houseListItemActive,
                ]}
                onPress={() => setHouseId(house.id)}
              >
                <View>
                  <Text style={styles.houseName}>{house.name}</Text>
                  <Text style={styles.houseMeta}>
                    {membership.role === 'ADMIN' ? 'Admin' : 'Membro'} ·{' '}
                    {new Date(membership.joinedAt).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => {
              setHouseNameInput('');
              setHouseAddressInput('');
              setCreateModalVisible(true);
            }}
          >
            <Text style={styles.primaryActionText}>Criar nova casa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => {
              setInviteCodeInput('');
              setJoinModalVisible(true);
            }}
          >
            <Text style={styles.secondaryActionText}>Entrar com código</Text>
          </TouchableOpacity>
        </View>
      </View>

      {currentHouse ? (
        <>
          <View style={[styles.card, cardShadowStyle]}>
            <Text style={styles.cardTitle}>Contexto atual</Text>
            <Text style={styles.helperText}>Usuário autenticado: {user?.email ?? 'não identificado'}</Text>
            <Text style={styles.helperText}>Casa selecionada: {currentHouse.house.name}</Text>
            <TouchableOpacity
              onPress={async () => {
                const invite = currentHouse.house.inviteCode;
                try {
                  if (Platform.OS === 'web' && navigator?.clipboard) {
                    await navigator.clipboard.writeText(invite);
                    Alert.alert('Convite', 'Código copiado para a área de transferência.');
                  } else {
                    Alert.alert('Convite', `Compartilhe este código: ${invite}`);
                  }
                } catch {
                  Alert.alert('Convite', `Código: ${invite}`);
                }
              }}
            >
              <Text style={styles.inviteCode}>
                Código de convite: <Text style={styles.inviteCodeValue}>{currentHouse.house.inviteCode}</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, cardShadowStyle]}>
            <Text style={styles.cardTitle}>Membros</Text>
            {membersLoading ? (
              <ActivityIndicator />
            ) : members.length === 0 ? (
              <Text style={styles.helperText}>Nenhum membro encontrado.</Text>
            ) : (
              members.map((member) => (
                <View key={member.id} style={styles.memberRow}>
                  <View>
                    <Text style={styles.memberName}>{member.user.name ?? member.user.email}</Text>
                    <Text style={styles.memberMeta}>
                      {member.user.email} · {formatRole(member.role)}
                    </Text>
                  </View>
                  <View style={styles.memberActions}>
                    {member.userId === user?.id ? (
                      <TouchableOpacity onPress={handleLeaveHouse}>
                        <Text style={styles.leaveLink}>Sair</Text>
                      </TouchableOpacity>
                    ) : isAdmin ? (
                      <>
                        <TouchableOpacity onPress={() => handleUpdateRole(member)}>
                          <Text style={styles.roleLink}>
                            {member.role === 'ADMIN' ? 'Tornar Membro' : 'Tornar Admin'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleRemoveMember(member)}>
                          <Text style={styles.removeLink}>Remover</Text>
                        </TouchableOpacity>
                      </>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      ) : null}

      <View style={[styles.card, cardShadowStyle]}>
        <Text style={styles.cardTitle}>Checklist inicial</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Implementar listagem de membros com papéis.</Text>
          <Text style={styles.listItem}>• Gerar e compartilhar códigos de convite.</Text>
          <Text style={styles.listItem}>• Preparar sessão para dispositivos IoT (fase 2).</Text>
        </View>
      </View>

      <View style={[styles.card, cardShadowStyle]}>
        <Text style={styles.cardTitle}>Sessão</Text>
        <Text style={styles.helperText}>
          Encerre sua sessão neste dispositivo. Você poderá entrar novamente com seu e-mail e senha.
        </Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            try {
              await signOut();
              router.replace('/login');
            } catch (error) {
              Alert.alert('Erro ao sair', (error as Error).message);
            }
          }}
        >
          <Text style={styles.logoutButtonText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={isCreateModalVisible}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Criar nova casa</Text>
            <TextInput
              value={houseNameInput}
              onChangeText={setHouseNameInput}
              placeholder="Nome da casa"
              style={styles.modalInput}
            />
            <TextInput
              value={houseAddressInput}
              onChangeText={setHouseAddressInput}
              placeholder="Endereço (opcional)"
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondary}
                onPress={() => setCreateModalVisible(false)}
                disabled={createHouseMutation.isPending}
              >
                <Text style={styles.modalSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimary}
                onPress={async () => {
                  if (!houseNameInput.trim()) {
                    Alert.alert('Campos obrigatórios', 'Informe um nome para a casa.');
                    return;
                  }

                  try {
                    const house = await createHouseMutation.mutateAsync({
                      creatorUserId: user!.id,
                      name: houseNameInput,
                      address: houseAddressInput ? houseAddressInput : null,
                    });
                    
                    // Aguarda um pouco para garantir que o membro foi adicionado
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    setCreateModalVisible(false);
                    setHouseNameInput('');
                    setHouseAddressInput('');
                    
                    // Define o houseId antes de invalidar o cache
                    setHouseId(house.id);
                    
                    // Aguarda a invalidação do cache antes de mostrar o alerta
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    Alert.alert(
                      'Casa criada',
                      `Convide membros utilizando o código ${house.inviteCode}.`,
                    );
                  } catch (error) {
                    console.error('Erro ao criar casa:', error);
                    Alert.alert('Erro ao criar casa', (error as Error).message);
                  }
                }}
              >
                <Text style={styles.modalPrimaryText}>
                  {createHouseMutation.isPending ? 'Salvando...' : 'Criar casa'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={isJoinModalVisible}
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Entrar com código</Text>
            <TextInput
              value={inviteCodeInput}
              onChangeText={setInviteCodeInput}
              autoCapitalize="none"
              placeholder="Código de convite"
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondary}
                onPress={() => setJoinModalVisible(false)}
                disabled={joinHouseMutation.isPending}
              >
                <Text style={styles.modalSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimary}
                onPress={async () => {
                  if (!inviteCodeInput.trim()) {
                    Alert.alert('Campos obrigatórios', 'Informe o código de convite.');
                    return;
                  }

                  try {
                    const house = await joinHouseMutation.mutateAsync({
                      inviteCode: inviteCodeInput.trim(),
                    });
                    setJoinModalVisible(false);
                    setInviteCodeInput('');
                    setHouseId(house.id);
                    Alert.alert('Bem-vindo!', `Agora você faz parte da casa ${house.name}.`);
                  } catch (error) {
                    Alert.alert('Erro ao entrar na casa', (error as Error).message);
                  }
                }}
              >
                <Text style={styles.modalPrimaryText}>
                  {joinHouseMutation.isPending ? 'Entrando...' : 'Entrar na casa'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flexGrow: 1,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
    backgroundColor: '#f8fafc',
    gap: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  houseList: {
    gap: 12,
  },
  houseListItem: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
  },
  houseListItemActive: {
    borderColor: '#1d4ed8',
    backgroundColor: '#eef2ff',
  },
  houseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  houseMeta: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  secondaryAction: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1d4ed8',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: '#1d4ed8',
    fontWeight: '600',
    fontSize: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  list: {
    gap: 8,
  },
  listItem: {
    fontSize: 14,
    color: '#475569',
  },
  logoutButton: {
    marginTop: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#dc2626',
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
  },
  logoutButtonText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 14,
  },
  helperText: {
    fontSize: 14,
    color: '#475569',
  },
  inviteCode: {
    fontSize: 13,
    color: '#475569',
  },
  inviteCodeValue: {
    fontWeight: '600',
    color: '#1d4ed8',
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  memberMeta: {
    fontSize: 13,
    color: '#64748b',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  roleLink: {
    color: '#1d4ed8',
    fontSize: 14,
    fontWeight: '600',
  },
  removeLink: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  leaveLink: {
    color: '#1d4ed8',
    fontSize: 14,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 20,
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalPrimary: {
    flex: 1,
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  modalSecondary: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1d4ed8',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryText: {
    color: '#1d4ed8',
    fontWeight: '600',
    fontSize: 15,
  },
});

