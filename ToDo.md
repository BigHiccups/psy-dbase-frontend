# TODO.md — psy-dbase-front

> Tarefas pendentes, organizadas por fase. Espelha a estrutura do `TODO.md` do
> backend `psy-dbase`.

**Legenda:** `[ ]` pendente · `[~]` em andamento · `[x]` concluído · `[!]` bloqueado

**Branches ativas:**
- Frontend: `feat/design-imp`
- Backend: `feature/form-creation`

---

## 🎯 Próximos 3 passos

Ordem sugerida para a próxima sessão de trabalho:

1. **Tela de submissões pendentes** — listar `patient_form_submissions` com
   `status='pending'` e botão "Aprovar" que chama a RPC `approve_submission`
2. **Captura de horários no convite** — adicionar seção "Horários das sessões"
   no `InvitePatientModal` (obrigatório), salvar em `patient_invite_schedules`
   via backend, exibir em modo leitura no `PublicForm`
3. **Checkbox de orientação sobre o local** no `PublicForm` (mesmo padrão do
   termo de confidencialidade)

---

## Fase 1 — Fundação ✅

- [x] Setup Vite + React + TypeScript
- [x] Tailwind v4 com plugin `@tailwindcss/vite`
- [x] ESLint + Prettier
- [x] Cliente Supabase (`src/lib/supabase.ts`)
- [x] Contexto de autenticação (`AuthContext`)
- [x] Rota protegida (`ProtectedRoute`)
- [x] Tela de login com Google
- [x] Deploy na Vercel com variáveis de ambiente
- [x] Redirecionamento pós-login para `/dashboard`

---

## Fase 2 — Pacientes + Formulário Público

### Concluído

- [x] Tipos compartilhados (`Patient`, `InviteResponse`)
- [x] Hook `usePatients`
- [x] Cliente HTTP autenticado (`src/lib/api.ts`)
- [x] Página `Patients` com listagem
- [x] `InvitePatientModal` (nome + telefone → chama `POST /invites`)
- [x] Abertura do `whatsappUrl` em nova aba após gerar convite
- [x] Página `PublicForm` com validação de token via RPC
- [x] Checkbox do termo de confidencialidade
- [x] Rota pública `/form/:token` fora do `ProtectedRoute`

### Pendente — funcionalidade

- [ ] **Tela de submissões pendentes** em `/patients/submissions` ou seção na
      própria `Patients`
  - [ ] Listar submissões com `status='pending'`
  - [ ] Mostrar nome, telefone, data de envio
  - [ ] Botão "Ver detalhes" (modal)
  - [ ] Botão "Aprovar" → chama RPC `approve_submission`
  - [ ] Botão "Rejeitar" → `update status='rejected'`
  - [ ] Atualizar lista após aprovação (`reload`)
- [ ] **Captura de horários no convite** (regra de negócio: obrigatório)
  - [ ] Nova tabela `patient_invite_schedules` (SQL no backend/README)
  - [ ] Backend aceita `schedules: [{ weekday, startTime, durationMin }]`
  - [ ] Modal adiciona seção "Horários das sessões"
  - [ ] Botão "+ Adicionar horário" (select de dia + input de hora + duração)
  - [ ] Validação: pelo menos 1 horário obrigatório
  - [ ] Duração default 50 min (herda de `profiles.default_session_duration_minutes`)
  - [ ] Formulário público exibe os horários em modo **leitura**
- [ ] **Orientação sobre o local no formulário**
  - [ ] Bloco informativo: "ambiente tranquilo, silencioso e privado"
  - [ ] Checkbox adicional de confirmação
- [ ] **Tela de detalhes do paciente** (`/patients/:id`)
  - [ ] Dados cadastrais
  - [ ] Histórico de submissões
  - [ ] Placeholder para evoluções (Fase 4)

### Pendente — UI / design system

- [ ] Redesenhar `Login.tsx` com o design system
- [ ] Redesenhar `Dashboard.tsx` com o design system
- [ ] Redesenhar `Patients.tsx` com o design system
- [ ] Redesenhar `PublicForm.tsx` com o design system
- [ ] Substituir inputs crus do `InvitePatientModal` pelos componentes `ui/`
- [ ] Substituir o `<button>` cru do modal pelo `Button` do design system
- [ ] Loading states com `Spinner`
- [ ] Empty states com `EmptyState`

---

## Fase 3 — Agenda + Google Calendar + Meet

### Banco (migrations a rodar no Supabase)

