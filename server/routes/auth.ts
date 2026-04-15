import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabase';
import { JWT_SECRET } from '../lib/config';
import { sendEmail } from '../lib/email';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email dan password wajib diisi.' });
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Email atau password salah.' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Email atau password salah.' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        const { password: _, ...userWithoutPassword } = user;

        res.json({ token, user: userWithoutPassword });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/me', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, role, avatar')
            .eq('id', decoded.id)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        res.json({ user });
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

router.post('/logout', (req: Request, res: Response) => {
    res.json({ message: 'Logged out successfully' });
});

router.post('/forgot-password', async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return res.status(400).json({ error: 'Email tidak valid.' });
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (error || !user) {
            // Prevent user enumeration by not revealing if the email exists or not
            return res.json({ message: 'Kode verifikasi telah dikirim ke email Anda' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, 8);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

        await supabase
            .from('password_resets')
            .update({ used: true })
            .eq('email', email)
            .eq('used', false);

        const { error: insertError } = await supabase
            .from('password_resets')
            .insert([{
                email,
                otp_hash: otpHash,
                expires_at: expiresAt,
                used: false
            }]);

        if (insertError) {
            console.error('Insert OTP error:', insertError);
            throw insertError;
        }

        const emailResult = await sendEmail(
            email,
            'MitraMart - Kode Verifikasi Reset Password',
            `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Reset Password MitraMart</h2>
                <p>Anda menerima email ini karena adanya permintaan reset password untuk akun MitraMart Anda.</p>
                <p>Gunakan kode verifikasi berikut:</p>
                <h1 style="color: #10b981; letter-spacing: 5px;">${otp}</h1>
                <p>Kode ini berlaku selama 5 menit.</p>
                <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
            </div>
            `
        );

        if (!emailResult.success) {
            console.error('Email send failed:', emailResult.error);
            return res.status(500).json({ error: 'Gagal mengirim email. Pastikan konfigurasi SMTP benar.' });
        }

        res.json({ message: 'Kode verifikasi telah dikirim ke email Anda' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/verify-otp', async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Email dan kode OTP wajib diisi.' });
        }

        const { data: records, error } = await supabase
            .from('password_resets')
            .select('*')
            .eq('email', email)
            .eq('used', false)
            .gte('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1);

        if (error || !records || records.length === 0) {
            return res.status(400).json({ error: 'Kode tidak valid atau sudah kadaluarsa.' });
        }

        const record = records[0];
        const isValid = await bcrypt.compare(otp, record.otp_hash);

        if (!isValid) {
            return res.status(400).json({ error: 'Kode verifikasi salah.' });
        }

        res.json({ message: 'Verifikasi berhasil' });
    } catch (err) {
        console.error('Verify OTP error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/reset-password', async (req: Request, res: Response) => {
    try {
        const { email, password, otp } = req.body;

        if (!email || !password || !otp) {
            return res.status(400).json({ error: 'Semua field wajib diisi.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password harus minimal 6 karakter.' });
        }

        const { data: records, error: fetchError } = await supabase
            .from('password_resets')
            .select('*')
            .eq('email', email)
            .eq('used', false)
            .gte('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1);

        if (fetchError || !records || records.length === 0) {
            return res.status(400).json({ error: 'Sesi reset password tidak valid atau sudah kadaluarsa.' });
        }

        const record = records[0];
        const isValid = await bcrypt.compare(otp, record.otp_hash);

        if (!isValid) {
            return res.status(400).json({ error: 'Kode verifikasi tidak valid.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { error: updateError } = await supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq('email', email);

        if (updateError) throw updateError;

        await supabase
            .from('password_resets')
            .update({ used: true })
            .eq('id', record.id);

        res.json({ message: 'Password berhasil diubah. Silakan login.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Gagal mereset password' });
    }
});

// ============================================================
// ENDPOINT DARURAT - HAPUS SETELAH SELESAI DIGUNAKAN!
// Gunakan endpoint ini untuk mereset password akun yang lupa.
// Akses via browser: /api/auth/emergency-reset?secret=mitramart-darurat-2026&email=admin@mitramart.com&newpass=admin123
// ============================================================
router.get('/emergency-reset', async (req: Request, res: Response) => {
    try {
        const { secret, email, newpass } = req.query;

        // Kunci rahasia agar tidak sembarang orang bisa mereset
        if (secret !== 'mitramart-darurat-2026') {
            return res.status(403).json({ error: 'Kunci rahasia salah.' });
        }

        if (!email || !newpass) {
            return res.status(400).json({ error: 'Parameter email dan newpass wajib diisi.' });
        }

        const hashedPassword = await bcrypt.hash(String(newpass), 10);

        const { data, error } = await supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq('email', String(email))
            .select('id, name, email, role')
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Email tidak ditemukan di database.', detail: error?.message });
        }

        res.json({
            success: true,
            message: `Password untuk ${data.email} (${data.name}) berhasil direset!`,
            info: 'Silakan login dengan password baru Anda. JANGAN LUPA HAPUS ENDPOINT INI SETELAH SELESAI!'
        });
    } catch (err) {
        console.error('Emergency reset error:', err);
        res.status(500).json({ error: 'Gagal mereset password' });
    }
});

export default router;
