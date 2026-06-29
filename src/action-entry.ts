import * as core from '@actions/core';
import * as github from '@actions/github';
import { Octokit } from '@octokit/rest';
import { processReview } from './reviewer.js';
import { LLMConfig } from './llm.js';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  try {
    const token = core.getInput('github_token') || process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN is missing');
    }

    const provider = (core.getInput('ai_provider') || process.env.AI_PROVIDER || 'gemini') as 'gemini' | 'openai' | 'claude' | 'openrouter';
    let apiKey = '';

    if (provider === 'gemini') {
      apiKey = core.getInput('gemini_api_key') || process.env.GEMINI_API_KEY || '';
    } else if (provider === 'openai') {
      apiKey = core.getInput('openai_api_key') || process.env.OPENAI_API_KEY || '';
    } else if (provider === 'claude') {
      apiKey = core.getInput('claude_api_key') || process.env.CLAUDE_API_KEY || '';
    } else if (provider === 'openrouter') {
      apiKey = core.getInput('openrouter_api_key') || process.env.OPENROUTER_API_KEY || '';
    }

    if (!apiKey) {
      throw new Error(`API key for provider ${provider} is missing`);
    }

    const model = core.getInput('ai_model') || process.env.AI_MODEL || undefined;
    let customPrompt = core.getInput('custom_prompt') || process.env.CUSTOM_PROMPT || undefined;
    const customPromptFile = core.getInput('custom_prompt_file') || process.env.CUSTOM_PROMPT_FILE || undefined;
    
    if (customPromptFile) {
      const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
      const filePath = path.join(workspace, customPromptFile);
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        customPrompt = customPrompt ? `${customPrompt}\n\n${fileContent}` : fileContent;
      } else {
        console.warn(`Custom prompt file not found at: ${filePath}`);
      }
    }

    const llmConfig: LLMConfig = { provider, apiKey, model, customPrompt };
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
