import type { Activity } from "../types";

interface Props {
  activities: Activity[];
  onEdit?: (activity: Activity) => void;
  onDelete?: (activityCode: string) => void;
}

export function ActivityTable({ activities, onEdit, onDelete }: Props) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-lg">No hay actividades registradas</p>
        <p className="text-gray-400 text-sm">Agrega tu primera actividad usando el formulario</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-red-600 mb-4">Lista de Actividades</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-red-50">
              <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                Código
              </th>
              <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                Descripción
              </th>
              <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                Duración (días)
              </th>
              <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                Costo
              </th>
              <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                Actividades Requeridas
              </th>
              {(onEdit || onDelete) && (
                <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {activities.map((activity, index) => (
              <tr 
                key={activity.code} 
                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="border border-gray-200 px-4 py-3 font-medium text-red-600">
                  {activity.code}
                </td>
                <td className="border border-gray-200 px-4 py-3">
                  {activity.description}
                </td>
                <td className="border border-gray-200 px-4 py-3 text-center">
                  {activity.duration}
                </td>
                <td className="border border-gray-200 px-4 py-3 text-center">
                  ${activity.cost.toLocaleString()}
                </td>
                <td className="border border-gray-200 px-4 py-3">
                  {activity.requirements.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {activity.requirements.map(req => (
                        <span 
                          key={req}
                          className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {req}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">Ninguna</span>
                  )}
                </td>
                {(onEdit || onDelete) && (
                  <td className="border border-gray-200 px-4 py-3">
                    <div className="flex gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(activity)}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                        >
                          Editar
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(activity.code)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Total de actividades: <span className="font-semibold">{activities.length}</span></p>
      </div>
    </div>
  );
}