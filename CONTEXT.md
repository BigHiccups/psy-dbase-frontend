


# CONTEXT.md — psy-dbase-front

> **Leia isto antes de tocar no código.**
> Este documento é a fonte de verdade para qualquer IA ou dev que entre no projeto.
> Ele registra **decisões já tomadas** para evitar retrabalho e perguntas repetidas.

---

## 1. O que é este projeto

Interface web do **psy-dbase**, sistema de gestão para psicólogo autônomo.

Cobre cadastro de pacientes via formulário público, CRUD completo de pacientes,
CRUD de prestadores (pessoa física e empresa), revisão de provisórios importados
do Google, agenda em dia/semana/mês com bloqueio de conflito e stacking, e —
nas próximas fases — prontuário, financeiro, notificações e integração Calendar
bidirecional.

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
│   │   ├── DayCancelledModal.tsx          # cancelados do dia (Mês)
│   │   ├── DayHeader.tsx
│   │   ├── DayOverviewModal.tsx
│   │   ├── DayView.tsx
│   │   ├── MonthDayCell.tsx
│   │   ├── MonthView.tsx
│   │   ├── ScheduleEditor.tsx
│   │   ├── SlotCancelledModal.tsx         # cancelados de um slot
│   │   ├── StackOverviewModal.tsx         # +N blocos ocultos
│   │   ├── TimeColumn.tsx
│   │   └── WeekView.tsx
│   ├── layout/                # Sidebar, Header, AppLayout
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
│   └── useSubmissions.ts
├── lib/
│   ├── agenda-date.ts             # isoWeekday/jsWeekday, helpers
│   ├── api.ts
│   ├── appointment-colors.ts
│   ├── appointment-layout.ts      # computeLayout, countHiddenByStack
│   ├── appointments-filter.ts     # splitByStatus, countCancelledByDate
│   ├── masks.ts                   # CPF, CNPJ, telefone + validações
│   ├── patient-display.ts         # displayName (heurística)
│   ├── supabase.ts
│   ├── text.ts                    # toTitleCase
│   └── weekdays.ts                # mapeamento JS (0=Dom … 6=Sáb)
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
- `Header` sticky com avatar + logout

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
- `kind='person'` → CPF, esconde Razão social, mostra `ScheduleEditor`
- `kind='company'` → CNPJ + Razão social, sem `ScheduleEditor`

**Reativação:** mesma lógica do paciente (com modais).

### 4.15 Revisão de provisórios

Provisórios (`patients.status='prospect'`) aparecem **apenas** no bloco
"Aguardando revisão" em `/patients`.

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

**Escrita no Google (Fase 6):** ver seção 4.25.

### 4.17 Agenda — 3 modos e 4 tipos

A agenda lê `appointments` e renderiza em **Dia**, **Semana** e **Mês**.

**Tipos** com cores distintas (`appointment-colors.ts`):

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
| **Mês** | `N ✕` no canto superior direito da célula (total do dia) | `DayCancelledModal` (dia inteiro) |
| **Semana** | `N ✕` no canto superior direito do **slot de horário** | `SlotCancelledModal` (slot específico) |
| **Dia** | `N ✕` no canto superior direito do **slot de horário** | `SlotCancelledModal` (slot específico) |

### 4.18 Dia da semana — atenção ao formato

**Dois formatos coexistem** e não devem se misturar:

**Formato JS** (0=domingo, 6=sábado):
- `appointments.weekday`
- `patient_schedules.weekday`
- `provider_schedules.weekday`
- `patient_invite_schedules.weekday`
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

**Histórico:** já tivemos bug de blocos na coluna errada por misturar os dois.

### 4.19 Horários recorrentes (`patient_schedules`)

Pacientes ativos podem ter N horários recorrentes em `patient_schedules`. A RPC
`set_patient_schedules`:

1. **Valida conflito** com appointments ativos de **outros** sujeitos
2. Se não houver conflito:
   - **Deleta** appointments futuros ativos deste paciente
   - Remove os `patient_schedules` antigos
   - Insere os novos
   - Gera appointments para 90 dias

**Reconfiguração vs. cancelamento:** reconfigurar **deleta**; cancelar
(paciente avisou que não vem) **cancela** (`status='cancelled'`).

