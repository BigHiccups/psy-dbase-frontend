```markdown
# TODO.md — psy-dbase-front

> Tarefas pendentes, organizadas por fase.

**Legenda:** `[ ]` pendente · `[~]` em andamento · `[x]` concluído · `[!]` bloqueado

**URL de produção:** `https://psy-dbase-frontend.vercel.app`
**Branch principal:** `main`
**Branch atual:** `feat/recurrence`

---

## 🎯 Próximos 3 passos

1. **`provider_billings`** (Fase B) — vencimentos de prestadores `company`
2. **Ajustes finos** — 404, favicon, `AlertDialog`, busca, `postMessage`

---

## Fase 1 — Fundação ✅

- [x] Setup Vite + React + TypeScript
- [x] Tailwind v4
- [x] Cliente Supabase
- [x] `AuthContext`
- [x] `ProtectedRoute`
- [x] Login com Google
- [x] Deploy na Vercel
- [x] `vercel.json` com SPA routing

---

## Fase 2 — Pacientes + Formulário Público ✅

- [x] Hooks `usePatient`, `usePatients`, `useSubmissions`
- [x] `api.ts` autenticado
- [x] `Patients` com filtros e ações
- [x] `InvitePatientModal` com horários
- [x] `PublicForm` com sessões combinadas + 2 checkboxes
- [x] `SubmissionCard` (aprovar/rejeitar)
- [x] Design system completo
- [x] `AppLayout` com `Sidebar` + `Header`
- [x] Migração Tailwind v3 → v4
- [x] CRUD completo de pacientes
- [x] `PatientDetail` + `PatientForm`
- [x] Soft delete + hard delete
- [x] Máscaras (CPF, telefone, CNPJ)
- [x] Normalização de nome (`toTitleCase`)

---

## Fase 3 — Google Calendar + Agenda + Revisão + Dashboard ✅

### Integração + Revisão + Prestadores

- [x] Página `/settings` com Google Calendar
- [x] Bloco "Aguardando revisão" no Dashboard
- [x] Página `/patients/:id/review`
- [x] `displayName` (heurística visual)
- [x] CRUD completo de prestadores
- [x] Filtros em `/providers`
- [x] Máscara e validação de CNPJ
- [x] Item "Prestadores" na sidebar
- [x] `PatientForm` redireciona `prospect` para `/patients/:id/review`
- [x] `usePatients` exclui `prospect` do filtro "all"

### Agenda (3 modos + interações)

- [x] Hooks `useAppointments`, `useAgendaView`
- [x] `agenda-date.ts`, `appointment-colors.ts`, `appointment-layout.ts`,
      `appointment-overlap.ts`
- [x] `TimeColumn`, `DayHeader`, `AppointmentBlock`, `AgendaToolbar`
- [x] `WeekView`, `DayView`, `MonthView`, `MonthDayCell`
- [x] `DayOverviewModal`, `AppointmentDetailModal`, `CreateAppointmentModal`
- [x] `CancelSeriesModal` parametrizado (3 modos)
- [x] Rota `/agenda/:view/:date` com URL canônica
- [x] Item "Agenda" na sidebar
- [x] Tipos `Appointment`, `AppointmentWithRelations`, `AppointmentType`
- [x] Correção de timezone (`isoWeekday`/`jsWeekday`)
- [x] Stacking de ativos (principal 100%, sub-blocos 50%)
- [x] `StackOverviewModal` para `+N` blocos ocultos
- [x] Cancelados como badges por slot (Semana/Dia) / por dia (Mês)
- [x] `SlotCancelledModal` / `DayCancelledModal`
- [x] RPC `reactivate_appointment`
- [x] RPC `delete_cancelled_appointments`
- [x] "Cancelar série" no provider

### Horários recorrentes + bloqueio

- [x] `usePatientSchedules` + `usePatientScheduleSource` (fallback triplo)
- [x] `useProviderSchedules` + `useProviderScheduleSource` (fallback duplo)
- [x] `useOccupiedSlots` (com `excludePatientId` / `excludeProviderId`)
- [x] `ScheduleEditor` com bloqueio visual (âmbar)
- [x] Slot âmbar editável (recalcula conflito automaticamente)
- [x] `+ Adicionar` sugere slot livre
- [x] Conflito externo + interno bloqueia Salvar
- [x] Validação por SOBREPOSIÇÃO DE INTERVALO
- [x] `schedulesEqual` evita regeneração desnecessária
- [x] Bloqueio em `PatientForm`, `PatientReview`, `InvitePatientModal`,
      `ProviderForm`
