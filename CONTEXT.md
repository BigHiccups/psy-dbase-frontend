# CONTEXT.md — psy-dbase-front

> **Leia isto antes de tocar no código.**
> Este documento é a fonte de verdade para qualquer IA ou dev que entre no projeto.
> Ele registra **decisões já tomadas** para evitar retrabalho e perguntas repetidas.

---

## 1. O que é este projeto

Interface web do **psy-dbase**, sistema de gestão para psicólogo autônomo.

Cobre cadastro de pacientes via formulário público com link único, CRUD completo
de pacientes, configurações e integração com Google Calendar. Agenda visual,
prontuário e financeiro vêm nas próximas fases.

**Repositório irmão:** `psy-dbase` (backend Node + integrações).
**Um psicólogo por conta.** Não é multi-tenant compartilhado.
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
│   └── SubmissionCard.tsx
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   ├── usePatient.ts     # busca 1 paciente por id
│   ├── usePatients.ts    # busca lista com filtro
│   └── useSubmissions.ts
├── lib/
│   ├── supabase.ts       # cliente único do Supabase
│   ├── api.ts            # fetch autenticado para o backend Node
│   ├── masks.ts          # maskCPF, maskPhone + validações
│   ├── text.ts           # toTitleCase
│   └── weekdays.ts       # mapeamento 0–6 → "Dom".."Sáb"
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Patients.tsx
│   ├── PatientDetail.tsx
│   ├── PatientForm.tsx         # cria e edita
│   ├── PublicForm.tsx
│   └── Settings.tsx            # Google Calendar + preferências
├── types/
│   └── index.ts
├── App.tsx
├── index.css             # Tailwind v4 + @theme
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
- **Google Calendar (OAuth, importação, sincronização)**
- Envio de WhatsApp / e-mail (Fase 6)
- Geração de PDF de recibo (Fase 5)
- Transcrição de áudio (a decidir)

### 4.2 Cliente HTTP autenticado

Toda chamada ao backend passa por `src/lib/api.ts`, que:

1. Pega o `access_token` da sessão Supabase (`supabase.auth.getSession()`)
2. Injeta `Authorization: Bearer <token>`
3. Lança erro se não houver sessão

**Nunca** chamar `fetch` direto para o backend. Sempre via `apiFetch`.

### 4.3 RLS + GRANT obrigatórios em toda tabela nova

Toda tabela no Supabase precisa de **duas coisas**:

1. RLS + **policies** (`auth.uid() = user_id`)
2. `grant select, insert, update, delete on … to authenticated;`

**Sem o GRANT, o Postgres barra antes da RLS** — erro `42501 permission denied
for table`.

### 4.4 Tailwind v4 — não é v3

- **Não existe** `tailwind.config.js`
- **Não existe** `postcss.config.js`
- Plugin em `vite.config.ts` via `@tailwindcss/vite`
- Tema (cores, fontes) em `src/index.css` dentro de `@theme { … }`
- Cor primária: `brand-*` (teal-600)
- Fonte Inter via `<link>` no `index.html` (não via `@import` no CSS)

### 4.5 Design system próprio em `components/ui/`

Componentes base:

- `Button` — variantes: `primary` (brand), `secondary`, `ghost`, `danger`
- `Input` — com `label`, `error`, `hint`
- `Card` — container com borda e sombra sutil
- `Badge` — variantes: `success`, `warning`, `danger`, `neutral`, `brand`
- `Modal` — overlay + Esc para fechar
- `ConfirmDialog` — modal de confirmação com tons (`default`, `warning`, `danger`, `success`)
- `EmptyState` — ícone + título + descrição + ação
- `Spinner` — loading circular

**Regra:** telas novas devem usar esses componentes.

### 4.6 Layout de app autenticado

Rotas protegidas envelopadas por `<AppLayout />`:

- `Sidebar` fixa em desktop (>= `lg`), drawer em mobile
- `Header` sticky com avatar + logout

Estrutura no `App.tsx`:

```
<Route element={<ProtectedRoute />}>
  <Route element={<AppLayout />}>
    ...rotas protegidas...
  </Route>
</Route>
```

### 4.7 Rotas públicas fora do ProtectedRoute

`/login` e `/form/:token` ficam **antes** do `<ProtectedRoute>`.

**Atenção:** qualquer rota nova não declarada cai no fallback `*` → `/dashboard`
→ `ProtectedRoute` → `/login`.

### 4.8 SPA routing na Vercel

React Router gerencia rotas **no navegador**. Para evitar 404 em URLs diretas,
existe `vercel.json` com rewrite:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 4.9 Variáveis `VITE_*` são injetadas em build time

O Vite congela o valor de `import.meta.env.VITE_*` no bundle. Mudar env var no
painel da Vercel exige **redeploy sem cache**.

**Sintoma clássico:** bundle aponta para `localhost` mesmo após configurar.

### 4.10 Env vars de produção ficam no painel da Vercel

`.env.local` local **só vale para desenvolvimento**. Em produção, painel da
Vercel manda. Deixar tudo como **Config** (nada é segredo real com prefixo
`VITE_`).

