import { describe, expect, test } from 'bun:test';
import type { User } from '@/services/user.service';
import { mergeAuthUserWithDbProfile } from './auth-user-merge';

const baseMapped = {
  id: 'u1',
  email: 'a@b.com',
  name: 'JWT Name',
  avatarUrl: 'https://meta.example/avatar.jpg',
};

describe('mergeAuthUserWithDbProfile', () => {
  test('sem perfil no banco mantém JWT', () => {
    expect(mergeAuthUserWithDbProfile(baseMapped, null)).toEqual(baseMapped);
  });

  test('perfil com avatar_url e name substitui campos', () => {
    const profile: User = {
      id: 'u1',
      email: 'a@b.com',
      name: 'Do Banco',
      avatar_url: 'https://storage.example/p.jpg',
      phone: null,
      created_at: '',
      updated_at: '',
    };
    const merged = mergeAuthUserWithDbProfile(baseMapped, profile);
    expect(merged.name).toBe('Do Banco');
    expect(merged.avatarUrl).toBe('https://storage.example/p.jpg');
    expect(merged.email).toBe('a@b.com');
  });

  test('avatar null no banco zera foto mesmo com metadata JWT', () => {
    const profile: User = {
      id: 'u1',
      email: 'a@b.com',
      name: 'N',
      avatar_url: null,
      phone: null,
      created_at: '',
      updated_at: '',
    };
    const merged = mergeAuthUserWithDbProfile(baseMapped, profile);
    expect(merged.avatarUrl).toBeNull();
  });

  test('name null no banco preserva nome do JWT', () => {
    const profile: User = {
      id: 'u1',
      email: 'a@b.com',
      name: null,
      avatar_url: 'https://x/y.png',
      phone: null,
      created_at: '',
      updated_at: '',
    };
    const merged = mergeAuthUserWithDbProfile(baseMapped, profile);
    expect(merged.name).toBe('JWT Name');
    expect(merged.avatarUrl).toBe('https://x/y.png');
  });
});
