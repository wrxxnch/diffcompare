import JSZip from 'jszip';
import { FileItem } from '../types';

export interface UrlFetchResult {
  filename: string;
  content: string;
  sourceUrl: string;
}

/**
 * Normalizes a URL to its raw content URL if it is from GitHub, Codeberg, GitLab, or Gist.
 */
export function normalizeToRawUrl(rawUrl: string): { url: string; filename: string } {
  let url = rawUrl.trim();
  if (!url) return { url: '', filename: 'arquivo.txt' };

  try {
    const parsed = new URL(url);

    // GitHub normal blob URL -> raw.githubusercontent.com
    // e.g., https://github.com/user/repo/blob/main/src/index.ts
    if (parsed.hostname === 'github.com' && parsed.pathname.includes('/blob/')) {
      const parts = parsed.pathname.split('/').filter(Boolean);
      // parts = [user, repo, 'blob', branch, ...pathParts]
      if (parts.length >= 4 && parts[2] === 'blob') {
        const user = parts[0];
        const repo = parts[1];
        const branch = parts[3];
        const filePath = parts.slice(4).join('/');
        const raw = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${filePath}`;
        const filename = parts[parts.length - 1] || 'github_file.txt';
        return { url: raw, filename };
      }
    }

    // Codeberg normal src URL -> raw URL
    // e.g., https://codeberg.org/user/repo/src/branch/main/src/index.ts
    if (parsed.hostname === 'codeberg.org' && parsed.pathname.includes('/src/branch/')) {
      const raw = url.replace('/src/branch/', '/raw/branch/');
      const filename = parsed.pathname.split('/').filter(Boolean).pop() || 'codeberg_file.txt';
      return { url: raw, filename };
    }

    // GitLab normal blob URL -> raw URL
    // e.g., https://gitlab.com/user/repo/-/blob/main/src/index.ts
    if (parsed.hostname === 'gitlab.com' && parsed.pathname.includes('/-/blob/')) {
      const raw = url.replace('/-/blob/', '/-/raw/');
      const filename = parsed.pathname.split('/').filter(Boolean).pop() || 'gitlab_file.txt';
      return { url: raw, filename };
    }

    // Gist URL
    if (parsed.hostname === 'gist.github.com' && !url.includes('/raw')) {
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        // e.g. https://gist.github.com/user/gistId -> https://gist.githubusercontent.com/user/gistId/raw
        const raw = `https://gist.githubusercontent.com/${parts[0]}/${parts[1]}/raw`;
        return { url: raw, filename: 'gist.txt' };
      }
    }

    const segments = parsed.pathname.split('/').filter(Boolean);
    const filename = segments.length > 0 ? decodeURIComponent(segments[segments.length - 1]) : 'arquivo.txt';
    return { url, filename };
  } catch {
    return { url, filename: 'arquivo.txt' };
  }
}

/**
 * Fetches content from any URL with multiple fallbacks for CORS compatibility.
 */
