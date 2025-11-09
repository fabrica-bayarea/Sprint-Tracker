/**
 * Configuração centralizada de variáveis de ambiente
 * 
 * Este arquivo:
 * - Centraliza todas as variáveis de ambiente do projeto
 * - Fornece valores padrão seguros
 * - Adiciona tipagem para melhor autocomplete
 * - Valida as variáveis necessárias
 */

interface EnvConfig {
  // URLs da API
  apiUrl: string;
  wsUrl: string;
  wsPath: string;
  
  // Ambiente
  isDev: boolean;
  isProd: boolean;
  nodeEnv: string;
}

/**
 * Valida se uma variável de ambiente obrigatória existe
 */
function getRequiredEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  
  if (!value) {
    throw new Error(
      `Variável de ambiente obrigatória não encontrada: ${key}`
    );
  }
  
  return value;
}

/**
 * Pega uma variável de ambiente opcional com valor padrão
 */
function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Configuração de ambiente do projeto
 * Todas as variáveis de ambiente devem ser acessadas através deste objeto
 */
export const env: EnvConfig = {
  // URLs da API
  apiUrl: getRequiredEnv('BASE_URL_API', 'http://localhost:3000'),
  wsUrl: getRequiredEnv('BASE_URL_WS', 'ws://localhost:3000'),
  wsPath: getOptionalEnv('BASE_URL_WS_PATH', '/socket.io'),
  
  // Ambiente
  nodeEnv: getOptionalEnv('NODE_ENV', 'development'),
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
} as const;

/**
 * Validação das variáveis de ambiente no startup
 * Chama esta função no início da aplicação para garantir que tudo está configurado
 */
export function validateEnv(): void {
  const errors: string[] = [];
  
  // Validações customizadas
  if (!env.apiUrl.startsWith('http')) {
    errors.push('BASE_URL_API deve começar com http:// ou https://');
  }
  
  if (!env.wsUrl.startsWith('ws')) {
    errors.push('BASE_URL_WS deve começar com ws:// ou wss://');
  }
  
  if (errors.length > 0) {
    throw new Error(
      `Erros de validação das variáveis de ambiente:\n${errors.join('\n')}`
    );
  }
  
  // Log em desenvolvimento
  if (env.isDev) {
    console.log('✅ Variáveis de ambiente validadas:', {
      apiUrl: env.apiUrl,
      wsUrl: env.wsUrl,
      wsPath: env.wsPath,
      nodeEnv: env.nodeEnv,
    });
  }
}

// Exporta também como default para facilitar imports
export default env;
