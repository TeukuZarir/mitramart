import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../lib/supabase';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, name, email, role, avatar')
            .order('name');

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.post('/', adminOnly, async (req: Request, res: Response) => {
    try {
        const { name, email, password, role, avatar } = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
            return res.status(400).json({ error: 'Format email tidak valid.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { data, error } = await supabase
            .from('users')
            .insert([{
                name,
                email,
                password: hashedPassword,
                role,
                avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff`
            }])
            .select('id, name, email, role, avatar')
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(400).json({ error: 'Email sudah digunakan' });
            }
            throw error;
        }

        res.status(201).json(data);
    } catch (err) {
        console.error('Create user error:', err);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const isSelf = req.user && req.user.id === id;
        const isAdmin = req.user && req.user.role === 'ADMIN';

        if (!isSelf && !isAdmin) {
            return res.status(403).json({ error: 'Anda hanya dapat mengubah profil Anda sendiri.' });
        }

        const { name, email, role, avatar } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            return res.status(400).json({ error: 'Nama harus minimal 2 karakter.' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
            return res.status(400).json({ error: 'Format email tidak valid.' });
        }
        if (role && !['ADMIN', 'OWNER', 'CASHIER', 'WAREHOUSE'].includes(role)) {
            return res.status(400).json({ error: 'Role tidak valid.' });
        }
        if (!isAdmin && role && role !== req.user?.role) {
            return res.status(403).json({ error: 'Hanya ADMIN yang dapat mengubah role.' });
        }

        const updateData: any = { name: name.trim(), email: email.trim() };
        if (isAdmin && role) updateData.role = role;
        if (avatar) updateData.avatar = avatar;

        const { data, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', id)
            .select('id, name, email, role, avatar')
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(400).json({ error: 'Email sudah digunakan oleh akun lain' });
            }
            throw error;
        }
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

router.patch('/:id/password', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const isSelf = req.user && req.user.id === id;
        const isAdmin = req.user && req.user.role === 'ADMIN';

        if (!isSelf && !isAdmin) {
            return res.status(403).json({ error: 'Anda hanya dapat mengubah password Anda sendiri.' });
        }

        const { password, oldPassword } = req.body;

        if (!password || typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ error: 'Password harus minimal 6 karakter.' });
        }

        if (isSelf) {
            if (!oldPassword || typeof oldPassword !== 'string') {
                return res.status(400).json({ error: 'Password lama wajib diisi.' });
            }

            const { data: user, error: userError } = await supabase
                .from('users')
                .select('password')
                .eq('id', id)
                .single();

            if (userError || !user) {
                return res.status(404).json({ error: 'Status user tidak valid.' });
            }

            const isValid = await bcrypt.compare(oldPassword, user.password);
            if (!isValid) {
                return res.status(401).json({ error: 'Password lama salah.' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { error } = await supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'Password updated' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update password' });
    }
});

router.delete('/:id', adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        if (req.user && req.user.id === id) {
            return res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri.' });
        }

        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

export default router;
