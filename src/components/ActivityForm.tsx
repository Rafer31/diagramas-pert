import { useState, useEffect } from "react";
import type { Activity } from "../types";

interface Props {
  onAdd: (activity: Activity) => void;
  onUpdate?: (activity: Activity) => void;
  editingActivity?: Activity | null;
  activities?: Activity[];
}

export function ActivityForm({
  onAdd,
  onUpdate,
  editingActivity,
  activities = [],
}: Props) {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [cost, setCost] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);
  const [newRequirement, setNewRequirement] = useState("");

  const isEditing = editingActivity !== null && editingActivity !== undefined;
  
  // Nueva lógica: determinar si el botón debe estar habilitado
  const isFormValid = code.trim() && description.trim() && duration.trim() && cost.trim();

  useEffect(() => {
    if (editingActivity) {
      setCode(editingActivity.code);
      setDescription(editingActivity.description);
      setDuration(editingActivity.duration.toString());
      setCost(editingActivity.cost.toString());
      setRequirements(editingActivity.requirements);
    }
  }, [editingActivity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !code.trim() ||
      !description.trim() ||
      !duration.trim() ||
      !cost.trim()
    ) {
      alert("Por favor, completa todos los campos obligatorios.");
      return;
    }

    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      alert("La duración debe ser un número positivo.");
      return;
    }

    const costNum = parseFloat(cost);
    if (isNaN(costNum) || costNum < 0) {
      alert("El costo debe ser un número válido mayor o igual a cero.");
      return;
    }

    // Verificar que el código no esté duplicado (solo para nuevas actividades)
    if (!isEditing && activities.some((act) => act.code === code.trim())) {
      alert("Ya existe una actividad con ese código.");
      return;
    }

    // Verificar que los requerimientos existan
    const invalidRequirements = requirements.filter(
      (req) =>
        !activities.some((act) => act.code === req) && req !== code.trim()
    );

    if (invalidRequirements.length > 0) {
      alert(
        `Las siguientes actividades de requisito no existen: ${invalidRequirements.join(
          ", "
        )}`
      );
      return;
    }

    const activity: Activity = {
      code: code.trim(),
      description: description.trim(),
      duration: durationNum,
      cost: costNum,
      requirements: requirements.filter((req) => req !== code.trim()), // Evitar auto-referencia
    };

    if (isEditing && onUpdate) {
      onUpdate(activity);
    } else {
      onAdd(activity);
    }

    // Limpiar formulario
    setCode("");
    setDescription("");
    setDuration("");
    setCost("");
    setRequirements([]);
    setNewRequirement("");
  };

  const handleAddRequirement = () => {
    if (
      newRequirement.trim() &&
      !requirements.includes(newRequirement.trim())
    ) {
      setRequirements([...requirements, newRequirement.trim()]);
      setNewRequirement("");
    }
  };

  const handleRemoveRequirement = (req: string) => {
    setRequirements(requirements.filter((r) => r !== req));
  };

  const handleCancel = () => {
    setCode("");
    setDescription("");
    setDuration("");
    setCost("");
    setRequirements([]);
    setNewRequirement("");
  };

  const availableActivities = activities.filter((act) => act.code !== code);

  return (
    <div>
      <h2 className="text-2xl font-bold text-red-600 mb-4">
        {isEditing ? "Editar Actividad" : "Agregar Nueva Actividad"}
      </h2>

      {/* Mensaje informativo cuando no hay actividades */}
      {!isEditing && activities.length === 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            <strong>Nota:</strong> Esta será tu primera actividad. Puedes agregar más actividades después 
            y establecer dependencias entre ellas para crear el diagrama PERT.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Código de la Actividad *
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="ej. A, B, C..."
            className="w-full p-2 border border-gray-300 rounded-md"
            disabled={isEditing} // No permitir cambiar el código al editar
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción de la Actividad *
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción de la actividad"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duración (días) *
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Número de días"
            min="1"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Costo *
          </label>
          <input
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="Costo de la actividad"
            min="0"
            step="0.01"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Actividades Requeridas
          </label>
          
          {activities.length === 0 && !isEditing ? (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-600 text-sm">
              No hay actividades disponibles para seleccionar como requisitos. 
              Agrega esta actividad primero y luego podrás crear otras que dependan de ella.
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-2">
                <select
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md"
                  disabled={availableActivities.length === 0}
                >
                  <option value="">
                    {availableActivities.length === 0 
                      ? "No hay actividades disponibles" 
                      : "Seleccionar actividad..."}
                  </option>
                  {availableActivities.map((act) => (
                    <option key={act.code} value={act.code}>
                      {act.code} - {act.description}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddRequirement}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  disabled={!newRequirement || availableActivities.length === 0}
                >
                  Agregar
                </button>
              </div>

              {requirements.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {requirements.map((req) => (
                    <span
                      key={req}
                      className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {req}
                      <button
                        type="button"
                        onClick={() => handleRemoveRequirement(req)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className={`px-6 py-2 rounded-md transition-colors ${
              isFormValid
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!isFormValid}
          >
            {isEditing ? "Actualizar" : "Agregar"} Actividad
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}