import supabase, { isSupabaseEnabled } from './supabaseClient';

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

const getHealthUrl = () => {
    if (API_BASE.endsWith('/api')) {
        return `${API_BASE.replace(/\/api$/, '')}/api/health`;
    }
    return `${API_BASE}/health`;
};

export const checkApiHealth = async (timeout = 10000): Promise<boolean> => {
    // Prefer checking Supabase if configured
    if (isSupabaseEnabled && supabase) {
        try {
            const { data, error } = await supabase.from('users').select('id').limit(1);
            return !error;
        } catch (err) {
            console.warn('Supabase health check failed:', err);
            // fallback to API health
        }
    }

    try {
        const response = await fetch(getHealthUrl(), { signal: AbortSignal.timeout(timeout) });
        return response.ok;
    } catch (err) {
        console.warn('API health check failed:', err);
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

// Helpers to map DB rows to frontend models
const mapProduct = (p: any) => ({
    id: p.id,
    sku: p.sku,
    barcode: p.barcode,
    name: p.name,
    category: p.category,
    unit: p.unit,
    price: Number(p.price),
    cost: Number(p.cost),
    stock: Number(p.stock),
    minStock: p.min_stock ?? p.minStock ?? 0,
    supplier: p.supplier,
    expiryDate: p.expiry_date ?? p.expiryDate,
    location: p.location,
    image: p.image,
});

const mapUser = (u: any) => ({
    id: u.id,
    name: u.name || u.full_name || u.user_metadata?.full_name || u.email,
    email: u.email,
    role: u.role || 'CASHIER',
    avatar: u.avatar || u.user_metadata?.avatar,
    phone: u.phone,
});

export const authApi = {
    login: async (email: string, password: string) => {
        if (isSupabaseEnabled && supabase) {
            // Supabase auth
            const { data, error } = await supabase.auth.signInWithPassword({ email, password } as any);
            if (error) throw new Error(error.message || 'Login failed');

            const session = (data as any)?.session;
            const user = (data as any)?.user;

            // Try fetch profile from users table
            const { data: profile, error: profileErr } = await supabase.from('users').select('*').eq('email', email).single();
            const userProfile = profile || user;

            const token = session?.access_token || '';
            if (token) localStorage.setItem('mitramart_token', token);

            return { token, user: mapUser(userProfile) };
        }

        const data = await apiRequest<{ token: string; user: any }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        localStorage.setItem('mitramart_token', data.token);
        return data;
    },

    logout: async () => {
        if (isSupabaseEnabled && supabase) {
            await supabase.auth.signOut();
            localStorage.removeItem('mitramart_token');
            return;
        }
        await apiRequest('/auth/logout', { method: 'POST' });
        localStorage.removeItem('mitramart_token');
    },

    me: async () => {
        if (isSupabaseEnabled && supabase) {
            const { data, error } = await supabase.auth.getUser();
            if (error) throw new Error(error.message || 'Failed to get user');
            const email = (data as any)?.user?.email;
            if (!email) throw new Error('No authenticated user');
            const { data: profile } = await supabase.from('users').select('*').eq('email', email).single();
            return { user: mapUser(profile || (data as any).user) };
        }
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
    getAll: async () => {
        if (isSupabaseEnabled && supabase) {
            const { data, error } = await supabase.from('products').select('*');
            if (error) throw new Error(error.message || 'Failed to fetch products');
            return (data || []).map(mapProduct);
        }
        return apiRequest<any[]>('/products');
    },

    getOne: async (id: string) => {
        if (isSupabaseEnabled && supabase) {
            const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
            if (error) throw new Error(error.message || 'Failed to fetch product');
            return mapProduct(data);
        }
        return apiRequest<any>(`/products/${id}`);
    },

    create: async (product: any) => {
        if (isSupabaseEnabled && supabase) {
            const { data, error } = await supabase.from('products').insert([product]).select();
            if (error) throw new Error(error.message || 'Failed to create product');
            return mapProduct((data as any)[0]);
        }
        return apiRequest<any>('/products', {
            method: 'POST',
            body: JSON.stringify(product),
        });
    },

    update: async (id: string, product: any) => {
        if (isSupabaseEnabled && supabase) {
            const { data, error } = await supabase.from('products').update(product).eq('id', id).select();
            if (error) throw new Error(error.message || 'Failed to update product');
            return mapProduct((data as any)[0]);
        }
        return apiRequest<any>(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(product),
        });
    },

    delete: async (id: string) => {
        if (isSupabaseEnabled && supabase) {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw new Error(error.message || 'Failed to delete');
            return;
        }
        return apiRequest<void>(`/products/${id}`, { method: 'DELETE' });
    },

    updateStock: async (id: string, stock: number, expected_stock?: number) => {
        if (isSupabaseEnabled && supabase) {
            const { data, error } = await supabase.from('products').update({ stock }).eq('id', id).select();
            if (error) throw new Error(error.message || 'Failed to update stock');
            return mapProduct((data as any)[0]);
        }
        return apiRequest<any>(`/products/${id}/stock`, {
            method: 'PATCH',
            body: JSON.stringify({ stock, expected_stock }),
        });
    },
};

export const salesApi = {
    getAll: async () => {
        if (isSupabaseEnabled && supabase) {
            const { data, error } = await supabase.from('sales').select('*');
            if (error) throw new Error(error.message || 'Failed to fetch sales');
            return data || [];
        }
        return apiRequest<any[]>('/sales');
    },

    getOne: async (id: string) => {
        if (isSupabaseEnabled && supabase) {
            const { data, error } = await supabase.from('sales').select('*').eq('id', id).single();
            if (error) throw new Error(error.message || 'Failed to fetch sale');
            return data;
        }
        return apiRequest<any>(`/sales/${id}`);
    },

    create: async (sale: any) => {
        if (isSupabaseEnabled && supabase) {
            const { data, error } = await supabase.from('sales').insert([sale]).select();
            if (error) throw new Error(error.message || 'Failed to create sale');
            return (data as any)[0];
        }
        return apiRequest<any>('/sales', {
            method: 'POST',
            body: JSON.stringify(sale),
        });
    },
};

export const userApi = {
    getAll: async () => {
        if (isSupabaseEnabled && supabase) {
            const { data, error } = await supabase.from('users').select('*');
            if (error) throw new Error(error.message || 'Failed to fetch users');
            return (data || []).map(mapUser);
        }
        return apiRequest<any[]>('/users');
    },

    create: async (user: { name: string; email: string; password: string; role: string }) => {
        if (isSupabaseEnabled && supabase) {
            // Create auth user + profile
            const { error: signErr } = await supabase.auth.signUp({ email: user.email, password: user.password } as any);
            if (signErr) throw new Error(signErr.message || 'Failed to create auth user');
            const { data, error } = await supabase.from('users').insert([{ name: user.name, email: user.email, role: user.role }]).select();
            if (error) throw new Error(error.message || 'Failed to create profile');
            return (data as any)[0];
        }
        return apiRequest<any>('/users', {
            method: 'POST',
            body: JSON.stringify(user),
        });
    },

    update: async (id: string, user: any) => {
        if (isSupabaseEnabled && supabase) {
            const { data, error } = await supabase.from('users').update(user).eq('id', id).select();
            if (error) throw new Error(error.message || 'Failed to update user');
            return (data as any)[0];
        }
        return apiRequest<any>(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(user),
        });
    },

    updatePassword: async (id: string, password: string, oldPassword?: string) => {
        if (isSupabaseEnabled && supabase) {
            // Supabase handles passwords via auth; find email and update via auth API
            const { data: profile } = await supabase.from('users').select('email').eq('id', id).single();
            if (!profile || !profile.email) throw new Error('User email not found');
            const { error } = await supabase.auth.api.resetPasswordForEmail(profile.email, { redirectTo: window.location.origin });
            if (error) throw new Error(error.message || 'Failed to initiate password reset');
            return;
        }
        return apiRequest<void>(`/users/${id}/password`, {
            method: 'PATCH',
            body: JSON.stringify({ password, oldPassword }),
        });
    },

    delete: async (id: string) => {
        if (isSupabaseEnabled && supabase) {
            const { data: profile } = await supabase.from('users').select('email').eq('id', id).single();
            if (profile && profile.email) {
                // Deleting user from auth requires service role key; skip here
            }
            const { error } = await supabase.from('users').delete().eq('id', id);
            if (error) throw new Error(error.message || 'Failed to delete user');
            return;
        }
        return apiRequest<void>(`/users/${id}`, { method: 'DELETE' });
    },
};
