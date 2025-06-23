import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';
import fetch from 'node-fetch';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import cliProgress from 'cli-progress';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Set up command line arguments
const argv = yargs(hideBin(process.argv))
  .option('input', { alias: 'i', type: 'string', demandOption: true, describe: 'Input JSON file path' })
  .option('output', { alias: 'o', type: 'string', describe: 'Output file path (default: *.enriched.json)' })
  .option('dryRun', { alias: 'd', type: 'boolean', default: false, describe: 'Perform enrichment without writing output' })
  .option('concurrency', { alias: 'c', type: 'number', default: 3, describe: 'Max parallel GitHub requests' })
  .option('minDelay', { type: 'number', default: 500, describe: 'Minimum delay between requests (ms)' })
  .option('maxDelay', { type: 'number', default: 1500, describe: 'Maximum delay between requests (ms)' })
  .option('verbose', { alias: 'v', type: 'boolean', default: false, describe: 'Enable verbose logging' })
  .argv;

// Check if github token is set
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  console.error(chalk.red('Error: GITHUB_TOKEN not set in environment.'));
  process.exit(1);
}

// Set up headers for GitHub API requests
const headers = {
  Authorization: `token ${GITHUB_TOKEN}`,
  'User-Agent': 'AI-Agent-Landscape-Script',
  Accept: 'application/vnd.github.v3+json',
};

// Function to extract owner and repo from a GitHub URL
function extractRepoInfo(url) {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  return match ? { owner: match[1], repo: match[2].replace(/\.git$/, '') } : null;
}

// Function to introduce a random delay between requests
async function delayRandom(minMs = 500, maxMs = 1500) {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(res => setTimeout(res, ms));
}

// Function to retry a function with exponential backoff
async function retryWithBackoff(fn, retries = 3) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (e) {
      if (attempt === retries - 1) throw e;
      const delay = 1000 * 2 ** attempt;
      if (argv.verbose) console.warn(chalk.yellow(`Retrying in ${delay}ms...`));
      await new Promise(res => setTimeout(res, delay));
      attempt++;
    }
  }
}

// Function to fetch repository data from GitHub
async function fetchRepoData(owner, repo) {
  return retryWithBackoff(async () => {
    const repoUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1&page=1000000`;

    const repoResp = await fetch(repoUrl, { headers });
    if (!repoResp.ok) throw new Error(`Repo fetch failed: ${repoResp.statusText}`);
    const repoData = await repoResp.json();

    const rateRemaining = repoResp.headers.get('x-ratelimit-remaining');
    const rateReset = repoResp.headers.get('x-ratelimit-reset');
    if (rateRemaining && +rateRemaining < 5 && rateReset) {
      const now = Math.floor(Date.now() / 1000);
      const waitTime = (+rateReset - now + 5) * 1000;
      console.warn(chalk.yellow(`Rate limit low. Waiting ${Math.ceil(waitTime / 1000)}s...`));
      await new Promise(res => setTimeout(res, waitTime));
    }

    const firstCommitResp = await fetch(commitsUrl, { headers });
    if (!firstCommitResp.ok) throw new Error(`Commit fetch failed: ${firstCommitResp.statusText}`);
    let creationDate = repoData.created_at;

    const link = firstCommitResp.headers.get('link');
    if (link?.includes('rel="last"')) {
      const lastPage = parseInt(link.match(/&page=(\d+)>; rel="last"/)?.[1] || '1');
      const lastCommitResp = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1&page=${lastPage}`,
        { headers }
      );
      const commits = await lastCommitResp.json();
      if (Array.isArray(commits) && commits[0]?.commit?.author?.date) {
        creationDate = commits[0].commit.author.date;
      }
    }

    return {
      github_description: repoData.description || '',
      github_creation: creationDate,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      license: repoData.license?.name || '',
    };
  });
}

// Function to process each node and enrich it with GitHub data
async function processNode(node) {
  const url = node.data.properties.github;
  const info = extractRepoInfo(url);
  if (!info) throw new Error(`Invalid GitHub URL: ${url}`);

  const result = await fetchRepoData(info.owner, info.repo);
  if (result) {
    Object.assign(node.data.properties, result);
    return true;
  }
  return false;
}

// Main function to read input, process nodes, and write output
async function enrichData() {
  const rawData = await readFile(argv.input, 'utf-8');
  const graph = JSON.parse(rawData);
  const nodes = graph.nodes.filter(n => {
    const gh = n.data?.properties?.github;
    return gh && (!n.data.properties.github_description || !n.data.properties.github_creation);
  });

  const total = nodes.length;
  let success = 0, failed = 0;

  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(total, 0);

  const queue = [...nodes];
  const workers = Array.from({ length: argv.concurrency }, async () => {
    while (queue.length > 0) {
      const node = queue.shift();
      try {
        await processNode(node);
        success++;
      } catch (e) {
        if (argv.verbose) console.error(chalk.red(`Error: ${e.message}`));
        failed++;
      }
      bar.update(success + failed);
      await delayRandom(argv.minDelay, argv.maxDelay);
    }
  });

  await Promise.all(workers);
  bar.stop();

  console.log(chalk.green(`Success: ${success}`));
  console.log(chalk.red(`Failed: ${failed}`));

  if (!argv.dryRun) {
    const outputPath = argv.output || argv.input.replace(/\.json$/, '.enriched.json');
    await writeFile(outputPath, JSON.stringify(graph, null, 2));
    console.log(chalk.blue(`Output written to: ${outputPath}`));
  } else {
    console.log(chalk.gray('Dry run complete. No file written.'));
  }
}

// Run the enrichment process
enrichData();
