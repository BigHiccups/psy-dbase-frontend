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
paciente/prestador, e — nas próximas fases — prontuário, financeiro,
notificações e integração Calendar bidirecional.

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
│   ├── ui/                    # Design system
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
│   ├── useBirthdays.ts                # NOVO
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
│   ├── useTheme.ts                    # NOVO (dark mode)
│   ├── useTodayAppointmentsCount.ts   # NOVO
│   ├── useUpcomingAppointments.ts     # NOVO
│   └── useWeekAppointmentsCount.ts    # NOVO
├── lib/
│   ├── agenda-date.ts
│   ├── api.ts
│   ├── appointment-colors.ts
│   ├── appointment-layout.ts
│   ├── appointment-overlap.ts         # NOVO (intervalsOverlap, slotOverlapsAppointment)
│   ├── appointments-filter.ts
│   ├── masks.ts
│   ├── patient-display.ts
│   ├── supabase.ts
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
Já tivemos bug disso.

### 4.5 Design system próprio em `components/ui/`

- `Button` — `primary` / `secondary` / `ghost` / `danger`
- `Input` — com `label`, `error`, `hint`
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
e `ProviderDetail.tsx` (handlers de erro raro do Supabase). Será trocado por
`AlertDialog` do design system.

### 4.12 Normalização de nome vs. máscaras in-locus

- **Nome:** normaliza **silenciosamente ao enviar** (`toTitleCase`).
- **Telefone e CPF/CNPJ:** máscara **in-locus** enquanto digita.
- **Valor monetário:** máscara in-locus, armazenado em **centavos** no banco
  (`session_price_cents int`).

### 4.13 CRUD de pacientes

- **Criar do zero:** `/patients/new` (`PatientForm.tsx`)
- **Editar:** `/patients/:id/edit`
- **Arquivar (soft delete):** `status='inactive'`. Cancela appointments futuros.
- **Reativar:** `status='active'`. Recria appointments a partir de
  `patient_schedules`.
  - Se **não tem** schedules → `ReactivateModal`
  - Se **tem conflito** → `ConflictOnReactivateModal`
  - Se **sem conflito** → reativa direto
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
- Se o backend de produção estiver com URL local, o amigo do psicólogo cai
  em `localhost` ao autorizar.

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

**Onde os cancelados aparecem:**

| View | Badge | Modal |
|---|---|---|
| **Mês** | `N ✕` no canto superior direito da célula (total do dia) | `DayCancelledModal` |
| **Semana** | `N ✕` no canto superior direito do **slot de horário** | `SlotCancelledModal` |
| **Dia** | `N ✕` no canto superior direito do **slot de horário** | `SlotCancelledModal` |

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
- **Definitivo a partir de uma data** — idem, com data escolhida
- **Suspender por período** — cancela só o intervalo, mantém schedules,
  estende horizonte se necessário

**Onde o botão aparece:**
- `PatientDetail` — no card "Horários das sessões" (canto superior direito)
- `ProviderDetail` — no card "Horários recorrentes" (mesmo lugar)
- `AppointmentDetailModal` — botão "Cancelar série" quando `is_recurring`
  (funciona para paciente **e** provider)

### 4.21 Bloqueio rígido por SOBREPOSIÇÃO DE INTERVALO

Regra: `a.start < b.end && b.start < a.end`.

Exemplos:
- `14:30–15:30` vs `15:00` → **bloqueia** (sobreposição)
- `14:00–14:30` vs `14:30` → **não bloqueia** (fim coincide com início)
- `15:00–16:00` vs `14:30–15:30` → **bloqueia**

Implementado em `src/lib/appointment-overlap.ts`.

**Hooks:**
- `useOccupiedSlots` — retorna `{ weekday, startTime, durationMin, occupiedBy, subjectName }`
- `usePatientScheduleSource` — 3 camadas (`patient_schedules` → `patient_invite_schedules` → `appointments`)
- `useProviderScheduleSource` — 2 camadas (`provider_schedules` → `appointments` tipo `personal`)

**Regras do `ScheduleEditor`:**
- Slot âmbar = conflito (externo **ou** interno)
- **Slot âmbar é editável** — mudar recalcula automaticamente
- **`+ Adicionar` sugere slot livre** (percorre dias até achar)
- Botão "Salvar" bloqueado enquanto houver conflito
- `PatientForm`/`PatientReview`: `excludePatientId: id`
- `ProviderForm`: `excludeProviderId: id`
- `InvitePatientModal`: sem exclusão

