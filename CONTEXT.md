Perfeito. Vou reescrever os dois com o estado completo da feature até agora.

---

## Arquivo 1 — `CONTEXT.md` (frontend)

```markdown
# CONTEXT.md — psy-dbase-front

> **Leia isto antes de tocar no código.**
> Este documento é a fonte de verdade para qualquer IA ou dev que entre no projeto.
> Ele registra **decisões já tomadas** para evitar retrabalho e perguntas repetidas.

---

## 1. O que é este projeto

Interface web do **psy-dbase**, sistema de gestão para psicólogo autônomo.

Cobre cadastro de pacientes via formulário público, CRUD completo de pacientes,
CRUD de prestadores (pessoa física e empresa), revisão de provisórios importados
do Google, agenda em dia/semana/mês com bloqueio de conflito e stacking,
dashboard com próximas sessões e aniversariantes, valor de sessão por
paciente/prestador, **frequência configurável de recorrência** e — nas próximas
fases — prontuário, financeiro, notificações e integração Calendar bidirecional.

**Repositório irmão:** `psy-dbase` (backend Node + integrações).
**Status:** em produção na Vercel — `https://psy-dbase-frontend.vercel.app`

---

## 2. Stack e versões

| Camada        | Tecnologia                                              | Versão |
|---------------|---------------------------------------------------------|--------|
| Build         | Vite                                                    | 7.x    |
| UI            | React                                                   | 19.x   |
| Tipagem       | TypeScript                                              | 5.9.x  |
| Estilo        | **Tailwind CSS v4** (plugin `@tailwindcss/vite`)        | 4.3.x  |
| Roteamento    | React Router                                            | 7.x    |
| Ícones        | lucide-react                                            | —      |
| Auth          | Supabase Auth (Google OAuth)                            | —      |
| Dados         | `@supabase/supabase-js`                                 | 2.x    |
| HTTP          | fetch nativo (via `src/lib/api.ts`)                     | —      |
| Gerenciador   | npm                                                     | —      |
| Deploy        | Vercel                                                  | —      |

---

## 3. Estrutura de pastas