### 4.11 Nada de diálogos nativos do navegador

**Regra:** nunca usar `alert()`, `confirm()` ou `prompt()` nativos.

Sempre usar:

- **`ConfirmDialog`** — confirmações destrutivas ou decisões importantes
- **`Modal`** — formulários, avisos extensos

Exemplo:

```tsx
<ConfirmDialog
  open={open}
  onClose={() => setOpen(false)}
  onConfirm={handleDelete}
  title="Excluir paciente?"
  description="Esta ação não pode ser desfeita."
  confirmLabel="Excluir"
  tone="danger"
/>
```

**Exceção conhecida:** `alert(error.message)` em `PatientDetail.tsx` em dois
handlers (`handleArchive`, `handleReactivate`) — só dispara em erro raro do
Supabase. Trocar por `AlertDialog` futuramente.

### 4.12 Normalização de nome vs. máscaras in-locus

- **Nome:** normaliza **silenciosamente ao enviar** (`toTitleCase`). O input
  mostra o que o usuário digita; o banco recebe limpo.
- **Telefone e CPF:** máscara **in-locus** enquanto digita (`maskPhone`,
  `maskCPF`).

### 4.13 CRUD de pacientes

- **Criar do zero:** rota `/patients/new` (`PatientForm.tsx`), sem convite
- **Editar:** rota `/patients/:id/edit` (mesmo componente, com `id`)
- **Arquivar (soft delete):** muda `status='inactive'`. Reversível.
- **Excluir (hard delete):** botão ghost no detalhe, `ConfirmDialog` tone
  `danger`. Irreversível.
- **Listagem:** filtros "Ativos | Arquivados | Todos" via hook `usePatients(filter)`

### 4.14 Integração Google Calendar

- **Conectar:** botão em `/settings` chama `GET /calendar/connect`, abre URL
  em **nova aba**
- **Callback:** backend redireciona para `/settings?google=connected`, que
  exibe feedback e limpa o parâmetro da URL
- **Importar:** botão em `/settings` chama `POST /calendar/import` com
  `{ daysAhead: 90 }`
- **Desconectar:** botão + `ConfirmDialog` + `DELETE /calendar/disconnect`

**Sobre o fluxo em nova aba:** a aba original **não sabe** automaticamente que
a conexão foi concluída. F5 é necessário. Melhoria futura: `postMessage`.

### 4.15 Status `prospect`

`patients.status` aceita 4 valores: `prospect`, `active`, `inactive`,
`discharged`.

**`prospect`** = paciente importado do Google que ainda não foi revisado. A
UI de revisão ainda não existe — provisórios aparecem na lista de pacientes
como qualquer outro, mas com o nome cru do Google (`Atendimento Eduardo`).

**Heurística de exibição planejada:** `displayName()` que remove prefixos
comuns (`Atendimento `, `Sessão `) apenas visualmente — o banco mantém o texto
cru.

---

## 5. Fluxos principais

### 5.1 Login

1. Usuário clica em "Entrar com Google" na `/login`
2. `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: <origin>/dashboard } })`
3. Redireciona para Google → volta para `/dashboard`
4. `AuthContext` mantém a sessão via `onAuthStateChange`
5. Trigger no banco cria `profiles` automaticamente

**Importante:** o Supabase valida `redirectTo` contra a lista de **Redirect
URLs** no painel. `Site URL` **e** `Redirect URLs` precisam ter produção e
`localhost:5173`.

### 5.2 Convite de paciente

1. Psicólogo vai em `/patients` → "Convidar"
2. `InvitePatientModal` coleta nome (opcional), telefone (obrigatório) e pelo
   menos 1 horário (obrigatório)
3. Chama `POST /invites` no backend
4. Backend cria convite, encurta URL, monta link do WhatsApp
5. Frontend abre `whatsappUrl` em nova aba
6. Modal mostra resumo dos horários + botão "Copiar link"

### 5.3 Formulário público

1. Paciente abre `https://psy-dbase-frontend.vercel.app/form/<token>`
2. `PublicForm` valida token via RPC `get_invite_by_token`
3. Mostra:
   - Bloco "Sessões combinadas" (leitura)
   - Campos cadastrais com máscaras (CPF, telefone)
   - Checkbox do **termo de confidencialidade**
   - Checkbox da **orientação sobre o local**
4. Ao enviar, chama RPC `submit_patient_form` (valida tudo de novo, grava os
   dois aceites com timestamp, marca convite como usado)
5. Paciente vê tela de sucesso

### 5.4 Aprovar/Rejeitar submissão

1. Psicólogo vai em `/patients`
2. Seção "Submissões pendentes" (âmbar) mostra os formulários enviados
3. **Aprovar** → RPC `approve_submission` cria `patients` com `status='prospect'`
4. **Rejeitar** → `update status='rejected'`
5. Após qualquer ação, `reload()` é chamado nos hooks

### 5.5 Criar/editar paciente manual

1. `/patients/new` ou `/patients/:id/edit` (mesmo componente `PatientForm`)
2. Validação de CPF (`isValidCPF`) e telefone (`isValidPhoneBR`)
3. `toTitleCase` no nome ao enviar
4. Redireciona para `/patients/:id`

