# CONTEXT.md — psy-dbase-front

> **Leia isto antes de tocar no código.**
> Este documento é a fonte de verdade para qualquer IA ou dev que entre no projeto.
> Ele registra **decisões já tomadas** para evitar retrabalho e perguntas repetidas.

---

## 1. O que é este projeto

Interface web do **psy-dbase**, sistema de gestão para psicólogo autônomo.

Cobre cadastro de pacientes via formulário público com link único, submissões
pendentes com aprovação, agenda (Fase 3), prontuário com evolução SOAP (Fase 4),
financeiro (Fase 5) e relatórios.

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
│   ├── layout/          # Sidebar, Header, AppLayout
│   ├── ui/              # Button, Input, Card, Badge, Modal, EmptyState, Spinner, index.ts
│   ├── InvitePatientModal.tsx
│   └── SubmissionCard.tsx
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   ├── usePatients.ts
│   └── useSubmissions.ts
├── lib/
│   ├── supabase.ts      # cliente único do Supabase
│   ├── api.ts           # fetch autenticado para o backend Node
│   └── weekdays.ts      # mapeamento 0–6 → "Dom".."Sáb"
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Patients.tsx
│   └── PublicForm.tsx
├── types/
│   └── index.ts         # Patient, InviteResponse, ScheduleInput, InviteCheck…
├── App.tsx
├── index.css            # Tailwind v4 + @theme
└── main.tsx
```

---

## 4. Decisões de arquitetura

### 4.1 Dados vão direto para o Supabase

O frontend **não** passa pelo backend Node para ler/escrever dados de aplicação.
Ele fala direto com o Supabase via `@supabase/supabase-js`, e o **RLS** garante
isolamento.

O backend Node só é usado para operações que exigem **segredos**:

- Geração de convites (TinyURL + telefone + JWT validation)
- Google Calendar / Meet (Fase 3)
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

1. `alter table … enable row level security;` + **policies** (`auth.uid() = user_id`)
2. `grant select, insert, update, delete on … to authenticated;`

**Sem o GRANT, o Postgres barra antes da RLS** — o erro é
`42501 permission denied for table`. Já aconteceu uma vez com `profiles` e outra
com `patient_invites`.

### 4.4 Tailwind v4 — não é v3

- **Não existe** `tailwind.config.js`
- **Não existe** `postcss.config.js`
- Plugin registrado em `vite.config.ts` via `@tailwindcss/vite`
- Tema (cores, fontes) vai em `src/index.css` dentro de `@theme { … }`
- Cor primária é `brand-*` (mapeada para teal-600 do Tailwind)
- Fonte Inter carregada via `<link>` no `index.html` (não via `@import` no CSS,
  que conflita com a ordem do Tailwind v4)

### 4.5 Design system próprio em `components/ui/`

Componentes base reutilizados em todas as telas:

- `Button` — variantes: `primary` (brand), `secondary`, `ghost`, `danger`
- `Input` — com `label`, `error`, `hint`
- `Card` — container com borda e sombra sutil
- `Badge` — variantes: `success`, `warning`, `danger`, `neutral`, `brand`
- `Modal` — overlay + Esc para fechar, com título opcional
- `EmptyState` — ícone + título + descrição + ação
- `Spinner` — loading circular

**Regra:** telas novas devem usar esses componentes, não recriar botões/inputs
do zero.

### 4.6 Layout de app autenticado

Rotas protegidas são envelopadas por `<AppLayout />`, que fornece:

- `Sidebar` fixa em desktop (>= `lg`), drawer em mobile
- `Header` sticky no topo com avatar/nome + botão de logout

Estrutura no `App.tsx`:

```
<Route element={<ProtectedRoute />}>
  <Route element={<AppLayout />}>
    <Route path="/dashboard" … />
    <Route path="/patients" … />
  </Route>
</Route>
```

### 4.7 Rotas públicas fora do ProtectedRoute

`/login` e `/form/:token` ficam **antes** do `<ProtectedRoute>` no `App.tsx`.
O formulário público não exige sessão — o paciente não tem conta.

**Atenção:** qualquer rota nova que não esteja explicitamente declarada cai no
fallback `*` → redireciona para `/dashboard` → `ProtectedRoute` → `/login`.
Foi isso que fez o link do formulário cair na tela de login na primeira vez.

### 4.8 SPA routing na Vercel

O React Router gerencia as rotas **no navegador**. Quando o navegador pede
`https://psy-dbase-frontend.vercel.app/dashboard` direto, a Vercel procura um
arquivo físico chamado `dashboard`, não encontra, e devolve 404.

Solução: `vercel.json` na raiz do frontend com rewrite:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Sem isso, links diretos (formulário público, atalhos, F5 em rotas internas)
quebram em produção.

### 4.9 Variáveis `VITE_*` são injetadas em build time

O Vite **congela** o valor de `import.meta.env.VITE_*` no bundle JavaScript
durante o build. Isso significa:

