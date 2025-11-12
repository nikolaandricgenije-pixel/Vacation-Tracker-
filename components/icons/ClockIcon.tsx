import React from 'react';

function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx={12} cy={12} r={10} />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  );
}

export default ClockIcon;