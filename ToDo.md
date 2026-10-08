# TODO.md — psy-dbase-front

> Tarefas pendentes, organizadas por fase. Espelha a estrutura do `TODO.md` do
> backend `psy-dbase`.

**Legenda:** `[ ]` pendente · `[~]` em andamento · `[x]` concluído · `[!]` bloqueado

**Branches ativas:**
- Frontend: `main`
- Backend: `main`

**URL de produção:** `https://psy-dbase-frontend.vercel.app`

---

## 🎯 Próximos 3 passos

Ordem sugerida para a próxima sessão de trabalho:

1. **Polimento visual** — redesenhar `Login`, `Dashboard` e `PublicForm` com o
   design system (a `Patients` já está pronta como referência)
2. **Ajustar `InvitePatientModal`** — substituir inputs crus pelos componentes
   `ui/Input` e `ui/Button`
3. **Tela de detalhes do paciente** (`/patients/:id`) — dados cadastrais +
   placeholder para prontuário

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
- [x] `vercel.json` com SPA routing

---

## Fase 2 — Pacientes + Formulário Público ✅

### Concluído

- [x] Tipos compartilhados (`Patient`, `InviteResponse`, `ScheduleInput`, `InviteCheck`)
- [x] Hook `usePatients`
- [x] Hook `useSubmissions`
- [x] Cliente HTTP autenticado (`src/lib/api.ts`)
- [x] Página `Patients` com listagem
- [x] `InvitePatientModal` com seção de horários (múltiplos dias, hora, duração)
- [x] Validação de horários no frontend (pelo menos 1)
- [x] Abertura do `whatsappUrl` em nova aba após gerar convite
- [x] Página `PublicForm` com validação de token via RPC
- [x] Bloco "Sessões combinadas" em modo leitura
- [x] Checkbox do termo de confidencialidade
- [x] Checkbox da orientação sobre o local
- [x] Rota pública `/form/:token` fora do `ProtectedRoute`
- [x] `SubmissionCard` com aprovar/rejeitar
- [x] Seção "Submissões pendentes" em `/patients`
- [x] Design system (`Button`, `Input`, `Card`, `Badge`, `Modal`, `EmptyState`, `Spinner`)
- [x] Layout autenticado (`Sidebar`, `Header`, `AppLayout`)
- [x] Migração Tailwind v3 → v4
- [x] Fonte Inter via `<link>` no `index.html`

### Pendente — polimento visual

- [ ] Redesenhar `Login.tsx` com o design system
- [ ] Redesenhar `Dashboard.tsx` com o design system
- [ ] Redesenhar `PublicForm.tsx` com o design system
- [ ] Substituir inputs crus do `InvitePatientModal` pelos componentes `ui/`
- [ ] Substituir o `<button>` cru do modal pelo `Button` do design system
- [ ] Padronizar loading states com `Spinner`
- [ ] Padronizar empty states com `EmptyState`

### Pendente — funcionalidade

- [ ] Tela de detalhes do paciente (`/patients/:id`)
  - [ ] Dados cadastrais
  - [ ] Histórico de submissões
  - [ ] Placeholder para evoluções (Fase 4)
  - [ ] Botão de editar dados do paciente
  - [ ] Botão de mudar status (ativo / inativo / alta)
- [ ] Editar paciente (modal ou página)
- [ ] Excluir paciente (soft delete via `status='discharged'`)
- [ ] Filtros e busca em `/patients`
- [ ] Paginação em `/patients` (quando crescer)

---

## Fase 3 — Agenda + Google Calendar + Meet

### Frontend

- [ ] Página `/agenda` com visualização mensal
- [ ] Visualização semanal
- [ ] Modal de criação/edição de sessão
- [ ] Exibição do link do Meet na sessão
- [ ] Configuração de duração padrão (`/settings`)
- [ ] Configuração de política de remarcação (`/settings`)
- [ ] Configuração de multa por falta (`/settings`)
- [ ] Geração de eventos recorrentes a partir dos `schedules` do convite
- [ ] Botão "Conectar Google Calendar" (`/settings`)

