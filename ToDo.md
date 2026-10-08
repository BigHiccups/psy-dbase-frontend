# TODO.md — psy-dbase-front

> Tarefas pendentes, organizadas por fase.

**Legenda:** `[ ]` pendente · `[~]` em andamento · `[x]` concluído · `[!]` bloqueado

**URL de produção:** `https://psy-dbase-frontend.vercel.app`

---

## 🎯 Próximos 3 passos

1. **UI de revisão de provisórios** — bloco "Aguardando confirmação" em
   `/patients`, com botões "É paciente novo" / "É paciente existente" / "Não é
   paciente" para resolver os 3 importados do Google
2. **Página `/agenda`** — visualização semanal dos `appointments`, com cores
   por tipo (session/personal/blocked)
3. **Bloqueio rígido no `InvitePatientModal`** — slots ocupados ficam cinza

---

## Fase 1 — Fundação ✅

- [x] Setup Vite + React + TypeScript
- [x] Tailwind v4 com plugin `@tailwindcss/vite`
- [x] Cliente Supabase (`src/lib/supabase.ts`)
- [x] `AuthContext`
- [x] `ProtectedRoute`
- [x] Tela de login com Google (redesenhada)
- [x] Deploy na Vercel
- [x] `vercel.json` com SPA routing

---

## Fase 2 — Pacientes + Formulário Público ✅

- [x] Tipos compartilhados
- [x] `usePatients`, `usePatient`, `useSubmissions`
- [x] Cliente HTTP autenticado (`api.ts`)
- [x] `Patients.tsx` com listagem, filtros e ações
- [x] `InvitePatientModal` com seção de horários
- [x] `PublicForm` com sessões combinadas e dois checkboxes
- [x] `SubmissionCard` com aprovar/rejeitar
- [x] Design system completo
- [x] `AppLayout` com `Sidebar` + `Header`
- [x] Migração Tailwind v3 → v4
- [x] CRUD completo de pacientes
- [x] `PatientDetail`
- [x] `PatientForm` (criar/editar)
- [x] Soft delete (arquivar) + hard delete (excluir)
- [x] Máscaras (CPF, telefone)
- [x] Normalização de nome (`toTitleCase`)
- [x] Validação de CPF e telefone

---

## Fase 3 — Agenda + Google Calendar

### ✅ Concluído — Integração Google (conectar + importar)

- [x] Página `/settings`
- [x] Card "Google Calendar" com status
- [x] Botão "Conectar Google Calendar" (abre nova aba)
- [x] Feedback pós-OAuth (`?google=connected|denied|invalid|error`)
- [x] Botão "Importar agenda"
- [x] Botão "Desconectar" com `ConfirmDialog`
- [x] Rota `/settings` no `App.tsx`
- [x] Item "Configurações" habilitado na `Sidebar`

### ⏳ Pendente — UI de revisão de provisórios

- [ ] Bloco "Aguardando confirmação" em `/patients` (quando há `prospect`)
- [ ] Contador de provisórios
- [ ] Ação "É paciente novo" → abre `PatientForm` para completar e promover
- [ ] Ação "É paciente existente" → busca paciente e mescla
- [ ] Ação "Não é paciente" → abre opção `personal` / `blocked` e remove o
      `patient` provisório
- [ ] Helper `displayName()` em `src/lib/patient-display.ts` (heurística visual)
- [ ] Filtro "Provisórios" na listagem

### ⏳ Pendente — Página `/agenda`

- [ ] Visualização semanal (segunda a domingo)
- [ ] Navegação entre semanas
- [ ] Blocos coloridos por tipo (`session` brand, `personal` cinza, `blocked`
      listrado)
- [ ] Clicar num slot abre detalhe
- [ ] Clique em slot vazio cria sessão avulsa
- [ ] Filtro por paciente
- [ ] Toggle "Mostrar Google Calendar" (sincroniza visualmente)

### ⏳ Pendente — Bloqueio no convite

- [ ] `InvitePatientModal` consulta `appointments` ativos
- [ ] Slots ocupados ficam cinza/desabilitados
- [ ] Mostrar qual paciente ocupa (ou "compromisso pessoal" se for `personal`)
- [ ] Aplicar o mesmo bloqueio no `PatientForm` (criar paciente manual)

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
- [ ] Central de notificações (histórico)

---

## Ajustes finos pendentes

- [ ] Página 404 customizada
- [ ] Favicon customizado (hoje usa o padrão do Vite)
- [ ] Metadados (`<title>`, `<meta description>`, Open Graph)
- [ ] Landing page pública (opcional)
- [ ] Trocar `alert()` do `PatientDetail` por `AlertDialog` do design system
- [ ] Criar `AlertDialog` no design system (aviso sem confirmação)
- [ ] `postMessage` do OAuth callback para a aba original (evitar F5 manual)
- [ ] Editar perfil em `/settings`
- [ ] Editar preferências do consultório em `/settings`

---

## Transversal — Qualidade

- [ ] Testes unitários (Vitest)
- [ ] Testes de componentes (React Testing Library)
- [ ] CI no GitHub Actions (lint + build)
- [ ] Sentry
- [ ] Acessibilidade (foco, contraste, ARIA)
- [ ] PWA (opcional)

---

## Decisões pendentes

- [ ] Como exibir provisórios (bloco dedicado vs. seção separada)
- [ ] Layout da `/agenda` (grade semanal fixa vs. scroll infinito)
- [ ] Como mesclar paciente provisório com existente (nome + telefone? e-mail?)
- [ ] Se o Google Calendar aparece visualmente na agenda ou se é só leitura de
      disponibilidade

---

## Concluído (registro histórico)

- **Fase 1 completa:** auth Google, deploy Vercel, SPA routing
- **Fase 2 completa:** convite, formulário público, submissões, aprovação,
  CRUD de pacientes, máscaras, design system
- **Fase 3 parcial:** página `/settings`, integração Google Calendar (conectar,
  importar, desconectar)
- **Design system:** Button, Input, Card, Badge, Modal, ConfirmDialog,
  EmptyState, Spinner + Sidebar, Header, AppLayout
- **Migração Tailwind v3 → v4**