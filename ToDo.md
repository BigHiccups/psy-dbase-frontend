# TODO.md — psy-dbase-front

> Tarefas pendentes, organizadas por fase.

**Legenda:** `[ ]` pendente · `[~]` em andamento · `[x]` concluído · `[!]` bloqueado

**URL de produção:** `https://psy-dbase-frontend.vercel.app`

---

## 🎯 Próximos 3 passos

1. **Reativação com modal de conflito** — `PatientDetail.handleReactivate` hoje
   usa `alert()`; criar modal com 3 opções (escolher novo horário / reativar
   sem agendamentos / cancelar)
2. **Investigar reativação que não "descancelou" appointments na agenda** —
   bug reportado em teste; verificar se é cache de dados no cliente ou
   regressão no `set_patient_schedules`
3. **Retomar Bloco 8 (testes)** — modos 8.2 (definitivo a partir de hoje) e 8.3
   (definitivo a partir de uma data) do `CancelSeriesModal`

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
- [x] `PatientDetail`
- [x] `PatientForm` (criar/editar)
- [x] Soft delete (arquivar) + hard delete (excluir)
- [x] Máscaras (CPF, telefone)
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

### ✅ Concluído — Agenda

- [x] Hook `useAppointments` (busca por período com JOIN)
- [x] Hook `useAgendaView` (modo + navegação + persistência em localStorage)
- [x] `src/lib/agenda-date.ts` (helpers)
- [x] `src/lib/appointment-colors.ts`
- [x] `TimeColumn`, `DayHeader`, `AppointmentBlock`, `AgendaToolbar`
- [x] `WeekView` (grade 7 colunas × 15h)
- [x] `DayView` (grade 1 coluna)
- [x] `MonthView` + `MonthDayCell`
- [x] `DayOverviewModal`
- [x] `AppointmentDetailModal`
- [x] `CreateAppointmentModal`
- [x] `CancelSeriesModal` (3 modos)
- [x] `ScheduleEditor`
- [x] Rota `/agenda/:view/:date` com URL canônica
- [x] Item "Agenda" na sidebar
- [x] Tipos `Appointment`, `AppointmentWithRelations`, `AppointmentType`
- [x] Corrigido bug de timezone (WEEKDAY_SHORT/LONG em ordem ISO)

### ✅ Concluído — Horários recorrentes

- [x] Hook `usePatientSchedules`
- [x] `ScheduleEditor` em `PatientReview`
- [x] `ScheduleEditor` em `PatientForm`
- [x] `PatientDetail` exibe horários
- [x] Botão "Suspender agendamentos" em `PatientDetail`
- [x] Arquivar cancela futuros
- [x] Reativar recria a partir de schedules
- [x] Excluir via RPC `delete_patient`

### ✅ Concluído — Bloqueio rígido (frontend)

- [x] Hook `useOccupiedSlots`
- [x] Hook `usePatientScheduleSource` (fallback triplo: manual / invite / google)
- [x] `ScheduleEditor` aceita `disabledSlots` e mostra âmbar
- [x] Botão de remover **sempre habilitado** no slot âmbar (exceto se único)
- [x] Conflito **externo** bloqueia o salvar
- [x] Conflito **interno** (duas linhas do editor) bloqueia o salvar
- [x] `onConflictChange` para travar botão Salvar em `PatientForm`,
      `PatientReview` e `InvitePatientModal`
- [x] `schedulesEqual` para evitar regeneração desnecessária de appointments

### ✅ Concluído — Cancelados na agenda

- [x] `AppointmentBlock` aplica `line-through` + opacidade
- [x] `MonthDayCell` aplica `line-through` + opacidade
- [x] Cancelados aparecem em Dia, Semana e Mês

### ⏳ Pendente — Correções / investigações

- [ ] **Reativação com modal de conflito** — hoje é `alert()`
  - Modal com 3 opções: escolher novo horário / reativar sem agendamentos /
    cancelar
  - Se houver conflito nos `patient_schedules`, o usuário escolhe
- [ ] **Investigar bug**: após arquivar + reativar, appointments permanecem
      cancelados na agenda
  - Verificar se é cache do cliente (`useAppointments`) ou regressão no
    `set_patient_schedules`
  - Considerar adicionar reload em `window focus`
- [ ] **Verificar se `handleReactivate` está deletando `patient_schedules`
      indevidamente**
- [ ] **Retomar Bloco 8 dos testes** — modos 8.2 e 8.3 do `CancelSeriesModal`
- [ ] Trocar `alert()` restantes por `AlertDialog` do design system
- [ ] Criar `AlertDialog` no design system (aviso sem confirmação)

### ⏳ Pendente — Prestadores com horários e vencimentos

**Prestador `kind='person'` (ex: psicólogo particular, supervisor):**
- [ ] Tabela `provider_schedules` (análoga a `patient_schedules`)
- [ ] `ScheduleEditor` no `ProviderForm` (só quando `kind='person'`)
- [ ] Geração de `appointments` tipo `personal` a partir dos schedules
- [ ] Arquivar/reativar provider cancela/recria appointments
- [ ] `useProviderScheduleSource` (análogo ao de paciente)

**Prestador `kind='company'` (ex: curso, plataforma, aluguel):**
- [ ] Tabela `provider_billings` (separada de `appointments`)
  - Campos: `provider_id`, `description`, `amount`, `due_day` (1–31),
    `frequency` (`monthly` / `yearly` / `once`), `starts_on`, `ends_on`,
    `status`
