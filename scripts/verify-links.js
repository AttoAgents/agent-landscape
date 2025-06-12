/**
 * Enhanced Link Verification Tool for AI Agent Landscape Dataset
 * 
 * This standalone Node.js script verifies all URLs in the dataset with:
 * 1. Loading the dataset from a JSON file
 * 2. Extracting all URLs from node properties
 * 3. Automatically fixing common URL issues
 * 4. Making HTTP requests to verify if links are accessible
 * 5. Generating a detailed HTML report with clickable links
 * 6. Checking for duplicate nodes and orphaned nodes
 * 
 * Usage: node verify-links-enhanced.js [path-to-dataset.json] [options]
 * Options:
 *   --fix           Automatically fix common URL issues and save updated dataset
 *   --verbose       Show detailed information about all links
 *   --no-html       Skip HTML report generation
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const chalk = require('chalk'); // For colored console output

// Check if chalk is installed, if not, provide instructions
try {
  require.resolve('chalk');
} catch (e) {
  console.error('The "chalk" package is required for this script.');
  console.error('Please install it using: npm install chalk');
  process.exit(1);
}

// Parse command line arguments
const datasetPath = process.argv.find(arg => !arg.startsWith('--') && 
                                      !arg.includes('node') && 
                                      !arg.includes('verify-links')) || './dataset.json';
const shouldFix = process.argv.includes('--fix');
const verbose = process.argv.includes('--verbose');
const skipHtml = process.argv.includes('--no-html');

// Validate file path
if (!fs.existsSync(datasetPath)) {
  console.error(chalk.red(`Error: File not found: ${datasetPath}`));
  console.error(chalk.yellow('Usage: node verify-links-enhanced.js [path-to-dataset.json] [options]'));
  console.error(chalk.yellow('Options:'));
  console.error(chalk.yellow('  --fix           Automatically fix common URL issues and save updated dataset'));
  console.error(chalk.yellow('  --verbose       Show detailed information about all links'));
  console.error(chalk.yellow('  --no-html       Skip HTML report generation'));
  process.exit(1);
}

// Load dataset
console.log(chalk.blue(`Loading dataset from ${datasetPath}...`));
let graphData;
try {
  const fileContent = fs.readFileSync(datasetPath, 'utf8');
  graphData = JSON.parse(fileContent);
} catch (error) {
  console.error(chalk.red(`Error loading dataset: ${error.message}`));
  process.exit(1);
}

// Validate dataset structure
if (!graphData || !graphData.nodes || !Array.isArray(graphData.nodes)) {
  console.error(chalk.red('Error: Invalid dataset format. Expected an object with a "nodes" array.'));
  process.exit(1);
}

console.log(chalk.green(`Successfully loaded dataset with ${graphData.nodes.length} nodes and ${graphData.edges ? graphData.edges.length : 0} edges.`));

// Function to extract all URLs from the dataset
function extractUrls(type = 'all') {
  const urls = [];
  
  graphData.nodes.forEach(node => {
    const properties = node.data.properties;
    if (!properties) return;
    
    // Extract URL property
    if (properties.url && properties.url.trim() !== '') {
      if (type === 'all' || (type === 'github' && properties.url.includes('github.com')) || 
          (type === 'website' && !properties.url.includes('github.com'))) {
        urls.push({
          id: node.data.id,
          label: node.data.label,
          type: node.data.type,
          url: properties.url,
          urlType: 'main',
          nodeIndex: graphData.nodes.indexOf(node),
          propertyName: 'url'
        });
      }
    }
    
    // Extract GitHub property
    if (properties.github && properties.github.trim() !== '') {
      if (type === 'all' || type === 'github') {
        urls.push({
          id: node.data.id,
          label: node.data.label,
          type: node.data.type,
          url: properties.github,
          urlType: 'github',
          nodeIndex: graphData.nodes.indexOf(node),
          propertyName: 'github'
        });
      }
    }
  });
  
  return urls;
}

// Function to validate URL format
function isValidUrlFormat(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

// Function to attempt to fix common URL issues
function attemptUrlFix(url) {
  if (!url) return { fixed: false, url };
  
  let fixedUrl = url.trim();
  let fixed = false;
  
  // Fix 1: Missing protocol (add https://)
  if (!fixedUrl.startsWith('http://') && !fixedUrl.startsWith('https://')) {
    fixedUrl = 'https://' + fixedUrl;
    fixed = true;
  }
  
  // Fix 2: Fix typo in https (ttps://)
  if (fixedUrl.startsWith('ttps://')) {
    fixedUrl = 'https://' + fixedUrl.substring(7);
    fixed = true;
  }
  
  // Fix 3: Fix http:// vs https:// for common secure sites
  if (fixedUrl.startsWith('http://github.com')) {
    fixedUrl = fixedUrl.replace('http://', 'https://');
    fixed = true;
  }
  
  // Fix 4: Remove trailing slashes for consistency
  if (fixedUrl.endsWith('/') && !fixedUrl.endsWith('//')) {
    fixedUrl = fixedUrl.slice(0, -1);
    fixed = true;
  }
  
  // Fix 5: Fix double slashes in the middle of URLs
  if (fixedUrl.includes('//') && !fixedUrl.startsWith('http://') && !fixedUrl.startsWith('https://')) {
    fixedUrl = fixedUrl.replace('//', '/');
    fixed = true;
  }
  
  // Fix 6: Fix common typos in domain names
  const commonTypos = {
    'github.con': 'github.com',
    'githb.com': 'github.com',
    'gitub.com': 'github.com',
    'gihub.com': 'github.com',
    'goole.com': 'google.com',
    'googl.com': 'google.com',
    'ttps://github.com': 'https://github.com'
  };
  
  for (const [typo, correction] of Object.entries(commonTypos)) {
    if (fixedUrl.includes(typo)) {
      fixedUrl = fixedUrl.replace(typo, correction);
      fixed = true;
    }
  }
  
  return { fixed, url: fixedUrl };
}

// Function to check if a URL is accessible
function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      
      const req = protocol.get(url, {
        timeout: 10000, // 10 second timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Node.js Link Verification Tool)'
        }
      }, (res) => {
        // Handle redirects (follow up to 5 redirects)
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (res.req._redirectCount >= 5) {
            resolve({
              status: res.statusCode,
              ok: false,
              statusText: 'Too many redirects',
              redirectUrl: res.headers.location
            });
          } else {
            // Set redirect count
            const redirectCount = (res.req._redirectCount || 0) + 1;
            
            // Resolve redirect URL (handle relative URLs)
            let redirectUrl = res.headers.location;
            if (redirectUrl.startsWith('/')) {
              redirectUrl = `${parsedUrl.protocol}//${parsedUrl.host}${redirectUrl}`;
            }
            
            // Check the redirect URL
            checkUrl(redirectUrl).then(redirectResult => {
              redirectResult.redirectUrl = redirectUrl;
              redirectResult.redirectCount = redirectCount;
              resolve(redirectResult);
            });
          }
        } else {
          resolve({
            status: res.statusCode,
            ok: res.statusCode >= 200 && res.statusCode < 400,
            statusText: res.statusMessage || getStatusText(res.statusCode),
            redirectCount: res.req._redirectCount || 0
          });
        }
      });
      
      req._redirectCount = 0; // Initialize redirect count
      
      req.on('error', (error) => {
        resolve({
          status: 0,
          ok: false,
          statusText: error.message
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({
          status: 0,
          ok: false,
          statusText: 'Request timed out'
        });
      });
    } catch (error) {
      resolve({
        status: 0,
        ok: false,
        statusText: error.message
      });
    }
  });
}

// Helper function to get status text for HTTP status codes
function getStatusText(statusCode) {
  const statusTexts = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
  };
  
  return statusTexts[statusCode] || 'Unknown Status';
}

// Function to find duplicate nodes
function findDuplicateNodes() {
  const nodesByLabel = {};
  const duplicates = [];
  
  graphData.nodes.forEach(node => {
    const label = node.data.label;
    if (!nodesByLabel[label]) {
      nodesByLabel[label] = [];
    }
    nodesByLabel[label].push(node);
  });
  
  for (const label in nodesByLabel) {
    if (nodesByLabel[label].length > 1) {
      duplicates.push({
        label,
        count: nodesByLabel[label].length,
        nodes: nodesByLabel[label].map(node => ({
          id: node.data.id,
          type: node.data.type,
          nodeIndex: graphData.nodes.indexOf(node)
        }))
      });
    }
  }
  
  return duplicates;
}

// Function to find orphaned nodes (nodes with no connections)
function findOrphanedNodes() {
  const orphans = [];
  const connectedNodeIds = new Set();
  
  // Collect all node IDs that have connections
  if (graphData.edges) {
    graphData.edges.forEach(edge => {
      connectedNodeIds.add(edge.data.source);
      connectedNodeIds.add(edge.data.target);
    });
  }
  
  // Find nodes that aren't in the connected set
  graphData.nodes.forEach(node => {
    if (!connectedNodeIds.has(node.data.id)) {
      orphans.push({
        id: node.data.id,
        label: node.data.label,
        type: node.data.type,
        nodeIndex: graphData.nodes.indexOf(node)
      });
    }
  });
  
  return orphans;
}

// Function to verify all links
async function verifyLinks(type = 'all') {
  console.log(chalk.blue(`Starting verification of ${type} links...`));
  
  const urls = extractUrls(type);
  
  if (urls.length === 0) {
    console.log(chalk.yellow('No URLs found to verify.'));
    return null;
  }
  
  console.log(chalk.blue(`Found ${urls.length} URLs to verify.`));
  
  const results = {
    valid: [],
    invalid: [],
    broken: [],
    fixed: []
  };
  
  for (let i = 0; i < urls.length; i++) {
    const urlInfo = urls[i];
    const progress = Math.round((i / urls.length) * 100);
    
    // Update progress every 10 URLs
    if (i % 10 === 0 || i === urls.length - 1) {
      process.stdout.write(`\rProgress: ${progress}% (${i+1}/${urls.length})`);
    }
    
    // Check if URL format is valid
    let currentUrl = urlInfo.url;
    let wasFixed = false;
    
    if (!isValidUrlFormat(currentUrl)) {
      // Try to fix the URL
      const fixResult = attemptUrlFix(currentUrl);
      
      if (fixResult.fixed && isValidUrlFormat(fixResult.url)) {
        wasFixed = true;
        currentUrl = fixResult.url;
        
        // Update the dataset if --fix flag is set
        if (shouldFix) {
          graphData.nodes[urlInfo.nodeIndex].data.properties[urlInfo.propertyName] = currentUrl;
        }
        
        results.fixed.push({
          ...urlInfo,
          originalUrl: urlInfo.url,
          fixedUrl: currentUrl
        });
      } else {
        results.invalid.push({
          ...urlInfo,
          error: 'Invalid URL format'
        });
        continue;
      }
    }
    
    // Check if URL is accessible
    const checkResult = await checkUrl(currentUrl);
    
    if (checkResult.ok) {
      results.valid.push({
        ...urlInfo,
        url: currentUrl,
        wasFixed,
        originalUrl: wasFixed ? urlInfo.url : undefined,
        status: checkResult.status,
        redirectCount: checkResult.redirectCount || 0
      });
    } else {
      results.broken.push({
        ...urlInfo,
        url: currentUrl,
        wasFixed,
        originalUrl: wasFixed ? urlInfo.url : undefined,
        status: checkResult.status,
        error: checkResult.statusText,
        redirectUrl: checkResult.redirectUrl
      });
    }
  }
  
  console.log('\n');
  return results;
}

// Function to print verification results
function printResults(results) {
  if (!results) return;
  
  const total = results.valid.length + results.invalid.length + results.broken.length;
  
  console.log(chalk.green('\n===== Verification Results ====='));
  console.log(chalk.white(`Total URLs: ${total}`));
  console.log(chalk.green(`Valid: ${results.valid.length}`));
  console.log(chalk.yellow(`Invalid Format: ${results.invalid.length}`));
  console.log(chalk.red(`Broken Links: ${results.broken.length}`));
  console.log(chalk.blue(`Fixed URLs: ${results.fixed.length}`));
  
  if (results.fixed.length > 0) {
    console.log(chalk.blue('\n----- Fixed URLs -----'));
    results.fixed.forEach(item => {
      console.log(chalk.blue(`\n${item.label} (${item.type})`));
      console.log(`Original URL: ${item.originalUrl}`);
      console.log(`Fixed URL: ${item.fixedUrl}`);
    });
  }
  
  if (results.invalid.length > 0) {
    console.log(chalk.yellow('\n----- Invalid URL Formats -----'));
    results.invalid.forEach(item => {
      console.log(chalk.yellow(`\n${item.label} (${item.type})`));
      console.log(`URL: ${item.url}`);
      console.log(`Error: ${item.error}`);
    });
  }
  
  if (results.broken.length > 0) {
    console.log(chalk.red('\n----- Broken Links -----'));
    results.broken.forEach(item => {
      console.log(chalk.red(`\n${item.label} (${item.type})`));
      console.log(`URL (${item.urlType}): ${item.url}`);
      console.log(`Status: ${item.status}`);
      console.log(`Error: ${item.error}`);
      if (item.redirectUrl) {
        console.log(`Redirects to: ${item.redirectUrl}`);
      }
    });
  }
  
  if (verbose) {
    console.log(chalk.green('\n----- Valid Links -----'));
    results.valid.forEach(item => {
      console.log(chalk.green(`\n${item.label} (${item.type})`));
      console.log(`URL (${item.urlType}): ${item.url}`);
      console.log(`Status: ${item.status}`);
      if (item.wasFixed) {
        console.log(`Original URL: ${item.originalUrl}`);
      }
      if (item.redirectCount > 0) {
        console.log(`Redirects: ${item.redirectCount}`);
      }
    });
  } else {
    console.log(chalk.green(`\n${results.valid.length} valid links found. Use --verbose to see details.`));
  }
}

// Function to print duplicate nodes
function printDuplicates(duplicates) {
  if (duplicates.length === 0) {
    console.log(chalk.green('\nNo duplicate nodes found.'));
    return;
  }
  
  console.log(chalk.yellow(`\n===== Found ${duplicates.length} labels with duplicate nodes =====`));
  
  duplicates.forEach(dup => {
    console.log(chalk.yellow(`\n${dup.label} (${dup.count} instances):`));
    dup.nodes.forEach(node => {
      console.log(`  ID: ${node.id}, Type: ${node.type}`);
    });
  });
}

// Function to print orphaned nodes
function printOrphans(orphans) {
  if (orphans.length === 0) {
    console.log(chalk.green('\nNo orphaned nodes found.'));
    return;
  }
  
  console.log(chalk.red(`\n===== Found ${orphans.length} orphaned nodes =====`));
  
  orphans.forEach(orphan => {
    console.log(chalk.red(`\n${orphan.label}`));
    console.log(`ID: ${orphan.id}`);
    console.log(`Type: ${orphan.type}`);
  });
}

// Function to save the fixed dataset
function saveFixedDataset(originalPath) {
  if (!shouldFix) return;
  
  const pathInfo = path.parse(originalPath);
  const fixedPath = path.join(pathInfo.dir, `${pathInfo.name}-fixed${pathInfo.ext}`);
  
  fs.writeFileSync(fixedPath, JSON.stringify(graphData, null, 2));
  console.log(chalk.green(`\nFixed dataset saved to ${fixedPath}`));
}

// Function to generate HTML report
function generateHtmlReport(results, duplicates, orphans) {
  if (skipHtml) return;
  
  const reportFilename = `link-verification-report-${new Date().toISOString().slice(0, 10)}.html`;
  
  // Create HTML content
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Verification Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    .summary {
      background-color: #f8f9fa;
      border-radius: 5px;
      padding: 15px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .summary-item {
      display: inline-block;
      margin-right: 20px;
      padding: 10px;
      border-radius: 5px;
      min-width: 120px;
      text-align: center;
    }
    .valid {
      background-color: #d4edda;
      color: #155724;
    }
    .invalid {
      background-color: #fff3cd;
      color: #856404;
    }
    .broken {
      background-color: #f8d7da;
      color: #721c24;
    }
    .fixed {
      background-color: #cce5ff;
      color: #004085;
    }
    .duplicates {
      background-color: #e2e3e5;
      color: #383d41;
    }
    .orphans {
      background-color: #d6d8d9;
      color: #1b1e21;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f8f9fa;
      font-weight: bold;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    .url {
      word-break: break-all;
    }
    .status-ok {
      color: #28a745;
    }
    .status-redirect {
      color: #fd7e14;
    }
    .status-error {
      color: #dc3545;
    }
    .tab {
      overflow: hidden;
      border: 1px solid #ccc;
      background-color: #f1f1f1;
      border-radius: 5px 5px 0 0;
    }
    .tab button {
      background-color: inherit;
      float: left;
      border: none;
      outline: none;
      cursor: pointer;
      padding: 14px 16px;
      transition: 0.3s;
      font-size: 16px;
    }
    .tab button:hover {
      background-color: #ddd;
    }
    .tab button.active {
      background-color: #fff;
      border-bottom: 2px solid #007bff;
    }
    .tabcontent {
      display: none;
      padding: 20px;
      border: 1px solid #ccc;
      border-top: none;
      border-radius: 0 0 5px 5px;
      animation: fadeEffect 1s;
    }
    @keyframes fadeEffect {
      from {opacity: 0;}
      to {opacity: 1;}
    }
    .badge {
      display: inline-block;
      padding: 3px 7px;
      font-size: 12px;
      font-weight: bold;
      line-height: 1;
      text-align: center;
      white-space: nowrap;
      vertical-align: baseline;
      border-radius: 10px;
      margin-left: 5px;
    }
    .badge-success {
      background-color: #28a745;
      color: white;
    }
    .badge-warning {
      background-color: #ffc107;
      color: #212529;
    }
    .badge-danger {
      background-color: #dc3545;
      color: white;
    }
    .badge-info {
      background-color: #17a2b8;
      color: white;
    }
    .badge-secondary {
      background-color: #6c757d;
      color: white;
    }
    .search-container {
      margin-bottom: 20px;
    }
    #searchInput {
      width: 100%;
      padding: 12px 20px;
      margin: 8px 0;
      box-sizing: border-box;
      border: 2px solid #ccc;
      border-radius: 4px;
      font-size: 16px;
    }
    .timestamp {
      font-style: italic;
      color: #6c757d;
      margin-bottom: 20px;
    }
    .suggestion {
      background-color: #e8f4f8;
      padding: 10px;
      border-radius: 5px;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <h1>AI Agent Ecosystem Link Verification Report</h1>
  <p class="timestamp">Generated on ${new Date().toLocaleString()}</p>
  
  <div class="summary">
    <h2>Summary</h2>
    <div>
      <div class="summary-item valid">
        <h3>${results.valid.length}</h3>
        <p>Valid Links</p>
      </div>
      <div class="summary-item invalid">
        <h3>${results.invalid.length}</h3>
        <p>Invalid Format</p>
      </div>
      <div class="summary-item broken">
        <h3>${results.broken.length}</h3>
        <p>Broken Links</p>
      </div>
      <div class="summary-item fixed">
        <h3>${results.fixed.length}</h3>
        <p>Fixed URLs</p>
      </div>
      <div class="summary-item duplicates">
        <h3>${duplicates.length}</h3>
        <p>Duplicate Labels</p>
      </div>
      <div class="summary-item orphans">
        <h3>${orphans.length}</h3>
        <p>Orphaned Nodes</p>
      </div>
    </div>
  </div>
  
  <div class="search-container">
    <input type="text" id="searchInput" placeholder="Search for nodes, URLs, or issues...">
  </div>
  
  <div class="tab">
    <button class="tablinks active" onclick="openTab(event, 'ValidLinks')">Valid Links <span class="badge badge-success">${results.valid.length}</span></button>
    <button class="tablinks" onclick="openTab(event, 'BrokenLinks')">Broken Links <span class="badge badge-danger">${results.broken.length}</span></button>
    <button class="tablinks" onclick="openTab(event, 'InvalidLinks')">Invalid Format <span class="badge badge-warning">${results.invalid.length}</span></button>
    <button class="tablinks" onclick="openTab(event, 'FixedLinks')">Fixed URLs <span class="badge badge-info">${results.fixed.length}</span></button>
    <button class="tablinks" onclick="openTab(event, 'Duplicates')">Duplicates <span class="badge badge-secondary">${duplicates.length}</span></button>
    <button class="tablinks" onclick="openTab(event, 'Orphans')">Orphans <span class="badge badge-secondary">${orphans.length}</span></button>
  </div>
  
  <div id="ValidLinks" class="tabcontent" style="display: block;">
    <h2>Valid Links</h2>
    ${results.valid.length === 0 ? '<p>No valid links found.</p>' : `
    <table id="validTable">
      <thead>
        <tr>
          <th>Node</th>
          <th>Type</th>
          <th>URL Type</th>
          <th>URL</th>
          <th>Status</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${results.valid.map(item => `
        <tr>
          <td>${item.label}</td>
          <td>${item.type}</td>
          <td>${item.urlType}</td>
          <td class="url"><a href="${item.url}" target="_blank">${item.url}</a></td>
          <td class="${item.redirectCount > 0 ? 'status-redirect' : 'status-ok'}">${item.status} ${item.redirectCount > 0 ? `(${item.redirectCount} redirects)` : ''}</td>
          <td>${item.wasFixed ? `Fixed from: ${item.originalUrl}` : ''}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    `}
  </div>
  
  <div id="BrokenLinks" class="tabcontent">
    <h2>Broken Links</h2>
    ${results.broken.length === 0 ? '<p>No broken links found.</p>' : `
    <table id="brokenTable">
      <thead>
        <tr>
          <th>Node</th>
          <th>Type</th>
          <th>URL Type</th>
          <th>URL</th>
          <th>Status</th>
          <th>Error</th>
          <th>Suggestions</th>
        </tr>
      </thead>
      <tbody>
        ${results.broken.map(item => `
        <tr>
          <td>${item.label}</td>
          <td>${item.type}</td>
          <td>${item.urlType}</td>
          <td class="url"><a href="${item.url}" target="_blank">${item.url}</a></td>
          <td class="status-error">${item.status}</td>
          <td>${item.error}${item.redirectUrl ? `<br>Redirects to: <a href="${item.redirectUrl}" target="_blank">${item.redirectUrl}</a>` : ''}</td>
          <td>
            ${getSuggestionForBrokenLink(item)}
          </td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    `}
  </div>
  
  <div id="InvalidLinks" class="tabcontent">
    <h2>Invalid URL Formats</h2>
    ${results.invalid.length === 0 ? '<p>No invalid URL formats found.</p>' : `
    <table id="invalidTable">
      <thead>
        <tr>
          <th>Node</th>
          <th>Type</th>
          <th>URL Type</th>
          <th>URL</th>
          <th>Error</th>
          <th>Suggestions</th>
        </tr>
      </thead>
      <tbody>
        ${results.invalid.map(item => `
        <tr>
          <td>${item.label}</td>
          <td>${item.type}</td>
          <td>${item.urlType}</td>
          <td class="url">${item.url}</td>
          <td>${item.error}</td>
          <td>
            ${getSuggestionForInvalidUrl(item.url)}
          </td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    `}
  </div>
  
  <div id="FixedLinks" class="tabcontent">
    <h2>Fixed URLs</h2>
    ${results.fixed.length === 0 ? '<p>No URLs were fixed.</p>' : `
    <table id="fixedTable">
      <thead>
        <tr>
          <th>Node</th>
          <th>Type</th>
          <th>URL Type</th>
          <th>Original URL</th>
          <th>Fixed URL</th>
        </tr>
      </thead>
      <tbody>
        ${results.fixed.map(item => `
        <tr>
          <td>${item.label}</td>
          <td>${item.type}</td>
          <td>${item.urlType}</td>
          <td class="url">${item.originalUrl}</td>
          <td class="url"><a href="${item.fixedUrl}" target="_blank">${item.fixedUrl}</a></td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    `}
  </div>
  
  <div id="Duplicates" class="tabcontent">
    <h2>Duplicate Nodes</h2>
    ${duplicates.length === 0 ? '<p>No duplicate nodes found.</p>' : `
    <table id="duplicatesTable">
      <thead>
        <tr>
          <th>Label</th>
          <th>Count</th>
          <th>Node IDs</th>
          <th>Suggestions</th>
        </tr>
      </thead>
      <tbody>
        ${duplicates.map(dup => `
        <tr>
          <td>${dup.label}</td>
          <td>${dup.count}</td>
          <td>${dup.nodes.map(node => `${node.id} (${node.type})`).join('<br>')}</td>
          <td>
            <div class="suggestion">
              Consider merging these nodes or renaming them to be more specific.
            </div>
          </td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    `}
  </div>
  
  <div id="Orphans" class="tabcontent">
    <h2>Orphaned Nodes</h2>
    ${orphans.length === 0 ? '<p>No orphaned nodes found.</p>' : `
    <table id="orphansTable">
      <thead>
        <tr>
          <th>Label</th>
          <th>ID</th>
          <th>Type</th>
          <th>Suggestions</th>
        </tr>
      </thead>
      <tbody>
        ${orphans.map(orphan => `
        <tr>
          <td>${orphan.label}</td>
          <td>${orphan.id}</td>
          <td>${orphan.type}</td>
          <td>
            <div class="suggestion">
              Connect this node to related nodes or consider removing it if it's not needed.
            </div>
          </td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    `}
  </div>
  
  <script>
    function openTab(evt, tabName) {
      var i, tabcontent, tablinks;
      tabcontent = document.getElementsByClassName("tabcontent");
      for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
      }
      tablinks = document.getElementsByClassName("tablinks");
      for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
      }
      document.getElementById(tabName).style.display = "block";
      evt.currentTarget.className += " active";
    }
    
    // Search functionality
    document.getElementById('searchInput').addEventListener('keyup', function() {
      const searchTerm = this.value.toLowerCase();
      
      // Search in all tables
      searchTable('validTable', searchTerm);
      searchTable('brokenTable', searchTerm);
      searchTable('invalidTable', searchTerm);
      searchTable('fixedTable', searchTerm);
      searchTable('duplicatesTable', searchTerm);
      searchTable('orphansTable', searchTerm);
    });
    
    function searchTable(tableId, searchTerm) {
      const table = document.getElementById(tableId);
      if (!table) return;
      
      const rows = table.getElementsByTagName('tr');
      
      for (let i = 1; i < rows.length; i++) { // Start from 1 to skip header
        const row = rows[i];
        const cells = row.getElementsByTagName('td');
        let found = false;
        
        for (let j = 0; j < cells.length; j++) {
          const cellText = cells[j].textContent.toLowerCase();
          if (cellText.includes(searchTerm)) {
            found = true;
            break;
          }
        }
        
        row.style.display = found ? '' : 'none';
      }
    }
  </script>
</body>
</html>
  `;
  
  // Helper function to generate suggestions for broken links
  function getSuggestionForBrokenLink(item) {
    let suggestions = [];
    
    // 404 Not Found
    if (item.status === 404) {
      suggestions.push("The page might have been moved or deleted. Check if the URL is correct.");
      
      // GitHub specific suggestions
      if (item.url.includes('github.com')) {
        const repoName = item.url.split('github.com/')[1]?.split('/')[1];
        if (repoName) {
          suggestions.push(`Try searching for the repository "${repoName}" on GitHub.`);
        }
      }
    }
    
    // Connection issues
    if (item.status === 0) {
      suggestions.push("There might be a connection issue or the domain doesn't exist.");
      
      // Check for common domain typos
      if (item.url.includes('.co') && !item.url.includes('.com')) {
        suggestions.push(`Try changing to ".com" instead of ".co".`);
      }
    }
    
    // Timeout
    if (item.error.includes('timeout')) {
      suggestions.push("The server might be slow or unresponsive. Try again later.");
    }
    
    // Redirects
    if (item.redirectUrl) {
      suggestions.push(`Update the URL to the redirect destination: ${item.redirectUrl}`);
    }
    
    return suggestions.length > 0 
      ? `<div class="suggestion">${suggestions.join('<br>')}</div>` 
      : '';
  }
  
  // Helper function to generate suggestions for invalid URLs
  function getSuggestionForInvalidUrl(url) {
    let suggestions = [];
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      suggestions.push(`Add "https://" to the beginning: https://${url}`);
    }
    
    if (url.startsWith('ttps://')) {
      suggestions.push(`Fix "ttps://" to "https://": https://${url.substring(7)}`);
    }
    
    if (url.includes(' ')) {
      suggestions.push(`Remove spaces from the URL: ${url.replace(/\s+/g, '')}`);
    }
    
    // Check for common domain typos
    const commonTypos = {
      'github.con': 'github.com',
      'githb.com': 'github.com',
      'gitub.com': 'github.com',
      'gihub.com': 'github.com',
      'goole.com': 'google.com',
      'googl.com': 'google.com'
    };
    
    for (const [typo, correction] of Object.entries(commonTypos)) {
      if (url.includes(typo)) {
        suggestions.push(`Replace "${typo}" with "${correction}"`);
      }
    }
    
    return suggestions.length > 0 
      ? `<div class="suggestion">${suggestions.join('<br>')}</div>` 
      : '';
  }
  
  fs.writeFileSync(reportFilename, htmlContent);
  console.log(chalk.green(`\nHTML report generated: ${reportFilename}`));
}

// Function to export results to a JSON file
function exportResults(results, duplicates, orphans) {
  const exportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.valid.length + results.invalid.length + results.broken.length,
      valid: results.valid.length,
      invalid: results.invalid.length,
      broken: results.broken.length,
      fixed: results.fixed.length,
      duplicateLabels: duplicates.length,
      orphanedNodes: orphans.length
    },
    validUrls: results.valid,
    invalidUrls: results.invalid,
    brokenUrls: results.broken,
    fixedUrls: results.fixed,
    duplicateNodes: duplicates,
    orphanedNodes: orphans
  };
  
  const outputFilename = `link-verification-${new Date().toISOString().slice(0, 10)}.json`;
  fs.writeFileSync(outputFilename, JSON.stringify(exportData, null, 2));
  
  console.log(chalk.green(`\nResults exported to ${outputFilename}`));
}

// Main function
async function main() {
  try {
    // Verify links
    const results = await verifyLinks('all');
    
    // Find duplicate nodes
    console.log(chalk.blue('\nChecking for duplicate nodes...'));
    const duplicates = findDuplicateNodes();
    
    // Find orphaned nodes
    console.log(chalk.blue('\nChecking for orphaned nodes...'));
    const orphans = findOrphanedNodes();
    
    // Print results
    printResults(results);
    printDuplicates(duplicates);
    printOrphans(orphans);
    
    // Save fixed dataset if requested
    if (shouldFix) {
      saveFixedDataset(datasetPath);
    }
    
    // Generate HTML report
    generateHtmlReport(results, duplicates, orphans);
    
    // Export results to JSON
    exportResults(results, duplicates, orphans);
    
    console.log(chalk.green('\nVerification completed successfully.'));
  } catch (error) {
    console.error(chalk.red(`\nError during verification: ${error.message}`));
    process.exit(1);
  }
}

// Run the main function
main();
