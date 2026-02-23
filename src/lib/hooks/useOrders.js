import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrderService } from '../services/order.service';

export const useStoreOrders = (storeId, filter = 'active') => {
    return useQuery({
        queryKey: ['storeOrders', storeId, filter],
        queryFn: () => OrderService.getStoreOrders(storeId, filter),
        enabled: !!storeId, // Only run if we have a storeId
    });
};

export const useUpdateOrderStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ orderId, status }) => OrderService.updateOrderStatus(orderId, status),
        onSuccess: (data, variables) => {
            // Invalidate the store orders query to trigger a refetch
            // We could also do optimistic updates here, but invalidating is safer for now.
            queryClient.invalidateQueries({ queryKey: ['storeOrders'] });
        },
    });
};
