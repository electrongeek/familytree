import React from 'react';
import { Field, TextInput, TextArea, Select } from '../ui/fields.jsx';

export default function Sidebar({
  fileInputRef,

  // derived data
  stats,
  edgesLength,
  lastSavedAt,
  newName,
  selectedNode,
  selectedEdge,

  // handlers/state updaters
  setNewName,
  addStandalonePerson,
  addRelatedPerson,
  updateSelectedNodeField,
  deleteSelectedNode,
  deleteSelectedEdge,
  exportTree,
  importTree,
  clearSavedTree,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar__card">
        <div className="sidebar__title">Family Tree Editor</div>
        <div className="sidebar__subtitle">Build visually now, then layer in richer genealogy data later.</div>
        <div className="sidebar__meta">
          {lastSavedAt ? `Auto-saved: ${new Date(lastSavedAt).toLocaleString()}` : 'Not saved yet'}
        </div>

        <div className="sidebar__stats">
          <div className="sidebar__stat">
            <div className="sidebar__stat-label">People</div>
            <div className="sidebar__stat-value">{stats?.people ?? 0}</div>
          </div>
          <div className="sidebar__stat">
            <div className="sidebar__stat-label">Relationships</div>
            <div className="sidebar__stat-value">{edgesLength ?? 0}</div>
          </div>
        </div>

        <div className="sidebar__section">
          <Field label="Quick add person">
            <TextInput
              placeholder="Enter a name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </Field>
          <button className="btn btn--primary" onClick={addStandalonePerson}>
            Add standalone person
          </button>
        </div>

        <div className="sidebar__grid">
          <button className="btn btn--ghost" onClick={() => addRelatedPerson('parent')} disabled={!selectedNode}>
            Add parent
          </button>
          <button className="btn btn--ghost" onClick={() => addRelatedPerson('child')} disabled={!selectedNode}>
            Add child
          </button>
          <button className="btn btn--ghost" onClick={() => addRelatedPerson('spouse')} disabled={!selectedNode}>
            Add spouse
          </button>
          <button className="btn btn--ghost" onClick={() => addRelatedPerson('adopted-child')} disabled={!selectedNode}>
            Add adopted child
          </button>
        </div>

        <div className="sidebar__row">
          <button className="btn btn--dark" onClick={exportTree}>
            Export JSON
          </button>
          <button className="btn btn--ghost" onClick={() => fileInputRef.current?.click()}>
            Import JSON
          </button>
          <button className="btn btn--danger" onClick={clearSavedTree}>
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
          <div className="sidebar__section sidebar__section--divider">
            <div className="sidebar__section-title">Selected person</div>

            <div className="sidebar__stack">
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

              <div className="sidebar__grid sidebar__grid--two">
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

              <button className="btn btn--danger" onClick={deleteSelectedNode}>
                Delete person
              </button>
            </div>
          </div>
        )}

        {!selectedNode && selectedEdge && (
          <div className="sidebar__section sidebar__section--divider">
            <div className="sidebar__section-title">Selected relationship</div>
            <div className="sidebar__edge-card">
              <div>
                <span className="sidebar__edge-label">Type:</span>{' '}
                {selectedEdge.data?.relationship || 'custom'}
              </div>
              <div>
                <span className="sidebar__edge-label">Label:</span> {selectedEdge.label || 'Related'}
              </div>
            </div>
            <button className="btn btn--danger" onClick={deleteSelectedEdge}>
              Delete relationship
            </button>
          </div>
        )}

        <div className="sidebar__section sidebar__section--divider sidebar__tips">
          <div className="sidebar__section-title">Tips:</div>
          <ul>
            <li>Scroll to zoom and drag the canvas to pan.</li>
            <li>Drag nodes to arrange generations however you like.</li>
            <li>Use Export JSON so your work stays portable.</li>
          </ul>
        </div>
      </div>
    </aside>
  );
}