- [x] Arquivar cancela futuros / Reativar recria
- [x] Reativação com modal (sem schedules → `ReactivateModal`, com conflito
      → `ConflictOnReactivateModal`)
- [x] Botão "Suspender agendamentos" no card de horários

### Prestadores (person + company)

- [x] Tabela `provider_schedules` + RLS
- [x] RPCs `set_provider_schedules`, `cancel_provider_future_appointments`,
      `delete_provider`, `cancel_provider_appointment_series`
- [x] `ProviderForm` com `ScheduleEditor` (só `kind='person'`)
- [x] `ProviderDetail` com todas as ações
- [x] Card vazio "Definir horários"
- [x] Card "Vencimentos" (placeholder)
- [x] Botão "Suspender agendamentos"

### Dark mode

- [x] Hook `useTheme` (light / dark / system)
- [x] `ThemeToggle` no Header
- [x] Script anti-flash no `index.html`
- [x] `@variant dark` no `index.css`
- [x] `--color-brand-950` no `@theme`
- [x] Todas as telas em dark

### Dashboard reformulado

- [x] Cards de resumo
- [x] Hooks `useTodayAppointmentsCount`, `useWeekAppointmentsCount`
- [x] Bloco "Aguardando revisão"
- [x] Bloco "Próximas sessões"
- [x] Bloco "Aniversariantes do mês"
- [x] Removido "Ações rápidas"
- [x] Removido "Complete seu perfil" (→ badge na sidebar)

### Valor da sessão

- [x] Coluna `session_price_cents` em `patients` e `providers`
- [x] Máscara de moeda
- [x] Campo em `PatientForm`, `ProviderForm`, `PatientReview`
- [x] Exibição em `PatientDetail`, `ProviderDetail`
- [x] Coluna "Valor" em `Patients` e `Providers`

---

## Fase 3 estendida — Frequência configurável ⭐

**Contexto:** cobre 6 tipos de recorrência: `once`, `weekly`, `biweekly`,
`monthly`, `every_30_days`, `custom_days`. Antes era sempre semanal.

### Banco (migrations)

- [x] **Migration 1** — colunas `recurrence_type` + `recurrence_days` em
      `patient_schedules` / `provider_schedules`
- [x] **Migration 2** — 4 RPCs novas (5 args) convivendo com antigas
- [x] **Migration 2.6** — coluna `anchor_date` + `compute_next_occurrence`
      corrigido (4 args, `monthly` preserva o dia)
- [x] Recriar `promote_prospect_to_active` com `recurrence_type` / `recurrence_days`
- [ ] **Migration 3** — dropar RPCs antigas (3/4 args)
- [ ] Cleanup do `callRpcWithFallback` no frontend

### Tipos e helpers (frontend)

- [x] `RecurrenceType` em `types/index.ts`
- [x] `ScheduleInput` ganha `recurrenceType?`, `recurrenceDays?`, `anchorDate?`
- [x] `src/lib/recurrence.ts` — `RECURRENCE_OPTIONS`, `getRecurrenceLabel`,
      `getRecurrenceShortLabel`, `validateRecurrence`
- [x] `src/lib/supabase-rpc-fallback.ts` — `callRpcWithFallback`
- [x] `maskDateBR` / `parseDateBR` / `formatDateBR` / `isValidDateBR` em `masks.ts`
- [x] Componente `MaskedDateInput` (máscara + preservação do cursor)

### `ScheduleEditor`

- [x] Campo "Frequência" com select das 6 opções
- [x] Bloco visível só quando `onRecurrenceChange` é passado
- [x] Campo por linha muda conforme frequência (date picker vs select de weekday)
- [x] Conversão automática weekday ⇄ date ao trocar frequência
- [x] `once` bloqueia "+ Adicionar" e lixeira (1 único slot)
- [x] `custom_days` mostra campo "A cada N dias"
- [x] Mostra "cai em: <weekday>" abaixo do date picker
- [x] Validação de data inválida com feedback vermelho

### Hooks

- [x] `usePatientSchedules` lê `recurrence_type` / `recurrence_days` /
      `anchor_date`, expõe `recurrenceType` / `recurrenceDays` no retorno
- [x] `useProviderSchedules` idem
- [x] `usePatientScheduleSource` lê recorrência (camada manual)
- [x] `useProviderScheduleSource` idem

### Forms e Detail

- [x] `PatientForm` — estado local de frequência + `anchorDate` no JSONB +
      RPC via `callRpcWithFallback`
