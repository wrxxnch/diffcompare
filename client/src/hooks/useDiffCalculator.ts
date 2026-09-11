/**
 * Hook para calcular diferenças entre dois textos usando algoritmo de diff
 * Design Philosophy: Modern SaaS - Emerald & Rose Color Scheme
 * - Green (#10b981) para adições
 * - Red (#ef4444) para deleções
 */

export interface DiffLine {
  type: 'add' | 'remove' | 'unchanged';
  content: string;
  lineNumber: number;
}

export interface DiffResult {
  leftLines: DiffLine[];
  rightLines: DiffLine[];
}

/**
 * Algoritmo de diff simples baseado em linha
 * Compara duas strings linha por linha e identifica diferenças
 */
function calculateLineDiff(leftText: string, rightText: string): DiffResult {
  const leftLines = leftText.split('\n');
  const rightLines = rightText.split('\n');

  const leftDiff: DiffLine[] = [];
  const rightDiff: DiffLine[] = [];

  // Usar algoritmo de LCS (Longest Common Subsequence) simplificado
  const lcs = getLCS(leftLines, rightLines);
  
  let leftIdx = 0;
  let rightIdx = 0;
  let leftLineNum = 1;
  let rightLineNum = 1;

  for (const commonLine of lcs) {
    // Adicionar linhas removidas
    while (leftIdx < leftLines.length && leftLines[leftIdx] !== commonLine) {
      leftDiff.push({
        type: 'remove',
        content: leftLines[leftIdx],
        lineNumber: leftLineNum++,
      });
      leftIdx++;
    }

    // Adicionar linhas adicionadas
    while (rightIdx < rightLines.length && rightLines[rightIdx] !== commonLine) {
      rightDiff.push({
        type: 'add',
        content: rightLines[rightIdx],
        lineNumber: rightLineNum++,
      });
      rightIdx++;
    }

    // Adicionar linha comum
    if (leftIdx < leftLines.length && rightIdx < rightLines.length) {
      leftDiff.push({
        type: 'unchanged',
        content: leftLines[leftIdx],
        lineNumber: leftLineNum++,
      });
      rightDiff.push({
        type: 'unchanged',
        content: rightLines[rightIdx],
        lineNumber: rightLineNum++,
      });
      leftIdx++;
      rightIdx++;
    }
  }

  // Adicionar linhas restantes
  while (leftIdx < leftLines.length) {
    leftDiff.push({
      type: 'remove',
      content: leftLines[leftIdx],
      lineNumber: leftLineNum++,
    });
    leftIdx++;
  }

  while (rightIdx < rightLines.length) {
    rightDiff.push({
      type: 'add',
      content: rightLines[rightIdx],
      lineNumber: rightLineNum++,
    });
    rightIdx++;
  }

  return {
    leftLines: leftDiff,
    rightLines: rightDiff,
  };
}

/**
 * Calcula a Longest Common Subsequence entre dois arrays
 */
function getLCS(arr1: string[], arr2: string[]): string[] {
  const m = arr1.length;
  const n = arr2.length;

  // Criar matriz DP
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // Preencher a matriz
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Reconstruir a LCS
  const lcs: string[] = [];
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (arr1[i - 1] === arr2[j - 1]) {
      lcs.unshift(arr1[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}

export function useDiffCalculator() {
  return {
    calculateLineDiff,
  };
}