```
src/
├── components/
│   ├── agenda/
│   │   ├── AgendaToolbar.tsx
│   │   ├── AppointmentBlock.tsx
│   │   ├── AppointmentDetailModal.tsx
│   │   ├── CancelSeriesModal.tsx
│   │   ├── CreateAppointmentModal.tsx
│   │   ├── DayCancelledModal.tsx
│   │   ├── DayHeader.tsx
│   │   ├── DayOverviewModal.tsx
│   │   ├── DayView.tsx
│   │   ├── MonthDayCell.tsx
│   │   ├── MonthView.tsx
│   │   ├── ScheduleEditor.tsx
│   │   ├── SlotCancelledModal.tsx
│   │   ├── StackOverviewModal.tsx
│   │   ├── TimeColumn.tsx
│   │   └── WeekView.tsx
│   ├── layout/                # Sidebar, Header, AppLayout, ThemeToggle
│   ├── ui/                    # Design system (Button, Input, Card, Badge,
│   │                          #   Modal, ConfirmDialog, EmptyState, Spinner,
│   │                          #   MaskedDateInput)
│   ├── ConflictOnReactivateModal.tsx
│   ├── InvitePatientModal.tsx
│   ├── ProspectCard.tsx
│   ├── ReactivateModal.tsx
│   └── SubmissionCard.tsx
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   ├── useAgendaView.ts
│   ├── useAppointments.ts
│   ├── useBirthdays.ts
│   ├── useOccupiedSlots.ts
│   ├── usePatient.ts
│   ├── usePatients.ts
│   ├── usePatientSchedules.ts
│   ├── usePatientScheduleSource.ts
│   ├── useProvider.ts
│   ├── useProviders.ts
│   ├── useProviderSchedules.ts
│   ├── useProviderScheduleSource.ts
│   ├── useProspects.ts
│   ├── useSubmissions.ts
│   ├── useTheme.ts
│   ├── useTodayAppointmentsCount.ts
│   ├── useUpcomingAppointments.ts
│   └── useWeekAppointmentsCount.ts
├── lib/
│   ├── agenda-date.ts
│   ├── api.ts
│   ├── appointment-colors.ts
│   ├── appointment-layout.ts
│   ├── appointment-overlap.ts
│   ├── appointments-filter.ts
│   ├── masks.ts               # + maskDateBR/parseDateBR/formatDateBR
│   ├── patient-display.ts
│   ├── recurrence.ts          # NOVO
│   ├── supabase.ts
│   ├── supabase-rpc-fallback.ts # NOVO
│   ├── text.ts
│   └── weekdays.ts
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
│   └── index.ts               # + RecurrenceType, ScheduleInput.anchorDate
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
- Google Calendar (OAuth, leitura, importação; escrita na Fase 6)
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

**Importante:** o `@theme` precisa ter **`--color-brand-950`** definido. Sem
isso, `dark:bg-brand-950` **não funciona** (o Tailwind v4 ignora a classe).

### 4.5 Design system próprio em `components/ui/`

- `Button` — `primary` / `secondary` / `ghost` / `danger`
- `Input` — com `label`, `error`, `hint`
- `MaskedDateInput` — input de data com máscara `dd/mm/aaaa` e preservação
  do cursor (ver 4.29)
- `Card`
- `Badge` — `success` / `warning` / `danger` / `neutral` / `brand`
- `Modal` — overlay + Esc
- `ConfirmDialog` — confirmação com tons
- `EmptyState`
- `Spinner`

### 4.6 Layout de app autenticado

Rotas protegidas envelopadas por `<AppLayout />`:

- `Sidebar` fixa em desktop (>= `lg`), drawer em mobile
- `Header` sticky com avatar + logout + **`ThemeToggle`**
- Sidebar tem **badge amarelo** ao lado de "Configurações" quando o perfil
  está incompleto (sem CRP ou sem telefone)

Ordem da sidebar: Dashboard, Pacientes, Prestadores, Agenda, Prontuário
(futuro), Financeiro (futuro), Configurações.

### 4.7 Rotas públicas fora do ProtectedRoute

`/login` e `/form/:token` ficam **antes** do `<ProtectedRoute>`.

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

`.env.local` local **só vale para desenvolvimento**.

### 4.11 Nada de diálogos nativos do navegador

**Regra:** nunca usar `alert()`, `confirm()` ou `prompt()` nativos.

Sempre usar `ConfirmDialog` ou `Modal`.

**Exceção atual (a corrigir):** `alert(error.message)` em `PatientDetail.tsx`
e `ProviderDetail.tsx` (handlers de erro raro do Supabase).

### 4.12 Normalização de nome vs. máscaras in-locus

- **Nome:** normaliza **silenciosamente ao enviar** (`toTitleCase`).
- **Telefone e CPF/CNPJ:** máscara **in-locus** enquanto digita.
- **Valor monetário:** máscara in-locus, armazenado em **centavos** no banco
  (`session_price_cents int`).
- **Data (dd/mm/aaaa):** máscara in-locus via `MaskedDateInput`, armazenada
  em ISO (`YYYY-MM-DD`) no banco.

### 4.13 CRUD de pacientes

- **Criar do zero:** `/patients/new` (`PatientForm.tsx`)
- **Editar:** `/patients/:id/edit`
- **Arquivar (soft delete):** `status='inactive'`. Cancela appointments futuros.
- **Reativar:** `status='active'`. Recria appointments a partir de
  `patient_schedules`.
  - Se **não tem** schedules → `ReactivateModal`
  - Se **tem** conflito → `ConflictOnReactivateModal`
  - Se **sem** conflito → reativa direto
- **Excluir (hard delete):** RPC `delete_patient`.
- **Listagem:** filtros "Ativos | Arquivados | Todos".

**Atenção:** `PatientForm` redireciona `prospect` para `/patients/:id/review`.

### 4.14 CRUD de prestadores

- **Criar do zero:** `/providers/new` (`ProviderForm.tsx`)
- **Editar:** `/providers/:id/edit`
- **Arquivar (soft delete):** `status='archived'`.
- **Excluir (hard delete):** RPC `delete_provider`.
- **Listagem:** filtros "Todos | Pessoas | Empresas | Arquivados"

**Formulário dinâmico:**
- `kind='person'` → CPF, esconde Razão social, mostra `ScheduleEditor` +
  Financeiro (valor da sessão)
- `kind='company'` → CNPJ + Razão social, sem `ScheduleEditor`, Financeiro
  com label "Valor recorrente (referência)"

**Reativação:** mesma lógica do paciente (com modais).

### 4.15 Revisão de provisórios (movido para o Dashboard)

Provisórios (`patients.status='prospect'`) aparecem **no `/dashboard`**, no
bloco "Aguardando revisão" (colapsável).

**Não aparecem mais em `/patients`.**

Três ações por card (`ProspectCard`):

- **É paciente** → `/patients/:id/review` → `promote_prospect_to_active`
- **É prestador** → `convert_prospect_to_provider`
- **Remover** → `discard_prospect`

**Heurística de exibição:** `displayName()` remove prefixos comuns
("Atendimento ", "Sessão ").

### 4.16 Integração Google Calendar (leitura)

- **Conectar:** `/settings` → `GET /calendar/connect` → abre em nova aba
- **Callback:** backend redireciona para `/settings?google=connected`
- **Importar:** `POST /calendar/import` com `{ daysAhead: 90 }`
- **Desconectar:** `ConfirmDialog` + `DELETE /calendar/disconnect`

**Fluxo em nova aba:** a aba original **não sabe** que a conexão foi concluída;
F5 é necessário. Melhoria futura: `postMessage`.

**IMPORTANTE — URLs de produção:**
- Backend (Vercel): `GOOGLE_REDIRECT_URI=https://psy-dbase.vercel.app/calendar/callback`
- Local: `GOOGLE_REDIRECT_URI=http://localhost:3333/calendar/callback`

