-- Adiciona a coluna labor_cost_with_materials na tabela budgets
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS labor_cost_with_materials TEXT;
