import assert from 'node:assert';
import { SourceConfig, OutputFormat, isSourceConfig } from '../src/types/source-config';

const defaultFileTypes = ['.js', '.ts', '.tsx'];
const defaultIgnorePaths = ['node_modules', 'dist'];

const acceptedFormats: OutputFormat[] = ['json', 'yaml', 'toon'];

acceptedFormats.forEach((format) => {
  const validConfig: SourceConfig = {
    id: `demo-${format}`,
    name: 'Demo Config',
    description: 'Demo configuration for testing',
    packageName: 'demo-package',
    paths: ['.'],
    outputDir: './out',
    fileTypes: defaultFileTypes,
    ignorePaths: defaultIgnorePaths,
    outputFormat: format
  };

  assert.strictEqual(isSourceConfig(validConfig), true, `${format} config should pass validation`);
});

const fallbackConfig: SourceConfig = {
  id: 'demo-default',
  name: 'Demo Config',
  description: 'Demo configuration for testing',
  packageName: 'demo-package',
  paths: ['.'],
  outputDir: './out',
  fileTypes: defaultFileTypes,
  ignorePaths: defaultIgnorePaths
};

assert.strictEqual(isSourceConfig(fallbackConfig), true, 'Config without format should pass validation');

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

const invalidFormatConfig = {
  id: 'demo',
  name: 'Invalid format config',
  description: 'Uses unsupported format value',
  packageName: 'demo-package',
  paths: ['.'],
  outputDir: './out',
  fileTypes: defaultFileTypes,
  ignorePaths: defaultIgnorePaths,
  outputFormat: 'xml'
};

assert.strictEqual(isSourceConfig(invalidFormatConfig), false, 'Unsupported format should fail validation');

console.log('✅ source-config tests passed');
