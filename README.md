# psy-dbase-front

Interface web do **psy-dbase** — sistema de gestão para psicólogo autônomo.

Cobre cadastro de pacientes via formulário público com link único, agenda integrada
ao Google Calendar + Meet, prontuário com evolução SOAP, financeiro com
entradas/saídas categorizadas, recibos e relatórios.

> **Repositório irmão:** `psy-dbase` (backend Node + integrações)

## Stack

| Camada        | Tecnologia                                              |
|---------------|---------------------------------------------------------|
| Build         | Vite 7                                                  |
| UI            | React 19 + TypeScript                                   |
| Estilo        | Tailwind CSS v4 (plugin `@tailwindcss/vite`)            |
| Roteamento    | React Router v7                                         |
| Ícones        | lucide-react                                            |
| Auth          | Supabase Auth (Google OAuth)                            |
| Dados         | Supabase JS Client (fala direto com o Postgres via RLS) |
| HTTP          | fetch nativo, encapsulado em `src/lib/api.ts`           |
| Deploy        | Vercel                                                  |
| Gerenciador   | npm                                                     |

> **Idioma do código:** variáveis, funções, tipos e nomes de arquivo em inglês.
> Comentários em português.

## Arquitetura

```
[React + Tailwind]
       │
       ├──→ [Supabase JS Client] ──→ [Supabase Postgres + RLS]
       │                                (leitura/escrita direta)
       │
       └──→ [Backend Node]  ──→ [Google Calendar / Meet]
                                 [WhatsApp / E-mail]
                                 [Storage de áudio / PDFs]
```

- **Dados de aplicação** (pacientes, agenda, prontuário, financeiro): o frontend
  fala **direto** com o Supabase. RLS garante isolamento por psicólogo.
- **Operações que exigem segredos** (Google OAuth, WhatsApp, PDF, transcrição):
  passam pelo backend Node.
- **Multi-tenant:** um psicólogo por conta. `auth.uid()` é a chave de isolamento.

## Estrutura de pastas

```
src/
├── components/
│   ├── layout/          # Sidebar, Header, AppLayout
│   └── ui/              # Design system (Button, Input, Card, Modal…)
├── contexts/            # AuthContext
├── hooks/               # usePatients, etc.
├── lib/                 # supabase.ts, api.ts
├── pages/               # Login, Dashboard, Patients, PublicForm
├── types/               # Tipos compartilhados
├── App.tsx
├── index.css            # Tailwind v4 + @theme
└── main.tsx
```

## Rodando localmente

### 1. Pré-requisitos

- Node 20+
- npm 10+
- Projeto Supabase configurado (ver `.env.example`)

### 2. Instalar

```bash
npm install
```

### 3. Variáveis de ambiente

Crie `.env.local` na raiz com:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...sua_anon_key
VITE_API_URL=http://localhost:3333
```

> ⚠️ `.env.local` **não** vai para o Git. A `anon key` é pública e segura no
> frontend **porque o RLS protege os dados**. Nunca coloque a `service_role`
> aqui — ela é exclusiva do backend.

### 4. Rodar

```bash
npm run dev
```

Acesse `http://localhost:5173`.

## Scripts

| Comando           | O que faz                          |
|-------------------|------------------------------------|
| `npm run dev`     | Dev server com hot reload          |
| `npm run build`   | Build de produção (`dist/`)        |
| `npm run preview` | Preview do build local             |
| `npm run lint`    | ESLint                             |

## Autenticação

- Login via **Google OAuth**, intermediado pelo Supabase Auth.
- Fluxo:
  1. Usuário clica em "Entrar com Google"
  2. `supabase.auth.signInWithOAuth({ provider: "google" })`
  3. Redireciona para o Google → volta para `/dashboard`
  4. `AuthContext` mantém a sessão e injeta o JWT nas requisições
- Rotas protegidas usam `<ProtectedRoute />` que redireciona para `/login` se
  não houver sessão.

## Tailwind v4

Este projeto usa **Tailwind CSS v4**, que tem configuração diferente da v3:

- **Não** existe `tailwind.config.js`
- **Não** existe `postcss.config.js`
- O plugin é registrado em `vite.config.ts` via `@tailwindcss/vite`
- O tema (cores, fontes) vai em `src/index.css` dentro de `@theme { … }`

Cores customizadas estão expostas como `brand-*` (teal-600 como primária).

## Rotas

| Rota              | Acesso          | Descrição                                  |
|-------------------|-----------------|--------------------------------------------|
| `/login`          | Público         | Tela de login com Google                   |
| `/form/:token`    | Público         | Formulário de cadastro do paciente         |
| `/dashboard`      | Autenticado     | Visão geral                                |
| `/patients`       | Autenticado     | Listagem de pacientes + convite            |

## Deploy

Hospedado na **Vercel**. Variáveis de ambiente configuradas no painel do projeto.

Após o deploy, é preciso adicionar a URL da Vercel em:

1. **Supabase → Authentication → URL Configuration** (Site URL + Redirect URLs)
2. **Google Cloud → Credentials → OAuth Client** (Authorized JavaScript origins)

## Conformidade

- **LGPD:** dado sensível de saúde. Consentimento explícito, link de prontuário
  com hash expirável, sem indexação.
- **Sigilo profissional:** acesso ao prontuário apenas por link temporário.

## Documentos relacionados

- [`TODO.md`](./TODO.md) — tarefas pendentes por fase
- [`CONTEXT.md`](./CONTEXT.md) — contexto para IA: arquitetura, decisões, padrões

## Licença

A definir.