import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

function getJwtSecret(): string {
    const envSecret = process.env.JWT_SECRET;

    if (envSecret && envSecret.length >= 32) {
        return envSecret;
    }

    if (envSecret) {
        console.warn('⚠️  JWT_SECRET terlalu pendek (minimal 32 karakter). Menggunakan secret yang di-generate.');
    } else {
        console.warn('⚠️  JWT_SECRET tidak ditemukan di environment variables.');
    }

    if (process.env.NODE_ENV === 'production') {
        console.error('❌ FATAL: JWT_SECRET wajib di-set di production! Server tidak bisa berjalan tanpa JWT_SECRET yang aman.');
        process.exit(1);
    }

    const generated = crypto.randomBytes(64).toString('hex');
    console.warn('⚠️  Menggunakan JWT_SECRET auto-generated. Token akan INVALID setelah server restart.');
    console.warn('⚠️  Set JWT_SECRET di .env.local untuk persistence: JWT_SECRET=' + crypto.randomBytes(32).toString('hex'));

    return generated;
}

export const JWT_SECRET = getJwtSecret();

export function validateEnvVars() {
    const required: { key: string; desc: string; fatal: boolean }[] = [
        { key: 'SUPABASE_URL', desc: 'Supabase project URL', fatal: true },
        { key: 'SUPABASE_KEY', desc: 'Supabase anon/service key', fatal: true },
    ];

    const optional: { key: string; desc: string }[] = [
        { key: 'JWT_SECRET', desc: 'JWT signing secret (min 32 chars)' },
        { key: 'SMTP_USER', desc: 'Email untuk kirim OTP (Gmail)' },
        { key: 'SMTP_PASS', desc: 'App password Gmail untuk SMTP' },
        { key: 'PORT', desc: 'Port server (default: 3001)' },
    ];

    let hasError = false;

    console.log('\n📋 Environment Variables Check:');

    for (const { key, desc, fatal } of required) {
        if (!process.env[key]) {
            console.error(`  ❌ ${key} — ${desc} (REQUIRED)`);
            if (fatal) hasError = true;
        } else {
            console.log(`  ✅ ${key}`);
        }
    }

    for (const { key, desc } of optional) {
        if (!process.env[key]) {
            console.warn(`  ⚠️  ${key} — ${desc} (optional, some features disabled)`);
        } else {
            console.log(`  ✅ ${key}`);
        }
    }

    console.log('');

    if (hasError) {
        console.error('❌ Server tidak bisa berjalan tanpa environment variables yang diperlukan.');
        console.error('   Buat file .env.local dengan variabel-variabel di atas.');
        process.exit(1);
    }
}
