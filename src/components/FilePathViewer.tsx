import React, { useState, useRef, useEffect } from 'react';
import { Folder, FileText, Copy, Check, ChevronRight, Edit2, Info, Sparkles, HardDrive } from 'lucide-react';

interface FilePathViewerProps {
  idPrefix: string;
  side: 'left' | 'right';
  fullPath: string;
  onChangePath: (newPath: string) => void;
  lineCount: number;
}

export const FilePathViewer: React.FC<FilePathViewerProps> = ({
  idPrefix,
  side,
  fullPath,
  onChangePath,
  lineCount
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [tempPath, setTempPath] = useState(fullPath);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempPath(fullPath);
  }, [fullPath]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    };
    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPopoverOpen]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fullPath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Split path into directory and file
  const normalized = fullPath.replace(/\\/g, '/');
  const lastSlashIndex = normalized.lastIndexOf('/');
  const directory = lastSlashIndex !== -1 ? normalized.slice(0, lastSlashIndex + 1) : '';
  const baseName = lastSlashIndex !== -1 ? normalized.slice(lastSlashIndex + 1) : normalized;
  const segments = normalized.split('/').filter(Boolean);

  const dotColor = side === 'left' ? 'bg-rose-500' : 'bg-emerald-500';
  const ringColor = side === 'left' ? 'focus:ring-rose-500/50' : 'focus:ring-emerald-500/50';

  const applyPrefixPreset = (prefix: string) => {
    const cleanBase = baseName || 'arquivo.ts';
    const newPath = `${prefix.endsWith('/') ? prefix : prefix + '/'}${cleanBase}`;
    onChangePath(newPath);
  };

  return (
    <div className="flex items-center gap-1.5 min-w-0 flex-1 relative" ref={popoverRef}>
      {/* Side Color Dot */}
      <span className={`h-2 w-2 rounded-full ${dotColor} shrink-0`} />

      {/* Origin Path Tag & Full Editable Input */}
      <div className="relative flex items-center min-w-0 flex-1 bg-slate-900/90 hover:bg-slate-900 border border-slate-750/90 hover:border-slate-600 rounded-md px-2 py-1 transition-all shadow-xs group">
        <span className="text-[10px] font-bold tracking-wider text-slate-400 select-none mr-1.5 flex items-center gap-1 shrink-0 uppercase font-sans">
          <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Origem:</span>
        </span>
        <input
          id={`${idPrefix}-input`}
          type="text"
          value={fullPath}
          onChange={(e) => onChangePath(e.target.value)}
          placeholder="C:/Users/Usuario/caminho/arquivo.ext"
          title={`Caminho completo de origem: ${fullPath || '(Sem caminho)'} — Clique para editar`}
          className={`bg-transparent text-slate-100 font-mono text-xs font-semibold focus:outline-hidden focus:ring-1 ${ringColor} rounded px-1 py-0.5 flex-1 min-w-[140px] truncate transition-all`}
        />
        <button
          type="button"
          onClick={handleCopy}
          title="Copiar caminho completo"
          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-slate-200 transition-opacity shrink-0 ml-1"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>

      {/* Complete Path Inspector / Info Button */}
      <button
        id={`${idPrefix}-btn-full-path`}
        type="button"
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
        title={`Visualizar caminho completo detalhado e gerenciar diretórios (${fullPath})`}
        className={`p-1 rounded text-slate-400 hover:text-slate-200 transition-colors shrink-0 ${
          isPopoverOpen ? 'bg-slate-800 text-slate-100' : 'hover:bg-slate-850'
        }`}
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {/* Line Count Tag */}
      <span className="text-[11px] text-slate-500 font-mono shrink-0 hidden lg:inline">
        ({lineCount} linhas)
      </span>

      {/* Full Path Popover Card */}
      {isPopoverOpen && (
        <div 
          id={`${idPrefix}-popover-card`}
          className="absolute left-0 top-full mt-2 w-80 sm:w-96 md:w-[420px] bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 p-3.5 text-xs backdrop-blur-md animate-fadeIn"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <Folder className={`w-4 h-4 ${side === 'left' ? 'text-rose-400' : 'text-emerald-400'}`} />
              <span>Caminho de Origem Completo</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] transition-colors"
              title="Copiar caminho completo para a área de transferência"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-300">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>

          {/* Breadcrumb representation */}
          {segments.length > 1 && (
            <div className="mb-2.5 bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 flex flex-wrap items-center gap-1 font-mono text-[11px]">
              {segments.map((seg, idx) => {
                const isLast = idx === segments.length - 1;
                return (
                  <React.Fragment key={idx}>
                    <span className={isLast ? 'text-slate-100 font-bold' : 'text-slate-400'}>
                      {seg}
                    </span>
                    {!isLast && <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* Full Path Text Box */}
          <div className="space-y-2.5">
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">
                Caminho completo registrado:
              </label>
              <div className="p-2 bg-slate-950 text-slate-200 font-mono text-xs rounded-lg border border-slate-800 select-all break-all shadow-inner">
                {fullPath || '(Sem caminho definido)'}
              </div>
            </div>

            {/* Quick Windows Path Presets */}
            <div>
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mb-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Atalhos rápidos de Pasta Windows (C:/Users/...):
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPrefixPreset('C:/Users/JeanPierre/Projetos')}
                  className="p-1.5 rounded bg-slate-950/90 hover:bg-slate-800 border border-slate-800 text-left text-[10px] font-mono text-slate-300 hover:text-white transition-colors"
                >
                  <span className="text-slate-500 block text-[9px] font-sans">Projetos</span>
                  C:/Users/.../Projetos/
                </button>
                <button
                  type="button"
                  onClick={() => applyPrefixPreset('C:/Users/JeanPierre/Downloads')}
                  className="p-1.5 rounded bg-slate-950/90 hover:bg-slate-800 border border-slate-800 text-left text-[10px] font-mono text-slate-300 hover:text-white transition-colors"
                >
                  <span className="text-slate-500 block text-[9px] font-sans">Downloads</span>
                  C:/Users/.../Downloads/
                </button>
                <button
                  type="button"
                  onClick={() => applyPrefixPreset('C:/Projetos/sistema')}
                  className="p-1.5 rounded bg-slate-950/90 hover:bg-slate-800 border border-slate-800 text-left text-[10px] font-mono text-slate-300 hover:text-white transition-colors"
                >
                  <span className="text-slate-500 block text-[9px] font-sans">Diretório C:</span>
                  C:/Projetos/sistema/
                </button>
                <button
                  type="button"
                  onClick={() => applyPrefixPreset('D:/Workspace')}
                  className="p-1.5 rounded bg-slate-950/90 hover:bg-slate-800 border border-slate-800 text-left text-[10px] font-mono text-slate-300 hover:text-white transition-colors"
                >
                  <span className="text-slate-500 block text-[9px] font-sans">Drive D:</span>
                  D:/Workspace/
                </button>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-400">
              <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
                <span className="text-slate-500 block">Arquivo:</span>
                <span className="font-mono text-slate-200 font-medium truncate block">
                  {baseName || '-'}
                </span>
              </div>
              <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
                <span className="text-slate-500 block">Diretório:</span>
                <span className="font-mono text-slate-200 font-medium truncate block">
                  {directory || 'C:/Users/JeanPierre/...'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
