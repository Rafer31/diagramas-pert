import {
  MiniMap,
  Controls,
  Background,
  ReactFlow,

  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
} from "@xyflow/react";
import type {  Node as FlowNode,
  Edge as FlowEdge, } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect } from "react";
import type { Activity } from "../types";

interface Props {
  activities: Activity[];
  onEditActivity?: (activity: Activity) => void;
  onDeleteActivity?: (activityCode: string) => void;
}

const calculateNodePositions = (activities: Activity[]) => {
  const nodes: { [key: string]: { level: number; position: number } } = {};

  const calculateLevels = (
    activityCode: string,
    visited = new Set<string>()
  ): number => {
    if (visited.has(activityCode)) return 0;
    visited.add(activityCode);

    const activity = activities.find((a) => a.code === activityCode);
    if (!activity || activity.requirements.length === 0) return 0;

    return (
      Math.max(
        ...activity.requirements.map((req) =>
          calculateLevels(req, new Set(visited))
        )
      ) + 1
    );
  };

  activities.forEach((activity) => {
    nodes[activity.code] = {
      level: calculateLevels(activity.code),
      position: 0,
    };
  });

  const levelGroups: { [level: number]: string[] } = {};
  Object.entries(nodes).forEach(([code, data]) => {
    if (!levelGroups[data.level]) levelGroups[data.level] = [];
    levelGroups[data.level].push(code);
  });

  Object.entries(levelGroups).forEach(([level, codes]) => {
    codes.forEach((code, index) => {
      nodes[code].position = index;
    });
  });

  return nodes;
};

const CustomNode = ({ data }: { data: any }) => {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-red-300 min-w-[120px]">
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#f87171' }}
      />
      <div className="font-bold text-red-700 text-center">{data.code}</div>
      <div className="text-sm text-gray-600 text-center">{data.description}</div>
      <div className="text-sm text-gray-600 text-center">{data.duration}d | {data.duration + data.duration}</div>
      <div className="text-sm text-gray-600 text-center">${data.cost}</div>
      <div className="flex gap-1 mt-2 justify-center">
        <button
          onClick={() => data.onEdit(data.activity)}
          className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
        >
          Editar
        </button>
        <button
          onClick={() => data.onDelete(data.code)}
          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
        >
          Eliminar
        </button>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#f87171' }}
      />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export function PertDiagram({
  activities,
  onEditActivity,
  onDeleteActivity,
}: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);

  const updateDiagram = useCallback(() => {
    if (activities.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const positions = calculateNodePositions(activities);

    const newNodes: FlowNode[] = activities.map((act) => {
      const nodePosition = positions[act.code];
      return {
        id: act.code,
        type: "custom",
        data: {
          code: act.code,
          description: act.description,
          duration: act.duration,
          cost: act.cost,
          activity: act,
          onEdit: onEditActivity || (() => {}),
          onDelete: onDeleteActivity || (() => {}),
        },
        position: {
          x: nodePosition.level * 250 + 50,
          y: nodePosition.position * 150 + 50,
        },
        draggable: true,
      };
    });

    const newEdges: FlowEdge[] = [];
    
    activities.forEach((act) => {
      act.requirements.forEach((req) => {
        // Verificar que el requisito existe como actividad
        const requiredActivity = activities.find(a => a.code === req);
        if (requiredActivity) {
          newEdges.push({
            id: `${req}-${act.code}`,
            source: req,
            target: act.code,
            animated: true,
            style: {
              stroke: "#f87171",
              strokeWidth: 2,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#f87171",
            },
          });
        }
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [activities, onEditActivity, onDeleteActivity, setNodes, setEdges]);

  useEffect(() => {
    updateDiagram();
  }, [updateDiagram]);

  if (activities.length === 0) {
    return (
      <div className="h-96 border border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg">
          No hay actividades para mostrar en el diagrama
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Diagrama PERT</h2>
      <div
        style={{
          height: 600,
          border: "2px solid #fee2e2",
          borderRadius: "8px",
          backgroundColor: "#fefefe",
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <MiniMap
            nodeColor="#fb3456"
            nodeStrokeColor="#dc2626"
            nodeStrokeWidth={2}
          />
          <Controls />
          <Background gap={20} size={1} color="#fecaca" />
        </ReactFlow>
      </div>
    </div>
  );
}