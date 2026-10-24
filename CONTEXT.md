Com certeza! O `CONTEXT.md` do frontend que você me enviou estava focado na Fase 3 (quando tínhamos apenas o ScheduleEditor básico e estávamos começando o provider_billings). 

Com as nossas últimas implementações, o frontend deu um salto gigante: criamos o **Módulo Financeiro completo**, refatoramos todos os formulários para a arquitetura **Multi-Serviços**, implementamos as **cores na agenda** e adicionamos o **AlertDialog**.

Aqui está o **`CONTEXT.md` do Frontend (psy-dbase-front) totalmente reescrito e detalhado**, mantendo a densidade e o histórico das decisões.

*(Copie o bloco abaixo e substitua o conteúdo do seu arquivo).*

---

```markdown
# CONTEXT.md — psy-dbase-front

> **Leia isto antes de tocar no código.**
> Este documento é a fonte de verdade para qualquer IA ou dev que entre no projeto.
> Ele registra **decisões já tomadas** para evitar retrabalho e perguntas repetidas.

---

## 1. O que é este projeto

Interface web do **psy-dbase**, sistema de gestão para psicólogo autônomo.

Cobre cadastro de pacientes via formulário público, CRUD completo de pacientes e prestadores, revisão de provisórios importados do Google, **agenda em dia/semana/mês com arrastar-e-soltar e cores customizadas**, **módulo financeiro com fluxo de caixa e aprovação de receitas/despesas**, e **arquitetura multi-serviços** (um paciente ou prestador pode ter múltiplos horários e valores). 

**Repositório irmão:** `psy-dbase` (backend Node + integrações).
**Status:** em produção na Vercel — `https://psy-dbase-frontend.vercel.app`

---

## 2. Stack e versões

| Camada        | Tecnologia                                              | Versão |
|---------------|---------------------------------------------------------|--------|
| Build         | Vite                                                    | 7.x    |
| UI            | React                                                   | 19.x   |
| Tipagem       | TypeScript                                              | 5.9.x  |
| Estilo        | **Tailwind CSS v4** (plugin `@tailwindcss/vite`)        | 4.3.x  |
| Roteamento    | React Router                                            | 7.x    |
| Ícones        | lucide-react                                            | —      |
| Drag and Drop | **@dnd-kit/core**                                       | 6.x    |
| Auth          | Supabase Auth (Google OAuth)                            | —      |
| Dados         | `@supabase/supabase-js`                                 | 2.x    |
| HTTP          | fetch nativo (via `src/lib/api.ts`)                     | —      |
| Gerenciador   | npm                                                     | —      |
| Deploy        | Vercel                                                  | —      |

---

## 3. Estrutura de pastas (resumo das principais)