export async function fetchFileFromUrl(rawUrl: string): Promise<UrlFetchResult> {
  const { url: directUrl, filename } = normalizeToRawUrl(rawUrl);
  if (!directUrl) {
    throw new Error('URL inválida ou vazia.');
  }

  // Attempt 1: Direct fetch
  try {
    const res = await fetch(directUrl, { mode: 'cors' });
    if (res.ok) {
      const text = await res.text();
      return { filename, content: text, sourceUrl: directUrl };
    }
  } catch (err) {
    console.warn(`Direct fetch failed for ${directUrl}, attempting proxy fallback...`, err);
  }

  // Attempt 2: Public CORS Proxy fallback (allorigins / jsdelivr if github)
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl)}`;
  try {
    const proxyRes = await fetch(proxyUrl);
    if (proxyRes.ok) {
      const text = await proxyRes.text();
      return { filename, content: text, sourceUrl: directUrl };
    }
  } catch (proxyErr) {
    console.warn(`Proxy fetch failed for ${proxyUrl}`, proxyErr);
  }

  throw new Error(`Não foi possível carregar o arquivo da URL: ${directUrl}. Verifique se a URL é pública e acessível.`);
}

/**
 * Extract files from a ZIP Blob or ArrayBuffer (e.g. GitHub/Codeberg repository archive)
 */
export async function extractFilesFromZip(zipData: Blob | ArrayBuffer): Promise<Map<string, string>> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(zipData);
  const fileMap = new Map<string, string>();

  const entries: Array<{ path: string; file: JSZip.JSZipObject }> = [];
  loadedZip.forEach((relativePath, file) => {
    if (!file.dir) {
      entries.push({ path: relativePath, file });
    }
  });

  // Common binary or ignorable extensions to skip
  const ignorableExtensions = new Set([
    'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'svg', 'mp3', 'mp4', 'pdf',
    'zip', 'tar', 'gz', 'woff', 'woff2', 'ttf', 'eot', 'exe', 'bin', 'dll',
    'lock', 'wasm', 'pyc', 'class'
  ]);

  for (const entry of entries) {
    // Strip root directory from archive (e.g. repo-main/src/index.ts -> src/index.ts)
    const cleanPath = entry.path.includes('/')
      ? entry.path.substring(entry.path.indexOf('/') + 1)
      : entry.path;

    const ext = cleanPath.split('.').pop()?.toLowerCase() || '';
    if (ignorableExtensions.has(ext)) {
      continue;
    }

    try {
      const text = await entry.file.async('text');
      // Limit file size to 250KB per file to keep browser responsive
      if (text.length < 300_000) {
        fileMap.set(cleanPath, text);
      }
    } catch {
      // ignore binary read errors
    }
  }

  return fileMap;
}

/**
 * Fetch GitHub repository tree using GitHub Git Trees API
 */
export async function fetchGitHubRepoTree(
  owner: string,
  repo: string,
  branch = 'main',
  token?: string
): Promise<Map<string, string>> {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json'
  };
  if (token?.trim()) {
    headers['Authorization'] = `token ${token.trim()}`;
  }

  // 1. Try to get recursive tree
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  const treeRes = await fetch(treeUrl, { headers });

  if (!treeRes.ok) {
    // Fallback: try fetching zip archive directly via proxy or codeload
    return fetchGitHubZipArchive(owner, repo, branch);
  }

  const treeData = await treeRes.json();
  if (!treeData.tree || !Array.isArray(treeData.tree)) {
    throw new Error('Formato de resposta inesperado do GitHub API.');
  }

  const fileMap = new Map<string, string>();
  // Filter for blobs (files), limit to top 40 code files to prevent rate limiting
  const blobs = treeData.tree.filter((item: any) => item.type === 'blob' && !isIgnoredPath(item.path)).slice(0, 45);

  const fetchPromises = blobs.map(async (item: any) => {
    try {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${item.path}`;
      const res = await fetch(rawUrl);
      if (res.ok) {
        const text = await res.text();
        fileMap.set(item.path, text);
      }
    } catch {
      // ignore single file error
    }
  });

  await Promise.all(fetchPromises);
  return fileMap;
}

/**
 * Fetch Codeberg repository files using Codeberg API or zip archive
 */