- Mudar uma env var no painel da Vercel **não afeta** deploys existentes
- É preciso **redeploy sem cache** para a nova variável valer
- Se o build usar cache, o Vite reaproveita o bundle antigo e o valor antigo
  persiste

**Sintoma clássico:** bundle em produção aponta para `http://localhost:3333`
mesmo depois de você ter configurado `VITE_API_URL` no painel — porque o deploy
é anterior à configuração.

### 4.10 Env vars de produção ficam no painel da Vercel

O `.env.local` do disco **só vale para desenvolvimento local**. Em produção,
quem manda são as variáveis configuradas no painel da Vercel (projeto
`psy-dbase-frontend`).

Deixar as três como **Config** (não Secret) simplifica debug — todas são
públicas por design.

Frontend (painel Vercel):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL`

Backend (painel Vercel):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_URL`
- `CORS_ORIGINS`
- `TINYURL_API_TOKEN`

### 4.11 Nada de diálogos nativos do navegador

**Regra:** nunca usar `alert()`, `confirm()` ou `prompt()` nativos do Chrome
(ou de qualquer navegador). Eles são feios, bloqueiam a UI, não seguem o design
system, e não funcionam bem em mobile.

Sempre usar:

- **`ConfirmDialog`** (`src/components/ui/ConfirmDialog.tsx`) para confirmações
  destrutivas ou decisões importantes (aprovar/rejeitar, excluir, cancelar)
- **`Modal`** (`src/components/ui/Modal.tsx`) para formulários, avisos extensos
  e qualquer outro conteúdo

Exemplo de uso do `ConfirmDialog`:

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

Tons disponíveis: `default`, `warning`, `danger`, `success`.

---

## 5. Fluxos principais

### 5.1 Login

1. Usuário clica em "Entrar com Google" na `/login`
2. `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: <window.location.origin>/dashboard } })`
3. Redireciona para o Google → volta para `/dashboard`
4. `AuthContext` mantém a sessão via `onAuthStateChange`
5. Trigger no banco (`on_auth_user_created`) cria linha em `profiles`
   automaticamente no signup

**Importante:** o Supabase valida o `redirectTo` contra a lista de **Redirect
URLs** configurada no painel. Se a URL não estiver na lista, cai no fallback
(**Site URL**). Ambas precisam ter o domínio de produção **e** `localhost:5173`.

### 5.2 Convite de paciente

1. Psicólogo vai em `/patients` → botão "Convidar paciente"
2. `InvitePatientModal` coleta:
   - Nome (opcional)
   - Telefone (obrigatório)
   - **Pelo menos 1 horário** (obrigatório): dia da semana + hora + duração
     (default 50 min)
3. Chama `POST /invites` no backend Node via `apiFetch`
4. Backend:
   - Cria registro em `patient_invites` com token UUID
   - Cria registros em `patient_invite_schedules`
   - Encurta URL via TinyURL oficial (com fallback para URL longa)
   - Monta link `wa.me/<phone>?text=<mensagem>`
5. Frontend abre `whatsappUrl` em nova aba
6. Modal mostra resumo dos horários + botão "Copiar link"

### 5.3 Formulário público

1. Paciente recebe link `https://psy-dbase-frontend.vercel.app/form/<token>`
   via WhatsApp
2. `PublicForm` valida o token via RPC `get_invite_by_token` (retorna
   `valid`, `reason`, `patient_name_hint`, `schedules`)
3. Se válido, mostra:
   - Bloco "Sessões combinadas" em modo leitura (dias + horários + duração)
   - Campos cadastrais (nome, CPF, cidade, nascimento, telefone, contato de
     urgência)
   - Checkbox do **termo de confidencialidade**
   - Checkbox da **orientação sobre o local** (ambiente tranquilo, silencioso,
     privado)
4. Ao enviar, chama RPC `submit_patient_form` (valida token de novo, grava os
   dois aceites com timestamp, marca convite como usado)
5. Paciente vê tela de sucesso

### 5.4 Aprovação de submissão

1. Psicólogo vai em `/patients`
2. Seção "Submissões pendentes" mostra cards dos formulários enviados
3. Cada card tem botão **Aprovar** e **Rejeitar**
4. **Aprovar** chama RPC `approve_submission`:
   - Valida que o usuário logado é o dono
   - Cria registro em `patients` com os dados da submissão
   - Marca a submissão como `approved`
5. **Rejeitar** faz `update status='rejected', reviewed_at=now()`
6. Após qualquer ação, `reload()` é chamado nos hooks `usePatients` e
   `useSubmissions`

---

## 6. Convenções de código

- **Idioma:** variáveis, funções, tipos, arquivos em **inglês**. Comentários em
  **português**.
- **Componentes:** função nomeada (`export function Foo()`), não arrow function
  anônima.
- **Tipos:** usar `type`, não `interface` (exceto quando precisar de extensão).
- **Estados de fetch:** sempre tratar `loading`, `error` e `empty`.
- **Rotas:** PascalCase para arquivos de página (`Patients.tsx`), kebab-case
  para componentes utilitários.
