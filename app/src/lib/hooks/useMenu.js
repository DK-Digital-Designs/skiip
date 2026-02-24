import { useQuery } from '@tanstack/react-query';
import { ProductService } from '../services/product.service';
import { StoreService } from '../services/store.service';

export const useStores = (eventId) => {
    return useQuery({
        queryKey: ['stores', eventId],
        queryFn: () => StoreService.getStores(), // Assuming getStores doesn't actually filter by eventId yet
        enabled: !!eventId,
    });
};

export const useStore = (storeId) => {
    return useQuery({
        queryKey: ['store', storeId],
        queryFn: () => StoreService.getStoreById(storeId),
        enabled: !!storeId,
    });
};

export const useStoreMenu = (storeId) => {
    return useQuery({
        queryKey: ['storeMenu', storeId],
        queryFn: async () => {
            const { data } = await ProductService.getProducts({ storeId, limit: 100 });
            return data || [];
        },
        enabled: !!storeId,
    });
};
