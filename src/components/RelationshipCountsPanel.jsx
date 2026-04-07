import React from 'react';

export default function RelationshipCountsPanel({ relationshipCounts }) {
  const entries = Object.entries(relationshipCounts || {});
  return (
    <div className="relationship-counts">
      <div className="relationship-counts__title">Relationship counts</div>
      <div className="relationship-counts__badges">
        {entries.length === 0 ? (
          <span className="relationship-counts__badge is-muted">None yet</span>
        ) : (
          entries.map(([key, value]) => (
            <span key={key} className="relationship-counts__badge">
              {key}: {value}
            </span>
          ))
        )}
      </div>
    </div>
  );
}