export async function fetchCodebergRepoTree(
  owner: string,
  repo: string,
  branch = 'main',
  token?: string
): Promise<Map<string, string>> {
  const headers: HeadersInit = {
    Accept: 'application/json'
  };
  if (token?.trim()) {
    headers['Authorization'] = `token ${token.trim()}`;
  }

  // Codeberg Git Trees API
  const treeUrl = `https://codeberg.org/api/v1/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  try {
    const treeRes = await fetch(treeUrl, { headers });
    if (treeRes.ok) {
      const treeData = await treeRes.json();
      if (treeData.tree && Array.isArray(treeData.tree)) {
        const fileMap = new Map<string, string>();
        const blobs = treeData.tree.filter((item: any) => item.type === 'blob' && !isIgnoredPath(item.path)).slice(0, 45);

        const fetchPromises = blobs.map(async (item: any) => {
          try {
            const rawUrl = `https://codeberg.org/api/v1/repos/${owner}/${repo}/raw/${item.path}?ref=${branch}`;
            const res = await fetch(rawUrl);
            if (res.ok) {
              const text = await res.text();
              fileMap.set(item.path, text);
            }
          } catch {
            // ignore
          }
        });

        await Promise.all(fetchPromises);
        return fileMap;
      }
    }
  } catch (err) {
    console.warn('Codeberg tree API failed, trying archive...', err);
  }

  // Fallback: try raw zip archive
  const archiveUrl = `https://codeberg.org/api/v1/repos/${owner}/${repo}/archive/${branch}.zip`;
  const archiveRes = await fetch(archiveUrl);
  if (!archiveRes.ok) {
    throw new Error(`Falha ao carregar repositório do Codeberg (${owner}/${repo}@${branch}). Verifique se é público.`);
  }

  const blob = await archiveRes.blob();
  return extractFilesFromZip(blob);
}

/**
 * Fetch GitHub ZIP archive directly
 */
export async function fetchGitHubZipArchive(owner: string, repo: string, branch = 'main'): Promise<Map<string, string>> {
  const zipUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.zip`)}`;
  const res = await fetch(zipUrl);
  if (!res.ok) {
    throw new Error(`Não foi possível baixar o repositório ${owner}/${repo} (${branch}).`);
  }
  const blob = await res.blob();
  return extractFilesFromZip(blob);
}

function isIgnoredPath(path: string): boolean {
  const lower = path.toLowerCase();
  return (
    lower.startsWith('.git/') ||
    lower.startsWith('node_modules/') ||
    lower.startsWith('dist/') ||
    lower.startsWith('build/') ||
    lower.startsWith('.next/') ||
    lower.endsWith('.lock') ||
    lower.endsWith('.min.js') ||
    lower.endsWith('.min.css') ||
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.ico')
  );
}

/**
 * Merges two file maps (Left & Right) into an array of FileItem objects ready for FolderComparator
 */
export function createDiffFileItemsFromMaps(
  leftMap: Map<string, string>,
  rightMap: Map<string, string>
): FileItem[] {
  const allPaths = new Set([...leftMap.keys(), ...rightMap.keys()]);
  const result: FileItem[] = [];

  allPaths.forEach(path => {
    const leftContent = leftMap.get(path) || '';
    const rightContent = rightMap.get(path) || '';
    const name = path.split('/').pop() || path;
    const extension = name.split('.').pop() || 'txt';

    let status: 'modified' | 'added' | 'deleted' | 'identical' = 'modified';
    let additions = 0;
    let deletions = 0;

    if (!leftContent && rightContent) {
      status = 'added';
      additions = rightContent.split('\n').length;
    } else if (leftContent && !rightContent) {
      status = 'deleted';
      deletions = leftContent.split('\n').length;
    } else if (leftContent === rightContent) {
      status = 'identical';
    } else {
      status = 'modified';
      const leftLines = leftContent.split('\n').length;
      const rightLines = rightContent.split('\n').length;
      additions = Math.max(0, rightLines - leftLines);
      deletions = Math.max(0, leftLines - rightLines);
      if (additions === 0 && deletions === 0) {
        additions = 1;
        deletions = 1;
      }
    }

    result.push({
      id: `diff-${Math.random().toString(36).substr(2, 9)}`,
      path,
      name,
      leftContent,
      rightContent,
      status,
      additions,
      deletions,
      extension
    });
  });

  // Sort by modified, added, deleted, then identical
  const statusOrder: Record<string, number> = {
    modified: 1,
    added: 2,
    deleted: 3,
    identical: 4
  };

  return result.sort((a, b) => {
    const orderDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
    if (orderDiff !== 0) return orderDiff;
    return a.path.localeCompare(b.path);
  });
}
