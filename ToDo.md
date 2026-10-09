# TODO.md — psy-dbase-front

> Tarefas pendentes, organizadas por fase.

**Legenda:** `[ ]` pendente · `[~]` em andamento · `[x]` concluído · `[!]` bloqueado

**URL de produção:** `https://psy-dbase-frontend.vercel.app`

---

## 🎯 Próximos 3 passos

1. **Bloqueio rígido no `InvitePatientModal`** — slots ocupados ficam cinza;
   tooltip mostra o paciente/provider que ocupa
2. **Bloqueio no `PatientForm` e `PatientReview`** — mesmo tratamento; o
   `ScheduleEditor` já aceita `disabledSlots`, só falta passar
3. **Ajustes finos** — 404 customizada, favicon, metadados, `AlertDialog` no
   lugar dos `alert()` restantes

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
- [x] `DayOverviewModal` (lista do dia no mês)
- [x] `AppointmentDetailModal` (detalhe + cancelar)
- [x] `CreateAppointmentModal` (sessão avulsa / bloqueio)
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

### ⏳ Pendente — Bloqueio rígido

- [ ] `InvitePatientModal` consulta `appointments` ativos
- [ ] Slots ocupados ficam cinza/desabilitados
- [ ] Tooltip mostrando quem ocupa
- [ ] Aplicar no `PatientForm`
- [ ] Aplicar no `PatientReview`
- [ ] Aplicar no `ScheduleEditor` (prop `disabledSlots` já existe)

### ⏳ Pendente — Vencimentos (`due`)

- [ ] Tela de vencimentos em `/providers/:id`
- [ ] Criação de N parcelas (mensais/anuais)
- [ ] Marcar como pago
- [ ] Renderização de `due` no mês

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

## Fase 6 — Notificações + Conformidade

- [ ] Preferências de notificação por paciente
- [ ] Tela de configurações avançadas
- [ ] Política de privacidade e termos de uso
- [ ] Fluxo de consentimento LGPD no formulário
- [ ] Direito ao esquecimento (excluir dados do paciente)
- [ ] Central de notificações

---

## Ajustes finos pendentes

- [ ] Página 404 customizada
- [ ] Favicon customizado
- [ ] Metadados (`<title>`, `<meta description>`, Open Graph)
- [ ] Landing page pública (opcional)
- [ ] Trocar `alert()` do `PatientDetail` e `ProviderDetail` por `AlertDialog`
- [ ] Criar `AlertDialog` no design system
- [ ] `postMessage` do OAuth callback para a aba original
- [ ] Editar perfil em `/settings`
- [ ] Editar preferências do consultório em `/settings`
- [ ] Melhorar busca em `/patients` e `/providers`
- [ ] Paginação quando a lista crescer

---

## Transversal — Qualidade

- [ ] Testes unitários (Vitest)
- [ ] Testes de componentes (React Testing Library)
- [ ] **Testes E2E com Playwright** (fluxos críticos: login, criar paciente, agendar, cancelar)
- [ ] CI no GitHub Actions (lint + build)
- [ ] Sentry
- [ ] Acessibilidade (foco, contraste, ARIA)
- [ ] PWA (opcional)

---

## Decisões pendentes

- [ ] Como mesclar paciente provisório com existente (nome + telefone? e-mail?)
- [ ] Se o Google Calendar aparece visualmente na agenda ou se é só leitura
- [ ] Se a `/agenda` mostra vencimentos (`due`) no rodapé ou no cabeçalho
- [ ] Se o bloqueio rígido impede ou apenas avisa

---

## Concluído (registro histórico)

- **Fase 1 completa:** auth Google, deploy Vercel, SPA routing
- **Fase 2 completa:** convite, formulário público, submissões, CRUD de pacientes, máscaras, design system
- **Fase 3 completa:** integração Google Calendar, revisão de provisórios, CRUD de prestadores, **agenda em 3 modos**, horários recorrentes, cancelamento de série
- **Design system:** Button, Input, Card, Badge, Modal, ConfirmDialog, EmptyState, Spinner + Sidebar, Header, AppLayout
- **Migração Tailwind v3 → v4**
- **Correção de timezone** em WEEKDAY_SHORT/LONG