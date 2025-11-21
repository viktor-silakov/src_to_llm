# src-to-llm

Minimal CLI that walks project sources, filters them by config, and writes JSON plus a visualization for quick bundle review.

## Requirements
- Node.js 18+
- Yarn 1.x

## Getting Started
1. Install dependencies: `yarn`
2. Choose a config and export code: `yarn start`
3. Verify types: `yarn typecheck`
4. Run the minimal validation tests: `yarn test`

## Creating Custom Configs
Place additional configs under `config/` with the suffix `.config.ts`. Only `config/default.config.ts` is tracked in git; other files stay local.

Example (save as `config/my-app.config.ts`):
```ts
import { SourceConfig, defaultFileTypes, defaultIgnorePaths } from '../src/types/source-config';

export const myAppConfig: SourceConfig = {
  id: 'my-app',
  name: 'My App',
  description: 'Collect the core sources for My App',
  packageName: 'my-app',
  paths: ['../my-app/src', '../my-app/packages/utils'],
  outputDir: './out',
  fileTypes: [...defaultFileTypes, '.json'],
  ignorePaths: [...defaultIgnorePaths, 'dist', 'storybook-static']
};
```

Run `yarn start`, pick `my-app`, and find the generated artifacts inside `out/<packageName>/`.
