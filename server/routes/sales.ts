import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('sales')
            .select(`
        *,
        items:sale_items(
          *,
          product:products(name, sku, image)
        )
      `)
            .order('date', { ascending: false })
            .limit(500);

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Get sales error:', err);
        res.status(500).json({ error: 'Failed to fetch sales' });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('sales')
            .select(`
        *,
        items:sale_items(
          *,
          product:products(*)
        )
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(404).json({ error: 'Sale not found' });
    }
});

router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const { items, total, subtotal, tax, cashier, cashier_id, payment_method } = req.body;

        const productIds = items.map((item: any) => item.id);
        const { data: products, error: productError } = await supabase
            .from('products')
            .select('id, price, name, stock')
            .in('id', productIds);

        if (productError || !products) {
            return res.status(500).json({ error: 'Gagal memvalidasi produk' });
        }

        let trueSubtotal = 0;
        const validItems = items.map((item: any) => {
            const dbProduct = products.find(p => p.id === item.id);
            if (!dbProduct) throw new Error(`Produk tidak ditemukan: ${item.name}`);
            if (typeof item.qty !== 'number' || item.qty <= 0) {
                throw new Error(`Kuantitas tidak valid pada item: ${dbProduct.name}. Angka harus positif.`);
            }
            const itemPrice = dbProduct.price;
            trueSubtotal += itemPrice * item.qty;
            return {
                id: item.id,
                qty: item.qty,
                price: itemPrice,
                name: dbProduct.name
            };
        });

        const trueTax = Math.round(trueSubtotal * 0.11);
        const trueTotal = trueSubtotal + trueTax;

        const timestamp = Date.now().toString(36).toUpperCase();
        const random = crypto.randomBytes(3).toString('hex').toUpperCase();
        const saleId = `TRX-${timestamp}-${random}`;

        const validCashierId = req.user?.id;
        if (!validCashierId) {
            return res.status(401).json({ error: 'Sesi kasir tidak valid.' });
        }

        const rpcPayload = {
            p_sale_id: saleId,
            p_total: trueTotal,
            p_subtotal: trueSubtotal,
            p_tax: trueTax,
            p_cashier: cashier, // could also fallback to req.user.name if we had it
            p_cashier_id: validCashierId,
            p_payment_method: payment_method,
            p_items: JSON.stringify(validItems)
        };

        const { data: rpcResult, error: rpcError } = await supabase.rpc('process_checkout', rpcPayload);

        if (rpcError) {
            const errorMessage = rpcError.message || 'Checkout failed';
            if (errorMessage.includes('tidak cukup') || errorMessage.includes('tidak ditemukan')) {
                return res.status(400).json({ error: errorMessage });
            }
            throw rpcError;
        }

        res.status(201).json({ id: saleId, total, subtotal, tax, cashier, payment_method, items, date: new Date().toISOString() });
    } catch (err: any) {
        console.error('Create sale error:', err);
        const message = err?.message || 'Failed to process checkout';
        res.status(500).json({ error: message });
    }
});

export default router;
