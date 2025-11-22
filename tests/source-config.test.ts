import assert from 'node:assert';
import { SourceConfig, OutputFormat, isSourceConfig } from '../src/types/source-config';

const defaultFileTypes = ['.js', '.ts', '.tsx'];
const defaultIgnorePaths = ['node_modules', 'dist'];

const acceptedFormats: OutputFormat[] = ['json', 'yaml', 'toon'];

acceptedFormats.forEach((format) => {
  const validConfig: SourceConfig = {
    description: 'Demo configuration for testing',
    packageName: `demo-${format}`,
    paths: ['.'],
    outputDir: './custom-out',
    fileTypes: defaultFileTypes,
    ignorePaths: defaultIgnorePaths,
    outputFormat: format
  };

  assert.strictEqual(isSourceConfig(validConfig), true, `${format} config should pass validation`);
});

const fallbackConfig: SourceConfig = {
  description: 'Demo configuration for testing',
  packageName: 'demo-package',
  paths: ['.'],
  fileTypes: defaultFileTypes,
  ignorePaths: defaultIgnorePaths
};

assert.strictEqual(isSourceConfig(fallbackConfig), true, 'Config without format or outputDir should pass validation');

const missingFieldConfig = {
  description: 'Missing fields'
};

assert.strictEqual(isSourceConfig(missingFieldConfig), false, 'Config with missing fields should fail validation');

const wrongTypesConfig = {
  description: 'Config with wrong field types',
  packageName: 123,
  paths: 'not-an-array',
  outputDir: {},
  fileTypes: null,
  ignorePaths: undefined
};

assert.strictEqual(isSourceConfig(wrongTypesConfig), false, 'Config with wrong types should fail validation');

const invalidFormatConfig = {
  description: 'Uses unsupported format value',
  packageName: 'demo-package',
  paths: ['.'],
  fileTypes: defaultFileTypes,
  ignorePaths: defaultIgnorePaths,
  outputFormat: 'xml'
};

assert.strictEqual(isSourceConfig(invalidFormatConfig), false, 'Unsupported format should fail validation');

console.log('✅ source-config tests passed');
