import React from 'react';

export interface WorkstreamHeaderProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export const WorkstreamHeader: React.FC<WorkstreamHeaderProps> = ({
  title,
  subtitle,
  children
}) => {
  return (
    <header className="workstream-header border-b border-gray-200 bg-white px-6 py-4">
      {title && <h2 className="text-xl font-bold text-gray-900">{title}</h2>}
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      {children}
    </header>
  );
};
