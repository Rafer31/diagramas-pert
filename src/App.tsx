import { useState } from "react";
import type { Activity } from "./types";
import { ActivityForm } from "./components/ActivityForm";
import { ActivityTable } from "./components/ActivityTable";
import { ProjectSummary } from "./components/ProjectSummary";
import { PertDiagram } from "./components/PertDiagram";
import { ReactFlowProvider } from "@xyflow/react";

export default function App() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const addActivity = (activity: Activity) => {
    setActivities([...activities, activity]);
  };

  const updateActivity = (updatedActivity: Activity) => {
    setActivities(activities.map(act => 
      act.code === updatedActivity.code ? updatedActivity : act
    ));
    setEditingActivity(null);
  };

  const deleteActivity = (activityCode: string) => {
    // Verificar si otras actividades dependen de esta
    const dependentActivities = activities.filter(act => 
      act.requirements.includes(activityCode)
    );
    
    if (dependentActivities.length > 0) {
      const dependentCodes = dependentActivities.map(act => act.code).join(', ');
      if (!window.confirm(
        `La actividad ${activityCode} es requerida por: ${dependentCodes}. ` +
        `¿Estás seguro de que quieres eliminarla? Esto también eliminará las dependencias.`
      )) {
        return;
      }
      
      // Eliminar la actividad y limpiar las dependencias
      setActivities(activities
        .filter(act => act.code !== activityCode)
        .map(act => ({
          ...act,
          requirements: act.requirements.filter(req => req !== activityCode)
        }))
      );
    } else {
      if (window.confirm(`¿Estás seguro de que quieres eliminar la actividad ${activityCode}?`)) {
        setActivities(activities.filter(act => act.code !== activityCode));
      }
    }
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
  };

  return (
    <ReactFlowProvider>
      <div className="min-h-screen bg-gray-50 p-6 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-red-600 mb-10">
          Diagrama PERT - Gestión de Proyecto
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <ActivityForm 
              onAdd={addActivity} 
              onUpdate={updateActivity}
              editingActivity={editingActivity}
              activities={activities}
            />
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <ProjectSummary activities={activities} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <ActivityTable 
            activities={activities} 
            onEdit={handleEditActivity}
            onDelete={deleteActivity}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <PertDiagram 
            activities={activities} 
            onEditActivity={handleEditActivity}
            onDeleteActivity={deleteActivity}
          />
        </div>
      </div>
    </ReactFlowProvider>
  );
}