### 4.17 Agenda — 3 modos e 4 tipos

A agenda lê `appointments` e renderiza em **Dia**, **Semana** e **Mês**.

**Tipos** com cores distintas (`appointment-colors.ts`, com variantes dark):

| Tipo | Cor | Ocupa horário? |
|---|---|---|
| `session` | brand (teal) | sim |
| `personal` | cinza | sim |
| `blocked` | cinza listrado | sim |
| `due` | âmbar | **não** (marcador no cabeçalho) |

**Status visual:**

- `active` → normal
- `cancelled` → **nunca aparece na grade**; vira badge `N ✕`
- `completed` → esmaecido + ✓

### 4.18 Dia da semana — atenção ao formato

**Dois formatos coexistem** e não devem se misturar:

**Formato JS** (0=domingo, 6=sábado):
- `appointments.weekday`
- `patient_schedules.weekday`
- `provider_schedules.weekday`
- `patient_invite_schedules.weekday`
- `src/lib/weekdays.ts`
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

### 4.19 Horários recorrentes (`patient_schedules` / `provider_schedules`)

Pacientes e prestadores `person` têm horários recorrentes. A RPC
`set_patient_schedules` / `set_provider_schedules`:

1. **Valida conflito por SOBREPOSIÇÃO DE INTERVALO** (não igualdade de
   `start_time`)
2. Se não houver conflito:
   - **Deleta** appointments futuros deste sujeito
   - Remove os schedules antigos
   - Insere os novos
   - Gera appointments para 90 dias

**Reconfiguração vs. cancelamento:** reconfigurar **deleta**; cancelar
(paciente avisou que não vem) **cancela** (`status='cancelled'`).

**Idempotência:** `PatientForm` e `ProviderForm` só chamam a RPC se o conteúdo
do `ScheduleEditor` **mudou** desde o carregamento (`schedulesEqual`).

### 4.20 Cancelamento de série — 3 modos

`CancelSeriesModal` (parametrizado com `subjectType: "patient" | "provider"`):

- **Definitivo a partir de hoje** — cancela todos os futuros, deleta schedules
- **Definitivo a partir de uma data** — cancela a partir da data escolhida,
  **mantém schedules como referência**
- **Suspender por período** — cancela só o intervalo, mantém schedules,
  estende horizonte se necessário

**Onde o botão aparece:**
- `PatientDetail` — no card "Horários das sessões" (canto superior direito)
- `ProviderDetail` — no card "Horários recorrentes" (mesmo lugar)
- `AppointmentDetailModal` — botão "Cancelar série" quando `is_recurring`

### 4.21 Bloqueio rígido por SOBREPOSIÇÃO DE INTERVALO

Regra: `a.start < b.end && b.start < a.end`.

Implementado em `src/lib/appointment-overlap.ts`.

