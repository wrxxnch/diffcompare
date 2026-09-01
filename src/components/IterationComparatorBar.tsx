import React from 'react';
import { 
  GitCompare, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRightLeft, 
  X, 
  History, 
  Clock, 
  Layers,
  Sparkles
} from 'lucide-react';
import { RevisionSnapshot } from '../types';

interface IterationComparatorBarProps {
  history: RevisionSnapshot[];
  iterationAIndex: number;
  iterationBIndex: number;
  onChangeIterationA: (index: number) => void;
  onChangeIterationB: (index: number) => void;
  onClose: () => void;
  onStepPrevious: () => void;
  onStepNext: () => void;
  onStepCompareLatest: () => void;
  onSwapIterations: () => void;
}

export const IterationComparatorBar: React.FC<IterationComparatorBarProps> = ({
  history,
  iterationAIndex,
  iterationBIndex,
  onChangeIterationA,
  onChangeIterationB,
  onClose,
  onStepPrevious,
  onStepNext,
  onStepCompareLatest,
  onSwapIterations,
}) => {
  const formatTime = (ts: number) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(ts));
  };

  const itemA = history[iterationAIndex] || history[0];
  const itemB = history[iterationBIndex] || history[history.length - 1];

  return (
    <div 
      id="iteration-comparator-bar"
      className="bg-indigo-950/40 border-b border-indigo-900/50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-inner backdrop-blur-xs animate-fadeIn"
    >
      {/* Left: Mode Badge & Description */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-600/30 text-indigo-300 font-semibold border border-indigo-500/40 shadow-xs">
          <GitCompare className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>Modo Comparar Iteração</span>
        </div>
        <span className="text-slate-400 hidden lg:inline">
          Comparando versões pontuais do histórico ({history.length} registradas)
        </span>
      </div>

      {/* Center: Iteration A & Iteration B selectors with Swap */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Iteration A (Left) */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-indigo-500/30">
          <span className="text-blue-400 font-bold text-[11px] uppercase">Lado A:</span>
          <select
            id="select-iteration-a"
            value={iterationAIndex}
            onChange={(e) => onChangeIterationA(Number(e.target.value))}
            className="bg-slate-800 text-slate-200 text-xs rounded px-2 py-0.5 border border-slate-700 focus:outline-hidden focus:border-blue-500 cursor-pointer max-w-[200px] truncate"
          >
            {history.map((rev, idx) => (
              <option key={rev.id} value={idx}>
                #{idx + 1} - {rev.title} ({formatTime(rev.timestamp)})
              </option>
            ))}
          </select>
        </div>

        {/* Swap Button */}
        <button
          id="btn-swap-iterations"
          onClick={onSwapIterations}
          title="Inverter iterações selecionadas"
          className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
        </button>

        {/* Iteration B (Right) */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-purple-500/30">
          <span className="text-purple-400 font-bold text-[11px] uppercase">Lado B:</span>
          <select
            id="select-iteration-b"
            value={iterationBIndex}
            onChange={(e) => onChangeIterationB(Number(e.target.value))}
            className="bg-slate-800 text-slate-200 text-xs rounded px-2 py-0.5 border border-slate-700 focus:outline-hidden focus:border-purple-500 cursor-pointer max-w-[200px] truncate"
          >
            {history.map((rev, idx) => (
              <option key={rev.id} value={idx}>
                #{idx + 1} - {rev.title} ({formatTime(rev.timestamp)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Quick Stepper Actions and Close */}
      <div className="flex items-center gap-1.5">
        {/* Step Previous */}
        <button
          id="btn-step-prev-iteration"
          onClick={onStepPrevious}
          disabled={iterationBIndex <= 1 && iterationAIndex <= 0}
          title="Recuar uma iteração no passo a passo"
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 border border-slate-700 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {/* Step Next */}
        <button
          id="btn-step-next-iteration"
          onClick={onStepNext}
          disabled={iterationBIndex >= history.length - 1}
          title="Avançar uma iteração no passo a passo"
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 border border-slate-700 transition-colors"
        >
          <span className="hidden sm:inline">Próxima</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Quick: Compare (N-1 vs N) */}
        {history.length > 1 && (
          <button
            id="btn-compare-latest"
            onClick={onStepCompareLatest}
            title="Comparar a última alteração com a versão anterior (N-1 vs N)"
            className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 transition-colors"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span className="hidden md:inline">Último Passo</span>
          </button>
        )}

        <div className="h-4 w-px bg-slate-800 mx-1" />

        {/* Close Mode */}
        <button
          id="btn-close-iteration-mode"
          onClick={onClose}
          title="Sair do modo de comparação de iterações e voltar aos arquivos normais"
          className="flex items-center gap-1 px-2 py-1 rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};
