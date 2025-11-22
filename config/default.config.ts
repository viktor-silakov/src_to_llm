import { SourceConfig } from '../src/types/source-config';

const fileTypes = ['.js', '.cjs', '.mjs', '.ts', '.mts', '.cts', '.tsx'];

const ignorePaths = [
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

export const defaultConfig: SourceConfig = {
  description: 'Default configuration for this repository using relative paths',
  packageName: 'src-to-llm',
  paths: ['.'],
  fileTypes,
  ignorePaths,
  outputFormat: 'json'
};