**Hooks:**
- `useOccupiedSlots` — retorna `{ weekday, startTime, durationMin, occupiedBy, subjectName }`
- `usePatientScheduleSource` — 3 camadas (`patient_schedules` → `patient_invite_schedules` → `appointments`)
- `useProviderScheduleSource` — 2 camadas (`provider_schedules` → `appointments` tipo `personal`)

**Regras do `ScheduleEditor`:**
- Slot âmbar = conflito (externo **ou** interno)
- Slot âmbar **é editável** — mudar recalcula conflito automaticamente
- `+ Adicionar` sugere slot livre
- Botão "Salvar" bloqueado enquanto houver conflito
- `PatientForm`/`PatientReview`: `excludePatientId: id`
- `ProviderForm`: `excludeProviderId: id`
- `InvitePatientModal`: sem exclusão

### 4.22 Valor da sessão (`session_price_cents`)

Armazenado em **centavos** (`int`) para evitar float.

- **Paciente:** `patients.session_price_cents` — valor que você cobra
- **Prestador `person`:** `providers.session_price_cents` — valor que você paga por sessão
- **Prestador `company`:** `providers.session_price_cents` — valor recorrente
  de referência (Fase B refina com `provider_billings`)

**Máscara in-locus** com `maskCurrencyBRL` / `parseCurrencyToCents` /
`centsToCurrencyBRL`.

### 4.23 Dark mode

- Tailwind v4 com `@variant dark (&:where(.dark, .dark *))`
- Toggle no Header (`ThemeToggle`) com 3 opções: **Claro / Escuro / Sistema**
- Estado em `localStorage` (`psy-dbase:theme`)
- Script inline no `index.html` **antes do React**
- Paleta: **slate** para dark, brand mantém

**Atenção:** o `@theme` precisa ter `--color-brand-950: #042f2e`.

### 4.24 Dashboard

Ordem dos blocos:

1. Saudação
2. Cards de resumo (4): Pacientes ativos, Submissões pendentes, Sessões hoje, Sessões esta semana
3. Aguardando revisão (colapsável, scroll se > 3)
4. Próximas sessões (colapsável, hoje + 7 dias)
5. Aniversariantes do mês (só pacientes `active`)

### 4.25 Aniversariantes

- Busca `patients` com `status='active'` e `birth_date` no mês atual
- Aniversariantes de prestadores: **decisão adiada** (precisa adicionar
  `birth_date` em `providers`)

### 4.26 Prestadores — modelo estendido

**`person`** (ex: psicólogo, supervisor):
- `provider_schedules` (horários recorrentes)
- `appointments` tipo `personal`
- Bloqueia slot na agenda
- `session_price_cents` = valor pago por sessão

**`company`** (ex: curso, plataforma, aluguel):
- **Não tem** `provider_schedules`
- Card vazio "Vencimentos" no `ProviderDetail` (placeholder)
- Fase B: `provider_billings`
- Não aparece na grade; aparece como badge no dia

### 4.27 Convites — captura de e-mail e preferências (Fase 6)

`PublicForm` ganhará campo e-mail, checkboxes de alerta Google Calendar e
alerta de vencimento. Ver `TODO.md` seção Fase 6.

### 4.28 Frequência configurável ⭐ NOVO

Suporta 6 tipos de recorrência por sujeito (paciente ou prestador `person`):

| `recurrence_type` | Comportamento | Precisa de `recurrence_days`? |
|---|---|---|
| `once` | 1 ocorrência só (na `anchor_date`) | não |
| `weekly` | a cada 7 dias | não |
| `biweekly` | a cada 14 dias | não |
| `every_30_days` | a cada 30 dias | não |
| `monthly` | mesmo dia do mês da âncora (fallback pro último dia do mês) | não |
| `custom_days` | a cada N dias | **sim** (1..365) |

#### Coluna `anchor_date` (data)

Toda linha de `patient_schedules` / `provider_schedules` tem uma coluna
`anchor_date date` que guarda **a data da primeira ocorrência**.

**Por que existe:**
- `monthly` precisa saber "qual dia do mês" (ex: 17)
- `once` precisa de data exata (ex: 10/11/2026)
- `custom_days` conta a partir de uma data específica

