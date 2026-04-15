import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { authMiddleware, adminOrWarehouse, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('name')
            .limit(1000);

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Get products error:', err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(404).json({ error: 'Product not found' });
    }
});

router.post('/', adminOrWarehouse, async (req: AuthRequest, res: Response) => {
    try {
        const { name, sku, barcode, category, unit, price, cost, stock, min_stock, supplier, expiry_date, location, image } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length < 1) {
            return res.status(400).json({ error: 'Nama produk wajib diisi.' });
        }
        if (price === undefined || typeof price !== 'number' || price < 0) {
            return res.status(400).json({ error: 'Harga jual harus berupa angka positif.' });
        }
        if (cost !== undefined && (typeof cost !== 'number' || cost < 0)) {
            return res.status(400).json({ error: 'Harga modal harus berupa angka positif.' });
        }
        if (stock !== undefined && (typeof stock !== 'number' || stock < 0)) {
            return res.status(400).json({ error: 'Stok tidak boleh negatif.' });
        }

        const product = {
            name: name.trim(),
            sku: sku || '',
            barcode: barcode || '',
            category: category || 'Lainnya',
            unit: unit || 'Pcs',
            price: Math.round(price),
            cost: Math.round(cost || 0),
            stock: Math.max(0, Math.floor(stock || 0)),
            min_stock: Math.max(0, Math.floor(min_stock || 0)),
            supplier: supplier || '',
            expiry_date: expiry_date || null,
            location: location || '',
            image: image || ''
        };

        const { data, error } = await supabase
            .from('products')
            .insert([product])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        console.error('Create product error:', err);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

router.put('/:id', adminOrWarehouse, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, sku, barcode, category, unit, price, cost, stock, min_stock, supplier, expiry_date, location, image, expected_stock } = req.body;

        if (name !== undefined && (typeof name !== 'string' || name.trim().length < 1)) {
            return res.status(400).json({ error: 'Nama produk tidak boleh kosong.' });
        }
        if (price !== undefined && (typeof price !== 'number' || price < 0)) {
            return res.status(400).json({ error: 'Harga jual harus berupa angka positif.' });
        }
        if (cost !== undefined && (typeof cost !== 'number' || cost < 0)) {
            return res.status(400).json({ error: 'Harga modal harus berupa angka positif.' });
        }
        if (stock !== undefined && (typeof stock !== 'number' || stock < 0)) {
            return res.status(400).json({ error: 'Stok tidak boleh negatif.' });
        }

        if (expected_stock !== undefined && stock !== undefined) {
            const { data: dbProduct, error: dbError } = await supabase
                .from('products')
                .select('stock')
                .eq('id', id)
                .single();
            
            if (dbError || !dbProduct) {
                return res.status(404).json({ error: 'Produk tidak ditemukan.' });
            }
            if (dbProduct.stock !== expected_stock) {
                return res.status(409).json({ error: 'Konflik versi: Stok telah berubah sejak Anda membukanya. Silakan muat ulang halaman.' });
            }
        }

        const updates: any = {};
        if (name !== undefined) updates.name = name.trim();
        if (sku !== undefined) updates.sku = sku;
        if (barcode !== undefined) updates.barcode = barcode;
        if (category !== undefined) updates.category = category;
        if (unit !== undefined) updates.unit = unit;
        if (price !== undefined) updates.price = Math.round(price);
        if (cost !== undefined) updates.cost = Math.round(cost);
        if (stock !== undefined) updates.stock = Math.max(0, Math.floor(stock));
        if (min_stock !== undefined) updates.min_stock = Math.max(0, Math.floor(min_stock));
        if (supplier !== undefined) updates.supplier = supplier;
        if (expiry_date !== undefined) updates.expiry_date = expiry_date || null;
        if (location !== undefined) updates.location = location;
        if (image !== undefined) updates.image = image;

        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Update product error:', err);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

router.delete('/:id', adminOrWarehouse, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            if (error.code === '23503') {
                return res.status(400).json({ error: 'Gagal diproses! Produk ini tidak dapat dihapus karena sudah tercatat dalam riwayat transaksi.' });
            }
            throw error;
        }
        res.json({ message: 'Product deleted' });
    } catch (err) {
        console.error('Delete product error:', err);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

router.patch('/:id/stock', adminOrWarehouse, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { stock, expected_stock } = req.body;

        if (expected_stock !== undefined) {
            const { data: dbProduct, error: dbError } = await supabase
                .from('products')
                .select('stock')
                .eq('id', id)
                .single();
            
            if (dbError || !dbProduct) {
                return res.status(404).json({ error: 'Produk tidak ditemukan.' });
            }
            if (dbProduct.stock !== expected_stock) {
                return res.status(409).json({ error: 'Konflik versi: Stok telah berubah sejak Anda membukanya. Silakan muat ulang halaman.' });
            }
        }

        const { data, error } = await supabase
            .from('products')
            .update({ stock })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update stock' });
    }
});

export default router;
