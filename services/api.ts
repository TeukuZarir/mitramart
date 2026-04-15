const getApiBase = (): string => {
    // 1. Jika VITE_API_URL di-set secara eksplisit, gunakan itu
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) {
        return (import.meta as any).env.VITE_API_URL;
    }
    // 2. Jika berjalan di browser dan bukan localhost, gunakan /api relatif (Vercel production)
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return '/api';
    }
    // 3. Fallback ke localhost untuk development
    return 'http://localhost:3001/api';
};

const API_BASE = getApiBase();

const getToken = () => localStorage.getItem('mitramart_token');

export const checkApiHealth = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE.replace('/api', '')}/api/health`, { signal: AbortSignal.timeout(3000) });
        return response.ok;
    } catch {
        return false;
    }
};

async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('mitramart_token');
            localStorage.removeItem('mitramart_session_v3');
            window.location.href = '/';
        }
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
    }

    return response.json();
}

export const authApi = {
    login: async (email: string, password: string) => {
        const data = await apiRequest<{ token: string; user: any }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        localStorage.setItem('mitramart_token', data.token);
        return data;
    },

    logout: async () => {
        await apiRequest('/auth/logout', { method: 'POST' });
        localStorage.removeItem('mitramart_token');
    },

    me: async () => {
        return apiRequest<{ user: any }>('/auth/me');
    },

    forgotPassword: (email: string) =>
        apiRequest<{ message: string }>('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        }),

    verifyOtp: (email: string, otp: string) =>
        apiRequest<{ message: string }>('/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify({ email, otp }),
        }),

    resetPassword: (email: string, password: string, otp: string) =>
        apiRequest<{ message: string }>('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ email, password, otp }),
        }),
};

export const productApi = {
    getAll: () => apiRequest<any[]>('/products'),

    getOne: (id: string) => apiRequest<any>(`/products/${id}`),

    create: (product: any) =>
        apiRequest<any>('/products', {
            method: 'POST',
            body: JSON.stringify(product),
        }),

    update: (id: string, product: any) =>
        apiRequest<any>(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(product),
        }),

    delete: (id: string) =>
        apiRequest<void>(`/products/${id}`, { method: 'DELETE' }),

    updateStock: (id: string, stock: number, expected_stock?: number) =>
        apiRequest<any>(`/products/${id}/stock`, {
            method: 'PATCH',
            body: JSON.stringify({ stock, expected_stock }),
        }),
};

export const salesApi = {
    getAll: () => apiRequest<any[]>('/sales'),

    getOne: (id: string) => apiRequest<any>(`/sales/${id}`),

    create: (sale: {
        items: any[];
        total: number;
        subtotal?: number;
        tax?: number;
        cashier: string;
        cashier_id: string;
        payment_method: string;
    }) =>
        apiRequest<any>('/sales', {
            method: 'POST',
            body: JSON.stringify(sale),
        }),
};

export const userApi = {
    getAll: () => apiRequest<any[]>('/users'),

    create: (user: { name: string; email: string; password: string; role: string }) =>
        apiRequest<any>('/users', {
            method: 'POST',
            body: JSON.stringify(user),
        }),

    update: (id: string, user: any) =>
        apiRequest<any>(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(user),
        }),

    updatePassword: (id: string, password: string, oldPassword?: string) =>
        apiRequest<void>(`/users/${id}/password`, {
            method: 'PATCH',
            body: JSON.stringify({ password, oldPassword }),
        }),

    delete: (id: string) =>
        apiRequest<void>(`/users/${id}`, { method: 'DELETE' }),
};