- [x] `ProviderForm` — idem (só `kind='person'`)
- [x] `PatientDetail` — badge de frequência ao lado do título
- [x] `ProviderDetail` — badge de frequência
- [x] `CancelSeriesModal` — passa `p_renew_days: null` pra desambiguar overload
- [x] Hooks de `source` leem `anchor_date`
- [x] `PatientReview` passa `recurrence_type` / `recurrence_days` / `anchorDate`
- [x] Deploy + teste em produção
- [x] Migration 3 (drop RPCs antigas)
- [x] Cleanup do `callRpcWithFallback`
- [x] `MaskedDateInput` com máscara + setas ↑↓ + preservação de cursor

### Fase B — `provider_billings` (próxima rodada)

Ver seção "Fase B — provider_billings" mais abaixo.

---

## Fase B — `provider_billings`

**Contexto:** prestadores `kind='company'` não têm `provider_schedules`.
Têm vencimentos financeiros (mensal, bimestral, semestral, anual).

### Schema

- [ ] Tabela `provider_billings`:
  - `provider_id`, `description`, `amount` (centavos)
  - `due_day` (1–31)
  - `frequency` (`monthly` | `bimonthly` | `semiannual` | `yearly` | `once`)
  - `installments_total`, `installments_paid`
  - `starts_on`, `ends_on`, `status`

### RPCs

- [ ] `set_provider_billings`
- [ ] `mark_billing_as_paid`
- [ ] `cancel_provider_billings` (4 modos: imediato, from_date, suspend, renew)

### Frontend

- [ ] `BillingEditor` no `ProviderForm` (só `kind='company'`)
- [ ] Card "Vencimentos" no `ProviderDetail` (hoje é placeholder)
- [ ] Badge de vencimento no dia da agenda (não ocupa slot)
- [ ] `DayBillingsModal`

### Integração

- [ ] Fase 5 (Financeiro) — gerar `expenses` correspondentes
- [ ] Decidir se `appointments type='due'` migra pra `provider_billings` ou coexiste

---

## Eventos "all-day" (sem horário)

**Contexto:** alguns eventos não têm horário específico — acontecem "durante
o dia" (ex: pagamento de fatura). Hoje `appointments.start_time` é `not null`.

### Banco

- [ ] Permitir `start_time IS NULL` em `appointments`
- [ ] Permitir `duration_min` nulo quando `start_time` é nulo
- [ ] Atualizar constraint `appointments_subject_check` se necessário

### Frontend

- [ ] `ScheduleEditor` / `CreateAppointmentModal`: checkbox "dia inteiro"
- [ ] Quando marcado, esconde campos de horário e duração
- [ ] Agenda: renderiza all-day no topo do dia (fora da grade)
- [ ] Validação de conflito: all-day não conflita com horários específicos

### Onde usar primeiro

- [ ] Vencimentos (`due`, `provider_billings`)
- [ ] Feriados / folgas
- [ ] Eventos pessoais sem hora marcada

---

## Agendamento avulso

**Contexto:** criar 1 appointment fora da série, sem tocar em `*_schedules`.

- [ ] Botão "Novo agendamento" no `PatientDetail`
- [ ] Botão "Novo agendamento" no `ProviderDetail`
- [ ] Modal simples (data + hora + duração)
- [ ] Insere 1 appointment `is_recurring=false`
- [ ] Valida conflito por sobreposição (reusa `appointment-overlap.ts`)

---

## Drag and drop na agenda

**Contexto:** mover/redimensionar/criar appointments com o mouse.

- [ ] Escolher biblioteca (`@dnd-kit/core`)
- [ ] Mover sessão individual
- [ ] Redimensionar duração
- [ ] Mover série inteira (modifier key)
- [ ] Criar por drag (arrastar de slot vazio)
- [ ] Validar conflito antes de aplicar
- [ ] Undo/redo (Ctrl+Z)
- [ ] Touch/mobile
- [ ] UX: ao mover recorrente, pergunta "só este" ou "toda a série"?

---

## Ajustes finos

- [ ] Página 404 customizada
- [ ] Favicon + metadados (adiado com re-branding)
- [ ] Criar `AlertDialog` no design system
- [ ] Trocar `alert()` restantes (`PatientDetail`, `ProviderDetail`)
- [ ] Busca em `/patients` e `/providers` (nome + telefone + CPF)
- [ ] Editar perfil em `/settings`
- [ ] Editar preferências do consultório em `/settings`
- [ ] `postMessage` do OAuth callback (evitar F5)
- [ ] Paginação quando a lista crescer
- [ ] Substituir `MaskedDateInput` por `<input type="date">` quando o browser
      suportar locale BR universalmente (não urgente)