```text
src/
├── components/
│   ├── agenda/
│   │   ├── AgendaToolbar.tsx
│   │   ├── AppointmentBlock.tsx
│   │   ├── AppointmentDetailModal.tsx
│   │   ├── CancelSeriesModal.tsx
│   │   ├── CreateAppointmentModal.tsx
│   │   ├── create-appointment/          # Sub-componentes do modal
│   │   ├── DayBillingsBadge.tsx         # Badge de vencimentos
│   │   ├── DayBillingsModal.tsx         # Modal de vencimentos
│   │   ├── DayCancelledModal.tsx
│   │   ├── DayHeader.tsx
│   │   ├── DayOverviewModal.tsx
│   │   ├── DayView.tsx
│   │   ├── dnd/                         # Drag and drop
│   │   ├── MonthDayCell.tsx
│   │   ├── MonthView.tsx
│   │   ├── MoveAppointmentModal.tsx
│   │   ├── ResizeAppointmentModal.tsx
│   │   ├── ResizeHandle.tsx
│   │   ├── ScheduleEditor.tsx           # Legado (usado no PatientReview)
│   │   ├── ServiceScheduleField.tsx     # NOVO: Bloco Multi-Serviço (Cor, Data, Frequência)
│   │   ├── SlotCancelledModal.tsx
│   │   ├── StackOverviewModal.tsx
│   │   ├── TimeColumn.tsx
│   │   └── WeekView.tsx
│   ├── layout/                          # Sidebar, Header, AppLayout, ThemeToggle
│   ├── ui/                              # Design system
│   │   ├── Button.tsx, Input.tsx, MaskedDateInput.tsx, Card.tsx, Badge.tsx
│   │   ├── Modal.tsx, ConfirmDialog.tsx, AlertDialog.tsx, EmptyState.tsx, Spinner.tsx
│   ├── BillingEditorModal.tsx           # Modal simplificado de criar/editar serviço
│   ├── BillingList.tsx                  # Lista de faturamentos do serviço
│   ├── ConflictOnReactivateModal.tsx
│   ├── InvitePatientModal.tsx
│   ├── LinkPatientModal.tsx             # Vincular importação a paciente existente
│   ├── PendingSuggestionsCard.tsx       # Aprovação financeira no /finance
│   ├── PaymentReceiptModal.tsx          # Upload de comprovante
│   ├── ReceiptViewerModal.tsx           # Visualização do comprovante
│   ├── ProspectCard.tsx                 # Revisão de importados no Dashboard
│   ├── ReactivateModal.tsx
│   ├── SessionLedger.tsx                # Extrato financeiro por paciente/prestador
│   ├── SubmissionCard.tsx
│   └── TransactionModal.tsx             # Modal de criar/editar transação
├── contexts/                            # AuthContext
├── hooks/
│   ├── useAgendaView.ts, useAppointments.ts, useOccupiedSlots.ts
│   ├── useAllUpcomingBillings.ts, useProviderBillings.ts
│   ├── useTransactions.ts, usePendingSuggestions.ts
│   ├── usePatient.ts, usePatients.ts, usePatientSchedules.ts, usePatientScheduleSource.ts
│   ├── useProvider.ts, useProviders.ts, useProviderSchedules.ts, useProviderScheduleSource.ts
│   └── useProspects.ts, useSubmissions.ts, useTheme.ts, useBirthdays.ts
├── lib/
│   ├── agenda-date.ts, api.ts, appointment-colors.ts, appointment-layout.ts
│   ├── appointment-overlap.ts, appointments-filter.ts, billings-date.ts
│   ├── masks.ts, patient-display.ts, recurrence.ts, supabase.ts, text.ts, weekdays.ts
├── pages/
│   ├── Agenda.tsx, Dashboard.tsx, Login.tsx
│   ├── PatientDetail.tsx, PatientForm.tsx, PatientReview.tsx, Patients.tsx
│   ├── ProviderDetail.tsx, ProviderForm.tsx, Providers.tsx
│   ├── PublicForm.tsx, Settings.tsx, Finance.tsx
├── types/index.ts
├── App.tsx, index.css, main.tsx
```

---

## 4. Decisões de arquitetura

### 4.1 Dados vão direto para o Supabase
O frontend **não** passa pelo backend Node para ler/escrever dados de aplicação. Fala direto com o Supabase via `@supabase/supabase-js`, e o **RLS** garante isolamento.

### 4.2 RLS + GRANT obrigatórios
Toda tabela no Supabase precisa de RLS + policies e `grant select, insert, update, delete on … to authenticated;`. Sem o GRANT, o Postgres barra antes da RLS (erro `42501`).

### 4.3 Tailwind v4
Tema em `src/index.css` dentro de `@theme { … }`. **Importante:** precisa ter `--color-brand-950` definido para o dark mode funcionar. Não existe `tailwind.config.js`.

### 4.34 Arquitetura Multi-Serviços ⭐ NOVO
Um paciente ou prestador pode ter **múltiplos serviços** (ex: Terapia Individual R$ 200 e Supervisão R$ 150).
- Os formulários (`PatientForm` e `ProviderForm`) usam um estado `services: ServiceBlock[]`.
- O componente `ServiceScheduleField.tsx` gerencia cada bloco, contendo: Frequência (`weekly`, `monthly`, etc.), Data de Início (`anchorDate`), Cor e checkbox de "Dia inteiro" (boletos).
- As funções `set_patient_schedules` / `set_provider_schedules` no banco recebem um JSONB com todos os blocos.