### 5.6 Arquivar / Reativar / Excluir paciente

Em `/patients/:id`:

- **Arquivar** → `ConfirmDialog` (tone `warning`) → `update status='inactive'`
- **Reativar** → `ConfirmDialog` (tone `success`) → `update status='active'`
- **Excluir** → `ConfirmDialog` (tone `danger`) → `delete` → redireciona

### 5.7 Google Calendar — conectar

1. Em `/settings`, clica em "Conectar Google Calendar"
2. Chama `GET /calendar/connect` → recebe `{ url }`
3. `window.open(url, "_blank")`
4. Usuário autoriza no Google
5. Backend processa e redireciona para `/settings?google=connected`
6. Frontend mostra feedback verde e limpa o parâmetro

### 5.8 Google Calendar — importar

1. Em `/settings`, clica em "Importar agenda"
2. Chama `POST /calendar/import` com `{ daysAhead: 90 }`
3. Feedback mostra `X agendamentos e Y pacientes criados. Z já existiam.`

### 5.9 Google Calendar — desconectar

1. Botão "Desconectar" → `ConfirmDialog` (tone `danger`)
2. `DELETE /calendar/disconnect`
3. Feedback verde, card volta para "Não conectado"

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
| `Unsupported provider: provider is not enabled`     | Google OAuth não salvo no Supabase              | Authentication → Providers                                  |
| `redirect_uri_mismatch`                             | Callback do Google ≠ do Supabase                | `https://<ref>.supabase.co/auth/v1/callback`                |
| Login redireciona para `localhost` em produção      | Site URL aponta para localhost                  | Ajustar **Site URL** e **Redirect URLs**                    |
| `/dashboard` dá 404 em produção                     | Falta `vercel.json` com SPA rewrite             | Criar `vercel.json`                                         |
| Tailwind não aplica estilos novos                   | Config v3 em projeto v4                         | Usar `@theme` + plugin Vite                                 |
| `@import statements must precede all other…`        | `@import` da fonte após Tailwind                | Fonte via `<link>` no `index.html`                          |
| Bundle aponta para `localhost` mesmo após config    | `VITE_*` só em novo build                       | Redeploy **sem cache**                                      |
| `VITE_API_URL não configurada` em produção          | Variável ausente ou deploy antigo               | Painel + redeploy sem cache                                 |
| CORS no site de produção                            | Backend fora do ar (500)                        | Corrigir backend primeiro                                   |
| `tsc -b` falha com `declared but never used`        | Import não usado                                | Remover o import                                            |
| Callback OAuth do Google não volta para `/settings` | `FRONTEND_URL` no backend errado                | Confirmar `http://localhost:5173`                           |
| `Access blocked: app not verified`                  | Conta não está como Test User no Google Cloud   | Adicionar em Público-alvo                                   |

---

## 8. Segurança

- **`anon key`:** painel da Vercel + `.env.local`. Segura ali **porque o RLS
  protege**.
- **`service_role`:** exclusiva do backend. Nunca no frontend.
- **`access_token`:** header `Authorization`. Expira em 1h, renovado pelo SDK.
- **Env vars `VITE_*` são públicas:** aparecem no bundle. Nunca colocar segredo
  com esse prefixo.
- **LGPD:** dado sensível de saúde. Consentimento explícito, direito ao
  esquecimento.

---

## 9. O que está fora do escopo

- Lógica pesada (convite, OAuth, importação) → **backend `psy-dbase`**
- Migrations SQL → **SQL Editor do Supabase**
- Autenticação OAuth (login) → **Supabase Auth**
- Deploy do backend → **Vercel** (projeto separado)

---

## 10. Estado atual (última atualização)

**Concluído:**

- ✅ Fase 1: Auth Google, deploy Vercel, SPA routing
- ✅ Fase 2: convite com horários, formulário público, submissões, aprovação
- ✅ Design system + layout autenticado
- ✅ Migração Tailwind v3 → v4
- ✅ CRUD completo de pacientes (criar, editar, arquivar, reativar, excluir)
- ✅ Detalhe do paciente
- ✅ Filtros na listagem (Ativos / Arquivados / Todos)
- ✅ Máscaras (CPF, telefone) + normalização de nome
- ✅ Página `/settings` com Google Calendar (conectar, importar, desconectar)
- ✅ Feedback pós-OAuth

**Pendente (Fase 3+):**

- ⏳ UI de revisão de provisórios (`prospect`) — vincular, promover, rejeitar
- ⏳ Página `/agenda` (visualização semanal de `appointments`)
- ⏳ Bloqueio rígido no `InvitePatientModal` (slots ocupados)
- ⏳ Horários na criação de paciente manual (`PatientForm`)
- ⏳ Sessões avulsas
- ⏳ Sincronização visual com Google Calendar
- ⏳ Preferências do consultório editáveis
- ⏳ Edição de perfil
- ⏳ Prontuário (`/patients/:id/records`)
- ⏳ Financeiro (`/finance`)
- ⏳ Notificações

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