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
import { useCallback, useEffect, useRef } from "react";
import type { Activity } from "../types";

interface Props {
  activities: Activity[];
  onEditActivity?: (activity: Activity) => void;
  onDeleteActivity?: (activityCode: string) => void;
}

// Función para calcular la duración acumulativa de cada actividad
const calculateCumulativeDurations = (activities: Activity[]) => {
  const durations: { [key: string]: number } = {};
  const memo: { [key: string]: number } = {};

  const calculateDuration = (activityCode: string, visited = new Set<string>()): number => {
    // Evitar ciclos infinitos
    if (visited.has(activityCode)) return 0;
    
    // Si ya calculamos esta duración, devolverla
    if (memo[activityCode] !== undefined) return memo[activityCode];
    
    visited.add(activityCode);
    
    const activity = activities.find((a) => a.code === activityCode);
    if (!activity) return 0;

    if (activity.requirements.length === 0) {
      // Actividad sin dependencias: solo su duración
      memo[activityCode] = activity.duration;
      return activity.duration;
    }

    // Actividad con dependencias: duración propia + máxima duración de dependencias
    const maxRequirementDuration = Math.max(
      ...activity.requirements.map((req) => 
        calculateDuration(req, new Set(visited))
      )
    );

    memo[activityCode] = activity.duration + maxRequirementDuration;
    return memo[activityCode];
  };

  // Calcular duración acumulativa para todas las actividades
  activities.forEach((activity) => {
    durations[activity.code] = calculateDuration(activity.code);
  });

  return durations;
};

