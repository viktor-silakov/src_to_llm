export interface SourceConfig {
  id: string;
  name: string;
  description: string;
  packageName: string;
  paths: string[];
  outputDir: string;
  fileTypes: string[];
  ignorePaths: string[];
}

export const defaultFileTypes = [
  '.js',
  '.cjs',
  '.mjs',
  '.ts',
  '.mts',
  '.cts',
  '.tsx'
];

export const defaultIgnorePaths = [
  'e2e',
  'step_definitions',
  '.features-gen',
  'assets',
  'reports',
  'report',
  'dist/server',
  'support/mcp',
  'package-lock.json',
  '.log',
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.cache',
  '.env',
  '.DS_Store',
  'npm-debug.log',
  'yarn-error.log',
  '.idea',
  '.vscode',
  '*.log',
  '*.tmp',
  '*.temp',
  '*.swp',
  'Thumbs.db'
];

export const isSourceConfig = (value: unknown): value is SourceConfig => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as SourceConfig;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.description === 'string' &&
    typeof candidate.packageName === 'string' &&
    typeof candidate.outputDir === 'string' &&
    Array.isArray(candidate.paths) &&
    Array.isArray(candidate.fileTypes) &&
    Array.isArray(candidate.ignorePaths)
  );
};
