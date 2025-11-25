import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useUserHouses } from '@/hooks/useHouses';

export function HouseInitializer() {
    const user = useAuthStore((state) => state.user);
    const houseId = useAuthStore((state) => state.houseId);
    const setHouseId = useAuthStore((state) => state.setHouseId);
    const authLoading = useAuthStore((state) => state.loading);

    // Só busca casas se o auth já terminou de carregar
    const { data: houses = [], isLoading, error } = useUserHouses(authLoading ? undefined : user?.id);

    // Debug logs
    useEffect(() => {
        console.log('[HouseInitializer] State:', {
            authLoading,
            hasUser: !!user,
            userId: user?.id,
            houseId,
            housesCount: houses.length,
            isLoading,
            error: error?.message,
        });
    }, [authLoading, user, houseId, houses.length, isLoading, error]);

    useEffect(() => {
        // Aguarda o auth terminar de carregar
        if (authLoading) {
            console.log('[HouseInitializer] Auth still loading, waiting...');
            return;
        }

        // Se não tiver usuário, não faz nada
        if (!user) {
            console.log('[HouseInitializer] No user, skipping');
            return;
        }

        // Se ainda está carregando, aguarda
        if (isLoading) {
            console.log('[HouseInitializer] Still loading houses...');
            return;
        }

        // Se houve erro, loga mas não bloqueia
        if (error) {
            console.error('[HouseInitializer] Error loading houses:', error);
        }

        // Se não carregou as casas ainda, aguarda
        if (!houses.length) {
            console.log('[HouseInitializer] No houses found');
            return;
        }

        // Se já tem casa selecionada e ela ainda é válida, não faz nada
        const currentHouseIsValid = houses.some((h) => h.house.id === houseId);
        if (houseId && currentHouseIsValid) {
            console.log('[HouseInitializer] Current house is valid:', houseId);
            return;
        }

        // Se não tem casa selecionada ou a atual é inválida, seleciona a primeira
        if (!houseId || !currentHouseIsValid) {
            // Prioriza a casa onde o usuário é ADMIN, se houver, senão pega a primeira
            const adminHouse = houses.find(h => h.membership.role === 'ADMIN');
            const targetHouseId = adminHouse ? adminHouse.house.id : houses[0].house.id;

            console.log(`[HouseInitializer] Setting default house: ${targetHouseId}`, {
                wasHouseId: houseId,
                adminHouse: adminHouse?.house.id,
                firstHouse: houses[0]?.house.id,
            });
            setHouseId(targetHouseId);
        }
    }, [authLoading, user, houses, houseId, setHouseId, isLoading, error]);

    return null;
}
