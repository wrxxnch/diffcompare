import React, { useState } from 'react';
import { 
  FolderGit2, 
  Upload, 
  Search, 
  FileCode, 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle, 
  Trash2, 
  Download, 
  ArrowRight, 
  ChevronRight, 
  Sparkles,
  Archive,
  RefreshCw,
  FolderOpen,
  Folder
} from 'lucide-react';
import JSZip from 'jszip';
import { FileItem, DiffSettings } from '../types';

interface FolderComparatorProps {
  files: FileItem[];
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
  selectedFileId: string | null;
  onSelectFile: (file: FileItem) => void;
  onOpenDiffForFile: (file: FileItem) => void;
  onOpenImportModal?: () => void;
}

export const FolderComparator: React.FC<FolderComparatorProps> = ({
  files,
  setFiles,
  selectedFileId,
  onSelectFile,
  onOpenDiffForFile,
  onOpenImportModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'modified' | 'added' | 'deleted' | 'identical'>('all');
  const [isExportingZip, setIsExportingZip] = useState(false);

  // Filter files
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : file.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const stats = {
    total: files.length,
    modified: files.filter(f => f.status === 'modified').length,
    added: files.filter(f => f.status === 'added').length,
    deleted: files.filter(f => f.status === 'deleted').length,
    identical: files.filter(f => f.status === 'identical').length,
    totalAdditions: files.reduce((acc, f) => acc + f.additions, 0),
    totalDeletions: files.reduce((acc, f) => acc + f.deletions, 0)
  };

  // Upload folder left
  const handleUploadFolder = (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    const fileMap = new Map<string, { name: string; content: string }>();

    let pending = uploadedFiles.length;
    Array.from(uploadedFiles).forEach((file: File) => {
      const relativePath = (file as any).webkitRelativePath || file.name;
      // Strip top folder name if present
      const cleanPath = relativePath.includes('/') 
        ? relativePath.substring(relativePath.indexOf('/') + 1)
        : relativePath;

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = (event.target?.result as string) || '';
        fileMap.set(cleanPath, { name: file.name, content });
        pending--;
        if (pending === 0) {
          mergeUploadedFilesIntoState(fileMap, side);
        }
      };
      reader.readAsText(file);
    });
  };

  const mergeUploadedFilesIntoState = (
    uploadedMap: Map<string, { name: string; content: string }>,
    side: 'left' | 'right'
  ) => {
    setFiles(prevFiles => {
      const existingMap = new Map<string, FileItem>();
      prevFiles.forEach(f => existingMap.set(f.path, { ...f }));

      uploadedMap.forEach(({ name, content }, path) => {
        if (existingMap.has(path)) {
          const item = existingMap.get(path)!;
          if (side === 'left') {
            item.leftContent = content;
          } else {
            item.rightContent = content;
          }
          // Recalculate status
          item.status = calculateFileStatus(item.leftContent, item.rightContent);
        } else {
          // New file
          const newItem: FileItem = {
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            path,
            name,
            leftContent: side === 'left' ? content : '',
            rightContent: side === 'right' ? content : '',
            status: side === 'left' ? 'deleted' : 'added',
            additions: side === 'right' ? content.split('\n').length : 0,
            deletions: side === 'left' ? content.split('\n').length : 0,
            extension: name.split('.').pop() || 'txt'
          };
          existingMap.set(path, newItem);
        }
      });

      return Array.from(existingMap.values());
    });
  };

  const calculateFileStatus = (left: string, right: string): 'modified' | 'added' | 'deleted' | 'identical' => {
    if (!left && right) return 'added';
    if (left && !right) return 'deleted';
    if (left === right) return 'identical';
    return 'modified';
  };

  // Export Folder B as ZIP
  const handleExportZip = async () => {
    setIsExportingZip(true);
    try {
      const zip = new JSZip();
      files.forEach(file => {
        if (file.status !== 'deleted' && file.rightContent) {
          zip.file(file.path, file.rightContent);
        }
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `projeto-mesclado-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Falha ao exportar ZIP:', err);
    } finally {
      setIsExportingZip(false);
    }
  };

  // Load sample folder structure
  const handleLoadSampleFolder = () => {
    setFiles(SAMPLE_FOLDER_FILES);
  };

  // Apply all files left -> right
  const handleBatchSyncLeftToRight = () => {
    setFiles(prev => prev.map(file => ({
      ...file,
      rightContent: file.leftContent,
      status: 'identical',
      additions: 0,
      deletions: 0
    })));
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
      {/* Top Banner & Folder Upload Controls */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Comparador de Diretórios & Multi-Arquivos</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {stats.total} arquivos
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Analise, filtre e sincronize árvores de arquivos inteiras entre duas versões
            </p>
          </div>
        </div>

        {/* Upload Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Import Remote / ZIP modal */}
          {onOpenImportModal && (
            <button
              onClick={onOpenImportModal}
              title="Importar do GitHub, Codeberg, URLs ou arquivos ZIP do computador"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all transform hover:scale-[1.02]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Importar GitHub / Codeberg / ZIP</span>
            </button>
          )}

          {/* Upload Folder A */}
          <label 
            title="Selecionar Pasta A (Original)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5 text-rose-400" />
            <span>Carregar Pasta A</span>
            {/* @ts-ignore */}
            <input type="file" webkitdirectory="" directory="" multiple className="hidden" onChange={(e) => handleUploadFolder(e, 'left')} />
          </label>

          {/* Upload Folder B */}
          <label 
            title="Selecionar Pasta B (Modificada)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Carregar Pasta B</span>
            {/* @ts-ignore */}
            <input type="file" webkitdirectory="" directory="" multiple className="hidden" onChange={(e) => handleUploadFolder(e, 'right')} />
          </label>

          {/* Load Sample Demo */}
          <button
            onClick={handleLoadSampleFolder}
            title="Carregar projeto de demonstração com 6 arquivos de teste"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Demo Projeto</span>
          </button>

          {/* Export ZIP */}
          <button
            onClick={handleExportZip}
            disabled={isExportingZip || files.length === 0}
            title="Baixar a Pasta B mesclada como arquivo .ZIP"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-md shadow-emerald-900/30 transition-colors disabled:opacity-50"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{isExportingZip ? 'Compactando...' : 'Baixar Pasta B em .ZIP'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar & Search */}
      <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              statusFilter === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos ({stats.total})
          </button>
          <button
            onClick={() => setStatusFilter('modified')}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
              statusFilter === 'modified' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span>Modificados ({stats.modified})</span>
          </button>
          <button
            onClick={() => setStatusFilter('added')}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
              statusFilter === 'added' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Adicionados ({stats.added})</span>
          </button>
          <button
            onClick={() => setStatusFilter('deleted')}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
              statusFilter === 'deleted' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            <span>Excluídos ({stats.deleted})</span>
          </button>
          <button
            onClick={() => setStatusFilter('identical')}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
              statusFilter === 'identical' ? 'bg-slate-800 text-slate-300 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-slate-500" />
            <span>Idênticos ({stats.identical})</span>
          </button>
        </div>

        {/* Search Input & Batch Sync */}
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar arquivo por nome ou caminho..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleBatchSyncLeftToRight}
            title="Sincronizar todos os arquivos de A para B"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
            <span>Sincronizar A→B</span>
          </button>
        </div>
      </div>

      {/* Files Table / List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-6xl mx-auto border border-slate-800 rounded-xl overflow-hidden shadow-xl bg-slate-900/60">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Caminho do Arquivo</th>
                <th className="py-3 px-4 text-center">Adições</th>
                <th className="py-3 px-4 text-center">Exclusões</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                    Nenhum arquivo correspondente aos filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => (
                  <tr 
                    key={file.id} 
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onOpenDiffForFile(file)}
                  >
                    {/* Status Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {file.status === 'modified' && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <AlertTriangle className="w-3 h-3" /> Modificado
                        </span>
                      )}
                      {file.status === 'added' && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <PlusCircle className="w-3 h-3" /> Novo em B
                        </span>
                      )}
                      {file.status === 'deleted' && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <Trash2 className="w-3 h-3" /> Apenas em A
                        </span>
                      )}
                      {file.status === 'identical' && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          <CheckCircle2 className="w-3 h-3 text-slate-400" /> Idêntico
                        </span>
                      )}
                    </td>

                    {/* File Path */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 font-mono text-slate-200">
                        <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="font-medium group-hover:text-blue-400 transition-colors">
                          {file.path}
                        </span>
                      </div>
                    </td>

                    {/* Additions */}
                    <td className="py-3 px-4 text-center font-mono">
                      {file.additions > 0 ? (
                        <span className="text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                          +{file.additions}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Deletions */}
                    <td className="py-3 px-4 text-center font-mono">
                      {file.deletions > 0 ? (
                        <span className="text-rose-400 font-semibold bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">
                          -{file.deletions}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDiffForFile(file);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-medium group-hover:bg-blue-600 group-hover:text-white transition-all"
                      >
                        <span>Abrir Diff</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