- **Nada de `any`:** exceto em integrações de bibliotecas com tipos divergentes.

---

## 7. Armadilhas conhecidas

| Sintoma                                             | Causa                                           | Solução                                                     |
|-----------------------------------------------------|-------------------------------------------------|-------------------------------------------------------------|
| `42501 permission denied for table`                 | Faltou GRANT                                    | `grant … to authenticated;` na migration                    |
| `Unsupported provider: provider is not enabled`     | Google OAuth não salvo no Supabase              | Salvar em Authentication → Providers                        |
| `redirect_uri_mismatch`                             | Callback do Google ≠ do Supabase                | `https://<ref>.supabase.co/auth/v1/callback` no Google Cloud |
| Login redireciona para `localhost` em produção      | Site URL no Supabase aponta para localhost      | Ajustar Site URL **e** Redirect URLs no painel Supabase      |
| Link `/form/:token` cai em `/login`                 | Rota pública ausente ou fallback errado         | Declarar rota **antes** do `ProtectedRoute`                 |
| `/dashboard` dá 404 em produção                     | Falta `vercel.json` com rewrite para `index.html` | Criar `vercel.json` com SPA routing                        |
| Tailwind não aplica estilos novos                   | Config de v3 em projeto v4, ou dev server não reiniciado | Usar `@theme` no CSS e plugin Vite; reiniciar        |
| Erro `@import statements must precede all other…`   | `@import` da fonte após outras regras no CSS     | Mover a fonte para `<link>` no `index.html`                 |
| Bundle aponta para `localhost` mesmo após config    | Env var `VITE_*` só vale em novo build           | Redeploy **sem cache**                                      |
| `VITE_API_URL não configurada` no site em produção  | Variável ausente ou deploy antigo                | Criar no painel + redeploy sem cache                        |
| Erro de CORS no site de produção                    | Backend fora do ar (500 no boot)                 | Corrigir o backend primeiro; CORS nem chega a ser avaliado  |
| `tsc -b` falha com `declared but never used`        | Import não usado (build é mais rigoroso que dev) | Remover o import                                            |

---

## 8. Segurança

- **`anon key`:** vai no painel da Vercel e no `.env.local`. É segura ali
  **porque o RLS protege**. Nunca commitar `.env.local`.
- **`service_role key`:** exclusiva do backend. Nunca no frontend.
- **`access_token` do usuário:** vai no header `Authorization`. Expira em 1h e
  é renovado automaticamente pelo SDK.
- **Links de prontuário:** hash expirável, sem indexação (Fase 4).
- **LGPD:** dado sensível de saúde. Consentimento explícito, direito ao
  esquecimento, auditoria de acesso ao prontuário.
- **Env vars `VITE_*` são públicas:** qualquer pessoa vê no bundle. Nunca
  colocar segredo com prefixo `VITE_`.

---

## 9. O que está fora do escopo deste repositório

- Lógica de negócio pesada (geração de convite, encurtamento de URL, integração
  Google Calendar, envio de WhatsApp) → **backend `psy-dbase`**
- Migrations SQL → **rodadas manualmente no SQL Editor do Supabase**
- Autenticação OAuth → **Supabase Auth**
- Deploy do backend → **Vercel** (projeto separado)

---

## 10. Estado atual (última atualização)

**Concluído:**

- ✅ Fase 1: Auth Google, `profiles` com trigger, RLS, deploy Vercel
- ✅ Fase 2: convite com horários, formulário público, submissões,
  aprovação/rejeição
- ✅ Design system (`Button`, `Input`, `Card`, `Badge`, `Modal`, `EmptyState`,
  `Spinner`)
- ✅ Layout autenticado (`Sidebar`, `Header`, `AppLayout`)
- ✅ Migração Tailwind v3 → v4 com plugin Vite
- ✅ `vercel.json` com SPA routing
- ✅ Env vars configuradas no painel da Vercel
- ✅ TinyURL oficial (sem interstitial)

**Pendente (Fase 2 residual):**

- ⏳ Redesenhar `Login`, `Dashboard` e `PublicForm` com o design system
  (`Patients` já está pronta)
- ⏳ Substituir inputs crus do `InvitePatientModal` pelos componentes `ui/`
- ⏳ Tela de detalhes do paciente (`/patients/:id`)

**Pendente (Fase 3+):**

- ⏳ Agenda (`/agenda`) com Google Calendar + Meet
- ⏳ Prontuário (`/patients/:id/records`)
- ⏳ Financeiro (`/finance`)
- ⏳ Configurações (`/settings`)
- ⏳ Notificações

**Branches ativas:**
- Frontend: `main`
- Backend: `main`

---

## 11. Como usar este documento

Ao entrar no projeto, leia na ordem:

1. Este `CONTEXT.md` (decisões e armadilhas)
2. `README.md` (como rodar)
3. `TODO.md` (o que falta)
4. Código em `src/`

Se algo aqui estiver desatualizado, **atualize antes de codar**. Contexto
desatualizado é pior que contexto ausente.