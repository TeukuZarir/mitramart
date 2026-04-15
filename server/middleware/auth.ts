import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../lib/config';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token tidak valid atau sudah kadaluarsa.' });
    }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'OWNER')) {
        return res.status(403).json({ error: 'Akses ditolak. Hanya ADMIN atau OWNER yang diizinkan.' });
    }
    next();
};

export const adminOrWarehouse = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'WAREHOUSE' && req.user.role !== 'OWNER')) {
        return res.status(403).json({ error: 'Akses ditolak. Hanya ADMIN, OWNER, atau WAREHOUSE yang diizinkan.' });
    }
    next();
};
