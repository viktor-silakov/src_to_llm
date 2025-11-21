import fs from 'node:fs';
import path from 'node:path';
import Enquirer from 'enquirer';
import { stringify as stringifyYaml } from 'yaml';
import { encode as encodeToon } from '@toon-format/toon';
import { OutputFormat, SourceConfig, isSourceConfig } from './types/source-config';

type FilesContent = Record<string, Record<string, string>>;

interface ProcessingStats {
  totalFiles: number;
  totalSourceSize: number;
  outputFileSize: number;
  estimatedTokens: number;
}

const escapeRegExp = (input: string): string => input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
};

const formatNumber = (value: number): string => value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const shouldIgnoreFile = (relativePath: string, ignorePaths: string[]): boolean => {
  const normalizedPath = path.normalize(relativePath).replace(/\\/g, '/');

  return ignorePaths.some((ignorePath) => {
    if (ignorePath.includes('*')) {
      const regexPattern = new RegExp('^' + ignorePath.split('*').map(escapeRegExp).join('.*') + '$');
      return regexPattern.test(path.basename(normalizedPath));
    }

    return (
      normalizedPath.startsWith(`${ignorePath}/`) ||
      normalizedPath.startsWith(`/${ignorePath}/`) ||
      normalizedPath.includes(`/${ignorePath}/`) ||
      normalizedPath.endsWith(`/${ignorePath}`) ||
      normalizedPath === ignorePath
    );
  });
};

const estimateGeminiTokens = (text: string): number => Math.ceil(text.length / 3.5);

const sanitizeFileName = (fileName: string): string => fileName.replace(/[^a-z0-9.]/gi, '_');

const generateVisualizationHTML = (
  filesContent: FilesContent,
  stats: ProcessingStats
): string => {
  const treeData = { name: 'root', children: [] as any[] };

  Object.keys(filesContent).forEach((packageName) => {
    const packageNode = { name: packageName, children: [] as any[] };

    Object.keys(filesContent[packageName]).forEach((filePath) => {
      const content = filesContent[packageName][filePath];
      const size = Buffer.byteLength(content, 'utf-8');
      const parts = filePath.split('/');
      let currentLevel = packageNode.children;

      for (let i = 0; i < parts.length - 1; i += 1) {
        const part = parts[i];
        let existing = currentLevel.find((node) => node.name === part && node.children);

        if (!existing) {
          existing = { name: part, children: [] };
          currentLevel.push(existing);
        }

        currentLevel = existing.children;
      }

      currentLevel.push({
        name: parts[parts.length - 1],
        value: size
      });
    });

    treeData.children.push(packageNode);
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bundle Size Analyzer</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #1a1a1a;
            color: #fff;
            overflow: hidden;
        }
        #header {
            background: #2d2d2d;
            padding: 20px;
            border-bottom: 2px solid #3d3d3d;
        }
        #header h1 {
            font-size: 24px;
            margin-bottom: 10px;
        }
        .stats {
            display: flex;
            gap: 30px;
            font-size: 14px;
            color: #aaa;
        }
        .stat-item strong {
            color: #fff;
            margin-right: 5px;
        }
        #chart {
            width: 100vw;
            height: calc(100vh - 120px);
        }
        .node {
            cursor: pointer;
            transition: opacity 0.2s;
        }
        .node:hover {
            opacity: 0.8;
        }
        .node-label {
            pointer-events: none;
            font-size: 11px;
            fill: #fff;
            text-shadow: 0 1px 2px rgba(0,0,0,0.8);
        }
        #tooltip {
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 12px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
            border: 1px solid #555;
            z-index: 1000;
        }
        #notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            font-size: 14px;
            opacity: 0;
            transition: opacity 0.3s;
            z-index: 2000;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        #breadcrumb {
            padding: 15px 20px;
            background: #252525;
            font-size: 14px;
            border-bottom: 1px solid #3d3d3d;
        }
        .breadcrumb-item {
            display: inline;
            color: #6eb5ff;
            cursor: pointer;
        }
        .breadcrumb-item:hover {
            text-decoration: underline;
        }
        .breadcrumb-separator {
            margin: 0 8px;
            color: #666;
        }
    </style>
