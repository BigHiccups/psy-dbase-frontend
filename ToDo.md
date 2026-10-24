```markdown
# TODO.md — psy-dbase-front

> Tarefas pendentes, organizadas por fase.

**Legenda:** `[ ]` pendente · `[~]` em andamento · `[x]` concluído · `[!]` bloqueado

**URL de produção:** `https://psy-dbase-frontend.vercel.app`
**Branch principal:** `main`
**Branch atual:** `feat/recurrence`

---

## 🎯 Próximos 3 passos

1. **Sprint de Polimento e Mobile (Hotfixes)** — resolver bugs de layout no mobile, vencimentos e revisão de modais de confirmação.
2. **Ajustes Finos** — 404, busca, perfil em `/settings`.
3. **Fase 5 (Financeiro)** — entradas, saídas e recibos.

---

## Sprint de Polimento e Mobile (Hotfixes) 🚨

**Contexto:** Ajustes urgentes de UX/UI e correções de bugs identificados após a entrega do Drag and Drop e Provider Billings.

### 1. Correções na Empresa (Provider Billings)
- [ ] **Falta campo de Mês no Pagamento Anual:** No `BillingEditorModal`, quando a frequência for `yearly`, exibir um campo para o usuário escolher o mês do pagamento (ex: todo mês de Março). O modelo de dados `due_day` precisa ser complementado com um `due_month` (ou calcular a partir do `starts_on`).
- [ ] **Valor não aparece na tabela de Prestadores:** A coluna "Valor" na listagem de prestadores (`Providers.tsx`) está buscando `session_price_cents`, mas empresas agora usam `provider_billings`. Exibir a soma dos vencimentos ou o valor do primeiro vencimento para empresas.
- [ ] **Badge na visão Mês:** O `MonthView` (visão de mês) não está exibindo o badge de vencimentos. Adicionar o cálculo de `billingHappensOnDate` e o ícone/contador no `MonthDayCell`.

### 2. Responsividade e Mobile (Crítico)
- [ ] **Bloquear Drag and Drop no Mobile (Scroll vs Draw):** Ao tentar clicar e arrastar em um slot vazio no celular para criar um agendamento, o navegador está entendendo como scroll/refresh da página. 
  - *Solução:* Adicionar CSS `touch-action: none;` no `DroppableSlot` ou no `ResizeHandle` para que o navegador não roube o gesto de arrasto.
- [ ] **Posicionamento de Botões no Mobile:** No `CreateAppointmentModal` e `ScheduleEditor`, os botões de ação (Salvar, Criar agendamento) estão sendo escondidos pela barra inferior do navegador (Safari/Chrome mobile).
  - *Solução:* Adicionar `pb-safe` (padding-bottom safe-area) ou `max-h-[90vh] overflow-y-auto` nos modais para garantir que os botões fiquem visíveis e roláveis.
- [ ] **Quebra de Layout no `ScheduleEditor`:** No card de horários, o campo de horário, duração e a lixeira estão "estourando" a largura da tela em dispositivos móveis.
  - *Solução:* Empilhar os campos via Flexbox (`flex-col` para telas pequenas, `flex-row` para desktop) ou reduzir as larguras fixas.

### 3. Revisão Global de Modais e Alertas
- [ ] **Criar `AlertDialog` no Design System:** Substituir todos os `alert()` e `confirm()` nativos (que travam a tela no iOS/Android e parecem amadores) pelo novo componente.
- [ ] **Substituir alerts antigos:** Trocar os `alert()` em `PatientDetail.tsx`, `ProviderDetail.tsx` e `ProviderForm.tsx`.
- [ ] **Consistência nos Modais:** Revisar se todos os modais têm a estrutura correta (título, corpo rolável, rodapé fixo com botões) em telas pequenas.

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
- [ ] **Etapa 3 pendente** — hooks de `source` lerem `anchor_date`

### Forms e Detail

- [x] `PatientForm` — estado local de frequência + `anchorDate` no JSONB +
      RPC via `callRpcWithFallback`
- [x] `ProviderForm` — idem (só `kind='person'`)
- [x] `PatientDetail` — badge de frequência ao lado do título
- [x] `ProviderDetail` — badge de frequência
- [x] `CancelSeriesModal` — passa `p_renew_days: null` pra desambiguar overload
- [ ] **Etapa 3 pendente** — `PatientReview` passar `recurrence_type` /
      `recurrence_days` / `anchorDate` pra `promote_prospect_to_active` nova
- [ ] **Etapa 3 pendente** — deploy + teste em produção

### Decisão tomada: empresa não é agendável na agenda

- Prestador `kind='company'` **não aparece** no `CreateAppointmentModal`
- Empresas serão representadas por `provider_billings` (Fase B)
- Aparecem como **badge no dia** da agenda, não como bloco de horário
- Motivo: empresa não tem "sessão com hora", tem "vencimento mensal"