### Backend (registrado no TODO do backend)

- [ ] OAuth do Google
- [ ] Criação de evento no Calendar com `conferenceData` (Meet)
- [ ] Sincronização de cancelamento/remarcação

---

## Fase 4 — Prontuário + Anamnese + Evolução SOAP

### Frontend

- [ ] Tela de prontuário do paciente (`/patients/:id/records`)
- [ ] Formulário de anamnese inicial
- [ ] Editor de evolução SOAP + campo "Atuação do psicólogo"
- [ ] Upload de áudio da sessão
- [ ] Destaque de palavras/sentenças importantes
- [ ] Geração de link compartilhável com expiração
- [ ] Página pública de visualização via hash
- [ ] Invalidação automática após expirar

### Banco (a rodar manualmente no Supabase)

- [ ] `anamnesis`
- [ ] `sessions`
- [ ] `evolutions`
- [ ] `evolution_audio`
- [ ] `evolution_keywords`
- [ ] `share_links`
- [ ] `audit_log`

---

## Fase 5 — Financeiro + Recibos + Relatórios

### Frontend

- [ ] Lançamento de entradas (tabela completa conforme RF04)
- [ ] Lançamento de saídas categorizadas
- [ ] Lançamento de gastos específicos (terapia pessoal etc.)
- [ ] Filtros por período, status, forma de pagamento
- [ ] Alertas de vencimento
- [ ] Suporte a pagamento por sessão e por pacote
- [ ] Dashboard com entradas x saídas
- [ ] Relatório de pacientes novos
- [ ] Relatório de ocupação da agenda
- [ ] Download do recibo em PDF (chama backend)

### Banco

- [ ] `incomes`
- [ ] `expenses`
- [ ] `expense_categories`
- [ ] `session_payments`
- [ ] `personal_therapy`
- [ ] `receipts`

---

## Fase 6 — Notificações + Conformidade

- [ ] Preferências de notificação por paciente
- [ ] Tela de configurações (`/settings`)
- [ ] Política de privacidade e termos de uso
- [ ] Fluxo de consentimento LGPD no formulário
- [ ] Direito ao esquecimento (excluir dados do paciente)
- [ ] Central de notificações (histórico de lembretes enviados)

---

## Transversal — Qualidade

- [ ] Testes unitários (Vitest)
- [ ] Testes de componentes (React Testing Library)
- [ ] CI no GitHub Actions (lint + build)
- [ ] Monitoramento de erros no frontend (Sentry)
- [ ] Acessibilidade (foco, contraste, ARIA)
- [ ] Responsividade testada em mobile real
- [ ] PWA (opcional, para o psicólogo acessar pelo celular)

---

## Decisões pendentes

- [ ] Provedor de e-mail (Resend / SES) — afeta apenas backend
- [ ] Provedor de WhatsApp (Cloud API vs. intermediário) — afeta apenas backend
- [ ] Provedor de transcrição de áudio — afeta apenas backend
- [ ] Layout do recibo em PDF — afeta backend + talvez preview no front
- [ ] Quando versionar migrations SQL (hoje são rodadas manualmente no SQL Editor)

---

## Concluído (registro histórico)

- **Fase 1 completa:** auth Google, `profiles` com trigger, RLS, deploy Vercel,
  SPA routing via `vercel.json`
- **Fase 2 completa:** convite com horários via backend, TinyURL oficial,
  `wa.me`, formulário público com sessões combinadas e dois checkboxes,
  submissões pendentes com aprovar/rejeitar
- **Design system:** `Button`, `Input`, `Card`, `Badge`, `Modal`, `EmptyState`,
  `Spinner` + `Sidebar`, `Header`, `AppLayout`
- **Migração Tailwind v3 → v4** com plugin Vite
- **Env vars** configuradas no painel da Vercel (Production)