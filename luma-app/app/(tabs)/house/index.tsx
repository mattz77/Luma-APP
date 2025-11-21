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
import { LinearGradient } from 'expo-linear-gradient';
import { Home as HomeIcon, Users, Plus, LogIn, Copy, Settings, UserPlus, UserMinus, Shield, LogOut, ArrowLeft } from 'lucide-react-native';
import { GlassCard } from '@/components/shared';
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
    <View style={styles.container}>
      <LinearGradient
        colors={['#C28400', '#8F6100']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: top + 16 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFF44F" />
          </TouchableOpacity>
          <View style={styles.headerIconRow}>
            <View style={styles.homeIconBg}>
              <HomeIcon size={24} color="#C28400" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Casa & Membros</Text>
              <Text style={styles.subtitle}>{houses.length} casa(s)</Text>
            </View>
          </View>
          <Text style={styles.subtitleSecondary}>
            Gerencie membros, convites e permissões da residência.
          </Text>
        </View>

      <GlassCard style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Users size={20} color="#FFF44F" />
          <Text style={styles.sectionTitle}>Minhas casas</Text>
        </View>
        {housesLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color="#FFF44F" />
            <Text style={styles.helperText}>Carregando...</Text>
          </View>
        ) : houses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nenhuma casa ainda</Text>
            <Text style={styles.helperText}>
              Crie uma nova ou entre com um código de convite.
            </Text>
          </View>
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
                <View style={styles.houseIconBg}>
                  <HomeIcon size={18} color={house.id === houseId ? '#C28400' : '#FFF44F'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.houseName, house.id === houseId && styles.houseNameActive]}>{house.name}</Text>
                  <Text style={styles.houseMeta}>
                    {membership.role === 'ADMIN' ? '👑 Admin' : '👤 Membro'} ·{' '}
                    {new Date(membership.joinedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
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
            <Plus size={18} color="#2C1A00" />
            <Text style={styles.primaryActionText}>Criar casa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => {
              setInviteCodeInput('');
              setJoinModalVisible(true);
            }}
          >
            <LogIn size={18} color="#FFF44F" />
            <Text style={styles.secondaryActionText}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>

      {currentHouse ? (
        <>
          <GlassCard style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Settings size={20} color="#FFF44F" />
              <Text style={styles.cardTitle}>Resumo da casa</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Casa atual:</Text>
              <Text style={styles.infoValue}>{currentHouse.house.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Membros:</Text>
              <Text style={styles.infoValue}>{members.length}</Text>
            </View>
            <TouchableOpacity
              style={styles.inviteButton}
              onPress={async () => {
                const invite = currentHouse.house.inviteCode;
                try {
                  if (Platform.OS === 'web' && navigator?.clipboard) {
                    await navigator.clipboard.writeText(invite);
                    Alert.alert('Convite', 'Código copiado! 📋');
                  } else {
                    Alert.alert('Convite', `Compartilhe: ${invite}`);
                  }
                } catch {
                  Alert.alert('Convite', `Código: ${invite}`);
                }
              }}
            >
              <Copy size={16} color="#2C1A00" />
              <Text style={styles.inviteButtonText}>Copiar código: {currentHouse.house.inviteCode}</Text>
            </TouchableOpacity>
          </GlassCard>

          <GlassCard style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Users size={20} color="#FFF44F" />
              <Text style={styles.cardTitle}>Membros</Text>
            </View>
            {membersLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color="#FFF44F" />
              </View>
            ) : members.length === 0 ? (
              <Text style={styles.helperText}>Nenhum membro encontrado.</Text>
            ) : (
              members.map((member) => (
                <View key={member.id} style={styles.memberRow}>
                  <View style={styles.memberIconBg}>
                    {member.role === 'ADMIN' ? (
                      <Shield size={16} color="#FFF44F" />
                    ) : (
                      <Users size={16} color="#FFF44F" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{member.user.name ?? member.user.email}</Text>
                    <Text style={styles.memberMeta}>
                      {member.user.email} · {formatRole(member.role)}
                    </Text>
                  </View>
                  <View style={styles.memberActions}>
                    {member.userId === user?.id ? (
                      <TouchableOpacity onPress={handleLeaveHouse} style={styles.actionButton}>
                        <LogOut size={14} color="#FF6B6B" />
                      </TouchableOpacity>
                    ) : isAdmin ? (
                      <>
                        <TouchableOpacity onPress={() => handleUpdateRole(member)} style={styles.actionButton}>
                          <Shield size={14} color="#FFF44F" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleRemoveMember(member)} style={styles.actionButton}>
                          <UserMinus size={14} color="#FF6B6B" />
                        </TouchableOpacity>
                      </>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </GlassCard>
        </>
      ) : null}

      <GlassCard style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <LogOut size={20} color="#FF6B6B" />
          <Text style={[styles.cardTitle, { color: '#FF6B6B' }]}>Sair da conta</Text>
        </View>
        <Text style={styles.helperText}>
          Encerre sua sessão. Você poderá entrar novamente com seu e-mail e senha.
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
          <LogOut size={18} color="#2C1A00" />
          <Text style={styles.logoutButtonText}>Sair agora</Text>
        </TouchableOpacity>
      </GlassCard>

      <Modal
        animationType="slide"
        transparent
        visible={isCreateModalVisible}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <GlassCard style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Plus size={24} color="#FFF44F" />
              <Text style={styles.modalTitle}>Criar nova casa</Text>
            </View>
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
          </GlassCard>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={isJoinModalVisible}
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <GlassCard style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <LogIn size={24} color="#FFF44F" />
              <Text style={styles.modalTitle}>Entrar com código</Text>
            </View>
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
          </GlassCard>
        </View>
      </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
    gap: 20,
  },
  headerRow: {
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,244,79,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,244,79,0.3)',
    alignSelf: 'flex-start',
  },
  headerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  homeIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF44F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFF44F',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFF44F',
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFBE6',
    opacity: 0.8,
    marginTop: 2,
  },
  subtitleSecondary: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
  },
  sectionCard: {
    padding: 20,
    gap: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFBE6',
  },
  houseList: {
    gap: 12,
  },
  houseListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  houseListItemActive: {
    borderColor: '#FFF44F',
    borderWidth: 2,
    backgroundColor: 'rgba(255,244,79,0.1)',
  },
  houseIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,244,79,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,244,79,0.2)',
  },
  houseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFBE6',
  },
  houseNameActive: {
    color: '#FFF44F',
  },
  houseMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF44F',
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: '#FFF44F',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  primaryActionText: {
    color: '#2C1A00',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFF44F',
    paddingVertical: 14,
  },
  secondaryActionText: {
    color: '#FFF44F',
    fontWeight: '600',
    fontSize: 15,
  },
  card: {
    padding: 20,
    gap: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFBE6',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF44F',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF44F',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 8,
  },
  inviteButtonText: {
    color: '#2C1A00',
    fontWeight: '600',
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#FFF44F',
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: '#FFF44F',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  logoutButtonText: {
    color: '#2C1A00',
    fontWeight: '700',
    fontSize: 15,
  },
  helperText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  loadingState: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFBE6',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  memberIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,244,79,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,244,79,0.2)',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFBE6',
  },
  memberMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    padding: 24,
    gap: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFBE6',
  },
  modalInput: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    fontSize: 15,
    color: '#FFFBE6',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  modalPrimary: {
    flex: 1,
    backgroundColor: '#FFF44F',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFF44F',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  modalPrimaryText: {
    color: '#2C1A00',
    fontWeight: '700',
    fontSize: 15,
  },
  modalSecondary: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryText: {
    color: '#FFFBE6',
    fontWeight: '600',
    fontSize: 15,
  },
});