### 4.35 Motor Financeiro (Regime de Caixa) ⭐ NOVO
Localizado em `/finance` (`Finance.tsx`).
- **Cards Resumo:** Entradas e Saídas somam **apenas o que está pago** (`paid_on`). O card Pendentes mostra a contagem e o saldo.
- **`PendingSuggestionsCard`:** O sistema varre sessões (`appointments`) e vencimentos (`provider_billings`) e sugere lançamentos. Pode Aprovar, Editar ou Descartar.
- **`TransactionModal`:** Modal de criar/editar lançamento manual.
- **Comprovantes:** Upload de PDF/Imagem via `PaymentReceiptModal`. O bucket do Supabase é privado e a visualização (`ReceiptViewerModal`) usa URL assinada temporária.
- **Extrato de Sessões (`SessionLedger`):** Exibido no `PatientDetail` e `ProviderDetail`. A numeração (`#1`, `#2`) é separada por serviço e as badges usam a cor do serviço.

### 4.36 Agenda Premium (Cores e Títulos) ⭐ NOVO
- Os componentes `AppointmentBlock`, `MonthDayCell` e `DayOverviewModal` renderizam a propriedade `color` do agendamento (fundo com opacidade `${color}20`). Se nula, usam a cor padrão do tipo.
- O `title` do serviço aparece embaixo do nome do paciente na agenda.
- **Pendente:** As cores do histórico (passado) não atualizam automaticamente se o serviço mudar de cor; precisa de um merge no `useAppointments` (evitando UPDATE em massa no banco).

### 4.37 Importação e Merge de Google Calendar ⭐ NOVO
- A importação no backend agora materializa os eventos em `patient_schedules` (Não cria `appointments` direto).
- No Dashboard, o `ProspectCard` permite clicar em **"Vincular Existente"**, que abre o `LinkPatientModal` para unificar os horários importados com um paciente já ativo no banco.

### 4.38 AlertDialog (Design System) ⭐ NOVO
- Substituiu 100% dos `alert()` e `confirm()` nativos. O `AlertDialog` tem variantes (`info`, `error`, `success`) e botão único "Entendi".

### 4.4 Nada de diálogos nativos
Nunca usar `alert()`, `confirm()` ou `prompt()`. Usar sempre `AlertDialog` (para avisos) e `ConfirmDialog` (para ações destrutivas) do design system.

### 4.5 Normalização de nome vs. máscaras in-locus
- **Nome:** normaliza ao enviar (`toTitleCase`).
- **Telefone, CPF, CNPJ, Moeda:** máscara **in-locus**.
- **Data:** `MaskedDateInput` (dd/mm/aaaa), armazenada em ISO (`YYYY-MM-DD`).

### 4.6 SPA routing na Vercel
`vercel.json` com rewrite para `/index.html` (evita 404 no F5).

---

## 5. Funcionalidades e Regras de Negócio

### 5.1 Agenda (Dia, Semana, Mês)
- **Status:** `active` (normal), `cancelled` (line-through + badge), `completed` (esmaecido + check).
- **Tipos:** `session`, `personal`, `blocked`. O tipo `due` foi removido (substituído pelos alertas de vencimento no topo do dia).
- **Cores Customizadas:** `AppointmentBlock`, `MonthDayCell` e `DayOverviewModal` leem a propriedade `color` do agendamento. Se nula, usam a cor padrão do tipo. O fundo da cor recebe 15~20% de opacidade via Hex Alpha (ex: `${color}20`).
- **Título do Serviço:** A propriedade `title` aparece embaixo do nome do paciente/prestador na agenda.
- **Drag and Drop:** Usa `@dnd-kit/core`. Movimentação e redimensionamento com preview em tempo real. Bloqueios e cancelados não são arrastáveis.
- **Dia Inteiro:** Serviços sem horário (`start_time = null`) aparecem como cartões no topo da coluna do dia (fora da grade de horas).

