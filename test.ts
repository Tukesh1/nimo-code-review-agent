import { Octokit } from '@octokit/rest';
import * as dotenv from 'dotenv';
import { processReview } from './src/reviewer.js';
import { LLMConfig } from './src/llm.js';

dotenv.config();

async function runTest() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('Please set GITHUB_TOKEN in your .env file');
    process.exit(1);
  }

  const provider = (process.env.AI_PROVIDER || 'gemini') as 'gemini' | 'openai' | 'claude';
  let apiKey = '';

  if (provider === 'gemini') {
    apiKey = process.env.GEMINI_API_KEY || '';
  } else if (provider === 'openai') {
    apiKey = process.env.OPENAI_API_KEY || '';
  } else if (provider === 'claude') {
    apiKey = process.env.CLAUDE_API_KEY || '';
  }

  if (!apiKey) {
    console.error(`Please set ${provider.toUpperCase()}_API_KEY in your .env file`);
    process.exit(1);
  }

  const model = process.env.AI_MODEL || undefined;
  const customPrompt = process.env.CUSTOM_PROMPT || undefined;

  // To test this, provide a repository and a PR number that exists
  // We will use a public PR for testing if you change these variables
  const owner = 'Tukesh1'; // Change to your GitHub username
  const repo = 'nimo-code-review-agent'; // Change to a repo where you have an open PR
  const pullNumber = 1; // Change to an actual PR number in that repo

  console.log(`Starting Local Test Run against ${owner}/${repo}#${pullNumber}`);

  const octokit = new Octokit({ auth: token });
  const llmConfig: LLMConfig = { provider, apiKey, model, customPrompt };

  try {
    await processReview(octokit, owner, repo, pullNumber, llmConfig);
    console.log('Local test finished successfully.');
  } catch (err) {
    console.error('Local test failed:', err);
  }
}

runTest();
