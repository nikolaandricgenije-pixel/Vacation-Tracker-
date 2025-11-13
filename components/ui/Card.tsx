import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg dark:shadow-slate-900/20 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/10 dark:hover:shadow-slate-900/30 hover:-translate-y-0.5 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
