import { useState } from "react";
import { User, UserPlus } from "lucide-react";
import { Input, Badge } from "../../ui";
import { maskPhone, isValidPhoneBR } from "../../../lib/masks";

export type EntityPickerItem = {
  id: string;
  name: string;
};

type Props = {
  label: string;
  items: EntityPickerItem[];
  selectedId: string;
  query: string;
  creating: boolean;
  newName: string;
  newPhone: string;
  onQueryChange: (q: string) => void;
  onSelect: (id: string, name: string) => void;
  onStartCreating: (name: string) => void;
  onCreateCancel: () => void;
  onNewNameChange: (v: string) => void;
  onNewPhoneChange: (v: string) => void;
  searchPlaceholder: string;
  createLabel: string;
};

/**
 * Componente genérico para buscar e selecionar (ou criar) 
 * uma entidade (paciente ou prestador).
 * Reduz a duplicação entre PatientPicker e ProviderPicker.
 */
export function EntityPicker({
  label,
  items,
  selectedId,
  query,
  creating,
  newName,
  newPhone,
  onQueryChange,
  onSelect,
  onStartCreating,
  onCreateCancel,
  onNewNameChange,
  onNewPhoneChange,
  searchPlaceholder,
  createLabel,
}: Props) {
  const [phoneTouched, setPhoneTouched] = useState(false);

  const hasMatch = items.length > 0;
  const queryIsExactMatch =
    !!query.trim() &&
    items.some(
      (i) => i.name.trim().toLowerCase() === query.trim().toLowerCase()
    );

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
        {label} <span className="text-red-500">*</span>
      </label>
      <Input
        placeholder={searchPlaceholder}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        disabled={creating}
      />

      {!creating && (
        <div className="mt-2 space-y-1 rounded-lg border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id, item.name)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-slate-800 ${
                selectedId === item.id
                  ? "bg-brand-50 text-brand-900 dark:bg-brand-950/40 dark:text-brand-200"
                  : "text-gray-900 dark:text-slate-100"
              }`}
            >
              <User size={14} className="text-gray-400 dark:text-slate-500" />
              <span className="flex-1">{item.name}</span>
              {selectedId === item.id && <Badge variant="brand">Selecionado</Badge>}
            </button>
          ))}

          {!hasMatch && query.trim() !== "" && (
            <p className="px-3 py-2 text-xs text-gray-500 dark:text-slate-400">
              Nenhum resultado encontrado.
            </p>
          )}

          {!selectedId &&
            query.trim() !== "" &&
            !queryIsExactMatch && (
              <button
                type="button"
                onClick={() => onStartCreating(query.trim())}
                className="flex w-full items-center gap-2 border-t border-gray-100 px-3 py-2 text-left text-sm text-brand-700 hover:bg-brand-50 dark:border-slate-800 dark:text-brand-300 dark:hover:bg-brand-950/40"
              >
                <UserPlus size={14} />
                <span className="flex-1">
                  {createLabel} "{query.trim()}"
                </span>
              </button>
            )}
        </div>
      )}

      {creating && (
        <div className="mt-2 space-y-3 rounded-lg border border-brand-200 bg-brand-50/40 p-3 dark:border-brand-800 dark:bg-brand-950/30">
          <p className="text-xs font-medium text-brand-900 dark:text-brand-200">
            Cadastro rápido
          </p>
          <Input
            label="Nome"
            value={newName}
            onChange={(e) => onNewNameChange(e.target.value)}
            placeholder="Ex: Maria Silva"
          />
          <Input
            label="Telefone (opcional)"
            type="tel"
            inputMode="tel"
            value={newPhone}
            onChange={(e) => {
              setPhoneTouched(true);
              onNewPhoneChange(maskPhone(e.target.value));
            }}
            placeholder="(00) 00000-0000"
          />
          {phoneTouched && newPhone && !isValidPhoneBR(newPhone) && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Telefone inválido.
            </p>
          )}
          <button
            type="button"
            onClick={onCreateCancel}
            className="text-xs text-gray-600 underline hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            Cancelar cadastro rápido
          </button>
        </div>
      )}
    </div>
  );
}