**Como funciona o preenchimento:**
- Se o front envia `anchorDate` no JSONB `p_schedules`, o backend usa essa data
- Senão, calcula "próxima data no weekday informado" (compat com o formato antigo)

#### Função auxiliar `compute_next_occurrence(date, text, int, date)`

Calcula a próxima ocorrência. 4º parâmetro é `p_anchor_date`.

Regra especial do `monthly`:

```sql
make_date(
  extract(year from next_month_start)::int,
  extract(month from next_month_start)::int,
  least(anchor_day, last_day_of_next_month)
)
```

Isso faz:
- `17/jan` → `17/fev` → `17/mar` (dia preservado)
- `31/jan` → `28/fev` → `31/mar` (volta pro 31 quando o mês permite)

#### UI — `ScheduleEditor`

- Campo por linha muda conforme frequência:
  - `once`, `monthly`, `biweekly`, `every_30_days`, `custom_days` → **date picker** (input com máscara `dd/mm/aaaa`)
  - `weekly` → **select de weekday**
- Ao trocar a frequência no select, os horários são convertidos automaticamente:
  - weekday → date: calcula próxima data no weekday atual
  - date → weekday: extrai `getDay()` da data
- Abaixo do date picker: `cai em: <weekday>` (derivado, não editável)
- `once` bloqueia "+ Adicionar" e a lixeira (1 único slot)
- `custom_days` mostra campo "A cada N dias"

#### Backend — RPCs

As RPCs têm **2 versões coexistindo** (migração em andamento):

| RPC | Versão antiga | Versão nova |
|---|---|---|
| `set_patient_schedules` | `(uuid, jsonb, int)` | `(uuid, jsonb, text, int, int)` |
| `set_provider_schedules` | `(uuid, jsonb, int)` | `(uuid, jsonb, text, int, int)` |
| `cancel_appointment_series` | `(uuid, text, date, date)` | `(uuid, text, date, date, int)` |
| `cancel_provider_appointment_series` | `(uuid, text, date, date)` | `(uuid, text, date, date, int)` |

O frontend usa `callRpcWithFallback` que tenta a nova, e cai pra antiga se
o Postgres responder `function does not exist`.

**Importante:** o `CancelSeriesModal` passa `p_renew_days: null` explicitamente
pra desambiguar o overload (senão o Postgres não sabe qual versão chamar).

#### Migration 3 — pendente

Depois de validar em produção, dropar as RPCs antigas (3/4 args) e remover o
`callRpcWithFallback` do frontend.

### 4.29 `MaskedDateInput` — máscara de data BR ⭐ NOVO

Componente em `src/components/ui/MaskedDateInput.tsx`.

**Problema que resolve:** `<input type="date">` mostra a data no formato do
locale do navegador (mm/dd/aaaa em Chrome en-US). Não dá pra forçar via HTML.

**Solução:** `<input type="text">` com máscara `dd/mm/aaaa` controlada por
React, com **preservação da posição do cursor** ao editar no meio (via
`setSelectionRange` num `useLayoutEffect`).

Helpers em `src/lib/masks.ts`:
- `maskDateBR(input)` — aplica máscara enquanto digita
- `parseDateBR("dd/mm/aaaa")` → `"YYYY-MM-DD" | null` (valida data real)
- `formatDateBR("YYYY-MM-DD")` → `"dd/mm/aaaa"`
- `isValidDateBR("dd/mm/aaaa")` → boolean

---

## 5. Fluxos principais

### 5.1 Login

`supabase.auth.signInWithOAuth({ provider: "google", redirectTo: <origin>/dashboard })`.

**Site URL** e **Redirect URLs** precisam ter:
- `https://psy-dbase-frontend.vercel.app` + `/**`
- `http://localhost:5173` + `/**`

### 5.2 Convite de paciente

1. `/patients` → "Convidar"
2. `InvitePatientModal` coleta nome (opcional), telefone e ≥ 1 horário
3. Chama `POST /invites` no backend
4. Backend cria convite, encurta URL, monta link `wa.me`
5. Frontend abre `whatsappUrl` em nova aba

### 5.3 Formulário público

1. Paciente abre `/form/<token>`
2. `PublicForm` valida token via RPC `get_invite_by_token`
3. Mostra sessões combinadas + campos + 2 checkboxes
4. Envia via RPC `submit_patient_form`