const calculateNodePositions = (activities: Activity[]) => {
  const nodes: { [key: string]: { level: number; position: number } } = {};

  // Calcular niveles (profundidad) de cada nodo
  const calculateLevels = (
    activityCode: string,
    visited = new Set<string>()
  ): number => {
    if (visited.has(activityCode)) return 0; // Evitar ciclos
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

  // Asignar niveles a cada actividad
  activities.forEach((activity) => {
    nodes[activity.code] = {
      level: calculateLevels(activity.code),
      position: 0,
    };
  });

  // Agrupar por niveles y asignar posiciones horizontales
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

// Componente de nodo personalizado
const CustomNode = ({ data }: { data: any }) => {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-red-300 min-w-[140px]">
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#f87171' }}
      />
      <div className="font-bold text-red-700 text-center text-lg">{data.code}</div>
      <div className="text-xs text-gray-600 text-center truncate" title={data.description}>
        {data.description.length > 20 ? data.description.substring(0, 20) + '...' : data.description}
      </div>
      <div className="text-sm text-gray-600 text-center">
        <span className="font-semibold">{data.duration}d</span>
        <span className="text-red-600 font-bold"> | {data.cumulativeDuration}d</span>
      </div>
      <div className="text-xs text-gray-600 text-center">${data.cost}</div>
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
  const diagramRef = useRef<HTMLDivElement>(null);

  // Función para exportar a PDF - CORREGIDA para ReactFlow
  const exportToPDF = async () => {
    if (!diagramRef.current) return;

    try {
      // Importar dinámicamente las librerías
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).jsPDF;

      const element = diagramRef.current;
      
      // Esperar un momento para que ReactFlow termine de renderizar
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Configuración específica para ReactFlow
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
        height: element.offsetHeight,
        width: element.offsetWidth,
        foreignObjectRendering: true,
        // Configuración específica para evitar problemas con SVG y canvas
        onclone: (clonedDoc) => {
          // Asegurar que todos los elementos SVG se rendericen correctamente
          const svgElements = clonedDoc.querySelectorAll('svg');
          svgElements.forEach((svg) => {
            svg.setAttribute('width', svg.getBoundingClientRect().width.toString());
            svg.setAttribute('height', svg.getBoundingClientRect().height.toString());
          });
        }
      });

      const imgData = canvas.toDataURL('image/png', 0.9);
      const pdf = new jsPDF('l', 'mm', 'a4'); // landscape orientation
      
      const imgWidth = 280;
      const pageHeight = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let position = 10;

      // Título del documento
      pdf.setFontSize(16);
      pdf.text('Diagrama PERT - Análisis de Proyecto', 10, position);
      position += 15;

      // Agregar el diagrama
      if (imgHeight > pageHeight - position - 10) {
        // Si la imagen es muy grande, ajustarla
        const maxHeight = pageHeight - position - 10;
        const adjustedWidth = (canvas.width * maxHeight) / canvas.height;
        pdf.addImage(imgData, 'PNG', 10, position, adjustedWidth, maxHeight);
        position += maxHeight + 10;
      } else {
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        position += imgHeight + 10;
      }

      // Si hay espacio, agregar resumen
      if (position < pageHeight - 50) {
        pdf.setFontSize(12);
        pdf.text('Resumen del Proyecto:', 10, position);
        position += 10;

        const cumulativeDurations = calculateCumulativeDurations(activities);
        const totalDuration = Math.max(...Object.values(cumulativeDurations));
        const totalCost = activities.reduce((sum, act) => sum + act.cost, 0);

        pdf.setFontSize(10);
        pdf.text(`Total de actividades: ${activities.length}`, 10, position);
        position += 7;
        pdf.text(`Duración total del proyecto: ${totalDuration} días`, 10, position);
        position += 7;
        pdf.text(`Costo total: ${totalCost.toLocaleString()}`, 10, position);
      }

      pdf.save('diagrama-pert.pdf');
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      
      // Fallback más robusto
      try {
        const html2canvas = (await import('html2canvas')).default;
        const jsPDF = (await import('jspdf')).jsPDF;
        
        // Intentar captura básica sin configuraciones complejas
        const canvas = await html2canvas(diagramRef.current!, {
          scale: 1,
          backgroundColor: '#ffffff',
          useCORS: false,
          logging: false,
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', 'a4');
        
        // Calcular dimensiones apropiadas
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
        const width = canvas.width * ratio;
        const height = canvas.height * ratio;
        
        pdf.addImage(imgData, 'PNG', 10, 10, width - 20, height - 20);
        pdf.save('diagrama-pert.pdf');
      } catch (fallbackError) {
        console.error('Fallback también falló:', fallbackError);
        alert('Error al exportar el PDF. Esto puede deberse a restricciones del navegador. Intenta tomar una captura de pantalla manualmente.');
      }
    }
  };

  const updateDiagram = useCallback(() => {
    if (activities.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const positions = calculateNodePositions(activities);
    const cumulativeDurations = calculateCumulativeDurations(activities);

    const newNodes: FlowNode[] = activities.map((act) => {
      const nodePosition = positions[act.code];
      return {
        id: act.code,
        type: "custom",
        data: {
          code: act.code,
          description: act.description,
          duration: act.duration,
          cumulativeDuration: cumulativeDurations[act.code],
          cost: act.cost,
          activity: act,
          onEdit: onEditActivity || (() => {}),
          onDelete: onDeleteActivity || (() => {}),
        },
        position: {
          x: nodePosition.level * 280 + 50,
          y: nodePosition.position * 180 + 50,
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-red-600">Diagrama PERT</h2>
        <div className="flex gap-2">
          {activities.length > 0 && (
            <button
              onClick={exportToPDF}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              📄 Exportar PDF
            </button>
          )}
        </div>
      </div>
      
      {activities.length > 0 && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Resumen del Proyecto:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Total actividades:</span> {activities.length}
            </div>
            <div>
              <span className="font-medium">Duración total:</span> {Math.max(...Object.values(calculateCumulativeDurations(activities)))} días
            </div>
            <div>
              <span className="font-medium">Costo total:</span> ${activities.reduce((sum, act) => sum + act.cost, 0).toLocaleString()}
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            <span className="font-medium">Leyenda:</span> 
            <span className="ml-2">Duración individual | </span>
            <span className="text-red-600 font-bold">Duración acumulativa</span>
          </div>
        </div>
      )}

      <div
        ref={diagramRef}
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
            nodeColor="#fca5a5"
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