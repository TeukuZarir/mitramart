CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('OWNER', 'ADMIN', 'CASHIER', 'WAREHOUSE');
CREATE TYPE payment_method AS ENUM ('CASH', 'QRIS', 'DEBIT');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'CASHIER',
  avatar TEXT,
  phone VARCHAR(20),
  is_2fa_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO users (name, email, password, role, avatar) VALUES
('Admin MitraMart', 'admin@mitramart.com', '$2a$10$rQXvC3T4QqG5R8W7.5HZxOy1LZ9eZmPQ3kY7TqXnN9KjM5L2vR4ue', 'ADMIN', 'https://ui-avatars.com/api/?name=Admin&background=10b981&color=fff'),
('Kasir Riska', 'kasir@mitramart.com', '$2a$10$rQXvC3T4QqG5R8W7.5HZxOy1LZ9eZmPQ3kY7TqXnN9KjM5L2vR4ue', 'CASHIER', 'https://ui-avatars.com/api/?name=Riska&background=3b82f6&color=fff'),
('Gudang Joko', 'gudang@mitramart.com', '$2a$10$rQXvC3T4QqG5R8W7.5HZxOy1LZ9eZmPQ3kY7TqXnN9KjM5L2vR4ue', 'WAREHOUSE', 'https://ui-avatars.com/api/?name=Joko&background=f59e0b&color=fff');

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku VARCHAR(50) UNIQUE NOT NULL,
  barcode VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  cost DECIMAL(12,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  supplier VARCHAR(255),
  expiry_date DATE,
  location VARCHAR(100),
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO products (sku, barcode, name, category, unit, price, cost, stock, min_stock, supplier, expiry_date, location, image) VALUES
('BV-001', '89999090901', 'Indomie Goreng Original', 'Makanan', 'Pcs', 3500, 2800, 150, 50, 'PT Indofood', '2024-12-30', 'Rak A1-02', 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=500'),
('BV-002', '89999090902', 'Aqua Botol 600ml', 'Minuman', 'Botol', 4000, 2500, 85, 24, 'PT Tirta Investama', '2025-05-20', 'Kulkas 1', 'https://images.unsplash.com/photo-1602143407151-0111419500be?w=500'),
('HH-001', '89999090903', 'Lifebuoy Body Wash 450ml', 'Kebersihan', 'Pcs', 28000, 22000, 12, 10, 'Unilever', '2026-01-10', 'Rak B2-01', 'https://images.unsplash.com/photo-1600139199276-88045e75d40a?w=500'),
('SN-001', '89999090904', 'Chitato Sapi Panggang 68g', 'Snack', 'Bungkus', 11500, 9500, 40, 20, 'Indofood', '2024-08-15', 'Rak C1-05', 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500'),
('BV-003', '89999090905', 'Teh Pucuk Harum 350ml', 'Minuman', 'Botol', 3500, 2700, 200, 48, 'Mayora', '2025-02-28', 'Kulkas 2', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500'),
('HH-002', '89999090906', 'Pepsodent Pencegah Gigi Berlubang', 'Kebersihan', 'Tube', 15000, 11000, 5, 15, 'Unilever', '2026-06-01', 'Rak B1-03', 'https://images.unsplash.com/photo-1559599189-fe84dea4eb79?w=500');

CREATE TABLE sales (
  id VARCHAR(30) PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subtotal DECIMAL(12,2),
  tax DECIMAL(12,2),
  total DECIMAL(12,2) NOT NULL,
  cashier VARCHAR(255) NOT NULL,
  cashier_id UUID REFERENCES users(id),
  payment_method payment_method NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id VARCHAR(30) REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  qty INTEGER NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION decrement_stock(product_id UUID, qty INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products 
  SET stock = stock - qty 
  WHERE id = product_id AND stock >= qty;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product %', product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON products FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON sales FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON sale_items FOR ALL USING (true);
