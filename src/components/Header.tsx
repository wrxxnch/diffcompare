import React from 'react';
import { 
  FileCode2, 
  FolderGit2, 
  Columns, 
  Rows, 
  Settings, 
  Download, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  History
} from 'lucide-react';
import { ActiveTabMode, DiffSettings, DiffSummary } from '../types';

interface HeaderProps {
  activeTab: ActiveTabMode;
  setActiveTab: (tab: ActiveTabMode) => void;
  settings: DiffSettings;
  setSettings: React.Dispatch<React.SetStateAction<DiffSettings>>;
  summary: DiffSummary;
  onOpenSettings: () => void;
  onOpenImportModal: () => void;
  onExportPatch: () => void;
  onOpenHistory?: () => void;
  historyCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  settings,
  setSettings,
  summary,
  onOpenSettings,
  onOpenImportModal,
  onExportPatch,
  onOpenHistory,
  historyCount = 1
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold text-lg">
            <span className="font-mono text-sm tracking-tighter">Δ</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100 tracking-tight">
                DiffStudio
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Tempo Real
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Comparador e mesclador semântico de arquivos e diretórios
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            id="tab-single-file"
            onClick={() => setActiveTab('single')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'single'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Arquivo Único</span>
          </button>
          <button
            id="tab-multi-folder"
            onClick={() => setActiveTab('multi')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'multi'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Pastas & Múltiplos Arquivos</span>
          </button>
        </div>

        {/* Actions & Metrics */}
        <div className="flex items-center gap-2">
          {/* Quick Stats */}
          {activeTab === 'single' && (
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800/80 text-xs font-mono">
              {summary.identical ? (
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Arquivos Idênticos
                </span>
              ) : (
                <>
                  <span className="text-emerald-400 font-semibold">+{summary.additions}</span>
                  <span className="text-slate-600">/</span>
                  <span className="text-rose-400 font-semibold">-{summary.deletions}</span>
                  <span className="text-slate-500 text-[11px]">({summary.totalChunks} blocos)</span>
                </>
              )}
            </div>
          )}

          {/* Import / Compare Sources Button */}
          <button
            id="btn-open-import"
            onClick={onOpenImportModal}
            title="Importar do computador, comparar 2 URLs ou repositórios GitHub / Codeberg"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 transition-all transform hover:scale-[1.02]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Importar / URLs / Git</span>
          </button>

          {/* View Mode Toggle (Split / Unified) */}
          {activeTab === 'single' && (
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                id="btn-view-split"
                title="Visualização Lado a Lado (Split)"
                onClick={() => setSettings(prev => ({ ...prev, viewMode: 'split' }))}
                className={`p-1.5 rounded text-xs transition-colors ${
                  settings.viewMode === 'split'
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-view-unified"
                title="Visualização Unificada (Inline)"
                onClick={() => setSettings(prev => ({ ...prev, viewMode: 'unified' }))}
                className={`p-1.5 rounded text-xs transition-colors ${
                  settings.viewMode === 'unified'
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Rows className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Export Patch Button */}
          {activeTab === 'single' && (
            <button
              id="btn-export-patch"
              onClick={onExportPatch}
              title="Exportar como arquivo de patch .diff"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Exportar .diff</span>
            </button>
          )}

          {/* History Button */}
          {activeTab === 'single' && onOpenHistory && (
            <button
              id="btn-header-history"
              onClick={onOpenHistory}
              title="Histórico de alterações e revisões (Ctrl+Z / Ctrl+Y)"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <History className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Histórico</span>
              {historyCount > 1 && (
                <span className="px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-400/30">
                  {historyCount}
                </span>
              )}
            </button>
          )}

          {/* Settings Button */}
          <button
            id="btn-open-settings"
            onClick={onOpenSettings}
            title="Configurações de Comparação & GitHub Actions"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
