# CotaHub - Sistema de Gestão de Orçamentos

<div align="center">

## CotaHUB

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

## 📋 Sobre o Projeto

O CotaHub é uma solução moderna para a criação e gestão de orçamentos, desenvolvida para otimizar o processo que tradicionalmente era feito em planilhas Excel. O sistema oferece uma interface intuitiva e funcionalidades automatizadas que reduzem significativamente o tempo gasto na elaboração de orçamentos.

### 🌟 Motivação

Desenvolvido inicialmente para resolver uma necessidade real de otimização no processo de criação de orçamentos, o CotaHub transformou uma tarefa que levava horas em um processo de poucos minutos, mantendo a organização e profissionalismo dos documentos gerados.

## 🚀 Funcionalidades

- ✨ Autenticação de usuários
- 📝 Criação e edição de orçamentos
- 🧮 Cálculo automático de valores
- 📄 Geração automática de PDF
- 📱 Compartilhamento via WhatsApp
- 🔍 Filtros e busca avançada
- 👁️ Preview em tempo real
- 📊 Dashboard com métricas
- 📱 Interface responsiva

## 🛠️ Tecnologias Utilizadas

### Frontend
- React + TypeScript
- Tailwind CSS
- Radix UI
- Shadcn/UI
- React Hook Form
- Zod
- React Query
- Framer Motion
- Wouter
- Recharts

### Backend & Infraestrutura
- Supabase (Backend as a Service)
- PostgreSQL
- Edge Functions
- Puppeteer
- Supabase Storage

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/orcamentos-pai.git

# Entre no diretório
cd cotahub

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local

# Inicie o servidor de desenvolvimento
npm run dev
```

## 🔧 Configuração

1. Crie uma conta no [Supabase](https://supabase.com/)
2. Configure as variáveis de ambiente:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

## 📚 Estrutura do Projeto

```
cotahub/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── types/
├── supabase/
│   └── functions/
└── shared/
    └── schema/
```

## 🔄 Fluxo de Trabalho

1. **Autenticação**: Login/Registro de usuários
2. **Dashboard**: Visão geral e métricas
3. **Orçamentos**: CRUD completo
4. **Geração de PDF**: Processamento automático
5. **Compartilhamento**: Integração com WhatsApp

## 🚀 Deploy

- Frontend: [Vercel](https://vercel.com)
- Backend: [Supabase](https://supabase.com)

## 📖 Documentação da API

### Endpoints Principais

```typescript
POST /api/budgets - Criar orçamento
GET /api/budgets - Listar orçamentos
PUT /api/budgets/:id - Atualizar orçamento
DELETE /api/budgets/:id - Deletar orçamento
POST /api/generate-pdf/:id - Gerar PDF
```

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👤 Autor

Seu Nome
- LinkedIn: [Wellington Felix](https://www.linkedin.com/in/str-well/)
- GitHub: [@str-well](https://github.com/str-well)


---

<div align="center">
⭐️ Se este projeto te ajudou, deixe uma estrela!
</div>
