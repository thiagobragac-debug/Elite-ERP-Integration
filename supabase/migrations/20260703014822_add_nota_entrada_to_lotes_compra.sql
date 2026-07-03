-- Add nota_entrada_id to lotes_compra
ALTER TABLE lotes_compra
ADD COLUMN nota_entrada_id uuid REFERENCES notas_entrada(id) ON DELETE SET NULL;

CREATE INDEX idx_lotes_compra_nota_entrada ON lotes_compra(nota_entrada_id);
