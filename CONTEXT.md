# CONTEXT.md — psy-dbase-front

> **Leia isto antes de tocar no código.**
> Este documento é a fonte de verdade para qualquer IA ou dev que entre no projeto.
> Ele registra **decisões já tomadas** para evitar retrabalho e perguntas repetidas.

---

## 1. O que é este projeto

Interface web do **psy-dbase**, sistema de gestão para psicólogo autônomo.

Cobre cadastro de pacientes via formulário público, CRUD completo de pacientes,
CRUD de prestadores, revisão de provisórios importados do Google, agenda
(em construção), prontuário e financeiro (fases futuras).

**Repositório irmão:** `psy-dbase` (backend Node + integrações).
**Status:** em produção na Vercel — `https://psy-dbase-frontend.vercel.app`

---

## 2. Stack e versões

| Camada        | Tecnologia                                              | Versão       |
|---------------|---------------------------------------------------------|--------------|
| Build         | Vite                                                    | 7.x          |
| UI            | React                                                   | 19.x         |
| Tipagem       | TypeScript                                              | 5.9.x        |
| Estilo        | **Tailwind CSS v4** (plugin `@tailwindcss/vite`)        | 4.3.x        |
| Roteamento    | React Router                                            | 7.x          |
| Ícones        | lucide-react                                            | última       |
| Auth          | Supabase Auth (Google OAuth)                            | —            |
| Dados         | `@supabase/supabase-js`                                 | 2.x          |
| HTTP          | fetch nativo (via `src/lib/api.ts`)                     | —            |
| Gerenciador   | npm                                                     | —            |
| Deploy        | Vercel                                                  | —            |

---

## 3. Estrutura de pastas

```
src/
├── components/
│   ├── layout/           # Sidebar, Header, AppLayout
│   ├── ui/               # Button, Input, Card, Badge, Modal, ConfirmDialog,
│   │                     # EmptyState, Spinner, index.ts
│   ├── InvitePatientModal.tsx
│   ├── SubmissionCard.tsx
│   └── ProspectCard.tsx
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   ├── usePatient.ts         # busca 1 paciente por id
│   ├── usePatients.ts        # lista com filtro
│   ├── useProvider.ts        # busca 1 provider por id
│   ├── useProviders.ts       # lista com filtro
│   ├── useProspects.ts       # lista pacientes em prospect
│   └── useSubmissions.ts
├── lib/
│   ├── supabase.ts           # cliente único do Supabase
│   ├── api.ts                # fetch autenticado para o backend Node
│   ├── masks.ts              # maskCPF, maskCNPJ, maskPhone + validações
│   ├── text.ts               # toTitleCase
│   ├── patient-display.ts    # displayName (heurística visual)
│   └── weekdays.ts           # mapeamento 0–6 → "Dom".."Sáb"
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Patients.tsx
│   ├── PatientDetail.tsx
│   ├── PatientForm.tsx        # cria e edita
│   ├── PatientReview.tsx      # promove prospect a ativo
│   ├── PublicForm.tsx
│   ├── Providers.tsx
│   ├── ProviderDetail.tsx
│   ├── ProviderForm.tsx
│   └── Settings.tsx
├── types/
│   └── index.ts               # Patient, Provider, InviteResponse, ScheduleInput...
├── App.tsx
├── index.css                  # Tailwind v4 + @theme
└── main.tsx
```

---

## 4. Decisões de arquitetura

### 4.1 Dados vão direto para o Supabase

O frontend **não** passa pelo backend Node para ler/escrever dados de aplicação.
Fala direto com o Supabase via `@supabase/supabase-js`, e o **RLS** garante
isolamento.

O backend Node só é usado para operações que exigem **segredos**:

- Geração de convites (TinyURL + telefone + JWT validation)
- Google Calendar (OAuth, importação)
- Envio de WhatsApp / e-mail (Fase 6)
- Geração de PDF de recibo (Fase 5)
- Transcrição de áudio (a decidir)

### 4.2 Cliente HTTP autenticado

Toda chamada ao backend passa por `src/lib/api.ts`, que injeta o `Authorization:
Bearer <token>` automaticamente. **Nunca** chamar `fetch` direto.

