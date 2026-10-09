# CONTEXT.md — psy-dbase-front

> **Leia isto antes de tocar no código.**
> Este documento é a fonte de verdade para qualquer IA ou dev que entre no projeto.
> Ele registra **decisões já tomadas** para evitar retrabalho e perguntas repetidas.

---

## 1. O que é este projeto

Interface web do **psy-dbase**, sistema de gestão para psicólogo autônomo.

Cobre cadastro de pacientes via formulário público, CRUD completo de pacientes,
CRUD de prestadores, revisão de provisórios importados do Google, agenda com
visualização em dia/semana/mês, prontuário e financeiro (fases futuras).

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
│   ├── agenda/               # Componentes da página /agenda
│   │   ├── AgendaToolbar.tsx
│   │   ├── AppointmentBlock.tsx
│   │   ├── AppointmentDetailModal.tsx
│   │   ├── CancelSeriesModal.tsx
│   │   ├── CreateAppointmentModal.tsx
│   │   ├── DayHeader.tsx
│   │   ├── DayOverviewModal.tsx
│   │   ├── DayView.tsx
│   │   ├── MonthDayCell.tsx
│   │   ├── MonthView.tsx
│   │   ├── ScheduleEditor.tsx
│   │   ├── TimeColumn.tsx
│   │   └── WeekView.tsx
│   ├── layout/               # Sidebar, Header, AppLayout
│   ├── ui/                   # Button, Input, Card, Badge, Modal,
│   │                         # ConfirmDialog, EmptyState, Spinner
│   ├── InvitePatientModal.tsx
│   ├── ProspectCard.tsx
│   └── SubmissionCard.tsx
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   ├── useAgendaView.ts      # modo (day/week/month) + navegação
│   ├── useAppointments.ts    # busca appointments por período
│   ├── usePatient.ts
│   ├── usePatients.ts
│   ├── usePatientSchedules.ts
│   ├── useProvider.ts
│   ├── useProviders.ts
│   ├── useProspects.ts
│   └── useSubmissions.ts
├── lib/
│   ├── agenda-date.ts        # helpers de data para a agenda
│   ├── api.ts
│   ├── appointment-colors.ts # cores por tipo de appointment
│   ├── masks.ts              # maskCPF, maskCNPJ, maskPhone + validações
│   ├── patient-display.ts    # displayName (heurística visual)
│   ├── supabase.ts
│   ├── text.ts               # toTitleCase
│   └── weekdays.ts           # mapeamento 0–6 → "Dom".."Sáb" (formato JS)
├── pages/
│   ├── Agenda.tsx
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── PatientDetail.tsx
│   ├── PatientForm.tsx
│   ├── PatientReview.tsx
│   ├── Patients.tsx
│   ├── ProviderDetail.tsx
│   ├── ProviderForm.tsx
│   ├── Providers.tsx
│   ├── PublicForm.tsx
│   └── Settings.tsx
├── types/
│   └── index.ts
├── App.tsx
├── index.css
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

Toda chamada ao backend passa por `src/lib/api.ts`, que injeta
`Authorization: Bearer <token>`. **Nunca** chamar `fetch` direto.

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

Ordem da sidebar: Dashboard, Pacientes, Prestadores, Agenda, Prontuário
(futuro), Financeiro (futuro), Configurações.

### 4.7 Rotas públicas fora do ProtectedRoute

`/login` e `/form/:token` ficam **antes** do `<ProtectedRoute>`.

**Atenção:** rota não declarada cai no fallback `*` → `/dashboard` →
`ProtectedRoute` → `/login`.

**Ordem das rotas dinâmicas importa:** `/patients/new`,
`/patients/:id/review` **antes** de `/patients/:id`.

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
`ProviderDetail.tsx` em handlers de arquivar/reativar/excluir — só dispara em
erro raro do Supabase. Trocar por `AlertDialog` futuramente.

### 4.12 Normalização de nome vs. máscaras in-locus

- **Nome:** normaliza **silenciosamente ao enviar** (`toTitleCase`). O input
  mostra o que o usuário digita; o banco recebe limpo.
- **Telefone e CPF/CNPJ:** máscara **in-locus** enquanto digita.

### 4.13 CRUD de pacientes

- **Criar do zero:** `/patients/new` (`PatientForm.tsx`)
- **Editar:** `/patients/:id/edit`
- **Arquivar (soft delete):** `status='inactive'`. Cancela appointments futuros.
- **Reativar:** `status='active'`. Recria appointments a partir de
  `patient_schedules`.
