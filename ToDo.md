# TODO.md — psy-dbase-front

> Tarefas pendentes, organizadas por fase.

**Legenda:** `[ ]` pendente · `[~]` em andamento · `[x]` concluído · `[!]` bloqueado

**URL de produção:** `https://psy-dbase-frontend.vercel.app`
**Branch principal:** `main`

---

## 🎯 Próximos 3 passos

1. **Ajustes finos** — 404 customizada, favicon, metadados, `AlertDialog` no
   lugar dos `alert()` restantes
2. **`provider_billings`** (Fase B) — empresas com vencimentos mensais,
   trimestrais, anuais, com prazo (10 parcelas) e suspensão
3. **Fase 5 — Financeiro** — entradas, saídas, recibos, relatórios

**Ordem geral:** (b) ajustes finos → (a) `provider_billings` → (d) financeiro
→ (e) notificações → (c) prontuário.

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
- [x] Soft delete (arquivar) + hard delete (excluir)
- [x] Máscaras (CPF, telefone, CNPJ)
- [x] Normalização de nome (`toTitleCase`)

---

## Fase 3 — Google Calendar + Agenda + Revisão

### ✅ Concluído — Integração + Revisão + Prestadores

- [x] Página `/settings` com Google Calendar
- [x] Bloco "Aguardando revisão" com `ProspectCard`
- [x] Página `/patients/:id/review`
- [x] `displayName` (heurística visual)
- [x] CRUD completo de prestadores
- [x] Filtros em `/providers`
- [x] Máscara e validação de CNPJ
- [x] Item "Prestadores" na sidebar
- [x] `PatientForm` redireciona `prospect` para `/patients/:id/review`
- [x] `usePatients` exclui `prospect` do filtro "all"

### ✅ Concluído — Agenda (3 modos + interações)

- [x] Hooks `useAppointments`, `useAgendaView`
- [x] `agenda-date.ts`, `appointment-colors.ts`, `appointment-layout.ts`
- [x] `TimeColumn`, `DayHeader`, `AppointmentBlock`, `AgendaToolbar`
- [x] `WeekView`, `DayView`, `MonthView`, `MonthDayCell`
- [x] `DayOverviewModal`, `AppointmentDetailModal`, `CreateAppointmentModal`
- [x] `CancelSeriesModal` (3 modos, parametrizado para paciente/provider)
- [x] Rota `/agenda/:view/:date` com URL canônica
- [x] Item "Agenda" na sidebar
- [x] Tipos `Appointment`, `AppointmentWithRelations`, `AppointmentType`
- [x] Correção de timezone (`isoWeekday`/`jsWeekday`)
- [x] **Stacking de ativos** (principal 100%, sub-blocos 50%)
- [x] `StackOverviewModal` para `+N` blocos ocultos
- [x] **Cancelados como badges por slot** (Semana/Dia) / por dia (Mês)
- [x] `SlotCancelledModal` (cancelados de um horário específico)
- [x] `DayCancelledModal` (cancelados do dia — usado no Mês)
- [x] RPC `reactivate_appointment` (reativa com validação de conflito)
- [x] RPC `delete_cancelled_appointments` (remove em massa)

### ✅ Concluído — Horários recorrentes + bloqueio

- [x] `usePatientSchedules` + `usePatientScheduleSource` (fallback triplo)
- [x] `useProviderSchedules` + `useProviderScheduleSource` (fallback duplo)
- [x] `useOccupiedSlots` (com `excludePatientId` / `excludeProviderId`)
- [x] `ScheduleEditor` com bloqueio visual (âmbar)
- [x] Slot âmbar **editável** (recalcula conflito automaticamente)
- [x] `+ Adicionar` sugere slot livre
- [x] Conflito externo + interno bloqueia Salvar
- [x] `schedulesEqual` evita regeneração desnecessária
- [x] Bloqueio em `PatientForm`, `PatientReview`, `InvitePatientModal`,
      `ProviderForm`
- [x] Arquivar cancela futuros / Reativar recria (paciente e provider)
- [x] Reativação com modal:
  - Sem schedules → `ReactivateModal` (definir / reativar sem agendamentos)
  - Com conflito → `ConflictOnReactivateModal` (novos horários / só os livres)

### ✅ Concluído — Prestadores

- [x] Tabela `provider_schedules` + RLS
- [x] RPC `set_provider_schedules`
- [x] RPC `cancel_provider_future_appointments`
- [x] RPC `delete_provider`
- [x] RPC `cancel_provider_appointment_series` (3 modos)
- [x] `ProviderForm` com `ScheduleEditor` (só `kind='person'`)
- [x] `ProviderDetail` com todas as ações
- [x] `CancelSeriesModal` parametrizado (`subjectType`)
- [x] Modais de reativação parametrizados

---

## Fase 3 estendida — `provider_billings`

**Contexto:** prestadores `kind='company'` (curso, plataforma, aluguel) não
têm sessão semanal — têm **vencimento**. O vencimento **não é um appointment**
(não ocupa slot de horário). É uma entidade separada.

### Modelagem planejada

- [ ] Tabela `provider_billings`:
  - `id`, `user_id`, `provider_id`
  - `description` (ex: "Mensalidade plataforma X")
  - `amount` (valor previsto)
  - `due_day` (1–31)
  - `frequency` (`monthly` / `quarterly` / `semiannual` / `yearly` / `once`)
  - `installments_total` (ex: 10 parcelas — opcional)
  - `installments_paid` (contador)
  - `starts_on`, `ends_on`
  - `status` (`active` / `cancelled` / `completed`)
  - `notes`

### Backend (SQL)

