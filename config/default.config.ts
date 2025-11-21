import { SourceConfig, defaultFileTypes, defaultIgnorePaths } from '../src/types/source-config';

export const defaultConfig: SourceConfig = {
  id: 'default',
  name: 'Current workspace',
  description: 'Default configuration for this repository using relative paths',
  packageName: 'src-to-llm',
  paths: ['.'],
  outputDir: './out',
  fileTypes: defaultFileTypes,
  ignorePaths: defaultIgnorePaths
};
