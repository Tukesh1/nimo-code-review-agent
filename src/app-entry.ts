import { Probot } from 'probot';
import { Octokit } from '@octokit/rest';
import { processReview } from './reviewer.js';
import { LLMConfig } from './llm.js';

export default (app: Probot) => {
  app.on(['pull_request.opened', 'pull_request.synchronize'], async (context) => {
    const pullRequest = context.payload.pull_request;
    const owner = context.repo().owner;
    const repo = context.repo().repo;
    const pullNumber = pullRequest.number;

    const provider = (process.env.AI_PROVIDER || 'gemini') as 'gemini' | 'openai' | 'claude' | 'openrouter';
    let apiKey = '';

    if (provider === 'gemini') {
      apiKey = process.env.GEMINI_API_KEY || '';
    } else if (provider === 'openai') {
      apiKey = process.env.OPENAI_API_KEY || '';
    } else if (provider === 'claude') {
      apiKey = process.env.CLAUDE_API_KEY || '';
    } else if (provider === 'openrouter') {
      apiKey = process.env.OPENROUTER_API_KEY || '';
    }

    if (!apiKey) {
      app.log.error(`API key for provider ${provider} is missing. Cannot perform review.`);
      return;
    }

    const model = process.env.AI_MODEL || undefined;
    const customPrompt = process.env.CUSTOM_PROMPT || undefined;
    const llmConfig: LLMConfig = { provider, apiKey, model, customPrompt };

    // We can cast the probot octokit client, but creating a fresh Octokit with the token is sometimes easier
    // Probot's context.octokit is already authenticated as the App for this repo.
    // For simplicity, we'll wrap the probot octokit to match our expected signature, or just pass it directly.
    
    // We need an authenticated Octokit instance. Probot provides one.
    const octokit = context.octokit as unknown as Octokit;

    app.log.info(`Starting review for ${owner}/${repo}#${pullNumber} using ${provider}`);
    
    try {
      await processReview(octokit, owner, repo, pullNumber, llmConfig);
      app.log.info(`Finished review for ${owner}/${repo}#${pullNumber}`);
    } catch (error) {
      app.log.error(`Error during review: ${error}`);
    }
  });
};