**Idempotência do frontend:** o `PatientForm` só chama `set_patient_schedules`
se o conteúdo do `ScheduleEditor` **mudou** desde o carregamento
(`schedulesEqual`).

### 4.20 Cancelamento de série — 3 modos

`CancelSeriesModal` (parametrizado com `subjectType: "patient" | "provider"`):

- **Definitivo a partir de hoje** — cancela todos os futuros, deleta schedules
- **Definitivo a partir de uma data** — idem, com data escolhida
- **Suspender por período** — cancela só o intervalo, mantém schedules,
  estende horizonte se necessário

### 4.21 Bloqueio rígido de conflito

Quatro hooks/componentes compõem o sistema:

- **`useOccupiedSlots`** — busca appointments ativos futuros, deduplica por
  `weekday + start_time`, opcionalmente exclui `patient_id` ou `provider_id`
- **`usePatientScheduleSource`** — horários do paciente em 3 camadas:
  `patient_schedules` → `patient_invite_schedules` → `appointments` derivados
- **`useProviderScheduleSource`** — horários do prestador em 2 camadas:
  `provider_schedules` → `appointments` derivados (tipo `personal`)
- **`ScheduleEditor`** — aplica `disabledSlots`, mostra âmbar, chama
  `onConflictChange`

**Regras:**

- Slot âmbar = conflito (externo **ou** interno)
- **Slot âmbar é editável** — mudar dia/hora/duração recalcula o conflito
  automaticamente; se o novo valor não conflita, o âmbar some
- **`+ Adicionar` sugere slot livre** (percorre dias até achar um sem conflito)
- Botão de remover **sempre habilitado** (exceto se for o único item)
- Botão "Salvar" **bloqueado** enquanto houver conflito (`onConflictChange`)
- `PatientForm`: `excludePatientId: id`
- `PatientReview`: `excludePatientId: id`
- `ProviderForm`: `excludeProviderId: id`
- `InvitePatientModal`: sem exclusão

### 4.22 `schedulesEqual` — evitar regeneração

`PatientForm` e `ProviderForm` guardam `initialSchedules` (o que veio do
carregamento) e comparam com o estado atual usando uma chave ordenada
(`weekday-startTime-duration`). Só chamam `set_patient_schedules` /
`set_provider_schedules` se **mudou**.

Isso evita apagar e recriar appointments sem necessidade (perderia histórico e
quebraria a ligação com o Google Calendar).

### 4.23 Reativação com modais

Quando o usuário clica em "Reativar":

1. **Sem `patient_schedules`** (ou `provider_schedules`) → abre
   `ReactivateModal`:
   - **Definir horários agora** (navega para `/.../edit`)
   - **Reativar sem agendamentos** (só muda o status)
   - **Cancelar**
2. **Com schedules mas sem conflito** → reativa direto
3. **Com schedules e com conflito** → abre `ConflictOnReactivateModal`:
   - Lista os horários em conflito (com o nome do ocupante)
   - **Escolher novos horários** (navega para `/.../edit`)
   - **Reativar apenas os horários livres**
   - **Cancelar**

### 4.24 Stacking de ativos na agenda

Quando múltiplos appointments **ativos** compartilham o mesmo slot
(sobreposição por intervalo de tempo):

- O que **começa primeiro** (empate: o mais longo) é o **principal** →
  100% de largura, `z-index` baixo
- Os demais → **sub-blocos** com até 2 visíveis (50% cada), `z-index` alto
- Os restantes ficam **ocultos** com botão `+N` no canto superior direito
- `+N` → `StackOverviewModal` (lista completa da pilha)

Implementado em `src/lib/appointment-layout.ts`:
- `computeLayout(appointments, hourHeight, startHour)`
- `countHiddenByStack(layouts)`

### 4.25 Integração Google Calendar (escrita) — Fase 6

Decisões já tomadas para a Fase 6:

- **Ao criar appointment** (via `set_patient_schedules` ou
  `CreateAppointmentModal`):
  - Cria evento no Google Calendar do **psicólogo**
  - Envia convite de reunião (Google Meet) para `psicologo + paciente`