- [ ] Tela em `/providers/:id` para cadastrar vencimentos
- [ ] Marcar vencimento como pago
- [ ] Integração com financeiro (Fase 5)
- [ ] `appointments` tipo `due` — decidir se migra para `provider_billings`
      ou mantém os dois

### ⏳ Pendente — Melhorias na agenda

- [ ] Filtro por paciente
- [ ] Drag-and-drop para remarcar
- [ ] Editar horário/duração de um appointment
- [ ] Marcar como concluído (hoje só leitura)
- [ ] Banner de renovação (quando appointments estão perto do fim)
- [ ] Sincronização visual com Google Calendar

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

---

## Fase 5 — Financeiro + Recibos + Relatórios

- [ ] Lançamento de entradas
- [ ] Lançamento de saídas categorizadas
- [ ] Lançamento de gastos específicos (terapia pessoal etc.)
- [ ] Filtros por período, status, forma de pagamento
- [ ] Alertas de vencimento
- [ ] Suporte a pagamento por sessão e por pacote
- [ ] Dashboard com entradas x saídas
- [ ] Relatórios (pacientes novos, ocupação, faturamento)
- [ ] Download do recibo em PDF

---

## Fase 6 — Notificações + Integração Calendar (escrita) + Conformidade

### Convites — captura de e-mail e preferências

- [ ] Campo **e-mail** obrigatório no formulário público (`PublicForm`)
- [ ] Checkbox **"Receber alerta de sessões na minha Google Agenda"**
  - Só aparece se o e-mail for **Gmail**
  - Ao marcar, abre sub-opções de **quando alertar**: `5min` / `10min` /
    `30min` / `1h` antes
  - Alerta é o **mesmo para todas as sessões** (não por sessão)
- [ ] Checkbox **"Receber alerta de vencimento de faturas por e-mail"**
  - Ao marcar, abre input **melhor dia de pagamento** (dia do mês)
- [ ] Persistir essas preferências (nova tabela `patient_preferences` ou
      colunas em `patients`)

### Integração Google Calendar (escrita) — backend

- [ ] Ao criar `appointments` (via `set_patient_schedules` ou
      `CreateAppointmentModal`), criar evento no Google Calendar do
      **psicólogo**
- [ ] Enviar convite de reunião (Google Meet) para `psicologo + paciente`
      com dia/hora
- [ ] Respeitar a preferência de alerta do paciente (5min/10min/30min/1h)
- [ ] Cron job / evento de conclusão: quando uma sessão termina, enviar a
      **próxima** para o Google Calendar do paciente
  - **Não** enviar as 13 ocorrências de uma vez
  - Envio é **obrigatório** (mesmo se o paciente não aceitar o convite)
- [ ] Cancelar evento no Google quando appointment for cancelado

### Notificações

- [ ] Lembretes por WhatsApp (provedor a definir)
- [ ] Lembretes por e-mail (Resend / SES)
- [ ] Alertas de vencimento de fatura
- [ ] Central de notificações no app

### Conformidade

- [ ] Política de privacidade e termos de uso
- [ ] Fluxo de consentimento LGPD no formulário
- [ ] Direito ao esquecimento (excluir dados do paciente)
- [ ] Preferências de notificação por paciente em `/settings`

---

## Ajustes finos pendentes

- [ ] Página 404 customizada
- [ ] Favicon customizado
- [ ] Metadados (`<title>`, `<meta description>`, Open Graph)
- [ ] Landing page pública (opcional)
- [ ] `postMessage` do OAuth callback para a aba original (evitar F5)
- [ ] Editar perfil em `/settings`
- [ ] Editar preferências do consultório em `/settings`
- [ ] Melhorar busca em `/patients` e `/providers`
- [ ] Paginação quando a lista crescer

---

## Transversal — Qualidade

- [ ] Testes unitários (Vitest)
- [ ] Testes de componentes (React Testing Library)
- [ ] **Testes E2E com Playwright** (fluxos críticos: login, criar paciente,
      agendar, cancelar, arquivar, reativar)
- [ ] CI no GitHub Actions (lint + build)
- [ ] Sentry
- [ ] Acessibilidade (foco, contraste, ARIA)
- [ ] PWA (opcional)

---

## Decisões pendentes

- [ ] Como mesclar paciente provisório com existente (nome + telefone? e-mail?)
- [ ] Se `appointments` tipo `due` migra para `provider_billings` ou coexiste
- [ ] Provedor de WhatsApp (Fase 6)
- [ ] Provedor de e-mail (Fase 6)
- [ ] Se a página `/agenda` mostra vencimentos (`due`) no rodapé ou no cabeçalho
- [ ] Como o paciente aceita/recusa o convite do Google Calendar (afeta o cron
      de envio da "próxima sessão")

---

## Concluído (registro histórico)

- **Fase 1 completa:** auth Google, deploy Vercel, SPA routing
- **Fase 2 completa:** convite, formulário público, submissões, CRUD de
  pacientes, máscaras, design system
- **Fase 3 completa (frontend):** integração Google Calendar (leitura),
  revisão de provisórios, CRUD de prestadores, agenda em 3 modos, horários
  recorrentes, cancelamento de série, bloqueio rígido de conflito, cancelled
  visual em todas as views
- **Design system:** Button, Input, Card, Badge, Modal, ConfirmDialog,
  EmptyState, Spinner + Sidebar, Header, AppLayout
- **Migração Tailwind v3 → v4**
- **Correção de timezone** em WEEKDAY_SHORT/LONG