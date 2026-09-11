/**
 * DiffLineDisplay Component
 * Design Philosophy: Modern SaaS - Emerald & Rose Color Scheme
 * - Green (#10b981) para adições
 * - Red (#ef4444) para deleções
 * - Gray para linhas inalteradas
 */

import { DiffLine } from '@/hooks/useDiffCalculator';

interface DiffLineDisplayProps {
  line: DiffLine;
  isSelected?: boolean;
  onTransfer?: () => void;
  transferDirection?: 'left-to-right' | 'right-to-left';
}

export function DiffLineDisplay({
  line,
  isSelected = false,
  onTransfer,
  transferDirection,
}: DiffLineDisplayProps) {
  const getBackgroundColor = () => {
    if (line.type === 'add') return 'bg-emerald-50 hover:bg-emerald-100';
    if (line.type === 'remove') return 'bg-rose-50 hover:bg-rose-100';
    return 'bg-white hover:bg-gray-50';
  };

  const getBorderColor = () => {
    if (line.type === 'add') return 'border-l-4 border-emerald-500';
    if (line.type === 'remove') return 'border-l-4 border-rose-500';
    return 'border-l-4 border-transparent';
  };

  const getTextColor = () => {
    if (line.type === 'add') return 'text-emerald-900';
    if (line.type === 'remove') return 'text-rose-900';
    return 'text-gray-900';
  };

  const getIndicatorSymbol = () => {
    if (line.type === 'add') return '+';
    if (line.type === 'remove') return '−';
    return ' ';
  };

  const getIndicatorColor = () => {
    if (line.type === 'add') return 'text-emerald-600';
    if (line.type === 'remove') return 'text-rose-600';
    return 'text-gray-400';
  };

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-2 transition-colors
        ${getBackgroundColor()}
        ${getBorderColor()}
        ${isSelected ? 'ring-2 ring-offset-1 ring-blue-400' : ''}
      `}
    >
      {/* Line number */}
      <div className="flex-shrink-0 w-10 text-right">
        <span className="text-xs text-gray-500 font-mono">
          {line.lineNumber}
        </span>
      </div>

      {/* Indicator symbol */}
      <div className={`flex-shrink-0 w-4 text-center font-bold ${getIndicatorColor()}`}>
        {getIndicatorSymbol()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <code className={`text-sm font-mono break-words whitespace-pre-wrap ${getTextColor()}`}>
          {line.content || '\u00A0'} {/* Non-breaking space for empty lines */}
        </code>
      </div>

      {/* Transfer button */}
      {onTransfer && line.type !== 'unchanged' && (
        <button
          onClick={onTransfer}
          className={`
            flex-shrink-0 px-2 py-1 rounded text-xs font-medium transition-all
            ${
              transferDirection === 'left-to-right'
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-rose-500 hover:bg-rose-600 text-white'
            }
          `}
          title={
            transferDirection === 'left-to-right'
              ? 'Transferir para a direita'
              : 'Transferir para a esquerda'
          }
        >
          {transferDirection === 'left-to-right' ? '→' : '←'}
        </button>
      )}
    </div>
  );
}
