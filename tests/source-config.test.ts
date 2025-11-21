import assert from 'node:assert';
import { SourceConfig, isSourceConfig, defaultFileTypes, defaultIgnorePaths } from '../src/types/source-config';

const validConfig: SourceConfig = {
  id: 'demo',
  name: 'Demo Config',
  description: 'Demo configuration for testing',
  packageName: 'demo-package',
  paths: ['.'],
  outputDir: './out',
  fileTypes: defaultFileTypes,
  ignorePaths: defaultIgnorePaths
};

assert.strictEqual(isSourceConfig(validConfig), true, 'Valid config should pass validation');

const missingFieldConfig = {
  id: 'demo',
  description: 'Missing fields'
};

assert.strictEqual(isSourceConfig(missingFieldConfig), false, 'Config with missing fields should fail validation');

const wrongTypesConfig = {
  id: 'demo',
  name: 'Wrong Types',
  description: 'Config with wrong field types',
  packageName: 123,
  paths: 'not-an-array',
  outputDir: {},
  fileTypes: null,
  ignorePaths: undefined
};

assert.strictEqual(isSourceConfig(wrongTypesConfig), false, 'Config with wrong types should fail validation');

console.log('✅ source-config tests passed');