### 4.22 Valor da sessão (`session_price_cents`)

Armazenado em **centavos** (`int`) para evitar float.

- **Paciente:** `patients.session_price_cents` — valor que você cobra
- **Prestador `person`:** `providers.session_price_cents` — valor que você paga por sessão
- **Prestador `company`:** `providers.session_price_cents` — valor recorrente de referência (Fase B refina com `provider_billings`)

**Máscara in-locus** com `maskCurrencyBRL` / `parseCurrencyToCents` /
`centsToCurrencyBRL`.

**Exibido em:**
- `PatientForm`, `ProviderForm`, `PatientReview` (campo editável)
- `PatientDetail`, `ProviderDetail` (read-only, no card de dados)
- `Patients`, `Providers` (coluna "Valor" na tabela)

### 4.23 Dark mode

- Tailwind v4 com `@variant dark (&:where(.dark, .dark *))`
- Toggle no Header (`ThemeToggle`) com 3 opções: **Claro / Escuro / Sistema**
- Estado em `localStorage` (`psy-dbase:theme`)
- Script inline no `index.html` **antes do React** (evita flash branco)
- Paleta: **slate** (cinza-azulado) para dark, brand mantém
- `color-scheme` no `<html>` alternado

**Atenção:** o `@theme` precisa ter `--color-brand-950: #042f2e`. Sem isso,
o dark mode dos botões ativos quebra.

### 4.24 Dashboard

Ordem dos blocos:

1. Saudação
2. Cards de resumo (4): **Pacientes ativos**, **Submissões pendentes**,
   **Sessões hoje**, **Sessões esta semana**
3. **Aguardando revisão** (colapsável, scroll se > 3)
4. **Próximas sessões** (colapsável, hoje + 7 dias)
5. **Aniversariantes do mês** (só pacientes `active`)

**"Complete seu perfil"** — **saiu do Dashboard**. Agora é badge na sidebar.

**"Ações rápidas"** — **removida**.

**Colapsáveis:**
- Estado em `localStorage`
- "Aguardando revisão" começa expandido se ≤ 3 provisórios, colapsado se > 3
- "Próximas sessões" começa colapsado
- Cada um mostra um **resumo** quando colapsado

**"Próximas sessões":**
- Filtra appointments de hoje cujo horário **já passou**
- Recarrega a cada 5 min + ao ganhar foco da janela
- Clicar num item → `/agenda/day/<data>`
- "Ver agenda completa" → `/agenda`

### 4.25 Aniversariantes

- Busca `patients` com `status='active'` e `birth_date` no mês atual
- Mostra nome, dia do mês e idade que completa
- Clicar → `/patients/:id`
- Aniversariantes de prestadores: **decisão adiada** (precisa adicionar
  `birth_date` em `providers` + campo no form)

### 4.26 Prestadores — modelo estendido

**`person`** (ex: psicólogo, supervisor):
- `provider_schedules` (horários recorrentes)
- `appointments` tipo `personal`
- Bloqueia slot na agenda
- `session_price_cents` = valor pago por sessão

**`company`** (ex: curso, plataforma, aluguel):
- **Não tem** `provider_schedules`
- Card vazio "Vencimentos" no `ProviderDetail` (placeholder)
- Fase B: `provider_billings` (frequência mensal/bimestral/semestral/anual,
  `due_day`, `amount`)
- Não aparece na grade; aparece como badge no dia

### 4.27 Convites — captura de e-mail e preferências (Fase 6)

`PublicForm` ganhará:

- Campo **e-mail obrigatório**
- Checkbox **"Receber alerta de sessões na Google Agenda"**
  - Só aparece se o e-mail for **Gmail**
  - Se marcado → sub-opções `5min` / `10min` / `30min` / `1h` antes
- Checkbox **"Receber alerta de vencimento de faturas por e-mail"**
  - Se marcado → input **melhor dia de pagamento** (dia do mês)

---

## 5. Fluxos principais

### 5.1 Login

`supabase.auth.signInWithOAuth({ provider: "google", redirectTo: <origin>/dashboard })`.
Supabase valida `redirectTo` contra **Redirect URLs**.

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
3. Mostra sessões combinadas + campos + 2 checkboxes (termo + orientação)
4. Envia via RPC `submit_patient_form`