### 4.3 RLS + GRANT obrigatórios em toda tabela nova

Toda tabela no Supabase precisa de:

1. RLS + policies (`auth.uid() = user_id`)
2. `grant select, insert, update, delete on … to authenticated;`

**Sem o GRANT, o Postgres barra antes da RLS** — erro `42501 permission denied
for table`.

### 4.4 Tailwind v4 — não é v3

- **Não existe** `tailwind.config.js`
- **Não existe** `postcss.config.js`
- Plugin em `vite.config.ts` via `@tailwindcss/vite`
- Tema (cores, fontes) em `src/index.css` dentro de `@theme { … }`
- Cor primária: `brand-*` (teal-600)
- Fonte Inter via `<link>` no `index.html`

### 4.5 Design system próprio em `components/ui/`

Componentes base:

- `Button` — variantes: `primary`, `secondary`, `ghost`, `danger`
- `Input` — com `label`, `error`, `hint`
- `Card` — container com borda e sombra sutil
- `Badge` — variantes: `success`, `warning`, `danger`, `neutral`, `brand`
- `Modal` — overlay + Esc para fechar
- `ConfirmDialog` — modal de confirmação com tons
- `EmptyState` — ícone + título + descrição + ação
- `Spinner` — loading circular

### 4.6 Layout de app autenticado

Rotas protegidas envelopadas por `<AppLayout />`:

- `Sidebar` fixa em desktop (>= `lg`), drawer em mobile
- `Header` sticky com avatar + logout

Ordem da sidebar: Dashboard, Pacientes, **Prestadores**, Agenda (futuro),
Prontuário (futuro), Financeiro (futuro), Configurações.

### 4.7 Rotas públicas fora do ProtectedRoute

`/login` e `/form/:token` ficam **antes** do `<ProtectedRoute>`.

**Atenção:** rota não declarada cai no fallback `*` → `/dashboard` →
`ProtectedRoute` → `/login`.

**Ordem das rotas dinâmicas importa:** `/patients/new` e
`/patients/:id/review` **antes** de `/patients/:id`, senão o `:id` captura
`new` e `review`.

### 4.8 SPA routing na Vercel

`vercel.json` com rewrite:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### 4.9 Variáveis `VITE_*` são injetadas em build time

Mudar env var no painel da Vercel exige **redeploy sem cache**.

### 4.10 Env vars de produção ficam no painel da Vercel

`.env.local` local **só vale para desenvolvimento**. Deixar tudo como **Config**
(nada é segredo real com prefixo `VITE_`).

### 4.11 Nada de diálogos nativos do navegador

**Regra:** nunca usar `alert()`, `confirm()` ou `prompt()` nativos.

Sempre usar:

- **`ConfirmDialog`** — confirmações destrutivas ou decisões importantes
- **`Modal`** — formulários, avisos extensos

**Exceção conhecida:** `alert(error.message)` em `PatientDetail.tsx` e
`ProviderDetail.tsx` em handlers de arquivar/reativar — só dispara em erro raro
do Supabase. Trocar por `AlertDialog` futuramente.

### 4.12 Normalização de nome vs. máscaras in-locus

- **Nome:** normaliza **silenciosamente ao enviar** (`toTitleCase`). O input
  mostra o que o usuário digita; o banco recebe limpo.
- **Telefone e CPF/CNPJ:** máscara **in-locus** enquanto digita.

### 4.13 CRUD de pacientes

- **Criar do zero:** `/patients/new` (`PatientForm.tsx`)
- **Editar:** `/patients/:id/edit` (mesmo componente)
- **Arquivar (soft delete):** `status='inactive'`. Reversível.
- **Excluir (hard delete):** botão ghost no detalhe, `ConfirmDialog` `danger`.
- **Listagem:** filtros "Ativos | Arquivados | Todos" via `usePatients(filter)`

**Atenção:** `PatientForm` redireciona `prospect` para `/patients/:id/review`
(impede edição comum de provisório).

### 4.14 CRUD de prestadores

