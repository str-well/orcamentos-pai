-- Atualizar um registro existente
UPDATE budgets 
SET labor_cost_with_materials = '500' 
WHERE id = 35;

-- Inserir um novo registro com labor_cost_with_materials
INSERT INTO budgets (
  user_id, 
  client_name, 
  client_address, 
  client_city, 
  client_contact, 
  work_location, 
  service_type, 
  date, 
  services, 
  materials, 
  labor_cost, 
  labor_cost_with_materials,
  total_cost, 
  status
) 
VALUES (
  '5441cf37-fd40-44e1-91fe-eab720f2790e',
  'Teste Labor Cost With Materials',
  'Endereço Teste',
  'Cidade Teste',
  'Contato Teste',
  'Local Teste',
  'Serviço Teste',
  '2025-03-13',
  '[]',
  '[]',
  '100',
  '200',
  '300',
  'pending'
);

-- Verificar os registros
SELECT id, client_name, labor_cost, labor_cost_with_materials, total_cost 
FROM budgets 
WHERE id = 35 OR client_name = 'Teste Labor Cost With Materials'; 