import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Globe, 
  FolderGit2, 
  FileCode, 
  GitBranch, 
  Check, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  Sparkles, 
  Folder, 
  FileText,
  Key,
  ExternalLink,
  Code2,
  History,
  Clock,
  Trash2,
  Copy,
  Search
} from 'lucide-react';
import { 
  fetchFileFromUrl, 
  fetchGitHubRepoTree, 
  fetchCodebergRepoTree, 
  extractFilesFromZip,
  createDiffFileItemsFromMaps,
  normalizeToRawUrl 
} from '../utils/gitFetchService';
import { FileItem, RecentFileRecord } from '../types';

type ImportTab = 'local' | 'saved' | 'url' | 'github' | 'codeberg';

interface ImportSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySingleDiff: (filenameA: string, contentA: string, filenameB: string, contentB: string) => void;
  onApplyFolderDiff: (files: FileItem[]) => void;
  recentFiles?: RecentFileRecord[];
  onSelectRecentFile?: (record: RecentFileRecord, side: 'A' | 'B') => void;
}

export const ImportSourceModal: React.FC<ImportSourceModalProps> = ({
  isOpen,
  onClose,
  onApplySingleDiff,
  onApplyFolderDiff,
  recentFiles = []
}) => {
  const [activeTab, setActiveTab] = useState<ImportTab>('local');
  const [localMode, setLocalMode] = useState<'files' | 'zip' | 'paste'>('files');
  const [savedSelectedA, setSavedSelectedA] = useState<string | null>(null);
  const [savedSelectedB, setSavedSelectedB] = useState<string | null>(null);
  const [savedSearchQuery, setSavedSearchQuery] = useState('');

  // Local files state
  const [localFileA, setLocalFileA] = useState<{ name: string; content: string } | null>(null);
  const [localFileB, setLocalFileB] = useState<{ name: string; content: string } | null>(null);
  const [pasteA, setPasteA] = useState('');
  const [pasteB, setPasteB] = useState('');
  const [pasteNameA, setPasteNameA] = useState('arquivo_original.ts');
  const [pasteNameB, setPasteNameB] = useState('arquivo_modificado.ts');


  // URL Comparison state
  const [urlA, setUrlA] = useState('');
  const [urlB, setUrlB] = useState('');

  // GitHub Comparison state
  const [ghRepo, setGhRepo] = useState('facebook/react');
  const [ghBranchA, setGhBranchA] = useState('main');
  const [ghBranchB, setGhBranchB] = useState('main');
  const [ghPathA, setGhPathA] = useState('packages/react/src/React.js');
  const [ghPathB, setGhPathB] = useState('packages/react/src/React.js');
  const [ghRepoType, setGhRepoType] = useState<'file' | 'repo'>('file');
  const [ghToken, setGhToken] = useState('');

  // Codeberg Comparison state
  const [cbRepo, setCbRepo] = useState('forgejo/forgejo');
  const [cbBranchA, setCbBranchA] = useState('main');
  const [cbBranchB, setCbBranchB] = useState('v1.20');
  const [cbPathA, setCbPathA] = useState('README.md');
  const [cbPathB, setCbPathB] = useState('README.md');
  const [cbRepoType, setCbRepoType] = useState<'file' | 'repo'>('file');
  const [cbToken, setCbToken] = useState('');

  // Global loading & error states
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle applying saved files comparison
  const handleApplySavedFiles = () => {
    const itemA = recentFiles.find(f => f.id === savedSelectedA);
    const itemB = recentFiles.find(f => f.id === savedSelectedB);
    if (!itemA || !itemB) {
      setErrorMessage('Selecione um Arquivo A e um Arquivo B na lista de arquivos gravados.');
      return;
    }
    onApplySingleDiff(
      itemA.fullPath || itemA.filename, 
      itemA.content, 
      itemB.fullPath || itemB.filename, 
      itemB.content
    );
    onClose();
  };

  // Handle local single file upload
  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'A' | 'B') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      if (side === 'A') {
        setLocalFileA({ name: file.name, content });
      } else {
        setLocalFileB({ name: file.name, content });
      }
    };
    reader.readAsText(file);
  };

  // Handle local ZIP upload
  const handleLocalZipUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'A' | 'B') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setLoadingStatus(`Extraindo arquivo ZIP (${file.name})...`);
    setErrorMessage(null);

    try {
      const fileMap = await extractFilesFromZip(file);
      if (fileMap.size === 0) {
        throw new Error('Nenhum arquivo de texto encontrado no arquivo ZIP.');
      }

      if (side === 'A') {
        // If B is empty, fill B with same for comparison or prompt
        const items = createDiffFileItemsFromMaps(fileMap, new Map());
        onApplyFolderDiff(items);
      } else {
        // Apply to side B
        const items = createDiffFileItemsFromMaps(new Map(), fileMap);
        onApplyFolderDiff(items);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar arquivo ZIP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply local files to single diff
  const handleApplyLocalFiles = () => {
    if (localMode === 'files') {
      if (!localFileA && !localFileB) {
        setErrorMessage('Selecione pelo menos um arquivo para comparar.');
        return;
      }
      onApplySingleDiff(
        localFileA?.name || 'arquivo_a.txt',
        localFileA?.content || '',
        localFileB?.name || 'arquivo_b.txt',
        localFileB?.content || ''
      );
      onClose();
    } else if (localMode === 'paste') {
      onApplySingleDiff(
        pasteNameA || 'versao_a.ts',
        pasteA,
        pasteNameB || 'versao_b.ts',
        pasteB
      );
      onClose();
    }
  };

  // Fetch and Compare 2 URLs
  const handleFetchUrls = async () => {
    if (!urlA.trim() && !urlB.trim()) {
      setErrorMessage('Por favor, insira pelo menos uma URL válida.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStatus('Buscando conteúdo das URLs...');

    try {
      let resultA = { filename: 'url_a.txt', content: '', sourceUrl: '' };
      let resultB = { filename: 'url_b.txt', content: '', sourceUrl: '' };

      if (urlA.trim()) {
        setLoadingStatus('Baixando URL A...');
        resultA = await fetchFileFromUrl(urlA.trim());
      }

      if (urlB.trim()) {
        setLoadingStatus('Baixando URL B...');
        resultB = await fetchFileFromUrl(urlB.trim());
      }

      onApplySingleDiff(resultA.filename, resultA.content, resultB.filename, resultB.content);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao buscar as URLs. Verifique a conexão e o formato.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fill sample URLs
  const handleLoadSampleUrls = () => {
    setUrlA('https://raw.githubusercontent.com/facebook/react/v18.2.0/packages/react/src/React.js');
    setUrlB('https://raw.githubusercontent.com/facebook/react/v18.3.0/packages/react/src/React.js');
    setErrorMessage(null);
  };

  // Fetch GitHub Repo or File
  const handleFetchGitHub = async () => {
    const cleanRepo = ghRepo.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
    const [owner, repo] = cleanRepo.split('/');

    if (!owner || !repo) {
      setErrorMessage('Formato de repositório inválido. Use "dono/repositorio" (ex: facebook/react).');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (ghRepoType === 'file') {
        setLoadingStatus(`Buscando arquivo ${ghPathA} no branch ${ghBranchA}...`);
        const rawUrlA = `https://raw.githubusercontent.com/${owner}/${repo}/${ghBranchA.trim() || 'main'}/${ghPathA.trim()}`;
        const rawUrlB = `https://raw.githubusercontent.com/${owner}/${repo}/${ghBranchB.trim() || 'main'}/${ghPathB.trim()}`;

        const [resA, resB] = await Promise.all([
          fetchFileFromUrl(rawUrlA),
          fetchFileFromUrl(rawUrlB)
        ]);

        const nameA = `${ghBranchA}-${ghPathA.split('/').pop()}`;
        const nameB = `${ghBranchB}-${ghPathB.split('/').pop()}`;
        onApplySingleDiff(nameA, resA.content, nameB, resB.content);
        onClose();
      } else {
        // Compare whole repository branches
        setLoadingStatus(`Buscando árvore de arquivos do branch ${ghBranchA}...`);
        const mapA = await fetchGitHubRepoTree(owner, repo, ghBranchA.trim() || 'main', ghToken);

        setLoadingStatus(`Buscando árvore de arquivos do branch ${ghBranchB}...`);
        const mapB = await fetchGitHubRepoTree(owner, repo, ghBranchB.trim() || 'main', ghToken);

        const items = createDiffFileItemsFromMaps(mapA, mapB);
        if (items.length === 0) {
          throw new Error('Nenhum arquivo de código foi encontrado para comparação.');
        }

        onApplyFolderDiff(items);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao comunicar com a API do GitHub.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Codeberg Repo or File
  const handleFetchCodeberg = async () => {
    const cleanRepo = cbRepo.trim().replace(/^https?:\/\/codeberg\.org\//, '').replace(/\/$/, '');
    const [owner, repo] = cleanRepo.split('/');

    if (!owner || !repo) {
      setErrorMessage('Formato de repositório inválido. Use "dono/repositorio" (ex: forgejo/forgejo).');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (cbRepoType === 'file') {
        setLoadingStatus(`Buscando arquivo do Codeberg (${cbBranchA})...`);
        const rawUrlA = `https://codeberg.org/${owner}/${repo}/raw/branch/${cbBranchA.trim() || 'main'}/${cbPathA.trim()}`;
        const rawUrlB = `https://codeberg.org/${owner}/${repo}/raw/branch/${cbBranchB.trim() || 'main'}/${cbPathB.trim()}`;

        const [resA, resB] = await Promise.all([
          fetchFileFromUrl(rawUrlA),
          fetchFileFromUrl(rawUrlB)
        ]);

        const nameA = `codeberg-${cbBranchA}-${cbPathA.split('/').pop()}`;
        const nameB = `codeberg-${cbBranchB}-${cbPathB.split('/').pop()}`;
        onApplySingleDiff(nameA, resA.content, nameB, resB.content);
        onClose();
      } else {
        setLoadingStatus(`Buscando repositório Codeberg (${cbBranchA})...`);
        const mapA = await fetchCodebergRepoTree(owner, repo, cbBranchA.trim() || 'main', cbToken);

        setLoadingStatus(`Buscando repositório Codeberg (${cbBranchB})...`);
        const mapB = await fetchCodebergRepoTree(owner, repo, cbBranchB.trim() || 'main', cbToken);

        const items = createDiffFileItemsFromMaps(mapA, mapB);
        if (items.length === 0) {
          throw new Error('Nenhum arquivo encontrado no repositório Codeberg.');
        }

        onApplyFolderDiff(items);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao carregar dados do Codeberg.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Importar & Comparar Fontes
              </h2>
              <p className="text-xs text-slate-400">
                Carregue do computador, compare 2 URLs públicas ou importe do GitHub / Codeberg
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-2 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('local'); setErrorMessage(null); }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'local'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Computador (Local)</span>
          </button>

          <button
            onClick={() => { setActiveTab('saved'); setErrorMessage(null); }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'saved'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4 text-indigo-400" />
            <span>Arquivos Gravados</span>
            {recentFiles.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-500/30 text-indigo-200 font-bold">
                {recentFiles.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('url'); setErrorMessage(null); }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'url'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Comparar 2 URLs</span>
          </button>

          <button
            onClick={() => { setActiveTab('github'); setErrorMessage(null); }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'github'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>GitHub (Repo / Branch)</span>
          </button>

          <button
            onClick={() => { setActiveTab('codeberg'); setErrorMessage(null); }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'codeberg'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Codeberg (Livre)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1">
                <span className="font-semibold">Erro:</span> {errorMessage}
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="p-4 rounded-lg bg-blue-950/30 border border-blue-800/60 text-blue-200 text-xs flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
              <div>
                <p className="font-semibold text-blue-300">Carregando dados remotos...</p>
                <p className="text-slate-400 text-[11px]">{loadingStatus}</p>
              </div>
            </div>
          )}

          {/* TAB 1: LOCAL COMPUTADOR */}
          {activeTab === 'local' && (
            <div className="space-y-4">
              {/* Local Sub-mode Selector */}
              <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 w-fit text-xs">
                <button
                  onClick={() => setLocalMode('files')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    localMode === 'files' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  2 Arquivos Individuais
                </button>
                <button
                  onClick={() => setLocalMode('zip')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    localMode === 'zip' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Arquivos .ZIP (Pastas)
                </button>
                <button
                  onClick={() => setLocalMode('paste')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    localMode === 'paste' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Colar Texto / Clipboard
                </button>
              </div>

              {localMode === 'files' && (
                <div className="space-y-4">
                  {/* Quick-substitute shelf from saved files */}
                  {recentFiles.length > 0 && (
                    <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1.5 font-medium text-slate-300">
                          <History className="w-3.5 h-3.5 text-indigo-400" />
                          Substituição rápida por arquivos anteriores gravados:
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('saved')}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                        >
                          Ver todos ({recentFiles.length}) →
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {recentFiles.slice(0, 6).map((rf) => (
                          <div
                            key={rf.id}
                            className="flex items-center bg-slate-900 border border-slate-700/80 rounded-md text-[11px] font-mono overflow-hidden shadow-xs"
                          >
                            <span
                              className="px-2 py-1 text-slate-300 truncate max-w-[150px]"
                              title={rf.fullPath || rf.filename}
                            >
                              {rf.filename}
                            </span>
                            <button
                              type="button"
                              onClick={() => setLocalFileA({ name: rf.fullPath || rf.filename, content: rf.content })}
                              className="px-1.5 py-1 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border-l border-slate-800 text-[10px] font-sans font-semibold transition-colors"
                              title={`Definir como Arquivo A (${rf.lineCount} linhas)`}
                            >
                              + A
                            </button>
                            <button
                              type="button"
                              onClick={() => setLocalFileB({ name: rf.fullPath || rf.filename, content: rf.content })}
                              className="px-1.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border-l border-slate-800 text-[10px] font-sans font-semibold transition-colors"
                              title={`Definir como Arquivo B (${rf.lineCount} linhas)`}
                            >
                              + B
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* File A Card */}
                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          Arquivo A (Original)
                        </span>
                        {localFileA && (
                          <span className="text-[11px] font-mono text-slate-400">
                            {localFileA.content.split('\n').length} linhas
                          </span>
                        )}
                      </div>

                      <label className="border-2 border-dashed border-slate-750 hover:border-rose-500/50 rounded-lg p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center bg-slate-900/40">
                        <Upload className="w-6 h-6 text-slate-400" />
                        <div className="text-xs text-slate-300">
                          {localFileA ? (
                            <span className="font-semibold text-rose-300 truncate max-w-[220px] block" title={localFileA.name}>
                              {localFileA.name}
                            </span>
                          ) : (
                            <>
                              <span className="font-medium text-blue-400">Clique para selecionar</span> ou arraste o Arquivo A
                            </>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500">Qualquer formato (.ts, .py, .json, .txt, etc.)</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={(e) => handleLocalFileUpload(e, 'A')} 
                        />
                      </label>
                    </div>

                    {/* File B Card */}
                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Arquivo B (Modificado)
                        </span>
                        {localFileB && (
                          <span className="text-[11px] font-mono text-slate-400">
                            {localFileB.content.split('\n').length} linhas
                          </span>
                        )}
                      </div>

                      <label className="border-2 border-dashed border-slate-750 hover:border-emerald-500/50 rounded-lg p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center bg-slate-900/40">
                        <Upload className="w-6 h-6 text-slate-400" />
                        <div className="text-xs text-slate-300">
                          {localFileB ? (
                            <span className="font-semibold text-emerald-300 truncate max-w-[220px] block" title={localFileB.name}>
                              {localFileB.name}
                            </span>
                          ) : (
                            <>
                              <span className="font-medium text-emerald-400">Clique para selecionar</span> ou arraste o Arquivo B
                            </>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500">Qualquer formato (.ts, .py, .json, .txt, etc.)</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={(e) => handleLocalFileUpload(e, 'B')} 
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {localMode === 'zip' && (
                <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-4">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-slate-200">
                      Carregar Arquivo .ZIP de Projeto para Comparação de Pastas
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Envie um arquivo compactado (.zip) com seu código-fonte. O DiffStudio extrai os arquivos diretamente no seu navegador de forma 100% privada e segura.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="p-4 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center">
                      <Upload className="w-5 h-5 text-amber-400" />
                      <span className="text-xs font-medium text-slate-300">Carregar ZIP como Pasta A</span>
                      <input 
                        type="file" 
                        accept=".zip" 
                        className="hidden" 
                        onChange={(e) => handleLocalZipUpload(e, 'A')} 
                      />
                    </label>

                    <label className="p-4 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center">
                      <Upload className="w-5 h-5 text-emerald-400" />
                      <span className="text-xs font-medium text-slate-300">Carregar ZIP como Pasta B</span>
                      <input 
                        type="file" 
                        accept=".zip" 
                        className="hidden" 
                        onChange={(e) => handleLocalZipUpload(e, 'B')} 
                      />
                    </label>
                  </div>
                </div>
              )}

              {localMode === 'paste' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-rose-400">Nome do Arquivo A:</label>
                      <input 
                        type="text" 
                        value={pasteNameA} 
                        onChange={(e) => setPasteNameA(e.target.value)} 
                        className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 font-mono w-40"
                      />
                    </div>
                    <textarea
                      value={pasteA}
                      onChange={(e) => setPasteA(e.target.value)}
                      placeholder="Cole aqui o texto ou código original (Lado A)..."
                      rows={8}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 resize-none focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-emerald-400">Nome do Arquivo B:</label>
                      <input 
                        type="text" 
                        value={pasteNameB} 
                        onChange={(e) => setPasteNameB(e.target.value)} 
                        className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 font-mono w-40"
                      />
                    </div>
                    <textarea
                      value={pasteB}
                      onChange={(e) => setPasteB(e.target.value)}
                      placeholder="Cole aqui o texto ou código modificado (Lado B)..."
                      rows={8}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ARQUIVOS GRAVADOS ANTERIORMENTE */}
          {activeTab === 'saved' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-950/20 border border-indigo-500/20 rounded-xl flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                  <History className="w-5 h-5" />
                </div>
                <div className="text-xs space-y-1 flex-1">
                  <p className="font-semibold text-slate-200">
                    Biblioteca de Arquivos Gravados Automaticamente
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    Sempre que você importa ou altera arquivos, as versões anteriores e seus caminhos de origem completos ficam salvos aqui para restauração e substituição imediata.
                  </p>
                </div>
              </div>

              {/* Search Box in Saved Files Modal */}
              {recentFiles.length > 0 && (
                <div className="space-y-1.5">
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      value={savedSearchQuery}
                      onChange={(e) => setSavedSearchQuery(e.target.value)}
                      placeholder="Pesquisar por caminho de origem (ex: C:/Users/...) ou nome..."
                      className="w-full bg-slate-950 border border-slate-750 hover:border-slate-600 focus:border-indigo-500 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono transition-all"
                    />
                    {savedSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setSavedSearchQuery('')}
                        className="absolute right-2.5 text-slate-400 hover:text-slate-200 p-0.5"
                        title="Limpar pesquisa"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {savedSearchQuery && (
                    <div className="flex items-center justify-between text-[11px] px-1 text-slate-400">
                      <span>
                        Arquivos filtrados:{' '}
                        <strong className="text-slate-200">
                          {recentFiles.filter(rf => {
                            const q = savedSearchQuery.toLowerCase().trim();
                            return rf.filename.toLowerCase().includes(q) || (rf.fullPath && rf.fullPath.toLowerCase().includes(q)) || rf.content.toLowerCase().includes(q);
                          }).length}
                        </strong>{' '}
                        de {recentFiles.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSavedSearchQuery('')}
                        className="text-indigo-400 hover:underline"
                      >
                        Limpar busca
                      </button>
                    </div>
                  )}
                </div>
              )}

              {recentFiles.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 space-y-2">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-medium text-slate-400">Nenhum arquivo gravado no histórico ainda.</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Ao carregar arquivos locais ou importar de URLs e repositórios, eles serão guardados nesta lista automaticamente com o caminho de origem.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {recentFiles
                    .filter(rf => {
                      if (!savedSearchQuery.trim()) return true;
                      const q = savedSearchQuery.toLowerCase().trim();
                      return rf.filename.toLowerCase().includes(q) || (rf.fullPath && rf.fullPath.toLowerCase().includes(q)) || rf.content.toLowerCase().includes(q);
                    })
                    .map((rf) => {
                    const isSelectedA = savedSelectedA === rf.id;
                    const isSelectedB = savedSelectedB === rf.id;

                    return (
                      <div
                        key={rf.id}
                        className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelectedA && isSelectedB
                            ? 'bg-purple-950/20 border-purple-500/50 shadow-sm'
                            : isSelectedA
                            ? 'bg-rose-950/20 border-rose-500/40 shadow-sm'
                            : isSelectedB
                            ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                            : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-semibold text-slate-200">
                              {rf.filename}
                            </span>
                            {rf.lastUsedSide && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                rf.lastUsedSide === 'A'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}>
                                Último: Lado {rf.lastUsedSide}
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-slate-500">
                              {rf.lineCount} linhas
                            </span>
                          </div>

                          {rf.fullPath && (
                            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800/80 truncate select-all" title={`Caminho de origem: ${rf.fullPath}`}>
                              <span className="text-[10px] text-amber-400 font-sans font-bold uppercase tracking-wider">Origem:</span>
                              <span className="truncate">{rf.fullPath}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                          {/* Set as A */}
                          <button
                            type="button"
                            onClick={() => setSavedSelectedA(isSelectedA ? null : rf.id)}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                              isSelectedA
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            {isSelectedA ? 'Selecionado como A' : 'Usar como A'}
                          </button>

                          {/* Set as B */}
                          <button
                            type="button"
                            onClick={() => setSavedSelectedB(isSelectedB ? null : rf.id)}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                              isSelectedB
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {isSelectedB ? 'Selecionado como B' : 'Usar como B'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COMPARAÇÃO DE 2 URLS */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Insira links HTTP/HTTPS de arquivos públicos da web, GitHub Raw, Codeberg, Gist, Pastebin ou CDNs.
                </p>
                <button
                  type="button"
                  onClick={handleLoadSampleUrls}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Preencher Exemplo
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-rose-400 mb-1">
                    URL do Arquivo A (Versão Original):
                  </label>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
                    <Globe className="w-4 h-4 text-rose-400 shrink-0" />
                    <input
                      type="url"
                      value={urlA}
                      onChange={(e) => setUrlA(e.target.value)}
                      placeholder="https://raw.githubusercontent.com/... ou link normal de arquivo"
                      className="w-full bg-transparent text-xs font-mono text-slate-200 focus:outline-none placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-emerald-400 mb-1">
                    URL do Arquivo B (Versão Modificada):
                  </label>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
                    <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                    <input
                      type="url"
                      value={urlB}
                      onChange={(e) => setUrlB(e.target.value)}
                      placeholder="https://raw.githubusercontent.com/... ou link normal de arquivo"
                      className="w-full bg-transparent text-xs font-mono text-slate-200 focus:outline-none placeholder:text-slate-600"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Conversão Automática Inteligente:</strong> Links de visualização normal do GitHub (`github.com/.../blob/...`) e Codeberg (`codeberg.org/.../src/...`) são automaticamente convertidos para conteúdo raw.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: GITHUB REPO / BRANCHES */}
          {activeTab === 'github' && (
            <div className="space-y-4">
              {/* Type Switcher */}
              <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 w-fit text-xs">
                <button
                  onClick={() => setGhRepoType('file')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    ghRepoType === 'file' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Comparar Arquivo Específico
                </button>
                <button
                  onClick={() => setGhRepoType('repo')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    ghRepoType === 'repo' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Comparar Repositório Inteiro (Pastas)
                </button>
              </div>

              {/* Repo Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Repositório GitHub (dono/nome):
                </label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
                  <GitBranch className="w-4 h-4 text-purple-400 shrink-0" />
                  <input
                    type="text"
                    value={ghRepo}
                    onChange={(e) => setGhRepo(e.target.value)}
                    placeholder="facebook/react ou tailwindlabs/tailwindcss"
                    className="w-full bg-transparent text-xs font-mono text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Branches / Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-rose-400 mb-1">
                    Branch ou Tag A (Original):
                  </label>
                  <input
                    type="text"
                    value={ghBranchA}
                    onChange={(e) => setGhBranchA(e.target.value)}
                    placeholder="main ou v18.2.0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-emerald-400 mb-1">
                    Branch ou Tag B (Modificado):
                  </label>
                  <input
                    type="text"
                    value={ghBranchB}
                    onChange={(e) => setGhBranchB(e.target.value)}
                    placeholder="main, next ou v18.3.0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* If Single File, File Paths */}
              {ghRepoType === 'file' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Caminho do Arquivo A:
                    </label>
                    <input
                      type="text"
                      value={ghPathA}
                      onChange={(e) => setGhPathA(e.target.value)}
                      placeholder="packages/react/src/React.js"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Caminho do Arquivo B:
                    </label>
                    <input
                      type="text"
                      value={ghPathB}
                      onChange={(e) => setGhPathB(e.target.value)}
                      placeholder="packages/react/src/React.js"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* GitHub Token (Optional) */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1 flex items-center gap-1">
                  <Key className="w-3 h-3 text-slate-500" />
                  Token de Acesso GitHub (Opcional - apenas para repositórios privados ou rate limit):
                </label>
                <input
                  type="password"
                  value={ghToken}
                  onChange={(e) => setGhToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx (deixe em branco para repositórios públicos)"
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-400 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 4: CODEBERG */}
          {activeTab === 'codeberg' && (
            <div className="space-y-4">
              {/* Type Switcher */}
              <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 w-fit text-xs">
                <button
                  onClick={() => setCbRepoType('file')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    cbRepoType === 'file' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Comparar Arquivo Específico
                </button>
                <button
                  onClick={() => setCbRepoType('repo')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    cbRepoType === 'repo' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Comparar Repositório Inteiro (Pastas)
                </button>
              </div>

              {/* Repo Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Repositório Codeberg (dono/nome):
                </label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
                  <Code2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <input
                    type="text"
                    value={cbRepo}
                    onChange={(e) => setCbRepo(e.target.value)}
                    placeholder="forgejo/forgejo ou woodpecker-ci/woodpecker"
                    className="w-full bg-transparent text-xs font-mono text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Branches / Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-rose-400 mb-1">
                    Branch ou Tag A:
                  </label>
                  <input
                    type="text"
                    value={cbBranchA}
                    onChange={(e) => setCbBranchA(e.target.value)}
                    placeholder="main ou v1.20"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-emerald-400 mb-1">
                    Branch ou Tag B:
                  </label>
                  <input
                    type="text"
                    value={cbBranchB}
                    onChange={(e) => setCbBranchB(e.target.value)}
                    placeholder="main ou v1.21"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* File Paths */}
              {cbRepoType === 'file' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Caminho do Arquivo A:
                    </label>
                    <input
                      type="text"
                      value={cbPathA}
                      onChange={(e) => setCbPathA(e.target.value)}
                      placeholder="README.md ou src/main.go"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Caminho do Arquivo B:
                    </label>
                    <input
                      type="text"
                      value={cbPathB}
                      onChange={(e) => setCbPathB(e.target.value)}
                      placeholder="README.md ou src/main.go"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            {activeTab === 'local' && (
              <button
                type="button"
                onClick={handleApplyLocalFiles}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>Aplicar Comparação</span>
              </button>
            )}

            {activeTab === 'saved' && (
              <button
                type="button"
                onClick={handleApplySavedFiles}
                disabled={!savedSelectedA || !savedSelectedB}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                <span>
                  {savedSelectedA && savedSelectedB
                    ? 'Comparar Arquivos Gravados (A ↔ B)'
                    : 'Selecione Arquivo A e Arquivo B'}
                </span>
              </button>
            )}

            {activeTab === 'url' && (
              <button
                type="button"
                onClick={handleFetchUrls}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                <span>Buscar & Comparar URLs</span>
              </button>
            )}

            {activeTab === 'github' && (
              <button
                type="button"
                onClick={handleFetchGitHub}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
                <span>{ghRepoType === 'file' ? 'Buscar Arquivos GitHub' : 'Comparar Árvore GitHub'}</span>
              </button>
            )}

            {activeTab === 'codeberg' && (
              <button
                type="button"
                onClick={handleFetchCodeberg}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Code2 className="w-4 h-4" />}
                <span>{cbRepoType === 'file' ? 'Buscar Arquivos Codeberg' : 'Comparar Árvore Codeberg'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