- **Criar do zero:** `/providers/new` (`ProviderForm.tsx`)
- **Editar:** `/providers/:id/edit`
- **Arquivar (soft delete):** `status='archived'`. Reversível.
- **Excluir (hard delete):** botão ghost no detalhe.
- **Listagem:** filtros "Todos | Pessoas | Empresas | Arquivados"

**Formulário dinâmico:** se `kind='person'`, mostra CPF e esconde Razão social;
se `kind='company'`, mostra CNPJ + Razão social. Ao trocar tipo, o campo
`document` é limpo (máscara diferente).

### 4.15 Revisão de provisórios

Provisórios (`patients.status='prospect'`) aparecem **apenas** no bloco
"Aguardando revisão" em `/patients`, **não** na tabela normal.

Três ações por card (`ProspectCard`), cada uma chamando uma RPC:

- **É paciente** → navega para `/patients/:id/review` onde o usuário completa
  e ativa (chama `promote_prospect_to_active`)
- **É prestador** → `ConfirmDialog` → `convert_prospect_to_provider`
- **Remover** → `ConfirmDialog` → `discard_prospect`

**Heurística de exibição:** `displayName()` remove prefixos comuns
("Atendimento ", "Sessão ") apenas na UI. O banco mantém o texto cru
(`Atendimento Eduardo`).

### 4.16 Integração Google Calendar

- **Conectar:** botão em `/settings` chama `GET /calendar/connect`, abre URL
  em **nova aba**
- **Callback:** backend redireciona para `/settings?google=connected`, que
  exibe feedback e limpa o parâmetro da URL
- **Importar:** botão em `/settings` chama `POST /calendar/import` com
  `{ daysAhead: 90 }`
- **Desconectar:** `ConfirmDialog` + `DELETE /calendar/disconnect`

**Sobre o fluxo em nova aba:** a aba original **não sabe** automaticamente que
a conexão foi concluída. F5 é necessário. Melhoria futura: `postMessage`.

---

## 5. Fluxos principais

### 5.1 Login

`supabase.auth.signInWithOAuth({ provider: "google", redirectTo: <origin>/dashboard })`.
Supabase valida `redirectTo` contra **Redirect URLs**. **Site URL** e **Redirect
URLs** precisam ter produção e `localhost:5173`.

### 5.2 Convite de paciente

1. `/patients` → "Convidar"
2. `InvitePatientModal` coleta nome (opcional), telefone e ≥ 1 horário
3. `POST /invites` no backend
4. Backend cria convite, encurta URL, monta link `wa.me`
5. Frontend abre `whatsappUrl` em nova aba

### 5.3 Formulário público

1. Paciente abre `/form/<token>`
2. `PublicForm` valida token via RPC `get_invite_by_token`
3. Mostra sessões combinadas + campos com máscara + 2 checkboxes (termo +
   orientação sobre o local)
4. Envia via RPC `submit_patient_form` (valida tudo, grava os dois aceites,
   marca convite como usado)

### 5.4 Aprovar/Rejeitar submissão

1. `/patients` → seção "Submissões pendentes"
2. **Aprovar** → RPC `approve_submission` cria `patient` com `status='prospect'`
3. **Rejeitar** → `update status='rejected'`

**Nota:** pacientes aprovados via submissão entram como `prospect`, e vão para
o bloco "Aguardando revisão" — não direto para ativos.

### 5.5 Criar/editar paciente manual

1. `/patients/new` ou `/patients/:id/edit`
2. Validações de CPF/telefone; `toTitleCase` no nome
3. Redireciona para `/patients/:id`

### 5.6 Revisar provisório

1. `/patients` → bloco "Aguardando revisão"
2. Cada card mostra `displayName` + nome cru
3. Três ações (ver seção 4.15)

### 5.7 CRUD de prestador

Análogo ao de paciente, com `kind` (person/company), `legal_name` (empresas),
`document` (CPF/CNPJ).

### 5.8 Google Calendar — conectar / importar / desconectar

Ver seção 4.16.

---

## 6. Convenções de código

- **Idioma:** variáveis, funções, tipos, arquivos em **inglês**. Comentários
  em **português**.