### 5.4 Aprovar/Rejeitar submissão

1. `/patients` → seção "Submissões pendentes"
2. **Aprovar** → RPC `approve_submission` cria `patient` com `status='prospect'`
3. **Rejeitar** → `update status='rejected'`

### 5.5 Promover provisório a paciente

1. `/dashboard` → bloco "Aguardando revisão"
2. `ProspectCard` → "É paciente" → `/patients/:id/review`
3. Salva: RPC `promote_prospect_to_active` com `p_schedules`
4. **Ainda não passa `recurrence_type` / `recurrence_days`** — Etapa 3 pendente

### 5.6 Criar/editar paciente/prestador

- `PatientForm` / `ProviderForm` com `ScheduleEditor` + Financeiro
- Ao salvar: chama RPC de schedules **se os horários ou a frequência mudaram**
- Envia `anchorDate` dentro de cada item do JSONB `p_schedules`

### 5.7 Arquivar / Reativar / Excluir

- **Arquivar** → RPC `cancel_*_future_appointments` + status
- **Reativar** → status + (ver seção 4.13)
- **Excluir** → RPC `delete_patient` / `delete_provider`

### 5.8 Agenda

Ver seções 4.17 a 4.21.

### 5.9 Dashboard

Ver seção 4.24.

---

## 6. Convenções de código

- **Idioma:** variáveis, funções, tipos, arquivos em **inglês**. Comentários
  em **português**.
- **Componentes:** função nomeada (`export function Foo()`).
- **Tipos:** usar `type`, não `interface`.
- **Estados de fetch:** sempre tratar `loading`, `error` e `empty`.
- **Nada de `any`:** exceto em integrações com bibliotecas.

**Regra de ouro:** hooks só dentro de `export function`. Nunca fora.

---

## 7. Armadilhas conhecidas

| Sintoma                                             | Causa                                           | Solução                                                     |
|-----------------------------------------------------|-------------------------------------------------|-------------------------------------------------------------|
| `42501 permission denied for table`                 | Faltou GRANT                                    | `grant … to authenticated;`                                 |
| `Invalid hook call` no console                      | Hook fora do `export function`                  | Mover para dentro do componente                             |
| Login redireciona para `localhost` em produção      | Site URL aponta para localhost                  | Ajustar **Site URL** e **Redirect URLs**                    |
| `/dashboard` dá 404 em produção                     | Falta `vercel.json` com SPA rewrite             | Criar `vercel.json`                                         |
| Tailwind não aplica estilos novos                   | Config v3 em projeto v4                         | Usar `@theme` + plugin Vite                                 |
| Bundle aponta para `localhost` mesmo após config    | `VITE_*` só em novo build                       | Redeploy **sem cache**                                      |
| `tsc -b` falha com `declared but never used`        | Import não usado                                | Remover o import                                            |
| Rota `:id` captura `new` ou `review`                | Ordem das rotas                                 | Declarar literais antes de dinâmicas                        |
| Bloco aparece na coluna errada da agenda            | `WEEKDAY_SHORT/LONG` em ordem JS, não ISO       | Usar `isoWeekday()` antes de indexar                        |
| `appointments_subject_check` violada ao excluir     | FK com `on delete set null` conflita            | Usar RPC `delete_patient` / `delete_provider`               |
| Slot do próprio paciente/provider fica âmbar        | `useOccupiedSlots` sem `excludeId`              | Passar `excludePatientId` / `excludeProviderId`             |
| Salvar mesmo com conflito                           | Sem `onConflictChange` / sem validação no submit | Usar `hasScheduleConflict` + botão desabilitado             |
| Dark mode com fundo claro + texto claro             | Falta `--color-brand-950` no `@theme`           | Adicionar `--color-brand-950: #042f2e`                      |
| Amigo cai em localhost ao autorizar Google          | `GOOGLE_REDIRECT_URI` no backend de produção    | Atualizar pra URL da Vercel                                 |
| **`Could not choose the best candidate function`**  | Overload ambíguo de RPC                         | Passar todos os parâmetros, ou usar `callRpcWithFallback`   |
| **Cursor pula pro fim ao editar data com máscara**  | Input controlado reposiciona cursor             | Usar `MaskedDateInput` (setSelectionRange)                  |
| **`<input type="date">` mostra mm/dd/aaaa**         | Locale do navegador                             | Usar `MaskedDateInput` (não `<input type="date">`)          |
| **`monthly` cai em dia diferente do esperado**      | Faltava `anchor_date`                           | Sempre passar `anchorDate` no JSONB                         |

