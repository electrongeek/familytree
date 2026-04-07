import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function PersonNode({ data, selected }) {
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