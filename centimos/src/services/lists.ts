import api from './api';

export interface ListItem {
    item_id: string;
    product_barcode: string;
    quantity: number;
    is_purchased: boolean;
    added_at?: string;
    planned_price?: number;
}

export interface ShoppingList {
    list_id: string;
    name: string;
    budget_limit?: number;
    currency?: string;
    status: string;
    items: ListItem[];
}

export const getMyLists = async (): Promise<ShoppingList[]> => {
    const response = await api.get('/lists/');
    return response.data;
};

export const createList = async (name: string, budget_limit: number | undefined): Promise<ShoppingList> => {
    const response = await api.post('/lists/', {
        name: name,
        budget_limit: budget_limit,
        currency: "USD"
    });
    return response.data;
};

export const getListDetails = async (listId: string): Promise<ShoppingList> => {
    const response = await api.get(`/lists/${listId}`);
    return response.data;
};

export const addListItem = async (listId: string, barcode: string, quantity: number = 1) => {
    const response = await api.post(`/lists/${listId}/items`, {
        product_barcode: barcode,
        quantity: quantity
    });
    return response.data;
};

export const deleteList = async (listId: string): Promise<void> => {
    await api.delete(`/lists/${listId}`);
};

export const deleteListItem = async (listId: string, itemId: string): Promise<void> => {
    await api.delete(`/lists/${listId}/items/${itemId}`);
};

export const updateListItem = async (listId: string, itemId: string, data: { quantity?: number; is_purchased?: boolean; planned_price?: number }): Promise<void> => {
    await api.put(`/lists/${listId}/items/${itemId}`, data);
};