## Agenda Premium ✅ (Concluída)

- [x] Frequência configurável (`weekly`, `monthly`, `custom_days`, etc.) + `anchor_date`
- [x] Refatoração do `CreateAppointmentModal` em sub-componentes
- [x] Cadastro rápido de paciente e prestador direto na agenda
- [x] Bloqueio com 3 modos: range num dia, dia inteiro, vários dias
- [x] Cancelamento e reativação automática de agendamentos afetados por bloqueio
- [x] Drag and Drop: mover blocos
- [x] Drag and Drop: redimensionar com preview em tempo real
- [x] Drag and Drop: criar arrastando de um slot vazio
- [x] **Fase B:** Provider Billings (Vencimentos de empresas)
  - Tabela e RPCs de CRUD
  - `BillingList` no `ProviderForm`
  - Badge na agenda (`DayBillingsBadge`)
  - Modal de visualização (`DayBillingsModal`)
- [x] Pessoa Física com CPF ou CNPJ (para supervisores MEI)
- [x] Máscara de data BR (`MaskedDateInput`) com setas ↑↓

---
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

## Agendamento e Bloqueio pela Agenda (refatoração)

- [x] Refatorar `CreateAppointmentModal` em sub-componentes (`create-appointment/`)
- [x] 3 tipos de agendamento: Sessão, Prestador, Bloqueio
- [x] Cadastro rápido in-loco para pacientes e prestadores
- [x] Prestador filtra apenas `kind='person'` (empresas via `provider_billings`)
- [x] Suporte a "Repetir" (criar série) direto no modal da agenda
- [x] Bloqueio com 3 modos: range num dia, dia inteiro, vários dias
- [x] Contador e lista de agendamentos impactados antes de salvar bloqueio
- [x] Cancelamento automático dos agendamentos sobrepostos pelo bloqueio
- [x] Reativação automática ao remover o bloqueio
- [x] Adicionado campo `notes` para identificar o bloqueio na agenda
---

## Drag and drop na agenda

**Contexto:** mover/redimensionar/criar appointments com o mouse.

## Drag and drop na agenda

- [x] Escolher biblioteca (`@dnd-kit/core`)
- [x] Mover sessão individual
- [x] Redimensionar duração
- [x] Preview visual em tempo real durante o redimensionamento
- [x] Criar por drag (arrastar de slot vazio) — FASE 3
- [x] Validação de bloqueio e cancelados (não arrastáveis)
- [x] Modal de confirmação para mover (`MoveAppointmentModal`)
- [x] Modal de confirmação para redimensionar (`ResizeAppointmentModal`)
- [ ] Mover série inteira (modifier key)
- [ ] Undo/redo (Ctrl+Z)
- [ ] Touch/mobile

---

## Ajustes finos 


- [ ] Página 404 customizada
- [ ] Favicon + metadados (adiado com re-branding)
- [x] Criar `AlertDialog` no design system
- [x] Trocar `alert()` restantes (`PatientDetail`, `ProviderDetail`)
- [ ] Busca em `/patients` e `/providers` (nome + telefone + CPF)
- [ ] Editar perfil em `/settings`
- [ ] Editar preferências do consultório em `/settings`
- [ ] `postMessage` do OAuth callback (evitar F5)
- [ ] Paginação quando a lista crescer
- [ ] Substituir `MaskedDateInput` por `<input type="date">` quando o browser  suportar locale BR universalmente (não urgente)
- [ ] **Sincronização de Cores no Histórico:** Fazer o `useAppointments` mesclar a cor do agendamento com a cor atual do serviço no banco, para que o passado mude de cor sem precisar de UPDATE em massa no SQL.
- [ ] **Multi-Serviços no Mobile:** Refinar a responsividade do componente `ServiceScheduleField` (os inputs de data e hora estavam apertados no celular).
- [ ] **Busca server-side:** Implementar busca em `/patients` e `/providers` (nome + telefone + CPF).


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

- [x] Lançamento de entradas (por sessão)
- [x] Lançamento de saídas categorizadas
- [x] Integração com `provider_billings`
- [x] Filtros por período e status
- [x] Dashboard com entradas x saídas (resumo no topo)
- [ ] Lançamento de gastos específicos (terapia pessoal, supervisão) — *manual via TransactionModal*
- [ ] Alertas de vencimento proativos
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
- **Fase 3 estendida (Agenda Premium):** frequência configurável, drag and drop (mover, redimensionar, criar), bloqueios inteligentes, provider billings, refatorações de modal.
- **Migração Tailwind v3 → v4**
- **Fase 3 estendida (Multi-Serviços e Financeiro):** Refatoração de pacientes/prestadores para múltiplos blocos de serviço (com títulos, cores e valores independentes). Módulo financeiro completo (Regime de Caixa, sugestões, comprovantes). Sincronização de agenda e importação via RPC em lote.
```

---
