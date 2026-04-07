import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  Handle,
  Position,
  Panel,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import Sidebar from './Sidebar.jsx';
import RelationshipCountsPanel from './RelationshipCountsPanel.jsx';

function PersonNode({ data, selected }) {
  return (
    <div
      style={{
        minWidth: 200,
        borderRadius: 16,
        border: selected ? '1px solid #111827' : '1px solid #d1d5db',
        background: '#fff',
        padding: '10px 12px',
        boxShadow: selected ? '0 12px 22px rgba(0,0,0,0.12)' : '0 10px 18px rgba(0,0,0,0.08)',
        fontSize: 12,
        lineHeight: 1.25,
      }}
    >
      <Handle type="target" position={Position.Top} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 650, color: '#111827' }}>
            {data.name || 'Unnamed Person'}
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: '#6b7280' }}>
            {data.gender || 'Unknown'}
            {(data.birthDate || data.deathDate) && (
              <span>
                {' '}
                • {data.birthDate || '?'} {data.deathDate ? `- ${data.deathDate}` : ''}
              </span>
            )}
          </div>
        </div>

        {data.photo ? (
          <img
            src={data.photo}
            alt={data.name || 'Person'}
            style={{ height: 44, width: 44, borderRadius: 12, objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              height: 44,
              width: 44,
              borderRadius: 12,
              background: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 700,
              color: '#9ca3af',
              flex: '0 0 auto',
            }}
          >
            {(data.name || '?').charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div style={{ marginTop: 10, fontSize: 11, color: data.notes ? '#4b5563' : '#9ca3af' }}>
        {data.notes ? data.notes : 'No notes yet'}
      </div>

      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="target" position={Position.Left} id="left-target" />
      <Handle type="target" position={Position.Right} id="right-target" />
    </div>
  );
}

const nodeTypes = {
  person: PersonNode,
};

const initialNodes = [
  {
    id: '1',
    type: 'person',
    position: { x: 300, y: 80 },
    data: {
      name: 'You',
      gender: 'Unknown',
      birthDate: '',
      deathDate: '',
      notes: 'Start building your family tree here.',
      photo: '',
    },
  },
];

const initialEdges = [];
const STORAGE_KEY = 'family-tree-editor-v1';

const defaultEdgeOptions = {
  markerEnd: {
    type: MarkerType.ArrowClosed,
  },
  style: {
    strokeWidth: 1.5,
  },
};

function makePersonNode({ id, x, y, name }) {
  return {
    id,
    type: 'person',
    position: { x, y },
    data: {
      name: name || 'New Person',
      gender: 'Unknown',
      birthDate: '',
      deathDate: '',
      notes: '',
      photo: '',
    },
  };
}

function makeRelationshipEdge({ source, target, relationship, label, sourceHandle, targetHandle }) {
  const isSpouse = relationship === 'spouse';

  return {
    id: `${source}-${relationship}-${target}`,
    source,
    target,
    sourceHandle,
    targetHandle,
    label,
    data: { relationship },
    animated: false,
    type: 'smoothstep',
    markerEnd: isSpouse ? undefined : { type: MarkerType.ArrowClosed },
    style: {
      strokeWidth: isSpouse ? 2 : 1.5,
      strokeDasharray: relationship === 'adopted-child' ? '6 4' : undefined,
    },
  };
}

export default function FamilyTreeCanvas() {
  const didHydrateRef = useRef(false);
  const fileInputRef = useRef(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState('1');
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [newName, setNewName] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState('');

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        didHydrateRef.current = true;
        return;
      }

      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed.nodes)) setNodes(parsed.nodes);
      if (Array.isArray(parsed.edges)) setEdges(parsed.edges);

      const restoredNodeId = parsed.selectedNodeId || parsed.nodes?.[0]?.id || '1';
      setSelectedNodeId(restoredNodeId);
      setSelectedEdgeId(parsed.selectedEdgeId || null);
      setLastSavedAt(parsed.savedAt || '');
    } catch (error) {
      console.error('Could not restore saved family tree data.', error);
    } finally {
      didHydrateRef.current = true;
    }
  }, [setEdges, setNodes]);

  useEffect(() => {
    if (!didHydrateRef.current) return;

    try {
      const savedAt = new Date().toISOString();

      const payload = {
        version: 1,
        savedAt,
        selectedNodeId,
        selectedEdgeId,
        nodes,
        edges,
      };

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setLastSavedAt(savedAt);
    } catch (error) {
      console.error('Could not save family tree data.', error);
    }
  }, [nodes, edges, selectedNodeId, selectedEdgeId]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const selectedEdge = useMemo(
    () => edges.find((e) => e.id === selectedEdgeId) || null,
    [edges, selectedEdgeId]
  );

  const onConnect = useCallback(
    (params) => {
      setSelectedEdgeId(null);
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            label: 'Related',
            data: { relationship: 'custom' },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const selectNode = useCallback((nodeId) => {
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
  }, []);

  const addStandalonePerson = useCallback(() => {
    const id = crypto.randomUUID();
    const count = nodes.length;
    const x = 120 + (count % 4) * 250;
    const y = 120 + Math.floor(count / 4) * 180;
    const node = makePersonNode({ id, x, y, name: newName.trim() || `Person ${count + 1}` });

    setNodes((nds) => [...nds, node]);
    setNewName('');
    selectNode(id);
  }, [newName, nodes.length, selectNode, setNodes]);

  const updateSelectedNodeField = useCallback(
    (field, value) => {
      if (!selectedNodeId) return;
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  [field]: value,
                },
              }
            : node
        )
      );
    },
    [selectedNodeId, setNodes]
  );

  const addRelatedPerson = useCallback(
    (relationship) => {
      if (!selectedNode) return;

      const id = crypto.randomUUID();
      let x = selectedNode.position.x;
      let y = selectedNode.position.y;
      let label = 'Related';
      let source = selectedNode.id;
      let target = id;
      let sourceHandle;
      let targetHandle;

      if (relationship === 'child' || relationship === 'adopted-child') {
        y += 180;
        x += relationship === 'adopted-child' ? 100 : 0;
        label = relationship === 'adopted-child' ? 'Adopted child' : 'Child';
      }

      if (relationship === 'parent') {
        y -= 180;
        label = 'Parent';
        source = id;
        target = selectedNode.id;
      }

      if (relationship === 'spouse') {
        x += 260;
        label = 'Spouse';
        sourceHandle = 'right';
        targetHandle = 'left-target';
      }

      const relationshipNameMap = {
        child: `Child of ${selectedNode.data.name}`,
        'adopted-child': `Adopted child of ${selectedNode.data.name}`,
        parent: `Parent of ${selectedNode.data.name}`,
        spouse: `Spouse of ${selectedNode.data.name}`,
      };

      const node = makePersonNode({
        id,
        x,
        y,
        name: relationshipNameMap[relationship] || 'New Person',
      });

      const edge = makeRelationshipEdge({
        source,
        target,
        relationship,
        label,
        sourceHandle,
        targetHandle,
      });

      setNodes((nds) => [...nds, node]);
      setEdges((eds) => [...eds, edge]);
      selectNode(id);
    },
    [selectedNode, selectNode, setEdges, setNodes]
  );

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;

    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  }, [selectedNodeId, setEdges, setNodes]);

  const deleteSelectedEdge = useCallback(() => {
    if (!selectedEdgeId) return;
    setEdges((eds) => eds.filter((e) => e.id !== selectedEdgeId));
    setSelectedEdgeId(null);
  }, [selectedEdgeId, setEdges]);

  const clearSavedTree = useCallback(() => {
    const confirmed = window.confirm(
      'Clear the saved family tree from this browser and reset to a fresh tree?'
    );
    if (!confirmed) return;

    window.localStorage.removeItem(STORAGE_KEY);
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSelectedNodeId('1');
    setSelectedEdgeId(null);
    setNewName('');
    setLastSavedAt('');
  }, [setEdges, setNodes]);

  const exportTree = useCallback(() => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      nodes,
      edges,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'family-tree.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [edges, nodes]);

  const importTree = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result || '{}'));
          const importedNodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
          const importedEdges = Array.isArray(parsed.edges) ? parsed.edges : [];

          setNodes(importedNodes.length ? importedNodes : initialNodes);
          setEdges(importedEdges);
          setSelectedNodeId(importedNodes[0]?.id || '1');
          setSelectedEdgeId(null);
        } catch (error) {
          alert('That file could not be imported. Make sure it is a valid family-tree JSON file.');
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    },
    [setEdges, setNodes]
  );

  const stats = useMemo(() => {
    const people = nodes.length;
    const relationshipCounts = edges.reduce((acc, edge) => {
      const key = edge.data?.relationship || 'custom';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return { people, relationshipCounts };
  }, [edges, nodes.length]);

  return (
    <div className="app-shell">
      <Sidebar
        fileInputRef={fileInputRef}
        stats={stats}
        edgesLength={edges.length}
        lastSavedAt={lastSavedAt}
        newName={newName}
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        setNewName={setNewName}
        addStandalonePerson={addStandalonePerson}
        addRelatedPerson={addRelatedPerson}
        updateSelectedNodeField={updateSelectedNodeField}
        deleteSelectedNode={deleteSelectedNode}
        deleteSelectedEdge={deleteSelectedEdge}
        exportTree={exportTree}
        importTree={importTree}
        clearSavedTree={clearSavedTree}
      />

      <main className="canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => selectNode(node.id)}
          onEdgeClick={(_, edge) => {
            setSelectedEdgeId(edge.id);
            setSelectedNodeId(null);
          }}
          onPaneClick={() => setSelectedEdgeId(null)}
          fitView
          minZoom={0.2}
          maxZoom={2.5}
        >
          <Controls />
          <MiniMap zoomable pannable />

          <Panel position="top-right">
            <RelationshipCountsPanel relationshipCounts={stats.relationshipCounts} />
          </Panel>
        </ReactFlow>
      </main>
    </div>
  );
}