- **Alerta do paciente:** o paciente escolhe **uma vez** o intervalo
  (`5min` / `10min` / `30min` / `1h` antes) — vale para **todas** as sessões
- **Só envia para a agenda do paciente** se o e-mail for **Gmail**
- **Envio em cadeia:** as 13 ocorrências **não** são enviadas de uma vez.
  Apenas a **próxima sessão** é enviada. Após o término, a **seguinte** é
  enviada (cron job ou evento de conclusão). **Obrigatório** — acontece mesmo
  se o paciente não aceitar o convite.
- **Cancelamento:** se o appointment for cancelado, remove o evento do Google

### 4.26 Prestadores — modelo estendido

**Prestador `kind='person'`** (ex: psicólogo particular, supervisor):
- `provider_schedules` (tabela própria, **não** reusa `patient_schedules`)
- `ScheduleEditor` no `ProviderForm` (só quando `kind='person'`)
- Gera `appointments` tipo `personal` com `linked_expense=true`
- Arquivar/reativar cancela/recria appointments
- `useProviderScheduleSource` (2 camadas)

**Prestador `kind='company'`** (ex: curso, plataforma, aluguel):
- Terá `provider_billings` (tabela própria, **separada** de `appointments`)
- Campos previstos: `provider_id`, `description`, `amount`, `due_day` (1–31),
  `frequency` (`monthly` / `quarterly` / `semiannual` / `yearly` / `once`),
  `installments_total`, `installments_paid`, `starts_on`, `ends_on`, `status`
- Tela em `/providers/:id` para cadastrar vencimentos
- Marcar vencimento como pago → gera saída no financeiro (Fase 5)
- **Badge na agenda:** `$` no canto da célula do dia (não ocupa slot de horário)

**Decisão pendente:** `appointments` tipo `due` migra para `provider_billings`
ou coexiste? (recomendação: coexistir por enquanto)

### 4.27 Convites — captura de e-mail e preferências (Fase 6)

`PublicForm` ganhará:

- Campo **e-mail obrigatório**
- Checkbox **"Receber alerta de sessões na Google Agenda"**
  - Só aparece se o e-mail for **Gmail**
  - Se marcado → sub-opções `5min` / `10min` / `30min` / `1h` antes
- Checkbox **"Receber alerta de vencimento de faturas por e-mail"**
  - Se marcado → input **melhor dia de pagamento** (dia do mês)

Preferências persistem em tabela própria ou colunas em `patients` (a decidir).

---

## 5. Fluxos principais

### 5.1 Login

`supabase.auth.signInWithOAuth({ provider: "google", redirectTo: <origin>/dashboard })`.
Supabase valida `redirectTo` contra **Redirect URLs**. **Site URL** e
**Redirect URLs** precisam ter produção e `localhost:5173`.

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

**Fase 6:** adicionará e-mail obrigatório + 2 checkboxes de preferência.

### 5.4 Aprovar/Rejeitar submissão

1. `/patients` → seção "Submissões pendentes"
2. **Aprovar** → RPC `approve_submission` cria `patient` com `status='prospect'`
3. **Rejeitar** → `update status='rejected'`

### 5.5 Promover provisório a paciente

1. `/patients` → bloco "Aguardando revisão"
2. `ProspectCard` → "É paciente" → `/patients/:id/review`
3. `PatientReview`:
   - Carrega horários (via `usePatientScheduleSource`)
   - Usuário completa dados + ajusta horários
   - Salva: RPC `promote_prospect_to_active` com `p_schedules`
4. Vira `active` + `appointments` criados

### 5.6 Criar/editar paciente manual

1. `/patients/new` ou `/patients/:id/edit`
2. `PatientForm` com `ScheduleEditor` + bloqueio rígido
3. Ao salvar:
   - Chama `set_patient_schedules` **se os horários mudaram** (`schedulesEqual`)
   - No create, chama sempre (se tem horários)

### 5.7 Arquivar / Reativar / Excluir paciente

- **Arquivar** → RPC `cancel_future_appointments` + status `inactive`
- **Reativar** → status `active` + (ver seção 4.23)
- **Excluir** → RPC `delete_patient`

### 5.8 Agenda