---

## 8. Segurança

- **`anon key`:** painel da Vercel + `.env.local`. Segura porque o RLS protege.
- **`service_role`:** exclusiva do backend. Nunca no frontend.
- **`access_token`:** header `Authorization`. Expira em 1h, renovado pelo SDK.
- **Env vars `VITE_*` são públicas:** aparecem no bundle.
- **LGPD:** dado sensível de saúde.

---

## 9. O que está fora do escopo

- Lógica pesada (convite, OAuth, PDF) → **backend `psy-dbase`**
- Migrations SQL → **Supabase CLI + migrations versionadas** (mudou: era SQL Editor)
- Autenticação OAuth → **Supabase Auth**
- Deploy do backend → **Vercel** (projeto separado)

---

## 10. Estado atual (última atualização)

**Concluído (Fases 1–3):**

- ✅ Fase 1: Auth Google, deploy Vercel, SPA routing
- ✅ Fase 2: convite, formulário público, submissões, CRUD de pacientes
- ✅ Design system + layout autenticado
- ✅ Migração Tailwind v3 → v4
- ✅ Máscaras (CPF, CNPJ, telefone, moeda, **data BR**)
- ✅ Página `/settings` com Google Calendar
- ✅ CRUD completo de prestadores
- ✅ Agenda em 3 modos (Dia/Semana/Mês) + stacking + cancelados como badges
- ✅ Horários recorrentes (paciente + provider `person`)
- ✅ Arquivar/reativar com modais de conflito
- ✅ Dark mode completo
- ✅ Dashboard reformulado
- ✅ Valor da sessão (`session_price_cents`)

**Concluído (Frequência configurável) — parcialmente:**

- ✅ Migrations 1, 2, 2.6 aplicadas em produção
- ✅ Tipos `RecurrenceType` + `ScheduleInput.recurrenceType/recurrenceDays/anchorDate`
- ✅ `ScheduleEditor` com UI dinâmica (date vs weekday)
- ✅ `MaskedDateInput` (máscara + preservação do cursor)
- ✅ Hooks leem `recurrence_type` / `recurrence_days`
- ✅ `PatientForm` / `ProviderForm` enviam frequência + `anchorDate`
- ✅ Badges de frequência em `PatientDetail` / `ProviderDetail`
- ✅ `CancelSeriesModal` desambigua overload com `p_renew_days: null`
- ✅ `callRpcWithFallback` implementado

**Pendente (Frequência configurável) — Etapa 3:**

- ⏳ `usePatientScheduleSource` / `useProviderScheduleSource` ler `anchor_date`
- ⏳ `PatientReview` usar `promote_prospect_to_active` nova (com recorrência)
- ⏳ Deploy + teste em produção
- ⏳ Migration 3 — dropar RPCs antigas (3/4 args)
- ⏳ Cleanup do `callRpcWithFallback`

**Pendente — próximo:**

- ⏳ **`provider_billings`** (Fase B) — vencimentos de empresas
- ⏳ **Agendamento avulso** — botão "Novo agendamento" fora da série
- ⏳ **Drag and drop na agenda** — `@dnd-kit/core`
- ⏳ **Ajustes finos** — 404, favicon, metadados, `AlertDialog`, busca,
  perfil/preferências em `/settings`, `postMessage` do OAuth
- ⏳ **Re-branding** — pausado

**Pendente — fases seguintes:**

- ⏳ Financeiro (Fase 5) + Recibos + Relatórios
- ⏳ Notificações + Calendar escrita (Fase 6)
- ⏳ Prontuário (Fase 4)
- ⏳ Testes E2E (Playwright)

**Branches ativas:**
- Frontend: `feat/recurrence`
- Backend: `feat/recurrence`

---

## 11. Como usar este documento

Ao entrar no projeto, leia na ordem:

1. Este `CONTEXT.md`
2. `README.md`
3. `TODO.md`
4. Código em `src/`

Se algo aqui estiver desatualizado, **atualize antes de codar**.
```

---

## Arquivo 2 — `TODO.md` (frontend)

