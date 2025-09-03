import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner = ({ 
  message = 'Loading...', 
  size = 'md' 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const currentSizeClass = sizeClasses[size];

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div 
        className={`${currentSizeClass} border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
          {message}
        </p>
      )}
    </div>
  );
};