### 5.2 Arquitetura Multi-Serviços
Tanto `PatientForm` quanto `ProviderForm` não têm mais um único horário. Eles usam o conceito de **Blocos de Serviço** (`services`):
- Cada bloco tem: `title`, `sessionPrice`, `paymentFormat`, `schedule` (dia/hora), `recurrenceType` e `color`.
- O botão **"+ Adicionar outro serviço"** cria um novo bloco.
- O componente `ServiceScheduleField.tsx` renderiza o bloco e permite frequências complexas: `once`, `weekly`, `biweekly`, `monthly`, `bimonthly`, `quarterly`, `semiannual`, `yearly`, `custom_days` e o check de "Definir horário específico".
- **Sincronização:** Ao salvar, o frontend envia um JSONB com todos os blocos para a RPC (ex: `set_patient_schedules`).

### 5.3 Módulo Financeiro (`/finance`)
- **Regime de Caixa:** Os cards de Entradas/Saídas somam **apenas** o que está pago (`paid_on` preenchido). O card de Pendentes mostra a contagem e o saldo.
- **Aprovação de Sugestões (`PendingSuggestionsCard`):**
  - O sistema cruza `appointments` (sessões realizadas/passadas) e `provider_billings` (vencimentos).
  - As sugestões podem ser Aprovadas, Editadas (abre o `TransactionModal`) ou Descartadas.
- **Anexos:** O `PaymentReceiptModal` permite subir um PDF ou Imagem para o bucket `receipts` do Supabase. O `ReceiptViewerModal` gera uma URL assinada e exibe o arquivo sem sair da tela.
- **Rollback:** O botão "Desfazer pagamento" devolve a transação para o status Pendente.
- **Vínculo:** As transações podem ser vinculadas a um `appointment_id` (sessão), `billing_id` (empresa) ou `provider_id`.

### 5.4 Importação do Google Calendar e Revisão
- A importação traz Prospects para o Dashboard.
- O `ProspectCard` tem 3 ações:
  1. **É novo paciente:** Redireciona para `/patients/:id/review` (onde os blocos de serviço são configurados).
  2. **Vincular Existente:** Abre o `LinkPatientModal`, fundindo os horários importados com o cadastro de um paciente já ativo.
  3. **É prestador:** Converte para `provider` `person`.

### 5.5 Extrato de Sessões (`SessionLedger`)
- Localizado nas abas do `PatientDetail` e `ProviderDetail`.
- Faz a contagem **separada por serviço** (`#1 Terapia Individual`, `#1 Supervisão`).
- Usa a badge colorida com a cor do serviço.

---

## 6. Convenções de código

- **Idioma:** variáveis, funções, tipos, arquivos em **inglês**. Comentários em **português**.
- **Componentes:** função nomeada (`export function Foo()`).
- **Tipos:** usar `type`, não `interface`.
- **Estados de fetch:** sempre tratar `loading`, `error` e `empty`.
- **Nada de `any`:** exceto em integrações com bibliotecas.
- **Regra de ouro:** hooks só dentro de `export function`. Nunca fora (para evitar "Invalid hook call").

---

## 7. Armadilhas conhecidas