---

## Re-branding (pausado)

- [ ] Nome novo: **PSYDBASE** (slug `psydbase`)
- [ ] Slogan
- [ ] Logo (SVG)
- [ ] Favicon
- [ ] Aplicação: Sidebar, Login, `index.html`, Vercel, GitHub, Google Cloud,
      `package.json`
- [ ] Atualizar `README`, `CONTEXT`, `TODO` (front + back)

---

## Fase 4 — Prontuário + Anamnese + Evolução SOAP

- [ ] Tela `/patients/:id/records`
- [ ] Formulário de anamnese inicial
- [ ] Editor de evolução SOAP + "Atuação do psicólogo"
- [ ] Upload de áudio da sessão
- [ ] Destaque de palavras/sentenças importantes
- [ ] Geração de link compartilhável com expiração
- [ ] Página pública de visualização via hash
- [ ] Invalidação automática após expirar
- [ ] `audit_log` de acesso ao prontuário

---

## Fase 5 — Financeiro + Recibos + Relatórios

- [ ] Lançamento de entradas (por sessão, por pacote)
- [ ] Lançamento de saídas categorizadas
- [ ] Lançamento de gastos específicos (terapia pessoal, supervisão)
- [ ] Integração com `provider_billings`
- [ ] Filtros por período, status, forma de pagamento
- [ ] Alertas de vencimento
- [ ] Dashboard com entradas x saídas
- [ ] Relatórios (pacientes novos, ocupação, faturamento)
- [ ] Download do recibo em PDF (backend)

---

## Fase 6 — Notificações + Calendar escrita + Conformidade

### Convites — captura de e-mail

- [ ] Campo **e-mail obrigatório** no `PublicForm`
- [ ] Checkbox "Receber alerta de sessões na Google Agenda"
  - [ ] Só aparece se o e-mail for Gmail
  - [ ] Sub-opções `5min` / `10min` / `30min` / `1h` antes
- [ ] Checkbox "Receber alerta de vencimento de faturas por e-mail"
  - [ ] Input melhor dia de pagamento
- [ ] Persistir preferências

### Integração Google Calendar (escrita) — backend

- [ ] Ao criar `appointments` → criar evento no Calendar do psicólogo
- [ ] Enviar convite de reunião (Google Meet) para `psicologo + paciente`
- [ ] Respeitar preferência de alerta
- [ ] Envio em cadeia: só a próxima sessão vai para a agenda do paciente
- [ ] Cancelar evento no Google quando appointment for cancelado

### Notificações

- [ ] Lembretes por WhatsApp
- [ ] Lembretes por e-mail
- [ ] Alertas de vencimento de fatura
- [ ] Central de notificações

### Conformidade

- [ ] Política de privacidade
- [ ] Termos de uso
- [ ] Consentimento LGPD no formulário
- [ ] Direito ao esquecimento
- [ ] Preferências de notificação em `/settings`

---

## Transversal — Qualidade

- [ ] Testes unitários (Vitest)
- [ ] Testes de componentes (React Testing Library)
- [ ] Testes E2E (Playwright)
- [ ] CI no GitHub Actions
- [ ] Sentry
- [ ] Acessibilidade
- [ ] PWA (opcional)

---

## Decisões pendentes

- [ ] Aniversariantes de prestadores (precisa `birth_date` em `providers`)
- [ ] Se `appointments` tipo `due` migra para `provider_billings` ou coexiste
- [ ] Provedor de WhatsApp
- [ ] Provedor de e-mail
- [ ] Se o Google Calendar aparece visualmente na agenda ou só leitura

---

## Concluído (registro histórico)

- **Fase 1:** auth Google, deploy Vercel, SPA routing
- **Fase 2:** convite, formulário público, submissões, CRUD de pacientes,
  máscaras, design system
- **Fase 3:** integração Google Calendar (leitura), revisão de provisórios,
  CRUD de prestadores, agenda em 3 modos, horários recorrentes, bloqueio
  rígido por sobreposição, stacking, cancelados como badges, dark mode,
  dashboard reformulado, valor da sessão
- **Fase 3 estendida (parcial):** migrations 1/2/2.6, tipos, `ScheduleEditor`
  dinâmico, `MaskedDateInput`, badges, `callRpcWithFallback`
- **Design system:** Button, Input, Card, Badge, Modal, ConfirmDialog,
  EmptyState, Spinner, MaskedDateInput + Sidebar, Header, AppLayout, ThemeToggle
- **Migração Tailwind v3 → v4**
```

---
