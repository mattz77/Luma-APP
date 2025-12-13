import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import type {
  House,
  HouseMember,
  HouseMemberWithUser,
  HouseMemberRole,
  UserHouse,
} from '@/types/models';

type HouseRow = Database['public']['Tables']['houses']['Row'];
type HouseInsert = Database['public']['Tables']['houses']['Insert'];
type HouseMemberRow = Database['public']['Tables']['house_members']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];

type HouseMembershipRow = HouseMemberRow & {
  house: HouseRow | null;
};

type HouseMemberUserRow = HouseMemberRow & {
  user: UserRow | null;
};

const mapHouse = (row: HouseRow): House => ({
  id: row.id,
  name: row.name,
  address: row.address ?? null,
  photoUrl: row.photo_url ?? null,
  inviteCode: row.invite_code,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapMembership = (row: HouseMemberRow): HouseMember => ({
  id: row.id,
  houseId: row.house_id,
  userId: row.user_id,
  role: row.role as HouseMemberRole,
  joinedAt: row.joined_at,
  isActive: row.is_active,
});

export interface CreateHouseInput {
  name: string;
  address?: string | null;
  photoUrl?: string | null;
  creatorUserId: string;
}

export interface UpdateMemberRoleInput {
  membershipId: string;
  role: HouseMemberRole;
}

export const houseService = {
  async getUserHouses(userId: string): Promise<UserHouse[]> {
    const { data: membershipData, error } = await supabase
      .from('house_members')
      .select('id, house_id, user_id, role, joined_at, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('joined_at', { ascending: true });

    if (error) {
      throw error;
    }

    const memberships = (membershipData ?? []) as HouseMemberRow[];

    if (memberships.length === 0) {
      return [];
    }

    const houseIds = memberships.map((membership) => membership.house_id);

    const { data: houseData, error: housesError } = await supabase
      .from('houses')
      .select('*')
      .in('id', houseIds);

    if (housesError) {
      throw housesError;
    }

    const houses = (houseData ?? []) as HouseRow[];
    const housesById = new Map<string, HouseRow>();

    houses.forEach((house) => {
      housesById.set(house.id, house);
    });

    return memberships
      .filter((membership) => housesById.has(membership.house_id))
      .map((membership) => {
        const house = housesById.get(membership.house_id);
        if (!house) {
          throw new Error('House not found for membership.');
        }

        return {
          house: mapHouse(house),
          membership: mapMembership(membership),
        };
      });
  },

  async createHouse(input: CreateHouseInput): Promise<House> {
    const name = input.name.trim();
    const address = input.address?.trim() || null;
    const photoUrl = input.photoUrl || null;

    // Criar casa primeiro
    const { data, error } = await supabase.rpc('create_house_with_membership', {
      p_name: name,
      p_address: address,
    });

    if (error || !data) {
      throw error ?? new Error('Não foi possível criar a casa.');
    }

    const house = data as HouseRow;

    // Se tiver foto, atualizar a casa com a URL da foto
    if (photoUrl) {
      const { data: updatedHouse, error: updateError } = await supabase
        .from('houses')
        .update({ photo_url: photoUrl })
        .eq('id', house.id)
        .select('*')
        .single();

      if (updateError) {
        console.warn('[HouseService] Erro ao atualizar foto da casa:', updateError);
        // Não falhar a criação se o upload da foto falhar
      } else if (updatedHouse) {
        return mapHouse(updatedHouse as HouseRow);
      }
    }

    return mapHouse(house);
  },

  async joinHouse(userId: string, inviteCode: string): Promise<House> {
    const { data: house, error: houseError } = await supabase
      .from('houses')
      .select('*')
      .eq('invite_code', inviteCode)
      .single();

    if (houseError || !house) {
      throw houseError ?? new Error('Código de convite inválido.');
    }

    const houseRow = house as HouseRow;

    const { data: existingMembership, error: membershipFetchError } = await supabase
      .from('house_members')
      .select('*')
      .eq('house_id', houseRow.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (membershipFetchError) {
      throw membershipFetchError;
    }

    const membershipRow = existingMembership as HouseMemberRow | null;

    if (membershipRow?.is_active) {
      throw new Error('Você já faz parte dessa casa.');
    }

    if (membershipRow && !membershipRow.is_active) {
      const { error: reactivateError } = await supabase
        .from('house_members')
        .update({ is_active: true, role: 'MEMBER', joined_at: new Date().toISOString() })
        .eq('id', membershipRow.id);

      if (reactivateError) {
        throw reactivateError;
      }
    } else {
      const { error: insertError } = await supabase.from('house_members').insert({
        house_id: houseRow.id,
        user_id: userId,
        role: 'MEMBER',
      });

      if (insertError) {
        throw insertError;
      }
    }

    return mapHouse(houseRow);
  },

  async getHouseMembers(houseId: string): Promise<HouseMemberWithUser[]> {
    const { data, error } = await supabase
      .from('house_members')
      .select(
        'id, house_id, user_id, role, joined_at, is_active, user:users(id, email, name, avatar_url, phone, created_at, updated_at, last_login_at)',
      )
      .eq('house_id', houseId)
      .eq('is_active', true)
      .order('joined_at', { ascending: true });

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as HouseMemberUserRow[];

    return rows.map((item) => ({
      ...mapMembership(item as HouseMemberRow),
      user: {
        id: item.user?.id ?? '',
        email: item.user?.email ?? '',
        name: (item.user?.name as string | undefined) ?? null,
        avatarUrl: (item.user?.avatar_url as string | undefined) ?? null,
        phone: item.user?.phone ?? null,
        createdAt: item.user?.created_at ?? '',
        updatedAt: item.user?.updated_at ?? '',
        lastLoginAt: item.user?.last_login_at ?? null,
      },
    }));
  },

  async removeMember(membershipId: string): Promise<void> {
    const { error } = await supabase
      .from('house_members')
      .update({ is_active: false })
      .eq('id', membershipId);

    if (error) {
      throw error;
    }
  },

  async leaveHouse(userId: string, houseId: string): Promise<void> {
    const { error } = await supabase
      .from('house_members')
      .update({ is_active: false })
      .eq('house_id', houseId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  },

  async updateHouse(houseId: string, updates: Partial<Omit<CreateHouseInput, 'creatorUserId'>>): Promise<House> {
    const payload: Partial<HouseInsert> = {};

    if (updates.name !== undefined) {
      payload.name = updates.name.trim();
    }
    if (updates.address !== undefined) {
      payload.address = updates.address;
    }
    if (updates.photoUrl !== undefined) {
      payload.photo_url = updates.photoUrl;
    }

    const { data, error } = await supabase
      .from('houses')
      .update(payload)
      .eq('id', houseId)
      .select('*')
      .single();

    if (error || !data) {
      throw error ?? new Error('Não foi possível atualizar a casa.');
    }

    return mapHouse(data as HouseRow);
  },

  async updateMemberRole(input: UpdateMemberRoleInput): Promise<void> {
    const { error } = await supabase
      .from('house_members')
      .update({ role: input.role })
      .eq('id', input.membershipId);

    if (error) {
      throw error;
    }
  },
};