- **Componentes:** função nomeada (`export function Foo()`).
- **Tipos:** usar `type`, não `interface`.
- **Estados de fetch:** sempre tratar `loading`, `error` e `empty`.
- **Rotas:** PascalCase para páginas, kebab-case para utilitários.
- **Nada de `any`:** exceto em integrações com bibliotecas.

---

## 7. Armadilhas conhecidas

| Sintoma                                             | Causa                                           | Solução                                                     |
|-----------------------------------------------------|-------------------------------------------------|-------------------------------------------------------------|
| `42501 permission denied for table`                 | Faltou GRANT                                    | `grant … to authenticated;`                                 |
| Login redireciona para `localhost` em produção      | Site URL aponta para localhost                  | Ajustar **Site URL** e **Redirect URLs**                    |
| `/dashboard` dá 404 em produção                     | Falta `vercel.json` com SPA rewrite             | Criar `vercel.json`                                         |
| Tailwind não aplica estilos novos                   | Config v3 em projeto v4                         | Usar `@theme` + plugin Vite                                 |
| Bundle aponta para `localhost` mesmo após config    | `VITE_*` só em novo build                       | Redeploy **sem cache**                                      |
| `tsc -b` falha com `declared but never used`        | Import não usado                                | Remover o import                                            |
| Rota `:id` captura `new` ou `review`                | Ordem das rotas                                 | Declarar literais antes de dinâmicas                        |
| Prospect aparece na tabela normal                   | Filtro não exclui `prospect`                    | `usePatients` filtra por `.neq("status", "prospect")`       |
| `PatientStatus` sem `prospect` no `Record`          | Tipo desatualizado                              | Adicionar `prospect` nos records                            |
| Prestador não aparece em `/providers`               | `status='archived'` ou `kind` errado            | Conferir filtros                                            |

---

## 8. Segurança

- **`anon key`:** painel da Vercel + `.env.local`. Segura ali **porque o RLS
  protege**.
- **`service_role`:** exclusiva do backend. Nunca no frontend.
- **`access_token`:** header `Authorization`. Expira em 1h, renovado pelo SDK.
- **Env vars `VITE_*` são públicas:** aparecem no bundle.
- **LGPD:** dado sensível de saúde. Consentimento explícito, direito ao
  esquecimento.

---

## 9. O que está fora do escopo

- Lógica pesada (convite, OAuth, importação, PDF) → **backend `psy-dbase`**
- Migrations SQL → **SQL Editor do Supabase**
- Autenticação OAuth → **Supabase Auth**
- Deploy do backend → **Vercel** (projeto separado)

---

## 10. Estado atual (última atualização)

**Concluído:**

- ✅ Fase 1: Auth Google, deploy Vercel, SPA routing
- ✅ Fase 2: convite, formulário público, submissões, CRUD de pacientes
- ✅ Design system + layout autenticado
- ✅ Migração Tailwind v3 → v4
- ✅ Máscaras (CPF, CNPJ, telefone) + normalização de nome
- ✅ Página `/settings` com Google Calendar
- ✅ Bloco "Aguardando revisão" com `ProspectCard`
- ✅ Página `/patients/:id/review` (promoção de prospect a paciente)
- ✅ CRUD de prestadores (listagem, criar, editar, arquivar, excluir)
- ✅ Filtros por tipo em `/providers` (pessoas / empresas / arquivados)

**Pendente (Fase 3+):**

- ⏳ Página `/agenda` (visualização semanal de `appointments`)
- ⏳ Bloqueio rígido no `InvitePatientModal` (slots ocupados)
- ⏳ Horários na criação manual de paciente
- ⏳ CRUD de `due` (vencimentos de provider)
- ⏳ Prontuário (`/patients/:id/records`)
- ⏳ Financeiro (`/finance`)
- ⏳ Notificações
- ⏳ Preferências do consultório editáveis
- ⏳ Edição de perfil
- ⏳ Ajustes finos (404 customizada, favicon, metadados)

**Branches ativas:**
- Frontend: `main`
- Backend: `main`

---

## 11. Como usar este documento

Ao entrar no projeto, leia na ordem:

1. Este `CONTEXT.md`
2. `README.md`
3. `TODO.md`
4. Código em `src/`

Se algo aqui estiver desatualizado, **atualize antes de codar**.