</head>
<body>
    <div id="header">
        <h1>📊 Bundle Size Analyzer</h1>
        <div class="stats">
            <div class="stat-item"><strong>Files:</strong> ${formatNumber(stats.totalFiles)}</div>
            <div class="stat-item"><strong>Source Size:</strong> ${formatBytes(stats.totalSourceSize)}</div>
            <div class="stat-item"><strong>JSON Size:</strong> ${formatBytes(stats.outputFileSize)}</div>
            <div class="stat-item"><strong>Gemini Tokens:</strong> ${formatNumber(stats.estimatedTokens)}</div>
        </div>
    </div>
    <div id="breadcrumb"></div>
    <div id="chart"></div>
    <div id="tooltip"></div>
    <div id="notification"></div>

    <script>
        const data = ${JSON.stringify(treeData)};

        const width = window.innerWidth;
        const height = window.innerHeight - 120;

        const color = d3.scaleOrdinal(d3.schemeCategory10);

        const treemap = d3.treemap()
            .size([width, height])
            .padding(1)
            .round(true);

        const svg = d3.select('#chart')
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const tooltip = d3.select('#tooltip');
        const breadcrumb = d3.select('#breadcrumb');
        const notification = d3.select('#notification');

        let currentRoot = data;
        let currentPath = [];

        function showNotification(message) {
            notification
                .text(message)
                .style('opacity', 1);
            setTimeout(() => {
                notification.style('opacity', 0);
            }, 2000);
        }

        function render(root) {
            const hierarchy = d3.hierarchy(root)
                .sum((node) => node.value || 0)
                .sort((a, b) => b.value - a.value);

            treemap(hierarchy);

            svg.selectAll('*').remove();

            const nodes = svg.selectAll('g')
                .data(hierarchy.leaves())
                .join('g')
                .attr('class', 'node')
                .attr('transform', (node) => \`translate(\${node.x0},\${node.y0})\`);

            nodes.append('rect')
                .attr('width', (node) => node.x1 - node.x0)
                .attr('height', (node) => node.y1 - node.y0)
                .attr('fill', (node) => color(node.parent.data.name))
                .attr('stroke', '#1a1a1a')
                .attr('stroke-width', 2)
                .on('mouseover', function(event, node) {
                    const size = node.value;
                    const percent = ((size / hierarchy.value) * 100).toFixed(2);

                    const pathParts = [];
                    let current = node;
                    while (current.parent) {
                        pathParts.unshift(current.data.name);
                        current = current.parent;
                    }
                    const fullPath = pathParts.join('/');

                    tooltip
                        .style('opacity', 1)
                        .html(\`
                            <strong>\${node.data.name}</strong><br/>
                            Path: \${fullPath}<br/>
                            Size: \${formatBytes(size)}<br/>
                            Percent: \${percent}%
                        \`)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY + 10) + 'px');
                })
                .on('mouseout', () => tooltip.style('opacity', 0))
                .on('click', (event, node) => {
                    const pathParts = [];
                    let current = node;
                    while (current.parent) {
                        pathParts.unshift(current.data.name);
                        current = current.parent;
                    }
                    const fullPath = pathParts.join('/');

                    navigator.clipboard.writeText(fullPath).then(() => {
                        showNotification('✓ Path copied to clipboard!');
                    }).catch(() => {
                        showNotification('✗ Failed to copy path');
                    });
                });

            nodes.append('text')
                .attr('class', 'node-label')
                .attr('x', 4)
                .attr('y', 15)
                .text((node) => {
                    const width = node.x1 - node.x0;
                    const height = node.y1 - node.y0;
                    if (width > 50 && height > 20) {
                        return node.data.name.length > 20 ? node.data.name.substring(0, 20) + '...' : node.data.name;
                    }
                    return '';
                });
        }

        function updateBreadcrumb() {
            const crumbs = ['root', ...currentPath];
            breadcrumb.html(
                crumbs
                    .map((name, index) => \`<span class="breadcrumb-item" onclick="navigateTo(\${index})">\${name}</span>\`)
                    .join('<span class="breadcrumb-separator">/</span>')
            );
        }

        window.navigateTo = function(index) {
            currentPath = currentPath.slice(0, index);
            currentRoot = data;

            for (const name of currentPath.slice(1)) {
                currentRoot = currentRoot.children.find((child) => child.name === name);
            }

            updateBreadcrumb();
            render(currentRoot);
        };

        updateBreadcrumb();
        render(currentRoot);

        window.addEventListener('resize', () => {
            location.reload();
        });

        function formatBytes(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
        }
    </script>
</body>
</html>`;
};

const collectFiles = (
  dir: string,
  baseDir: string,
  config: SourceConfig,
  filesContent: FilesContent
): void => {
  const entries = fs.readdirSync(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    const relativePath = path.relative(baseDir, fullPath);

    if (stat.isDirectory()) {
      if (shouldIgnoreFile(relativePath, config.ignorePaths)) {
        continue;
      }

      collectFiles(fullPath, baseDir, config, filesContent);
      continue;
    }

    if (stat.isFile()) {
      addFile(fullPath, relativePath, config, filesContent);
    }
  }
};

const addFile = (
  filePath: string,
  relativePath: string,
  config: SourceConfig,
  filesContent: FilesContent
): void => {
  if (shouldIgnoreFile(relativePath, config.ignorePaths)) {
    return;
  }

  if (!config.fileTypes.includes(path.extname(filePath))) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const packageFiles = filesContent[config.packageName] || {};
  packageFiles[relativePath] = content;
  filesContent[config.packageName] = packageFiles;
};

const resolvePaths = (config: SourceConfig): string[] =>
  config.paths.map((current) => (path.isAbsolute(current) ? current : path.join(process.cwd(), current)));

const resolveOutputDir = (config: SourceConfig): string =>
  path.isAbsolute(config.outputDir) ? config.outputDir : path.join(process.cwd(), config.outputDir);

const resolveFormat = (config: SourceConfig): OutputFormat => config.outputFormat ?? 'json';

const formatExtensions: Record<OutputFormat, string> = {
  json: '.json',
  yaml: '.yaml',
  toon: '.toon'
};

const collectConfigFiles = (dir: string): string[] => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectConfigFiles(fullPath));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (!entry.name.endsWith('.config.ts')) {
      continue;
    }

    if (entry.name.startsWith('_')) {
      continue;
    }

    files.push(fullPath);
  }

  return files;
};

