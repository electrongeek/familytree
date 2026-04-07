import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import FamilyTreeCanvas from './components/FamilyTreeCanvas.jsx';

export default function App() {
  return (
    <ReactFlowProvider>
      <FamilyTreeCanvas />
    </ReactFlowProvider>
  );
}