- [ ] Criar tabela + RLS + GRANTs
- [ ] RPC `set_provider_billings(p_provider_id, p_billings jsonb)`
- [ ] RPC `mark_billing_as_paid(p_billing_id)`
- [ ] RPC `cancel_provider_billings(p_provider_id, mode, from, to, renew_installments)`
  - Modos: `immediate` / `from_date` / `suspend` / `renew`
  - **Novo modo `renew`:** estende por mais N parcelas

### Frontend

- [ ] `BillingEditor` (análogo ao `ScheduleEditor`) no `ProviderForm` para
      `kind='company'`
- [ ] Card de vencimentos em `ProviderDetail`
- [ ] Modal `CancelBillingsModal` (4 modos)
- [ ] **Badge de vencimento na agenda:**
  - Canto da célula do dia (Mês) / cabeçalho do dia (Semana/Dia)
  - `$ 10/11` ou apenas `$` + contador
  - Não ocupa slot de horário
- [ ] Modal `DayBillingsModal` (lista de vencimentos do dia)

### Sobre a decisão pendente

`appointments` tipo `due` **existe** hoje no modelo (constraint) mas **não é
usado**. Quando `provider_billings` for implementada, o tipo `due` pode:
- **(a)** Ser removido (migração limpa)
- **(b)** Coexistir (due = vencimento avulso genérico, billings = cobrança
      recorrente de provider)

**Recomendação:** **(b)** por enquanto. Decisão final quando `provider_billings`
estiver pronta.

---

## Ajustes finos (próximo passo)

- [ ] Página 404 customizada
- [ ] Favicon customizado
- [ ] Metadados (`<title>`, `<meta description>`, Open Graph)
- [ ] Landing page pública (opcional)
- [ ] Criar `AlertDialog` no design system
- [ ] Trocar `alert()` do `PatientDetail`, `ProviderDetail` e
      `CancelSeriesModal` por `AlertDialog`
- [ ] `postMessage` do OAuth callback para a aba original (evitar F5)
- [ ] Editar perfil em `/settings`
- [ ] Editar preferências do consultório em `/settings`
- [ ] Melhorar busca em `/patients` e `/providers`
- [ ] Paginação quando a lista crescer

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
- [ ] Integração com `provider_billings` (gera saída ao marcar como pago)
- [ ] Filtros por período, status, forma de pagamento
- [ ] Alertas de vencimento
- [ ] Dashboard com entradas x saídas
- [ ] Relatórios (pacientes novos, ocupação, faturamento)
- [ ] Download do recibo em PDF (backend)

---

## Fase 6 — Notificações + Calendar escrita + Conformidade

### Convites — captura de e-mail e preferências

- [ ] Campo **e-mail obrigatório** no `PublicForm`
- [ ] Checkbox **"Receber alerta de sessões na minha Google Agenda"**
  - Só aparece se o e-mail for **Gmail**
  - Se marcado → sub-opções **`5min` / `10min` / `30min` / `1h` antes**
  - Alerta é **o mesmo para todas as sessões**
- [ ] Checkbox **"Receber alerta de vencimento de faturas por e-mail"**
  - Se marcado → input **melhor dia de pagamento** (dia do mês)
- [ ] Persistir preferências (nova tabela ou colunas em `patients`)

### Integração Google Calendar (escrita) — backend

- [ ] Ao criar `appointments` → criar evento no Calendar do **psicólogo**
- [ ] Enviar convite de reunião (Google Meet) para `psicologo + paciente`
- [ ] Respeitar preferência de alerta (5min/10min/30min/1h)
- [ ] **Envio em cadeia:** só a próxima sessão vai para a agenda do paciente
  - Após o término, a **seguinte** é enviada (cron job / evento de conclusão)
  - **Obrigatório** — acontece mesmo se o paciente não aceitar
- [ ] Cancelar evento no Google quando appointment for cancelado

### Notificações

- [ ] Lembretes por WhatsApp (provedor a definir)
- [ ] Lembretes por e-mail (Resend / SES)
- [ ] Alertas de vencimento de fatura
- [ ] Central de notificações no app

### Conformidade

- [ ] Política de privacidade e termos de uso
- [ ] Fluxo de consentimento LGPD no formulário
- [ ] Direito ao esquecimento
- [ ] Preferências de notificação em `/settings`

---

## Transversal — Qualidade

- [ ] Testes unitários (Vitest)
- [ ] Testes de componentes (React Testing Library)
- [ ] **Testes E2E com Playwright** (fluxos críticos)
- [ ] CI no GitHub Actions (lint + build)
- [ ] Sentry
- [ ] Acessibilidade (foco, contraste, ARIA)
- [ ] PWA (opcional)

---

## Decisões pendentes

- [ ] Se `appointments` tipo `due` migra para `provider_billings` ou coexiste
- [ ] Provedor de WhatsApp
- [ ] Provedor de e-mail
- [ ] Como o paciente aceita/recusa convite do Google Calendar (afeta o cron)

---

## Concluído (registro histórico)

- **Fase 1:** auth Google, deploy Vercel, SPA routing
- **Fase 2:** convite, formulário público, submissões, CRUD de pacientes,
  máscaras, design system
- **Fase 3:** integração Google Calendar (leitura), revisão de provisórios,
  CRUD de prestadores, agenda em 3 modos, horários recorrentes, bloqueio
  rígido, stacking de ativos, cancelados como badges por slot, provider
  schedules com paridade de paciente
- **Design system:** Button, Input, Card, Badge, Modal, ConfirmDialog,
  EmptyState, Spinner + Sidebar, Header, AppLayout
- **Migração Tailwind v3 → v4**