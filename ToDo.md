# TODO.md — psy-dbase-front

> Tarefas pendentes, organizadas por fase.

**Legenda:** `[ ]` pendente · `[~]` em andamento · `[x]` concluído · `[!]` bloqueado

**URL de produção:** `https://psy-dbase-frontend.vercel.app`
**Branch principal:** `main`

---

## 🎯 Próximos 3 passos

1. **Frequência configurável** — adicionar `recurrence_type` + `recurrence_days`
   em `patient_schedules` / `provider_schedules` e refletir no `ScheduleEditor`
2. **`provider_billings`** (Fase B) — vencimentos de prestadores `company`
   (mensal / bimestral / semestral / anual)
3. **Ajustes finos** — 404, favicon, metadados, `AlertDialog`, busca,
   perfil/preferências em `/settings`, `postMessage` do OAuth

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
- [x] Bloco "Aguardando revisão" **no Dashboard** (movido de `/patients`)
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
- [x] **Stacking de ativos** (principal 100%, sub-blocos 50%)
- [x] `StackOverviewModal` para `+N` blocos ocultos
- [x] **Cancelados como badges por slot** (Semana/Dia) / por dia (Mês)
- [x] `SlotCancelledModal` / `DayCancelledModal`
- [x] RPC `reactivate_appointment` (reativa com validação de conflito)
- [x] RPC `delete_cancelled_appointments` (remove em massa)
- [x] **"Cancelar série" no provider** (era só paciente)

### Horários recorrentes + bloqueio

- [x] `usePatientSchedules` + `usePatientScheduleSource` (fallback triplo)
- [x] `useProviderSchedules` + `useProviderScheduleSource` (fallback duplo)
- [x] `useOccupiedSlots` (com `excludePatientId` / `excludeProviderId`)
- [x] `ScheduleEditor` com bloqueio visual (âmbar)
- [x] Slot âmbar **editável** (recalcula conflito automaticamente)
- [x] `+ Adicionar` sugere slot livre
- [x] Conflito externo + interno bloqueia Salvar
- [x] **Validação por SOBREPOSIÇÃO DE INTERVALO** (não igualdade)
- [x] `schedulesEqual` evita regeneração desnecessária
- [x] Bloqueio em `PatientForm`, `PatientReview`, `InvitePatientModal`,
      `ProviderForm`
- [x] Arquivar cancela futuros / Reativar recria (paciente e provider)
- [x] Reativação com modal:
  - Sem schedules → `ReactivateModal`
  - Com conflito → `ConflictOnReactivateModal`
- [x] Botão "Suspender agendamentos" reposicionado no card de horários

### Prestadores (person + company)

- [x] Tabela `provider_schedules` + RLS
- [x] RPCs `set_provider_schedules`, `cancel_provider_future_appointments`,
      `delete_provider`, `cancel_provider_appointment_series`
- [x] `ProviderForm` com `ScheduleEditor` (só `kind='person'`)
- [x] `ProviderDetail` com todas as ações
- [x] Card vazio "Definir horários" quando não há schedules
- [x] Card "Vencimentos" (placeholder) para `company`
- [x] Botão "Suspender agendamentos" no Provider

### Dark mode

- [x] Hook `useTheme` (light / dark / system)
- [x] `ThemeToggle` no Header
- [x] Script anti-flash no `index.html`
- [x] `@variant dark` no `index.css`
- [x] `--color-brand-950` no `@theme`
- [x] Todas as telas e componentes em dark

### Dashboard reformulado

- [x] Cards de resumo: Pacientes ativos, Submissões pendentes,
      **Sessões hoje**, **Sessões esta semana**
- [x] Hooks `useTodayAppointmentsCount`, `useWeekAppointmentsCount`
- [x] Bloco "Aguardando revisão" (colapsável + scroll)
- [x] Bloco "Próximas sessões" (colapsável, hoje + 7 dias)
  - [x] Filtra horários já passados
  - [x] Recarrega a cada 5 min + window focus
  - [x] Clicar no item → `/agenda/day/<data>`
- [x] Bloco "Aniversariantes do mês" (pacientes)
- [x] Removido "Ações rápidas"
- [x] Removido "Complete seu perfil" → virou badge na sidebar

### Valor da sessão

