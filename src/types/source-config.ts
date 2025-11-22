export type OutputFormat = 'json' | 'yaml' | 'toon';

export interface SourceConfig {
  description: string;
  packageName: string;
  paths: string[];
  outputDir?: string;
  fileTypes: string[];
  ignorePaths: string[];
  outputFormat?: OutputFormat;
}

export const isSourceConfig = (value: unknown): value is SourceConfig => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as SourceConfig;

  if (
    typeof candidate.description !== 'string' ||
    typeof candidate.packageName !== 'string' ||
    !Array.isArray(candidate.paths) ||
    !Array.isArray(candidate.fileTypes) ||
    !Array.isArray(candidate.ignorePaths)
  ) {
    return false;
  }

  if (candidate.outputDir !== undefined && typeof candidate.outputDir !== 'string') {
    return false;
  }

  if (
    !candidate.paths.every((value) => typeof value === 'string') ||
    !candidate.fileTypes.every((value) => typeof value === 'string') ||
    !candidate.ignorePaths.every((value) => typeof value === 'string')
  ) {
    return false;
  }

  if (
    candidate.outputFormat !== undefined &&
    candidate.outputFormat !== 'json' &&
    candidate.outputFormat !== 'yaml' &&
    candidate.outputFormat !== 'toon'
  ) {
    return false;
  }

  return true;
};
