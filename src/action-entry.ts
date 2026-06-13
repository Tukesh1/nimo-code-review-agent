import * as core from '@actions/core';
import * as github from '@actions/github';
import { Octokit } from '@octokit/rest';
import { processReview } from './reviewer';
import { LLMConfig } from './llm';

async function run() {
  try {
    const token = core.getInput('github_token') || process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN is missing');
    }

    const provider = (core.getInput('ai_provider') || process.env.AI_PROVIDER || 'gemini') as 'gemini' | 'openai' | 'claude';
    let apiKey = '';

    if (provider === 'gemini') {
      apiKey = core.getInput('gemini_api_key') || process.env.GEMINI_API_KEY || '';
    } else if (provider === 'openai') {
      apiKey = core.getInput('openai_api_key') || process.env.OPENAI_API_KEY || '';
    } else if (provider === 'claude') {
      apiKey = core.getInput('claude_api_key') || process.env.CLAUDE_API_KEY || '';
    }

    if (!apiKey) {
      throw new Error(`API key for provider ${provider} is missing`);
    }

    const model = core.getInput('ai_model') || process.env.AI_MODEL || undefined;
    const llmConfig: LLMConfig = { provider, apiKey, model };
    const octokit = new Octokit({ auth: token });

    const context = github.context;
    
    if (context.eventName !== 'pull_request') {
      console.log('Not a pull request event. Skipping review.');
      return;
    }

    const pullRequest = context.payload.pull_request;
    if (!pullRequest) {
      throw new Error('Pull request payload is missing');
    }

    const owner = context.repo.owner;
    const repo = context.repo.repo;
    const pullNumber = pullRequest.number;

    await processReview(octokit, owner, repo, pullNumber, llmConfig);

  } catch (error: any) {
    core.setFailed(`Action failed with error: ${error.message}`);
  }
}

run();