### 5.4 Aprovar/Rejeitar submissão

1. `/patients` → seção "Submissões pendentes"
2. **Aprovar** → RPC `approve_submission` cria `patient` com `status='prospect'`
3. **Rejeitar** → `update status='rejected'`

### 5.5 Promover provisório a paciente

1. `/dashboard` → bloco "Aguardando revisão"
2. `ProspectCard` → "É paciente" → `/patients/:id/review`
3. Salva: RPC `promote_prospect_to_active` com `p_schedules`

### 5.6 Criar/editar paciente/prestador

- `PatientForm` / `ProviderForm` com `ScheduleEditor` + Financeiro
- Ao salvar: chama RPC de schedules **se os horários mudaram**

### 5.7 Arquivar / Reativar / Excluir

- **Arquivar** → RPC `cancel_*_future_appointments` + status
- **Reativar** → status + (ver seção 4.13 para 3 cenários)
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
| **Bloco aparece na coluna errada da agenda**        | `WEEKDAY_SHORT/LONG` em ordem JS, não ISO       | Usar `isoWeekday()` antes de indexar                        |
| `appointments_subject_check` violada ao excluir     | FK com `on delete set null` conflita            | Usar RPC `delete_patient` / `delete_provider`               |
| **Slot do próprio paciente/provider fica âmbar**    | `useOccupiedSlots` sem `excludeId`              | Passar `excludePatientId` / `excludeProviderId`             |
| **Salvar mesmo com conflito**                       | Sem `onConflictChange` / sem validação no submit | Usar `hasScheduleConflict` + botão desabilitado             |
| **Dark mode com fundo claro + texto claro**         | Falta `--color-brand-950` no `@theme`           | Adicionar `--color-brand-950: #042f2e`                      |
| **Amigo cai em localhost ao autorizar Google**      | `GOOGLE_REDIRECT_URI` no backend de produção    | Atualizar para `https://psy-dbase.vercel.app/calendar/callback` |
| **`<input type="date">` mostra mm/dd/aaaa**         | Locale do navegador                             | Adicionar Português (BR) nas configs do Chrome              |

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

- Lógica pesada (convite, OAuth, PDF) → **backend `psy-dbase`**
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
- ✅ Máscaras (CPF, CNPJ, telefone, **moeda**) + normalização de nome
- ✅ Página `/settings` com Google Calendar
- ✅ Bloco "Aguardando revisão" no **Dashboard** (colapsável)
- ✅ Página `/patients/:id/review`
- ✅ CRUD completo de prestadores (`person` + `company`)
- ✅ **Agenda em 3 modos** (Dia/Semana/Mês)
- ✅ **Stacking de ativos** + `StackOverviewModal`
- ✅ **Cancelados como badges por slot/dia** + modais
- ✅ `ScheduleEditor` com bloqueio rígido **por sobreposição de intervalo**
- ✅ Horários recorrentes (paciente + provider `person`)
- ✅ Arquivar/reativar com modais de conflito (paciente + provider)
- ✅ `CancelSeriesModal` parametrizado (3 modos)
- ✅ Reativação de appointment individual
- ✅ Deleção em massa de cancelados
- ✅ RPCs de prestador (`set_provider_schedules`, `cancel_provider_*`,
  `delete_provider`)
- ✅ **Dark mode completo** (todas as telas)
- ✅ **Dashboard reformulado** (cards funcionais, próximas sessões,
  aniversariantes, colapsáveis)
- ✅ **Valor da sessão** (`session_price_cents` em paciente e provider)
- ✅ **Coluna "Valor"** nas listagens

**Pendente — próximo passo:**

- ⏳ **Frequência configurável** — avulso / semanal / quinzenal / mensal /
  a cada 30 dias / custom
- ⏳ **`provider_billings`** (Fase B) — vencimentos de empresas
- ⏳ **Ajustes finos** — 404, favicon, metadados, `AlertDialog`, busca,
  perfil/preferências em `/settings`, `postMessage` do OAuth
- ⏳ **Re-branding** — nome, logo, favicon, aplicação (pausado)

**Pendente — fases seguintes:**

- ⏳ Financeiro (Fase 5)
- ⏳ Notificações + Calendar escrita (Fase 6)
- ⏳ Prontuário (Fase 4)
- ⏳ Testes E2E (Playwright)

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