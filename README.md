psy-dbase-front/README.md
markdown
# psy-dbase-front

Interface web do **psy-dbase** — sistema de gestão para psicólogo autônomo.

Cobre cadastro de pacientes via formulário público com link único, agenda
integrada ao Google Calendar + Meet, prontuário com evolução SOAP, financeiro
com entradas/saídas categorizadas, recibos e relatórios.

> **Repositório irmão:** `psy-dbase` (backend Node + integrações)

## Stack

| Camada        | Tecnologia                                              | Versão |
|---------------|---------------------------------------------------------|--------|
| Build         | Vite                                                    | 7.x    |
| UI            | React + TypeScript                                      | 19.x   |
| Estilo        | **Tailwind CSS v4** (plugin `@tailwindcss/vite`)        | 4.3.x  |
| Roteamento    | React Router                                            | 7.x    |
| Ícones        | lucide-react                                            | —      |
| Auth          | Supabase Auth (Google OAuth)                            | —      |
| Dados         | Supabase JS Client (RLS)                                | 2.x    |
| HTTP          | fetch nativo (via `src/lib/api.ts`)                     | —      |
| Deploy        | Vercel                                                  | —      |
| Gerenciador   | npm                                                     | —      |

> **Idioma do código:** variáveis, funções, tipos e nomes de arquivo em inglês.
> Comentários em português.

## Arquitetura
[React + Tailwind]
│
├──→ [Supabase JS Client] ──→ [Supabase Postgres + RLS]
│ (leitura/escrita direta)
│
└──→ [Backend Node] ──→ [Google Calendar / Meet]
[WhatsApp / E-mail]
[Storage de áudio / PDFs]

text

- **Dados de aplicação** (pacientes, agenda, prontuário, financeiro): o frontend
  fala **direto** com o Supabase. RLS garante isolamento por psicólogo.
- **Operações que exigem segredos** (Google OAuth, WhatsApp, PDF, transcrição):
  passam pelo backend Node.
- **Multi-tenant:** um psicólogo por conta. `auth.uid()` é a chave de isolamento.

## Estrutura de pastas
src/
├── components/
│ ├── agenda/ # Componentes da página /agenda
│ ├── layout/ # Sidebar, Header, AppLayout
│ └── ui/ # Design system (Button, Input, Card…)
├── contexts/ # AuthContext
├── hooks/ # usePatients, useAppointments, useOccupiedSlots…
├── lib/ # supabase.ts, api.ts, agenda-date.ts, masks.ts…
├── pages/ # Login, Dashboard, Patients, Agenda, Settings…
├── types/ # Tipos compartilhados
├── App.tsx
├── index.css # Tailwind v4 + @theme
└── main.tsx

text

## Rodando localmente

### 1. Pré-requisitos

- Node 20+
- npm 10+
- Projeto Supabase configurado (mesmo do backend)

### 2. Instalar

```bash
npm install
3. Variáveis de ambiente
Crie .env.local na raiz com:

env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...sua_anon_key
VITE_API_URL=http://localhost:3333
⚠️ .env.local não vai para o Git. A anon key é pública e segura no
frontend porque o RLS protege os dados. Nunca coloque a service_role
aqui — ela é exclusiva do backend.

4. Rodar
bash
npm run dev
Acesse http://localhost:5173.

Scripts
Comando	O que faz
npm run dev	Dev server com hot reload
npm run build	Build de produção (dist/)
npm run preview	Preview do build local
npm run lint	ESLint
Autenticação
Login via Google OAuth, intermediado pelo Supabase Auth

Fluxo: usuário clica em "Entrar com Google" → signInWithOAuth →
redireciona para /dashboard → AuthContext mantém a sessão

Rotas protegidas usam <ProtectedRoute /> que redireciona para /login

Tailwind v4
Este projeto usa Tailwind CSS v4, que tem configuração diferente da v3:

Não existe tailwind.config.js

Não existe postcss.config.js

Plugin registrado em vite.config.ts via @tailwindcss/vite

Tema (cores, fontes) em src/index.css dentro de @theme { … }

Cor primária: brand-* (teal-600)

Rotas
Rota	Acesso	Descrição
/login	Público	Login com Google
/form/:token	Público	Formulário público do paciente
/dashboard	Autenticado	Visão geral
/patients	Autenticado	Listagem + submissões + provisórios
/patients/new	Autenticado	Criar paciente manualmente
/patients/:id	Autenticado	Detalhe do paciente
/patients/:id/edit	Autenticado	Editar paciente
/patients/:id/review	Autenticado	Revisar/promover provisório a paciente
/providers	Autenticado	Listagem de prestadores
/providers/new	Autenticado	Criar prestador
/providers/:id	Autenticado	Detalhe do prestador
/providers/:id/edit	Autenticado	Editar prestador
/agenda	Autenticado	Redireciona para /agenda/week/<hoje>
/agenda/:view/:date	Autenticado	view = day | week | month
/settings	Autenticado	Google Calendar + preferências
Deploy
Hospedado na Vercel. Env vars no painel do projeto.

Após deploy, é preciso adicionar a URL da Vercel em:

Supabase → Authentication → URL Configuration (Site URL + Redirect URLs)

Google Cloud → Credentials → OAuth Client (Authorized JavaScript origins)

Conformidade
LGPD: dado sensível de saúde. Consentimento explícito, link de prontuário
com hash expirável, sem indexação.

Sigilo profissional: acesso ao prontuário apenas por link temporário.

Documentos relacionados
TODO.md — tarefas pendentes por fase

CONTEXT.md — contexto para IA: arquitetura, decisões, padrões

Licença
A definir.