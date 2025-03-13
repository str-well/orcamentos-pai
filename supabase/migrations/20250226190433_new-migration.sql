-- Adiciona a coluna labor_cost_with_materials na tabela budgets
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS labor_cost_with_materials TEXT;

-- Cria uma função para verificar a estrutura da tabela
CREATE OR REPLACE FUNCTION get_table_structure(table_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'column_name', column_name,
        'data_type', data_type,
        'is_nullable', is_nullable
      )
    )
    FROM information_schema.columns
    WHERE table_name = $1
    AND table_schema = 'public'
  );
END;
$$;