- [ ] Tabela `appointments`
- [ ] Tabela `appointment_attendees` (N participantes por atendimento)
- [ ] Policies RLS + GRANT para `authenticated`
- [ ] GRANT para `service_role` (backend vai criar eventos)

### Frontend

- [ ] Página `/agenda` com visualização mensal
- [ ] Visualização semanal
- [ ] Modal de criação/edição de sessão
- [ ] Configuração de duração padrão na tela de configurações
- [ ] Configuração de política de remarcação
- [ ] Configuração de multa por falta
- [ ] Exibição do link do Meet na sessão
- [ ] Geração de eventos recorrentes a partir dos horários combinados no convite

### Backend (registrar no TODO do backend)

- [ ] OAuth do Google para o psicólogo
- [ ] Criação de evento no Calendar com `conferenceData` (Meet)
- [ ] Convite opcional para a agenda do paciente
- [ ] Suporte a N participantes
- [ ] Sincronização de cancelamento/remarcação

---

## Fase 4 — Prontuário + Anamnese + Evolução SOAP

### Banco

- [ ] Tabela `anamnesis`
- [ ] Tabela `sessions`
- [ ] Tabela `evolutions` (S, O, A, P + Atuação do psicólogo)
- [ ] Tabela `evolution_audio`
- [ ] Tabela `evolution_keywords`
- [ ] Tabela `share_links` (hash expirável)
- [ ] Tabela `audit_log`

### Frontend

- [ ] Tela de prontuário do paciente (`/patients/:id/records`)
- [ ] Formulário de anamnese inicial
- [ ] Editor de evolução SOAP + campo "Atuação do psicólogo"
- [ ] Upload de áudio da sessão
- [ ] Destaque de palavras/sentenças importantes
- [ ] Geração de link compartilhável com expiração
- [ ] Página pública de visualização via hash
- [ ] Invalidação automática após expirar

---

## Fase 5 — Financeiro + Recibos + Relatórios

### Banco

- [ ] `incomes`
- [ ] `expenses`
- [ ] `expense_categories`
- [ ] `session_payments`
- [ ] `personal_therapy` (gastos do psicólogo como paciente)
- [ ] `receipts`

### Frontend

- [ ] Lançamento de entradas (tabela completa conforme RF04)
- [ ] Lançamento de saídas categorizadas
- [ ] Lançamento de gastos específicos
- [ ] Filtros por período, status, forma de pagamento
- [ ] Alertas de vencimento
- [ ] Suporte a pagamento por sessão e por pacote
- [ ] Dashboard com entradas x saídas
- [ ] Relatório de pacientes novos
- [ ] Relatório de ocupação da agenda
- [ ] Download do recibo em PDF (chama backend)

---

## Fase 6 — Notificações + Conformidade

- [ ] Preferências de notificação por paciente
- [ ] Tela de configurações (`/settings`)
- [ ] Política de privacidade e termos de uso
- [ ] Fluxo de consentimento LGPD no formulário
- [ ] Direito ao esquecimento (excluir dados do paciente)

---

## Transversal — Qualidade

- [ ] Testes unitários (Vitest)
- [ ] Testes de componentes (React Testing Library)
- [ ] CI no GitHub Actions (lint + build)
- [ ] Monitoramento de erros no frontend (Sentry)
- [ ] Acessibilidade (foco, contraste, ARIA)
- [ ] Responsividade testada em mobile real

---

## Decisões pendentes

- [ ] Provedor de e-mail (Resend / SES) — afeta apenas backend
- [ ] Provedor de WhatsApp (Cloud API vs. intermediário) — afeta apenas backend
- [ ] Provedor de transcrição de áudio — afeta apenas backend
- [ ] Layout do recibo em PDF — afeta backend + talvez preview no front
- [ ] Host do backend Node (Render / Railway / Fly.io)
- [ ] Quando versionar migrations SQL (hoje são rodadas manualmente no SQL Editor)

---

## Concluído (registro histórico)

- **Fase 1 completa:** auth Google, `profiles` com trigger, RLS, deploy Vercel
- **Fase 2 parcial:** convite via backend, encurtamento TinyURL, `wa.me`,
  formulário público com token, submissão `pending`
- **Design system:** `Button`, `Input`, `Card`, `Badge`, `Modal`, `EmptyState`,
  `Spinner` + `Sidebar`, `Header`, `AppLayout`
- **Migração Tailwind v3 → v4** com plugin Vite