- [x] Coluna `session_price_cents` em `patients` e `providers`
- [x] Máscara de moeda (`maskCurrencyBRL`, `parseCurrencyToCents`,
      `centsToCurrencyBRL`)
- [x] Campo em `PatientForm`, `ProviderForm`, `PatientReview`
- [x] Exibição em `PatientDetail`, `ProviderDetail`
- [x] Coluna "Valor" em `Patients` e `Providers`

---

## Fase 3 estendida — Frequência configurável

**Contexto:** hoje a recorrência é **sempre semanal** (`a cada 7 dias`).
Precisamos cobrir: avulso, 15 em 15, mensal, a cada N dias.

### Schema

- [ ] Adicionar em `patient_schedules`:
  - `recurrence_type` (`once` | `weekly` | `biweekly` | `monthly` | `every_30_days` | `custom_days`)
  - `recurrence_days` (int, só para `custom_days`)
- [ ] Adicionar em `provider_schedules`: mesma coisa

### RPCs

- [ ] Atualizar `set_patient_schedules` para respeitar `recurrence_type`
- [ ] Atualizar `set_provider_schedules` idem
- [ ] Atualizar `cancel_*_appointment_series` para respeitar `recurrence_type`
- [ ] Validação no banco: `recurrence_days` obrigatório se `custom_days`

### Frontend

- [ ] `ScheduleEditor` ganha campo **"Frequência"** acima da lista
- [ ] Select com as 6 opções
- [ ] Se `custom_days`, mostra input numérico
- [ ] Atualizar tipos (`ScheduleInput` ganha `recurrenceType` + `recurrenceDays`)
- [ ] `usePatientScheduleSource` / `useProviderScheduleSource` leem a frequência
- [ ] Envio nos forms

### Fase B — `provider_billings`

- [ ] Tabela `provider_billings`:
  - `provider_id`, `description`, `amount`
  - `due_day` (1–31)
  - `frequency` (`monthly` | `bimonthly` | `semiannual` | `yearly` | `once`)
  - `installments_total`, `installments_paid`
  - `starts_on`, `ends_on`, `status`
- [ ] RPC `set_provider_billings`
- [ ] RPC `mark_billing_as_paid`
- [ ] RPC `cancel_provider_billings` (4 modos, incluindo **renovar**)
- [ ] `BillingEditor` no `ProviderForm` para `company`
- [ ] Card de vencimentos em `ProviderDetail`
- [ ] **Badge de vencimento** no dia da agenda (não ocupa slot)
- [ ] Modal `DayBillingsModal`
- [ ] Integração com financeiro (Fase 5)

---

## Ajustes finos (próximo passo)

- [ ] Página 404 customizada
- [ ] Favicon + metadados (adiado com re-branding)
- [ ] Criar `AlertDialog` no design system
- [ ] Trocar `alert()` restantes (`PatientDetail`, `ProviderDetail`) por
      `AlertDialog`
- [ ] Busca em `/patients` e `/providers` (nome + telefone + CPF)
- [ ] Editar perfil em `/settings`
- [ ] Editar preferências do consultório em `/settings`
- [ ] `postMessage` do OAuth callback para a aba original (evitar F5)
- [ ] Paginação quando a lista crescer

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
  - [ ] Só aparece se o e-mail for **Gmail**
  - [ ] Sub-opções `5min` / `10min` / `30min` / `1h` antes
- [ ] Checkbox "Receber alerta de vencimento de faturas por e-mail"
  - [ ] Input **melhor dia de pagamento** (dia do mês)
- [ ] Persistir preferências

### Integração Google Calendar (escrita) — backend

- [ ] Ao criar `appointments` → criar evento no Calendar do psicólogo
- [ ] Enviar convite de reunião (Google Meet) para `psicologo + paciente`
- [ ] Respeitar preferência de alerta
- [ ] **Envio em cadeia:** só a próxima sessão vai para a agenda do paciente
  - [ ] Após o término, a próxima é enviada (cron / evento)
  - [ ] Obrigatório — mesmo se o paciente não aceitar
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
- [ ] **Testes E2E (Playwright)** — fluxos críticos
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
- **Design system:** Button, Input, Card, Badge, Modal, ConfirmDialog,
  EmptyState, Spinner + Sidebar, Header, AppLayout, ThemeToggle
- **Migração Tailwind v3 → v4**