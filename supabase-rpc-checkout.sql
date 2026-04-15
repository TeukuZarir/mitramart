CREATE OR REPLACE FUNCTION process_checkout(
  p_sale_id VARCHAR(30),
  p_total DECIMAL(12,2),
  p_subtotal DECIMAL(12,2),
  p_tax DECIMAL(12,2),
  p_cashier VARCHAR(255),
  p_cashier_id UUID,
  p_payment_method payment_method,
  p_items JSONB
)
RETURNS JSONB AS $$
DECLARE
  item JSONB;
  current_stock INTEGER;
  product_name VARCHAR(255);
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT stock, name INTO current_stock, product_name
    FROM products
    WHERE id = (item->>'id')::UUID
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produk dengan ID % tidak ditemukan', item->>'id';
    END IF;

    IF current_stock < (item->>'qty')::INTEGER THEN
      RAISE EXCEPTION 'Stok "%" tidak cukup. Tersedia: %, diminta: %',
        product_name, current_stock, (item->>'qty')::INTEGER;
    END IF;
  END LOOP;

  INSERT INTO sales (id, total, subtotal, tax, cashier, cashier_id, payment_method, date)
  VALUES (p_sale_id, p_total, p_subtotal, p_tax, p_cashier, p_cashier_id, p_payment_method, NOW());

  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO sale_items (sale_id, product_id, qty, price, subtotal)
    SELECT 
      p_sale_id,
      (item->>'id')::UUID,
      (item->>'qty')::INTEGER,
      price,
      price * (item->>'qty')::INTEGER
    FROM products
    WHERE id = (item->>'id')::UUID;

    UPDATE products
    SET stock = stock - (item->>'qty')::INTEGER
    WHERE id = (item->>'id')::UUID;
  END LOOP;

  RETURN jsonb_build_object(
    'id', p_sale_id,
    'total', p_total,
    'subtotal', p_subtotal,
    'tax', p_tax,
    'cashier', p_cashier,
    'payment_method', p_payment_method,
    'date', NOW()
  );
END;
$$ LANGUAGE plpgsql;