1. `/agenda` → redireciona para `/agenda/week/<hoje>`
2. Modos: `AgendaToolbar` (Dia/Semana/Mês)
3. Navegação: setas + "Hoje"
4. Clicar em bloco → `AppointmentDetailModal`
5. Clicar em slot vazio → `CreateAppointmentModal`
6. Clicar em célula do mês → `DayOverviewModal`
7. Clicar em `N ✕` (cancelados) → `SlotCancelledModal` / `DayCancelledModal`
8. Clicar em `+N` (stacking) → `StackOverviewModal`
9. Cancelar série → `CancelSeriesModal`

### 5.9 Prestadores

- `/providers` — listagem com filtros
- `/providers/new` — criar (com `ScheduleEditor` se `kind='person'`)
- `/providers/:id` — detalhe com ações completas (editar, arquivar/reativar,
  suspender agendamentos, excluir)

### 5.10 Google Calendar — conectar / importar / desconectar

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
| Prospect aparece na tabela normal                   | Filtro não exclui `prospect`                    | `usePatients` filtra por `.neq("status", "prospect")`       |
| **Bloco aparece na coluna errada da agenda**        | `WEEKDAY_SHORT/LONG` em ordem JS, não ISO       | Usar `isoWeekday()` antes de indexar                        |
| `appointments_subject_check` violada ao excluir     | FK com `on delete set null` conflita            | Usar RPC `delete_patient` / `delete_provider`               |
| Horários antigos poluem a agenda após reconfigurar  | `set_patient_schedules` cancelava em vez de deletar | RPC agora deleta appointments futuros                    |
| **Slot do próprio paciente fica âmbar na edição**   | `useOccupiedSlots` sem `excludePatientId`       | Passar `excludePatientId: id` em `PatientForm`/`Review`     |
| **`ScheduleEditor` não mostra âmbar**               | `disabledSlots` comentado ou vazio              | Descomentar e passar `occupiedSlots`                        |
| **Salvar mesmo com conflito**                       | Sem `onConflictChange` / sem validação no submit | Usar `hasScheduleConflict` + botão desabilitado             |
| **`<input type="date">` mostra mm/dd/aaaa**         | Locale do navegador                             | Adicionar Português (BR) nas configs do Chrome              |
| **`+N` sobrepõe bloco no topo do dia**              | `z-index` do `+N` acima do `AppointmentBlock`   | `+N` tem `z-index: 100`; aceito pois é pequeno              |

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
- ✅ Máscaras (CPF, CNPJ, telefone) + normalização de nome
- ✅ Página `/settings` com Google Calendar (leitura + importação)
- ✅ Bloco "Aguardando revisão" + `/patients/:id/review`
- ✅ CRUD completo de prestadores (`person` + `company`)
- ✅ **Agenda em 3 modos** (Dia/Semana/Mês)
- ✅ **Stacking de ativos** + `StackOverviewModal`
- ✅ **Cancelados como badges por slot/dia** + `SlotCancelledModal` /
  `DayCancelledModal`
- ✅ `ScheduleEditor` com bloqueio rígido (slot âmbar editável, `+ Adicionar`
  sugere slot livre)
- ✅ Horários recorrentes para **paciente** (`patient_schedules`) e
  **prestador person** (`provider_schedules`)
- ✅ Arquivar/reativar com modais de conflito (paciente + prestador)
- ✅ `CancelSeriesModal` parametrizado (3 modos, paciente + prestador)
- ✅ `ReactivateModal` e `ConflictOnReactivateModal` parametrizados
- ✅ Reativação de appointment individual (`reactivate_appointment`)
- ✅ Deleção em massa de cancelados (`delete_cancelled_appointments`)
- ✅ RPCs de prestador (`set_provider_schedules`,
  `cancel_provider_future_appointments`, `delete_provider`,
  `cancel_provider_appointment_series`)
- ✅ Correção de timezone (`isoWeekday`/`jsWeekday`)

**Pendente — próximo passo:**

- ⏳ **Ajustes finos** — 404 customizada, favicon, metadados, `AlertDialog` no
  lugar dos `alert()` restantes
- ⏳ **`provider_billings`** (Fase B) — vencimentos de empresas

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