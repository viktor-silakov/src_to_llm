# Agent Playbook

Guidelines for creating new configs that agents can rely on during exports.

## Workflow
- Create a new `config/<name>.config.ts` file
- Import `SourceConfig` from `../src/types/source-config`
- Declare explicit `fileTypes` and `ignorePaths` arrays inside the config
- Set `outputFormat` when you need `yaml` or `toon`; omit it for default `json`
- Keep `paths` absolute or workspace-relative and ensure they exist locally before running `yarn start`
- Omit `outputDir` unless you need a custom location (defaults to `./out`)

## TypeScript Monorepo Example
```ts
import { SourceConfig } from '../src/types/source-config';

const fileTypes = ['.ts', '.tsx', '.js', '.json'];
const ignorePaths = ['node_modules', 'dist', 'storybook-static', '.turbo', '*.log'];

export const tsWorkspaceConfig: SourceConfig = {
  description: 'Next.js app with shared UI packages',
  packageName: 'ts-workspace',
  paths: ['../client', '../packages/ui'],
  fileTypes,
  ignorePaths,
  outputFormat: 'yaml'
};
```

## Rust Crate Example
```ts
import { SourceConfig } from '../src/types/source-config';

const fileTypes = ['.rs', '.toml', '.md'];
const ignorePaths = ['target', 'benches/generated', '*.log'];

export const rustCoreConfig: SourceConfig = {
  description: 'Primary Rust crate with documentation',
  packageName: 'rust-core',
  paths: ['../crates/core'],
  fileTypes,
  ignorePaths,
  outputFormat: 'json'
};
```

## Python Service Example
```ts
import { SourceConfig } from '../src/types/source-config';

const fileTypes = ['.py', '.pyi', '.toml', '.md'];
const ignorePaths = ['.venv', '__pycache__', '*.pyc', 'build', 'dist'];

export const pythonServiceConfig: SourceConfig = {
  description: 'API layer with tests and infra scripts',
  packageName: 'python-service',
  paths: ['../services/api'],
  fileTypes,
  ignorePaths,
  outputFormat: 'toon'
};
```
