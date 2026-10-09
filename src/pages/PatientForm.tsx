import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Button, Card, Input, Spinner } from "../components/ui";
import { usePatient } from "../hooks/usePatient";
import { toTitleCase } from "../lib/text";
import { maskCPF, maskPhone, isValidCPF, isValidPhoneBR } from "../lib/masks";

type FormState = {
  full_name: string;
  cpf: string;
  city: string;
  birth_date: string;
  phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  notes: string;
};

const INITIAL_FORM: FormState = {
  full_name: "",
  cpf: "",
  city: "",
  birth_date: "",
  phone: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  notes: "",
};

export function PatientForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { patient, loading: loadingPatient } = usePatient(id);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carrega dados do paciente no modo edição
  useEffect(() => {
    if (patient) {
      setForm({
        full_name: patient.full_name ?? "",
        cpf: patient.cpf ?? "",
        city: patient.city ?? "",
        birth_date: patient.birth_date ?? "",
        phone: patient.phone ?? "",
        emergency_contact_name: patient.emergency_contact_name ?? "",
        emergency_contact_phone: patient.emergency_contact_phone ?? "",
        notes: patient.notes ?? "",
      });
    }
  }, [patient]);

  // Se for um paciente provisório (prospect), redireciona para a página de revisão.
  // Não permitimos edição comum aqui porque a promoção precisa de fluxo próprio.
  useEffect(() => {
    if (patient && patient.status === "prospect" && isEdit) {
      navigate(`/patients/${patient.id}/review`, { replace: true });
    }
  }, [patient, isEdit, navigate]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validações extras (frontend)
    if (form.cpf && !isValidCPF(form.cpf)) {
      setError("CPF inválido. Confira os dígitos.");
      return;
    }
    if (form.phone && !isValidPhoneBR(form.phone)) {
      setError("Telefone inválido. Use DDD + número.");
      return;
    }
    if (
      form.emergency_contact_phone &&
      !isValidPhoneBR(form.emergency_contact_phone)
    ) {
      setError("Telefone do contato de urgência inválido.");
      return;
    }

    setSaving(true);

    const payload = {
      full_name: toTitleCase(form.full_name),
      cpf: form.cpf.trim() || null,
      city: form.city.trim() || null,
      birth_date: form.birth_date || null,
      phone: form.phone || null,
      emergency_contact_name: form.emergency_contact_name
        ? toTitleCase(form.emergency_contact_name)
        : null,
      emergency_contact_phone: form.emergency_contact_phone || null,
      notes: form.notes.trim() || null,
    };

    if (isEdit) {
      const { error } = await supabase
        .from("patients")
        .update(payload)
        .eq("id", id);

      if (error) {
        setError(error.message);
        setSaving(false);
        return;
      }

      navigate(`/patients/${id}`);
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Sessão expirada. Faça login novamente.");
        setSaving(false);
        return;
      }

      const { data, error } = await supabase
        .from("patients")
        .insert({ ...payload, user_id: user.id })
        .select()
        .single();

      if (error || !data) {
        setError(error?.message ?? "Erro ao criar paciente.");
        setSaving(false);
        return;
      }

      navigate(`/patients/${data.id}`);
    }
  }

  if (isEdit && loadingPatient) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={24} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Cabeçalho */}
      <div>
        <Link
          to={isEdit ? `/patients/${id}` : "/patients"}
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={14} />
          {isEdit ? "Voltar para o paciente" : "Voltar para pacientes"}
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">
          {isEdit ? "Editar paciente" : "Novo paciente"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isEdit
            ? "Atualize os dados cadastrais do paciente."
            : "Cadastre um paciente manualmente, sem enviar convite."}
        </p>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="space-y-4 p-6">
          <h2 className="text-sm font-medium text-gray-900">Dados pessoais</h2>

          <Input
            label="Nome completo"
            required
            value={form.full_name}
            onChange={(e) => update("full_name", e.target.value)}
            placeholder="Ex: Maria Silva"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="CPF"
              inputMode="numeric"
              value={form.cpf}
              onChange={(e) => update("cpf", maskCPF(e.target.value))}
              placeholder="000.000.000-00"
            />

            <Input
              label="Data de nascimento"
              type="date"
              value={form.birth_date}
              onChange={(e) => update("birth_date", e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Cidade"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
            />

            <Input
              label="Telefone"
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => update("phone", maskPhone(e.target.value))}
              placeholder="(00) 00000-0000"
            />
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-sm font-medium text-gray-900">
            Contato de urgência
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nome"
              value={form.emergency_contact_name}
              onChange={(e) =>
                update("emergency_contact_name", e.target.value)
              }
            />

            <Input
              label="Telefone"
              type="tel"
              inputMode="tel"
              value={form.emergency_contact_phone}
              onChange={(e) =>
                update("emergency_contact_phone", maskPhone(e.target.value))
              }
              placeholder="(00) 00000-0000"
            />
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-sm font-medium text-gray-900">
            Observações internas
          </h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Notas
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={4}
              placeholder="Anotações administrativas (não vão para o prontuário)"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <p className="mt-1 text-xs text-gray-500">
              Campo opcional. Visível apenas para você.
            </p>
          </div>
        </Card>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Ações */}
        <div className="flex justify-end gap-2">
          <Link to={isEdit ? `/patients/${id}` : "/patients"}>
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            <Save size={16} />
            {saving
              ? "Salvando..."
              : isEdit
                ? "Salvar alterações"
                : "Criar paciente"}
          </Button>
        </div>
      </form>
    </div>
  );
}