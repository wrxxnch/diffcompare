import React, { useState } from 'react';
import { 
  History, 
  RotateCcw, 
  Undo2, 
  Redo2, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  ArrowRightLeft, 
  FileEdit, 
  Sparkles, 
  Trash2, 
  Clock, 
  Check, 
  Search,
  ChevronRight
} from 'lucide-react';
import { RevisionSnapshot } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: RevisionSnapshot[];
  currentIndex: number;
  onRevertToSnapshot: (index: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  currentIndex,
  onRevertToSnapshot,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClearHistory
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getRelativeTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 10) return 'Agora mesmo';
    if (diffSec < 60) return `Há ${diffSec}s`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Há ${diffMin}m`;
    const diffHour = Math.floor(diffMin / 60);
    return `Há ${diffHour}h`;
  };

  const getTypeIcon = (type: RevisionSnapshot['type']) => {
    switch (type) {
      case 'transfer':
        return <ArrowRight className="w-3.5 h-3.5 text-blue-400" />;
      case 'apply_all':
        return <ArrowRight className="w-3.5 h-3.5 text-purple-400" />;
      case 'swap':
        return <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />;
      case 'reset':
        return <RotateCcw className="w-3.5 h-3.5 text-slate-400" />;
      case 'clear':
        return <Trash2 className="w-3.5 h-3.5 text-rose-400" />;
      case 'import':
        return <Sparkles className="w-3.5 h-3.5 text-indigo-400" />;
      case 'preset':
        return <Clock className="w-3.5 h-3.5 text-emerald-400" />;
      case 'edit':
      default:
        return <FileEdit className="w-3.5 h-3.5 text-teal-400" />;
    }
  };

  const filteredHistory = history
    .map((item, idx) => ({ item, originalIndex: idx }))
    .filter(({ item }) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.filenameA.toLowerCase().includes(q) ||
        item.filenameB.toLowerCase().includes(q)
      );
    })
    .reverse(); // Show latest at top

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-100 text-sm">Histórico de Alterações</h2>
              <p className="text-[11px] text-slate-400">
                {history.length} {history.length === 1 ? 'versão salva' : 'versões salvas'} na linha do tempo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Action Bar: Undo, Redo, Shortcuts info */}
        <div className="p-3 bg-slate-950/50 border-b border-slate-800/80 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Desfazer alteração anterior (Ctrl+Z)"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 border border-slate-700 transition-colors font-medium text-xs"
            >
              <Undo2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Desfazer</span>
              <kbd className="text-[9px] bg-slate-950 px-1 py-0.5 rounded text-slate-400 ml-0.5">Ctrl+Z</kbd>
            </button>

            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Refazer alteração (Ctrl+Y / Ctrl+Shift+Z)"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 border border-slate-700 transition-colors font-medium text-xs"
            >
              <Redo2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Refazer</span>
              <kbd className="text-[9px] bg-slate-950 px-1 py-0.5 rounded text-slate-400 ml-0.5">Ctrl+Y</kbd>
            </button>
          </div>

          {history.length > 1 && (
            <button
              onClick={onClearHistory}
              title="Limpar snapshots antigos do histórico"
              className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors px-1 py-0.5"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Search in History */}
        <div className="p-3 border-b border-slate-800 bg-slate-900/50">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrar histórico..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Revision Timeline List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 select-none">
          {filteredHistory.map(({ item, originalIndex }) => {
            const isCurrent = originalIndex === currentIndex;
            const isPast = originalIndex < currentIndex;
            const isFuture = originalIndex > currentIndex;

            return (
              <div
                key={item.id}
                onClick={() => onRevertToSnapshot(originalIndex)}
                className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-950/40 border-blue-500/60 ring-1 ring-blue-500/40 shadow-md'
                    : isFuture
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-60 hover:opacity-100 hover:bg-slate-850 hover:border-slate-700'
                      : 'bg-slate-950/80 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                {/* Active Indicator & Type Icon */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded-md bg-slate-900 border border-slate-800`}>
                      {getTypeIcon(item.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-semibold ${isCurrent ? 'text-blue-300' : 'text-slate-200'}`}>
                          {item.title}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded border border-blue-400/30 flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Atual
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {formatTime(item.timestamp)} • {getRelativeTime(item.timestamp)}
                      </div>
                    </div>
                  </div>

                  {/* Revert Button on Hover */}
                  {!isCurrent && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRevertToSnapshot(originalIndex);
                      }}
                      className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold rounded-md transition-all shadow-xs flex items-center gap-1"
                    >
                      <span>Voltar aqui</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Description if any */}
                {item.description && (
                  <p className="text-[11px] text-slate-400 mt-1 mb-2 font-sans line-clamp-2">
                    {item.description}
                  </p>
                )}

                {/* Diff Stats Badge and Filenames */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-850/80 text-[10px] font-mono text-slate-400">
                  <div className="truncate max-w-[200px]" title={`${item.filenameA} ↔ ${item.filenameB}`}>
                    {item.filenameA}
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.summary.additions > 0 && (
                      <span className="text-emerald-400 font-bold">+{item.summary.additions}</span>
                    )}
                    {item.summary.deletions > 0 && (
                      <span className="text-rose-400 font-bold">-{item.summary.deletions}</span>
                    )}
                    {item.summary.modifications > 0 && (
                      <span className="text-amber-400 font-bold">~{item.summary.modifications}</span>
                    )}
                    {item.summary.additions === 0 && item.summary.deletions === 0 && item.summary.modifications === 0 && (
                      <span className="text-slate-500">Idênticos</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredHistory.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-xs">
              Nenhuma alteração encontrada para a busca "{searchQuery}"
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Dica: Use <kbd className="px-1 py-0.5 bg-slate-900 rounded border border-slate-800 text-slate-400">Ctrl+Z</kbd> / <kbd className="px-1 py-0.5 bg-slate-900 rounded border border-slate-800 text-slate-400">Ctrl+Y</kbd></span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
