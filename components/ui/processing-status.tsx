import React from 'react';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';

interface ProcessingStatusProps {
  mode: 'client' | 'server';
  isProcessing: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSwitchMode?: () => void;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  mode,
  isProcessing,
  error,
  onRetry,
  onSwitchMode
}) => {
  if (!isProcessing && !error) return null;

  return (
    <div className="mt-3 p-3 rounded-lg border">
      {isProcessing && (
        <div className="flex items-center gap-3">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {mode === 'server' ? 'Processing on server...' : 'Processing in browser...'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {mode === 'server' 
                ? 'Server processing memungkinkan hasil lebih cepat dan akurat'
                : 'Client processing menggunakan resource browser Anda'
              }
            </p>
          </div>
          {mode === 'server' && <Wifi className="h-4 w-4 text-green-500" />}
          {mode === 'client' && <WifiOff className="h-4 w-4 text-blue-500" />}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              Processing failed
            </p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-1">
              {error}
            </p>
            <div className="flex gap-2 mt-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                >
                  Try Again
                </button>
              )}
              {mode === 'server' && onSwitchMode && (
                <button
                  onClick={onSwitchMode}
                  className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                >
                  Try Client Mode
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};