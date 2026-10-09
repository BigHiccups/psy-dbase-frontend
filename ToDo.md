# TODO.md — psy-dbase-front

> Tarefas pendentes, organizadas por fase.

**Legenda:** `[ ]` pendente · `[~]` em andamento · `[x]` concluído · `[!]` bloqueado

**URL de produção:** `https://psy-dbase-frontend.vercel.app`

---

## 🎯 Próximos 3 passos

1. **Página `/agenda`** — visualização semanal dos `appointments`, com cores
   por tipo (`session` brand, `personal` cinza, `blocked` listrado, `due`
   marcador). É o que dá sentido visual à integração Google.
2. **Bloqueio rígido no `InvitePatientModal`** — slots ocupados ficam cinza;
   tooltip mostra o nome do paciente/provider.
3. **Horários na criação manual de paciente** — `PatientForm` permite definir
   recorrência desde o início (com o mesmo bloqueio).

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

## Fase 3 — Google Calendar + Revisão de Provisórios

### ✅ Concluído — Integração + Revisão + Prestadores

- [x] Página `/settings` com Google Calendar
- [x] Botão "Conectar Google Calendar" (nova aba)
- [x] Feedback pós-OAuth (`?google=connected|denied|invalid|error`)
- [x] Botão "Importar agenda"
- [x] Botão "Desconectar" com `ConfirmDialog`
- [x] Bloco "Aguardando revisão" em `/patients`
- [x] `ProspectCard` com 3 ações
- [x] Página `/patients/:id/review`
- [x] Helper `displayName` em `src/lib/patient-display.ts`
- [x] CRUD completo de prestadores
- [x] `Providers` (listagem com filtros)
- [x] `ProviderDetail` (detalhes + arquivar/reativar/excluir)
- [x] `ProviderForm` (formulário dinâmico por `kind`)
- [x] Máscara e validação de CNPJ (`maskCNPJ`, `isValidCNPJ`)
- [x] Item "Prestadores" na sidebar
- [x] Rotas `/providers`, `/providers/new`, `/providers/:id`,
      `/providers/:id/edit`
- [x] `PatientForm` redireciona `prospect` para `/patients/:id/review`
- [x] `usePatients` exclui `prospect` do filtro "all"

### ⏳ Pendente — Página `/agenda`

- [ ] Visualização semanal (segunda a domingo)
- [ ] Navegação entre semanas
- [ ] Blocos coloridos por tipo (`session` brand, `personal` cinza,
      `blocked` listrado)
- [ ] `due` renderizado como marcador no cabeçalho do dia (sem horário)
- [ ] Clicar num slot abre detalhe
- [ ] Clique em slot vazio cria sessão avulsa
- [ ] Filtro por paciente
- [ ] Toggle "Mostrar Google Calendar" (sincroniza visualmente)
- [ ] Sessões avulsas (`is_recurring=false`)

### ⏳ Pendente — Bloqueio no convite

- [ ] `InvitePatientModal` consulta `appointments` ativos
- [ ] Slots ocupados ficam cinza/desabilitados
- [ ] Mostrar qual paciente/provider ocupa
- [ ] Aplicar o mesmo bloqueio no `PatientForm` (criar paciente manual)
- [ ] Aplicar no `/patients/:id/review` (revisão)

### ⏳ Pendente — Horários no paciente

- [ ] `PatientForm` com seção "Horários das sessões" (recorrência)
- [ ] `PatientReview` com seção "Horários das sessões"
- [ ] Criação de `appointments` recorrentes ao salvar

### ⏳ Pendente — Vencimentos (`due`)

- [ ] Tela de vencimentos em `/providers/:id`
- [ ] Criação de N parcelas (mensais/anuais)
- [ ] Marcar como pago

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
- [ ] CI no GitHub Actions (lint + build)
- [ ] Sentry
- [ ] Acessibilidade (foco, contraste, ARIA)
- [ ] PWA (opcional)

---

## Decisões pendentes

- [ ] Layout da `/agenda` (grade semanal fixa vs. scroll infinito)
- [ ] Como mesclar paciente provisório com existente (nome + telefone? e-mail?)
- [ ] Se o Google Calendar aparece visualmente na agenda ou se é só leitura de
      disponibilidade
- [ ] Se a `/agenda` mostra vencimentos (`due`) no rodapé ou no cabeçalho

---

## Concluído (registro histórico)

- **Fase 1 completa:** auth Google, deploy Vercel, SPA routing
- **Fase 2 completa:** convite, formulário público, submissões, CRUD de pacientes,
  máscaras, design system
- **Fase 3 parcial:** `/settings`, integração Google Calendar (conectar,
  importar, desconectar), bloco de revisão de provisórios, CRUD de prestadores
- **Design system:** Button, Input, Card, Badge, Modal, ConfirmDialog,
  EmptyState, Spinner + Sidebar, Header, AppLayout
- **Migração Tailwind v3 → v4**