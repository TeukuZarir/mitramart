import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { validateEnvVars } from './lib/config';
import { supabase } from './lib/supabase';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import salesRoutes from './routes/sales';
import userRoutes from './routes/users';

validateEnvVars();

// ============================================================
// AUTO RESET PASSWORD - HAPUS BLOK INI SETELAH BERHASIL LOGIN!
// Kode ini otomatis mereset password semua akun saat server start.
// ============================================================
(async () => {
    try {
        const accounts = [
            { email: 'admin@mitramart.com', password: 'admin123' },
            { email: 'kasir@mitramart.com', password: 'kasir123' },
            { email: 'gudang@mitramart.com', password: 'gudang123' },
        ];
        for (const acc of accounts) {
            const hash = await bcrypt.hash(acc.password, 10);
            await supabase.from('users').update({ password: hash }).eq('email', acc.email);
        }
        console.log('✅ Semua password berhasil direset otomatis!');
    } catch (err) {
        console.error('❌ Gagal reset password otomatis:', err);
    }
})();
// ============================================================

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://mitramart.vercel.app'
];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Terlalu banyak percobaan login. Silakan coba lagi setelah 15 menit.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    }
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3000,
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/verify-otp', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'MitraMart API is running' });
});

if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

export default app;
