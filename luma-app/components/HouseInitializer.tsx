import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useUserHouses } from '@/hooks/useHouses';

export function HouseInitializer() {
    const user = useAuthStore((state) => state.user);
    const houseId = useAuthStore((state) => state.houseId);
    const setHouseId = useAuthStore((state) => state.setHouseId);

    const { data: houses = [] } = useUserHouses(user?.id);

    useEffect(() => {
        // Se não tiver usuário, não faz nada
        if (!user) return;

        // Se não carregou as casas ainda, aguarda
        if (!houses.length) return;

        // Se já tem casa selecionada e ela ainda é válida, não faz nada
        const currentHouseIsValid = houses.some((h) => h.house.id === houseId);
        if (houseId && currentHouseIsValid) return;

        // Se não tem casa selecionada ou a atual é inválida, seleciona a primeira
        if (!houseId || !currentHouseIsValid) {
            // Prioriza a casa onde o usuário é ADMIN, se houver, senão pega a primeira
            const adminHouse = houses.find(h => h.membership.role === 'ADMIN');
            const targetHouseId = adminHouse ? adminHouse.house.id : houses[0].house.id;

            console.log(`[HouseInitializer] Setting default house: ${targetHouseId}`);
            setHouseId(targetHouseId);
        }
    }, [user, houses, houseId, setHouseId]);

    return null;
}
