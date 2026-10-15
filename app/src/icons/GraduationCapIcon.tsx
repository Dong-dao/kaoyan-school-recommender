import React from 'react';

interface GraduationCapIconProps {
  size?: number;
  color?: string;
}

const GraduationCapIcon: React.FC<GraduationCapIconProps> = ({ size = 24, color = '#1E40AF' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
};

export default GraduationCapIcon;
