import { FileItem } from '../types';

export const SAMPLE_PRESETS = [
  {
    id: 'js-refactor',
    name: 'Refatoração JavaScript (Funções, Ifs & Loops)',
    language: 'typescript',
    fileA: 'C:/Users/JeanPierre/Projetos/sistema-pedidos/src/services/orders/processOrder.v1.ts',
    fileB: 'C:/Users/JeanPierre/Projetos/sistema-pedidos/src/services/orders/processOrder.v2.ts',
    left: `// Versão 1: Sistema legado de pedidos
export interface Order {
  id: string;
  items: Array<{ name: string; price: number; quantity: number; category: string }>;
  customerType: string;
  couponCode?: string;
}

export function processOrder(order: Order): number {
  let total = 0;
  
  // Bloco de iteração legada
  for (let i = 0; i < order.items.length; i++) {
    const item = order.items[i];
    total = total + (item.price * item.quantity);
  }

  // Bloco condicional if
  if (order.customerType === 'VIP') {
    total = total * 0.90; // 10% desconto
  } else if (order.customerType === 'PARTNER') {
    total = total * 0.85; // 15% desconto
  } else {
    // Cliente comum sem desconto
    total = total * 1.0;
  }

  // Validação de cupom de desconto
  if (order.couponCode) {
    if (order.couponCode === 'NATAL10') {
      total = total - 10;
    } else if (order.couponCode === 'FRETEGRATIS') {
      console.log('Cupom de frete aplicado');
    }
  }

  return total;
}

export function calculateShipping(weightKg: number, region: string): number {
  let shippingCost = 15.0;

  if (region === 'SP' || region === 'RJ') {
    shippingCost = 10.0;
  } else if (region === 'NORDESTE') {
    shippingCost = 28.5;
  } else {
    shippingCost = 35.0;
  }

  if (weightKg > 5) {
    shippingCost += (weightKg - 5) * 3.5;
  }

  return shippingCost;
}
`,
    right: `// Versão 2: Sistema otimizado e modernizado com novas regras
export interface Order {
  id: string;
  items: Array<{ name: string; price: number; quantity: number; category: string }>;
  customerType: 'VIP' | 'PARTNER' | 'REGULAR';
  couponCode?: string;
  taxExempt?: boolean;
}

export function processOrder(order: Order): number {
  // Otimização: iteração funcional com reduce
  let total = order.items.reduce((acc, item) => {
    const itemSubtotal = item.price * item.quantity;
    return acc + itemSubtotal;
  }, 0);

  // Bloco condicional modernizado com novas taxas 2026
  if (order.customerType === 'VIP') {
    total = total * 0.88; // Desconto atualizado para 12%
  } else if (order.customerType === 'PARTNER') {
    total = total * 0.80; // Desconto VIP parceiro 20%
  } else if (order.taxExempt) {
    total = total * 0.95; // Isenção fiscal
  }

  // Validação de cupom de desconto com Map
  if (order.couponCode) {
    const couponDiscounts: Record<string, number> = {
      'NATAL10': 15,
      'BEMVINDO20': 20,
      'PROMO2026': 25
    };

    if (order.couponCode in couponDiscounts) {
      total = Math.max(0, total - couponDiscounts[order.couponCode]);
    }
  }

  return Math.round(total * 100) / 100;
}

export function calculateShipping(weightKg: number, region: string, isExpress = false): number {
  let baseCost = 12.0;

  // Tabela regional atualizada
  if (['SP', 'RJ', 'MG', 'PR'].includes(region)) {
    baseCost = 8.50;
  } else if (region === 'NORDESTE' || region === 'NORTE') {
    baseCost = 24.00;
  } else {
    baseCost = 30.00;
  }

  if (isExpress) {
    baseCost *= 1.5;
  }

  if (weightKg > 5) {
    baseCost += (weightKg - 5) * 4.2;
  }

  return baseCost;
}
`
  },
  {
    id: 'python-algo',
    name: 'Algoritmo Python (Iterações & Condicionais)',
    language: 'python',
    fileA: 'C:/Users/JeanPierre/Projetos/analytics-pipeline/scripts/data_pipeline_old.py',
    fileB: 'C:/Users/JeanPierre/Projetos/analytics-pipeline/scripts/data_pipeline_new.py',
    left: `import math

def analyze_user_metrics(records):
    """Calcula estatísticas de usuários de forma sequencial"""
    valid_records = []
    total_score = 0
    
    # Loop de filtragem
    for record in records:
        if record.get('active') == True:
            if record.get('score', 0) > 50:
                valid_records.append(record)
                total_score += record.get('score', 0)

    # Condicional de validação
    if len(valid_records) == 0:
        return {'average': 0, 'count': 0, 'status': 'EMPTY'}
    
    avg = total_score / len(valid_records)
    
    if avg > 80:
        tier = 'DIAMOND'
    elif avg > 65:
        tier = 'GOLD'
    else:
        tier = 'SILVER'
        
    return {
        'average': avg,
        'count': len(valid_records),
        'tier': tier
    }
`,
    right: `import math
from typing import List, Dict, Any

def analyze_user_metrics(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calcula estatísticas de usuários com list comprehension otimizada"""
    # Filtragem veloz e segura
    valid_records = [
        r for r in records 
        if r.get('active') is True and r.get('score', 0) >= 40
    ]

    # Condicional de validação rápida
    if not valid_records:
        return {'average': 0.0, 'count': 0, 'tier': 'INACTIVE', 'variance': 0.0}
    
    scores = [r['score'] for r in valid_records]
    avg = sum(scores) / len(scores)
    
    # Cálculo de variância estatística
    variance = sum((s - avg) ** 2 for s in scores) / len(scores)
    
    # Classificação de tiers atualizada
    if avg >= 85:
        tier = 'PLATINUM'
    elif avg >= 70:
        tier = 'DIAMOND'
    elif avg >= 55:
        tier = 'GOLD'
    else:
        tier = 'BRONZE'
        
    return {
        'average': round(avg, 2),
        'variance': round(variance, 2),
        'count': len(valid_records),
        'tier': tier
    }
`
  },
  {
    id: 'json-config',
    name: 'Configurações de Servidor (JSON)',
    language: 'json',
    fileA: 'C:/Users/JeanPierre/Projetos/cloud-service/config/appsettings.dev.json',
    fileB: 'C:/Users/JeanPierre/Projetos/cloud-service/config/appsettings.prod.json',
    left: `{
  "application": "CloudService",
  "version": "1.4.0",
  "environment": "development",
  "server": {
    "port": 3000,
    "host": "localhost",
    "debug": true,
    "corsAllowed": ["http://localhost:5173", "http://localhost:3000"]
  },
  "database": {
    "type": "sqlite",
    "host": "127.0.0.1",
    "poolSize": 5,
    "ssl": false
  },
  "features": {
    "rateLimiter": false,
    "aiAssistance": true,
    "emailNotifications": false,
    "auditLogs": false
  }
}`,
    right: `{
  "application": "CloudService",
  "version": "2.0.0-rc1",
  "environment": "production",
  "server": {
    "port": 8080,
    "host": "0.0.0.0",
    "debug": false,
    "corsAllowed": ["https://app.example.com", "https://api.example.com"]
  },
  "database": {
    "type": "postgres",
    "host": "db.prod.internal.cloud",
    "poolSize": 25,
    "ssl": true,
    "readReplicas": 3
  },
  "features": {
    "rateLimiter": true,
    "aiAssistance": true,
    "emailNotifications": true,
    "auditLogs": true,
    "multiFactorAuth": true
  }
}`
  }
];

