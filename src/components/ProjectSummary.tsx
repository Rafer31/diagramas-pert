import type { Activity } from "../types";

interface Props {
  activities: Activity[];
}

export function ProjectSummary({ activities }: Props) {
  const totalCost = activities.reduce((sum, act) => sum + act.cost, 0);
  const criticalPath = calcularRutaCritica(activities);

  return (
    <div className="bg-gray-100 p-4 rounded shadow mb-6">
      <h2 className="text-xl font-semibold text-red-700 mb-2">Resumen del Proyecto</h2>
      <p><strong>Ruta crítica:</strong> {criticalPath.join(" → ")}</p>
      <p><strong>Duración total:</strong> {calcularDuracionRuta(criticalPath, activities)} días</p>
      <p><strong>Costo total:</strong> ${totalCost}</p>
    </div>
  );
}

function calcularDuracionRuta(path: string[], acts: Activity[]) {
  return path.reduce((sum, code) => {
    const act = acts.find((a) => a.code === code);
    return sum + (act?.duration || 0);
  }, 0);
}

function calcularRutaCritica(acts: Activity[]): string[] {
  const graph: Record<string, string[]> = {};
  const duration: Record<string, number> = {};

  acts.forEach((act) => {
    graph[act.code] = act.requirements;
    duration[act.code] = act.duration;
  });

  const visited: Record<string, number> = {};
  const path: Record<string, string[]> = {};

  const dfs = (node: string): number => {
    if (visited[node] !== undefined) return visited[node];
    if (graph[node].length === 0) {
      visited[node] = duration[node];
      path[node] = [node];
      return visited[node];
    }

    let max = 0;
    let bestPath: string[] = [];

    for (const pre of graph[node]) {
      const d = dfs(pre);
      if (d > max) {
        max = d;
        bestPath = [...path[pre]];
      }
    }

    visited[node] = max + duration[node];
    path[node] = [...bestPath, node];
    return visited[node];
  };

  let maxDur = 0;
  let best: string[] = [];

  for (const act of acts) {
    const total = dfs(act.code);
    if (total > maxDur) {
      maxDur = total;
      best = path[act.code];
    }
  }

  return best;
}
