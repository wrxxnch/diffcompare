import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Github, 
  Sliders, 
  Copy, 
  Check, 
  Terminal, 
  ExternalLink,
  Code,
  Sparkles
} from 'lucide-react';
import { DiffSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DiffSettings;
  setSettings: React.Dispatch<React.SetStateAction<DiffSettings>>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  setSettings
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'github'>('editor');
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);

  if (!isOpen) return null;

  const workflowCode = `name: Deploy to GitHub Pages

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;

  const handleCopyWorkflow = () => {
    navigator.clipboard.writeText(workflowCode);
    setCopiedWorkflow(true);
    setTimeout(() => setCopiedWorkflow(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Configurações & Hospedagem</h2>
              <p className="text-xs text-slate-400">Personalize a exibição do diff e configure o deploy via GitHub Actions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Header */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-2 gap-4">
          <button
            onClick={() => setActiveTab('editor')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'editor'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Preferências do Editor</span>
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'github'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Github className="w-4 h-4" />
            <span>GitHub Actions (.github/workflows)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-300">
          {activeTab === 'editor' ? (
            <div className="space-y-4">
              {/* Font size */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                <div>
                  <div className="font-semibold text-slate-200">Tamanho da Fonte</div>
                  <div className="text-slate-500 text-[11px]">Ajuste a escala tipográfica do código</div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={11}
                    max={18}
                    step={1}
                    value={settings.fontSize}
                    onChange={(e) => setSettings(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                    className="w-28 accent-blue-500 cursor-pointer"
                  />
                  <span className="font-mono font-bold text-slate-200 w-8 text-right">
                    {settings.fontSize}px
                  </span>
                </div>
              </div>

              {/* Compare Iterations Mode */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">Comparar Iterações do Histórico</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      Padrão: Desativado
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Habilita o painel de comparação pontual entre revisões e snapshots anteriores do histórico
                  </div>
                </div>
                <input
                  id="checkbox-setting-compare-iterations"
                  type="checkbox"
                  checked={settings.compareIterations}
                  onChange={(e) => setSettings(prev => ({ ...prev, compareIterations: e.target.checked }))}
                  className="h-4 w-4 accent-indigo-500 rounded cursor-pointer"
                />
              </div>

              {/* Sub-line / Word diff */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                <div>
                  <div className="font-semibold text-slate-200">Diferença por Palavra/Caractere (Intra-linha)</div>
                  <div className="text-slate-500 text-[11px]">Destaca trechos específicos alterados dentro da mesma linha</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showWordDiff}
                  onChange={(e) => setSettings(prev => ({ ...prev, showWordDiff: e.target.checked }))}
                  className="h-4 w-4 accent-blue-500 rounded cursor-pointer"
                />
              </div>

              {/* Synchronized Scroll */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                <div>
                  <div className="font-semibold text-slate-200">Rolagem Sincronizada</div>
                  <div className="text-slate-500 text-[11px]">Rola os lados esquerdo e direito ao mesmo tempo</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.syncScroll}
                  onChange={(e) => setSettings(prev => ({ ...prev, syncScroll: e.target.checked }))}
                  className="h-4 w-4 accent-blue-500 rounded cursor-pointer"
                />
              </div>

              {/* Line Numbers */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                <div>
                  <div className="font-semibold text-slate-200">Numeração de Linhas</div>
                  <div className="text-slate-500 text-[11px]">Exibe números de linha na calha esquerda e direita</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showLineNumbers}
                  onChange={(e) => setSettings(prev => ({ ...prev, showLineNumbers: e.target.checked }))}
                  className="h-4 w-4 accent-blue-500 rounded cursor-pointer"
                />
              </div>

              {/* Wrap Lines */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                <div>
                  <div className="font-semibold text-slate-200">Quebra Automática de Linha</div>
                  <div className="text-slate-500 text-[11px]">Quebra linhas longas sem precisar de rolagem horizontal</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.wrapLines}
                  onChange={(e) => setSettings(prev => ({ ...prev, wrapLines: e.target.checked }))}
                  className="h-4 w-4 accent-blue-500 rounded cursor-pointer"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-950/30 border border-blue-800/40 rounded-xl">
                <div className="flex items-center gap-2 text-blue-400 font-semibold mb-1">
                  <Github className="w-4 h-4" />
                  <span>Workflow de Deploy Criado com Sucesso!</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  O arquivo de automação já foi criado em <code className="bg-slate-950 px-1.5 py-0.5 rounded text-blue-300 font-mono">/.github/workflows/deploy.yml</code> no seu repositório.
                </p>
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-200 text-xs">Como hospedar no GitHub Pages:</h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 text-xs pl-1">
                  <li>Envie o código para o seu repositório no GitHub (<code className="font-mono text-slate-300">git push origin main</code>).</li>
                  <li>No GitHub, acesse a aba <strong>Settings</strong> do repositório.</li>
                  <li>No menu lateral esquerdo, clique em <strong>Pages</strong>.</li>
                  <li>Em <strong>Build and deployment &gt; Source</strong>, selecione <strong>GitHub Actions</strong>.</li>
                  <li>O workflow será executado automaticamente a cada push e publicará seu app online!</li>
                </ol>
              </div>

              {/* Workflow snippet with Copy */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-slate-400">.github/workflows/deploy.yml</span>
                  <button
                    onClick={handleCopyWorkflow}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors"
                  >
                    {copiedWorkflow ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar YAML</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-60 leading-relaxed">
                  {workflowCode}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
};