export const SAMPLE_FOLDER_FILES: FileItem[] = [
  {
    id: 'file-1',
    path: 'src/services/orderService.ts',
    name: 'orderService.ts',
    leftContent: SAMPLE_PRESETS[0].left,
    rightContent: SAMPLE_PRESETS[0].right,
    status: 'modified',
    additions: 18,
    deletions: 12,
    extension: 'ts'
  },
  {
    id: 'file-2',
    path: 'src/utils/metrics.py',
    name: 'metrics.py',
    leftContent: SAMPLE_PRESETS[1].left,
    rightContent: SAMPLE_PRESETS[1].right,
    status: 'modified',
    additions: 14,
    deletions: 9,
    extension: 'py'
  },
  {
    id: 'file-3',
    path: 'config/settings.json',
    name: 'settings.json',
    leftContent: SAMPLE_PRESETS[2].left,
    rightContent: SAMPLE_PRESETS[2].right,
    status: 'modified',
    additions: 10,
    deletions: 6,
    extension: 'json'
  },
  {
    id: 'file-4',
    path: 'src/components/NewFeatureModal.tsx',
    name: 'NewFeatureModal.tsx',
    leftContent: '',
    rightContent: `import React from 'react';\n\nexport const NewFeatureModal = () => {\n  return (\n    <div className="p-4 bg-emerald-950 text-white rounded-lg">\n      <h3>Novo Componente Adicionado na Versão 2.0</h3>\n    </div>\n  );\n};\n`,
    status: 'added',
    additions: 9,
    deletions: 0,
    extension: 'tsx'
  },
  {
    id: 'file-5',
    path: 'src/legacy/deprecateOldEngine.ts',
    name: 'deprecateOldEngine.ts',
    leftContent: `// Arquivo legado removido na nova versão\nexport function oldEngine() {\n  console.warn("Obsoleto");\n}\n`,
    rightContent: '',
    status: 'deleted',
    additions: 0,
    deletions: 4,
    extension: 'ts'
  },
  {
    id: 'file-6',
    path: 'README.md',
    name: 'README.md',
    leftContent: `# Comparador de Arquivos & Pastas\nFerramenta em tempo real para comparação e mesclagem de código.\n`,
    rightContent: `# Comparador de Arquivos & Pastas\nFerramenta em tempo real para comparação e mesclagem de código.\n`,
    status: 'identical',
    additions: 0,
    deletions: 0,
    extension: 'md'
  }
];