| Sintoma | Causa | Solução |
|---|---|---|
| **`42501 permission denied for table`** | Faltou GRANT | `grant … to authenticated;` |
| **`Invalid hook call` no console** | Hook fora do `export function` | Mover para dentro do componente |
| **Tailwind não aplica estilos** | Config v3 em projeto v4 | Usar `@theme` + plugin Vite |
| **Dark mode com fundo claro + texto claro** | Falta `--color-brand-950` no `@theme` | Adicionar `--color-brand-950: #042f2e` |
| **`Could not choose the best candidate function`** | Overload ambíguo de RPC | Passar todos os parâmetros ou usar `callRpcWithFallback` |
| **`duplicate key value violates unique constraint`** | Salvar cor/horário que já existe | RPC do banco usa `ON CONFLICT DO UPDATE` |
| **Cor não aplica no histórico** | O `UPDATE` só pega o futuro | Rodar SQL ou usar merge no `useAppointments` (Pendente) |
| **`<input type="date">` mostra mm/dd/aaaa** | Locale do navegador | Usar `MaskedDateInput` |
| **Botão dentro de modal dá submit no form** | Botão sem `type="button"` | Adicionar `type="button"` em botões que não sejam de submissão |
| **`monthly` cai em dia diferente do esperado** | Faltava `anchor_date` | Sempre passar `anchorDate` no JSONB |
| **Modal fechando ao clicar em "Configurar"** | Formulário abraçando o modal (Portal) | Usar `e.preventDefault()` e `e.stopPropagation()`, ou portar o modal |
| **`duplicate key value violates unique constraint`** | Salvar cor/horário de serviço que já existe no banco | RPC de schedule usa `ON CONFLICT DO UPDATE` para atualizar as cores sem quebrar |
| **Botão dentro de modal recarrega o form** | Botão sem `type="button"` dentro de um `<form>` | Adicionar `type="button"` em botões que abrem modais ou não são submits |
| **Cor não aplica no histórico da agenda** | O banco só atualiza o futuro na RPC de save | Rodar SQL de correção no passado ou implementar merge visual no `useAppointments` |
| **Modal de vencimento e horário quebrando** | Modal renderizado dentro da tag `<form>` | Usar `e.stopPropagation()` ou portar o modal |

---

## 8. Estado atual (última atualização)

**Concluído (Fases 1–3 + Financeiro + Multi-Serviços):**

- ✅ Autenticação, Roteamento, Layout, Design System e Dark Mode.
- ✅ Convite, formulário público, submissões e CRUD de pacientes.
- ✅ CRUD de prestadores (com CPF/CNPJ alternáveis).
- ✅ Agenda em 3 modos com DnD (mover, redimensionar), stacking e bloqueios.
- ✅ Importação do Google refatorada (Materialização adiada, Merge/Vínculo).
- ✅ Frequência configurável e `MaskedDateInput`.
- ✅ **Arquitetura Multi-Serviços:** Múltiplos blocos com título, cor e valores independentes.
- ✅ **Módulo Financeiro Completo:** Regime de caixa, sugestões, transações, comprovantes, extrato.
- ✅ **Agenda Premium:** Cores customizadas, título do serviço nos blocos.
- ✅ **AlertDialog implementado:** Fim dos alerts nativos.
- ✅ **Correção da Importação Google:** Sincronização de fuso, dia inteiro e vínculo de pacientes existentes.


**Pendente — fases seguintes:**
- ⏳ **Ajustes finos no Financeiro:** Relatórios (Faturamento, ocupação), exportação CSV.
- ⏳ **Prontuário (Fase 4):** Evolução SOAP, Anamnese, Upload de áudio.
- ⏳ **Fase 5b:** Geração de Recibos em PDF (Backend).
- ⏳ **Fase 6:** Notificações e Sincronização de escrita com Google Calendar.
- ⏳ **Sincronização de Cores:** Merge visual das cores no `useAppointments` para não depender de SQL no passado.
- ⏳ **Busca e Paginação:** Busca server-side em `/patients` e `/providers`.
- ⏳ **Testes E2E (Playwright).**
- ⏳ **Sincronização de Cores no Histórico:** Fazer o merge visual das cores no `useAppointments` para não depender de SQL no passado.
- ⏳ **Ajustes finos no Financeiro:** Relatórios (Faturamento, ocupação), exportação CSV.
- ⏳ **Prontuário (Fase 4):** Evolução SOAP, Anamnese, Upload de áudio.

**Branches ativas:**
- Frontend: `main`
- Backend: `main`

---

## 9. Como usar este documento

Ao entrar no projeto, leia na ordem:
1. Este `CONTEXT.md`
2. `README.md`
3. `TODO.md`
4. Código em `src/`

Se algo aqui estiver desatualizado, **atualize antes de codar**.
```

---

Esse documento agora reflete **exatamente** a arquitetura e as funcionalidades que construímos juntos (Multi-serviços, Financeiro, Cores, etc.). 

Se estiver de acordo, o próximo passo é atualizarmos o **`TODO.md` do Frontend** com a mesma riqueza de detalhes (marcando tudo o que já foi entregue e listando os refinamentos pendentes, como o merge de cores e a busca). Quer que eu prepare?