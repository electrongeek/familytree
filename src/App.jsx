import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
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

function PersonNode({ data, selected }) {
  return (
    <div
      className={`min-w-[200px] rounded-2xl border bg-white px-4 py-3 shadow-md transition-all ${
        selected ? 'border-black shadow-lg' : 'border-neutral-300'
      }`}
    >
      <Handle type="target" position={Position.Top} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-neutral-900">
            {data.name || 'Unnamed Person'}
          </div>
          <div className="mt-1 text-xs text-neutral-500">
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
            className="h-12 w-12 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-lg font-semibold text-neutral-400">
            {(data.name || '?').charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {data.notes ? (
        <div className="mt-3 line-clamp-3 text-xs text-neutral-600">{data.notes}</div>
      ) : (
        <div className="mt-3 text-xs text-neutral-400">No notes yet</div>
      )}

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

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      {children}
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-500"
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className="min-h-[84px] w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-500"
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-500"
    />
  );
}

function FamilyTreeCanvas() {
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

  const clearEdgeSelection = useCallback(() => setSelectedEdgeId(null), []);

  const onConnect = useCallback(
    (params) => {
      clearEdgeSelection();
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
    [setEdges, clearEdgeSelection]
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
    const relationshipCounts = edges.reduce(
      (acc, edge) => {
        const key = edge.data?.relationship || 'custom';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {}
    );
    return { people, relationshipCounts };
  }, [edges, nodes.length]);

  return (
    <div className="h-screen w-full bg-neutral-100">
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
        onPaneClick={() => {
          setSelectedEdgeId(null);
        }}
        fitView
        minZoom={0.2}
        maxZoom={2.5}
      >
        <Background gap={20} size={1} />
        <Controls />
        <MiniMap zoomable pannable />

        <Panel position="top-left">
          <div className="w-[320px] rounded-3xl border border-neutral-200 bg-white p-4 shadow-xl">
            <div className="text-lg font-semibold text-neutral-900">Family Tree Editor</div>
            <div className="mt-1 text-xs text-neutral-500">
              Build visually now, then layer in richer genealogy data later.
            </div>
            <div className="mt-1 text-[11px] text-neutral-500">
              {lastSavedAt
                ? `Auto-saved: ${new Date(lastSavedAt).toLocaleString()}`
                : 'Not saved yet'}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-neutral-50 p-3 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-neutral-500">People</div>
                <div className="font-semibold text-neutral-900">{stats.people}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-neutral-500">Relationships</div>
                <div className="font-semibold text-neutral-900">{edges.length}</div>
              </div>
            </div>

            <div className="mt-4">
              <Field label="Quick add person">
                <TextInput
                  placeholder="Enter a name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </Field>
              <button
                onClick={addStandalonePerson}
                className="mt-2 w-full rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white"
              >
                Add standalone person
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => addRelatedPerson('parent')}
                disabled={!selectedNode}
                className="rounded-2xl border border-neutral-300 bg-white px-3 py-2 text-sm disabled:opacity-40"
              >
                Add parent
              </button>
              <button
                onClick={() => addRelatedPerson('child')}
                disabled={!selectedNode}
                className="rounded-2xl border border-neutral-300 bg-white px-3 py-2 text-sm disabled:opacity-40"
              >
                Add child
              </button>
              <button
                onClick={() => addRelatedPerson('spouse')}
                disabled={!selectedNode}
                className="rounded-2xl border border-neutral-300 bg-white px-3 py-2 text-sm disabled:opacity-40"
              >
                Add spouse
              </button>
              <button
                onClick={() => addRelatedPerson('adopted-child')}
                disabled={!selectedNode}
                className="rounded-2xl border border-neutral-300 bg-white px-3 py-2 text-sm disabled:opacity-40"
              >
                Add adopted child
              </button>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={exportTree}
                className="flex-1 rounded-2xl bg-neutral-900 px-3 py-2 text-sm text-white"
              >
                Export JSON
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 rounded-2xl border border-neutral-300 bg-white px-3 py-2 text-sm"
              >
                Import JSON
              </button>
              <button
                onClick={clearSavedTree}
                className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                Reset
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={importTree}
              />
            </div>

            {selectedNode && (
              <div className="mt-5 border-t border-neutral-200 pt-4">
                <div className="mb-3 text-sm font-semibold text-neutral-900">Selected person</div>
                <div className="space-y-3">
                  <Field label="Name">
                    <TextInput
                      value={selectedNode.data.name || ''}
                      onChange={(e) => updateSelectedNodeField('name', e.target.value)}
                    />
                  </Field>

                  <Field label="Gender">
                    <Select
                      value={selectedNode.data.gender || 'Unknown'}
                      onChange={(e) => updateSelectedNodeField('gender', e.target.value)}
                    >
                      <option>Unknown</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Non-binary</option>
                    </Select>
                  </Field>

                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Birth date">
                      <TextInput
                        placeholder="YYYY-MM-DD"
                        value={selectedNode.data.birthDate || ''}
                        onChange={(e) => updateSelectedNodeField('birthDate', e.target.value)}
                      />
                    </Field>
                    <Field label="Death date">
                      <TextInput
                        placeholder="YYYY-MM-DD"
                        value={selectedNode.data.deathDate || ''}
                        onChange={(e) => updateSelectedNodeField('deathDate', e.target.value)}
                      />
                    </Field>
                  </div>

                  <Field label="Photo URL">
                    <TextInput
                      placeholder="https://..."
                      value={selectedNode.data.photo || ''}
                      onChange={(e) => updateSelectedNodeField('photo', e.target.value)}
                    />
                  </Field>

                  <Field label="Notes">
                    <TextArea
                      value={selectedNode.data.notes || ''}
                      onChange={(e) => updateSelectedNodeField('notes', e.target.value)}
                    />
                  </Field>

                  <button
                    onClick={deleteSelectedNode}
                    className="w-full rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
                  >
                    Delete person
                  </button>
                </div>
              </div>
            )}

            {!selectedNode && selectedEdge && (
              <div className="mt-5 border-t border-neutral-200 pt-4">
                <div className="mb-2 text-sm font-semibold text-neutral-900">
                  Selected relationship
                </div>
                <div className="rounded-2xl bg-neutral-50 p-3 text-sm text-neutral-700">
                  <div>
                    <span className="font-medium">Type:</span>{' '}
                    {selectedEdge.data?.relationship || 'custom'}
                  </div>
                  <div className="mt-1">
                    <span className="font-medium">Label:</span> {selectedEdge.label || 'Related'}
                  </div>
                </div>
                <button
                  onClick={deleteSelectedEdge}
                  className="mt-3 w-full rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
                >
                  Delete relationship
                </button>
              </div>
            )}

            <div className="mt-5 border-t border-neutral-200 pt-4 text-xs text-neutral-500">
              <div>Tips:</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Scroll to zoom and drag the canvas to pan.</li>
                <li>Drag nodes to arrange generations however you like.</li>
                <li>Use Export JSON so your work stays portable.</li>
              </ul>
            </div>
          </div>
        </Panel>

        <Panel position="top-right">
          <div className="rounded-3xl border border-neutral-200 bg-white px-4 py-3 shadow-lg">
            <div className="text-xs uppercase tracking-wide text-neutral-500">
              Relationship counts
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {Object.entries(stats.relationshipCounts).length === 0 ? (
                <span className="rounded-full bg-neutral-100 px-2 py-1 text-neutral-500">
                  None yet
                </span>
              ) : (
                Object.entries(stats.relationshipCounts).map(([key, value]) => (
                  <span
                    key={key}
                    className="rounded-full bg-neutral-100 px-2 py-1 text-neutral-700"
                  >
                    {key}: {value}
                  </span>
                ))
              )}
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <FamilyTreeCanvas />
    </ReactFlowProvider>
  );
}