- **Excluir (hard delete):** RPC `delete_patient` (deleta tudo em transação).
- **Listagem:** filtros "Ativos | Arquivados | Todos" via `usePatients(filter)`

**Atenção:** `PatientForm` redireciona `prospect` para `/patients/:id/review`.

### 4.14 CRUD de prestadores

- **Criar do zero:** `/providers/new` (`ProviderForm.tsx`)
- **Editar:** `/providers/:id/edit`
- **Arquivar (soft delete):** `status='archived'`. Reversível.
- **Excluir (hard delete):** botão ghost no detalhe.
- **Listagem:** filtros "Todos | Pessoas | Empresas | Arquivados"

**Formulário dinâmico:** se `kind='person'`, mostra CPF e esconde Razão social;
se `kind='company'`, mostra CNPJ + Razão social.

### 4.15 Revisão de provisórios

Provisórios (`patients.status='prospect'`) aparecem **apenas** no bloco
"Aguardando revisão" em `/patients`, **não** na tabela normal.

Três ações por card (`ProspectCard`), cada uma chamando uma RPC:

- **É paciente** → `/patients/:id/review` → `promote_prospect_to_active`
- **É prestador** → `convert_prospect_to_provider`
- **Remover** → `discard_prospect`

**Heurística de exibição:** `displayName()` remove prefixos comuns
("Atendimento ", "Sessão ") apenas na UI. O banco mantém o texto cru
(`Atendimento Eduardo`).

### 4.16 Integração Google Calendar

- **Conectar:** botão em `/settings` → `GET /calendar/connect` → abre em nova
  aba
- **Callback:** backend redireciona para `/settings?google=connected`
- **Importar:** `POST /calendar/import` com `{ daysAhead: 90 }`
- **Desconectar:** `ConfirmDialog` + `DELETE /calendar/disconnect`

**Sobre o fluxo em nova aba:** a aba original **não sabe** automaticamente que
a conexão foi concluída. F5 é necessário. Melhoria futura: `postMessage`.

### 4.17 Agenda — 3 modos e 3 tipos de sujeito

A agenda lê `appointments` e renderiza em 3 modos: **Dia**, **Semana**, **Mês**.
Cada modo tem seu componente (`DayView`, `WeekView`, `MonthView`).

**Tipos de appointment** com cores distintas (`appointment-colors.ts`):

| Tipo | Cor | Ocupa horário? |
|---|---|---|
| `session` | brand (teal) | sim |
| `personal` | cinza | sim |
| `blocked` | cinza listrado | sim |
| `due` | âmbar | **não** (marcador no cabeçalho) |

**Status visual:**

- `active` → normal
- `cancelled` → riscado + opacidade
- `completed` → esmaecido + ✓

### 4.18 Dia da semana — atenção ao formato

**Dois formatos coexistem** e não devem se misturar:

**Formato JS** (0=domingo, 6=sábado):
- Coluna `appointments.weekday`
- Coluna `patient_schedules.weekday`
- Coluna `patient_invite_schedules.weekday`
- `src/lib/weekdays.ts` (usado em `ScheduleEditor`, `InvitePatientModal`)
- `Date.getDay()`

**Formato ISO** (0=segunda, 6=domingo):
- `WEEKDAY_SHORT` e `WEEKDAY_LONG` em `agenda-date.ts`
- Usado **apenas para exibição**

**Conversão:**

```ts
isoWeekday(jsDay)   // JS → ISO
jsWeekday(isoDay)   // ISO → JS
```

**Sempre** usar `isoWeekday` antes de indexar `WEEKDAY_SHORT`/`WEEKDAY_LONG`.

**Histórico:** já tivemos bug de blocos aparecendo na coluna errada por
misturar os dois formatos.

### 4.19 Horários recorrentes (`patient_schedules`)

Pacientes ativos podem ter N horários recorrentes em `patient_schedules`. Ao
salvar (criar/editar paciente ou promover prospect), a RPC
`set_patient_schedules`:

1. **Deleta** appointments futuros ativos desse paciente (não cancela — limpa
   para evitar poluição)
2. Remove os `patient_schedules` antigos
3. Insere os novos
4. Gera appointments para 90 dias

**Reconfiguração vs. cancelamento:** reconfigurar **deleta**; cancelar
(paciente avisou que não vem) **cancela** (`status='cancelled'`).

### 4.20 Cancelamento de série — 3 modos

`CancelSeriesModal` oferece:

- **Definitivo a partir de hoje** — cancela todos os futuros, deleta schedules
- **Definitivo a partir de uma data** — idem, com data escolhida
- **Suspender por período** — cancela só o intervalo, mantém schedules,
  estende horizonte se necessário

---

## 5. Fluxos principais

### 5.1 Login

`supabase.auth.signInWithOAuth({ provider: "google", redirectTo: <origin>/dashboard })`.
Supabase valida `redirectTo` contra **Redirect URLs**. **Site URL** e
**Redirect URLs** precisam ter produção e `localhost:5173`.

### 5.2 Convite de paciente

1. `/patients` → "Convidar"
2. `InvitePatientModal` coleta nome (opcional), telefone e ≥ 1 horário
3. `POST /invites` no backend
4. Backend cria convite, encurta URL, monta link `wa.me`
5. Frontend abre `whatsappUrl` em nova aba

### 5.3 Formulário público

1. Paciente abre `/form/<token>`
2. `PublicForm` valida token via RPC `get_invite_by_token`
3. Mostra sessões combinadas + campos com máscara + 2 checkboxes
4. Envia via RPC `submit_patient_form`

### 5.4 Aprovar/Rejeitar submissão

1. `/patients` → seção "Submissões pendentes"
2. **Aprovar** → RPC `approve_submission` cria `patient` com `status='prospect'`
3. **Rejeitar** → `update status='rejected'`

### 5.5 Promover provisório a paciente

1. `/patients` → bloco "Aguardando revisão"
2. `ProspectCard` → "É paciente" → `/patients/:id/review`
3. `PatientReview`:
   - Carrega horários do convite (se houver)
   - Usuário completa dados + ajusta horários
   - Salva: RPC `promote_prospect_to_active` com `p_schedules`
4. Vira `active` + `appointments` criados

### 5.6 Criar/editar paciente manual

1. `/patients/new` ou `/patients/:id/edit`
2. `PatientForm` com `ScheduleEditor`
3. Ao salvar, chama `set_patient_schedules` se houver horários

### 5.7 Arquivar / Reativar / Excluir paciente

- **Arquivar** → RPC `cancel_future_appointments` + status `inactive`
- **Reativar** → status `active` + RPC `set_patient_schedules` (recria)
- **Excluir** → RPC `delete_patient` (transação completa)

### 5.8 Agenda

1. `/agenda` → redireciona para `/agenda/week/<hoje>`
2. Modos: `AgendaToolbar` (Dia/Semana/Mês)
3. Navegação: setas + "Hoje"
4. Clicar em bloco → `AppointmentDetailModal`
5. Clicar em slot vazio → `CreateAppointmentModal`
6. Clicar em célula do mês → `DayOverviewModal`
7. Cancelar série → `CancelSeriesModal`

### 5.9 Google Calendar — conectar / importar / desconectar

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
| **Bloco aparece na coluna errada da agenda**        | `WEEKDAY_SHORT/LONG` em ordem JS, não ISO       | Usar `isoWeekday()` antes de indexar                        |
| `appointments_subject_check` violada ao excluir     | FK com `on delete set null` conflita            | Usar RPC `delete_patient`                                   |
| Horários antigos poluem a agenda após reconfigurar  | `set_patient_schedules` cancelava em vez de deletar | RPC agora deleta appointments futuros                    |
| `<input type="date">` mostra mm/dd/aaaa             | Locale do navegador                             | Adicionar Português (BR) nas configs do Chrome              |

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
- ✅ CRUD de prestadores
- ✅ **Página `/agenda` funcional** com 3 modos (Dia/Semana/Mês)
- ✅ `ScheduleEditor` reutilizável
- ✅ `CancelSeriesModal` (3 modos de cancelamento)
- ✅ Horários em `PatientForm` e `PatientReview`
- ✅ `PatientDetail` com "Suspender agendamentos"
- ✅ Arquivar cancela futuros / Reativar recria
- ✅ Correção de timezone em `WEEKDAY_SHORT/LONG`

**Pendente (Fase 3+):**

- ⏳ Bloqueio rígido no `InvitePatientModal` (slots ocupados)
- ⏳ Bloqueio no `PatientForm` e `PatientReview`
- ⏳ Vencimentos (`due`) na UI
- ⏳ Ajustes finos (404, favicon, metadados, `AlertDialog`)
- ⏳ Prontuário (`/patients/:id/records`)
- ⏳ Financeiro (`/finance`)
- ⏳ Notificações
- ⏳ Testes automatizados (Playwright)

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