const loadConfigs = async (): Promise<SourceConfig[]> => {
  const configDir = path.join(process.cwd(), 'config');

  if (!fs.existsSync(configDir) || !fs.statSync(configDir).isDirectory()) {
    throw new Error('Каталог config не найден');
  }

  const configFiles = collectConfigFiles(configDir).sort();

  const loaded: SourceConfig[] = [];
  const seen = new Set<string>();

  for (const filePath of configFiles) {
    const moduleExports = require(filePath) as Record<string, unknown>;
    const values = Object.values(moduleExports);

    for (const value of values) {
      if (isSourceConfig(value) && !seen.has(value.id)) {
        loaded.push(value);
        seen.add(value.id);
        continue;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          if (isSourceConfig(item) && !seen.has(item.id)) {
            loaded.push(item);
            seen.add(item.id);
          }
        }
      }
    }
  }

  if (!loaded.length) {
    throw new Error('Конфигурации не найдены');
  }

  return loaded;
};

const convertSources = (config: SourceConfig): void => {
  const filesContent: FilesContent = {};
  const resolvedPaths = resolvePaths(config);
  const outputDir = resolveOutputDir(config);
  const projectOutputDir = path.join(outputDir, sanitizeFileName(config.packageName));

  resolvedPaths.forEach((currentPath) => {
    console.log(`Processing path: ${currentPath}`);

    if (!fs.existsSync(currentPath)) {
      console.warn(`Path is missing: ${currentPath}`);
      return;
    }

    const stat = fs.statSync(currentPath);

    if (stat.isDirectory()) {
      collectFiles(currentPath, currentPath, config, filesContent);
    } else if (stat.isFile()) {
      addFile(currentPath, path.basename(currentPath), config, filesContent);
    }
  });

  if (!fs.existsSync(projectOutputDir)) {
    fs.mkdirSync(projectOutputDir, { recursive: true });
  }

  const format = resolveFormat(config);
  const outputExtension = formatExtensions[format];
  const outputName =
    resolvedPaths.length === 1
      ? `${sanitizeFileName(path.basename(resolvedPaths[0]))}${outputExtension}`
      : `${sanitizeFileName(config.id)}-codebase${outputExtension}`;
  const outputPath = path.join(projectOutputDir, outputName);

  let outputContent: string;

  switch (format) {
    case 'yaml':
      outputContent = stringifyYaml(filesContent);
      break;
    case 'toon':
      outputContent = encodeToon(filesContent);
      break;
    default:
      outputContent = JSON.stringify(filesContent, null, 2);
  }

  fs.writeFileSync(outputPath, outputContent, 'utf-8');

  const outputFileSize = fs.statSync(outputPath).size;
  const estimatedTokens = estimateGeminiTokens(outputContent);

  const totalFiles = Object.values(filesContent).reduce((acc, pkg) => acc + Object.keys(pkg).length, 0);
  const totalSourceSize = Object.values(filesContent).reduce(
    (acc, pkg) =>
      acc +
      Object.values(pkg).reduce((fileAcc, content) => fileAcc + Buffer.byteLength(content, 'utf-8'), 0),
    0
  );

  const stats: ProcessingStats = {
    totalFiles,
    totalSourceSize,
    outputFileSize,
    estimatedTokens
  };

  const htmlOutputPath = path.join(
    projectOutputDir,
    `${path.parse(outputName).name}-visualization.html`
  );
  const visualizationHTML = generateVisualizationHTML(filesContent, stats);
  fs.writeFileSync(htmlOutputPath, visualizationHTML, 'utf-8');

  console.log('\n' + '='.repeat(60));
  console.log('📊 PROCESSING REPORT');
  console.log('='.repeat(60));
  console.log(`✅ Output file: ${outputPath}`);
  console.log(`🎨 Visualization: ${htmlOutputPath}`);
  console.log('-'.repeat(60));
  console.log(`🧾 Output format: ${format.toUpperCase()}`);
  console.log(`📁 Total files processed: ${formatNumber(totalFiles)}`);
  console.log(`📦 Total source size: ${formatBytes(totalSourceSize)}`);
  console.log(`💾 Output file size: ${formatBytes(outputFileSize)}`);
  console.log(`🤖 Estimated Gemini 2.5 tokens: ${formatNumber(estimatedTokens)}`);
  console.log('='.repeat(60));
  console.log('\n💡 To view the visualization, run:');
  console.log(`   open "${htmlOutputPath}"`);
  console.log('');
};

const pickConfig = async (configs: SourceConfig[]): Promise<SourceConfig> => {
  const { config: selectedId } = await Enquirer.prompt<{ config: string }>({
    type: 'select',
    name: 'config',
    message: 'Выберите конфигурацию (стрелками)',
    choices: configs.map((config) => ({
      name: config.id,
      message: `${config.name} — ${config.description}`
    }))
  });

  const selectedConfig = configs.find((config) => config.id === selectedId);

  if (!selectedConfig) {
    throw new Error('Selected configuration is not available');
  }

  return selectedConfig;
};

const main = async (): Promise<void> => {
  const configs = await loadConfigs();
  const config = await pickConfig(configs);
  convertSources(config);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
