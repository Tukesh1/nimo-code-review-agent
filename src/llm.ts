import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export interface LLMConfig {
  provider: 'openai' | 'gemini' | 'claude' | 'openrouter';
  apiKey: string;
  model?: string;
  customPrompt?: string;
}

export interface ReviewResponse {
  summary: string;
  inlineComments: {
    path: string;
    line: number;
    comment: string;
  }[];
}

const SYSTEM_PROMPT = `You are an expert senior software engineer reviewing a pull request.
You will be provided with the diff of a pull request.
Your task is to review the code for bugs, security vulnerabilities, performance issues, and bad practices.

Output your review strictly as a JSON object matching the following structure:
{
  "summary": "A high-level summary of the entire PR and its overall quality.",
  "inlineComments": [
    {
      "path": "path/to/file.ts",
      "line": 42,
      "comment": "Specific feedback for this line."
    }
  ]
}

Only comment on lines that were actually added or modified in the diff.
If there are no issues, return an empty array for inlineComments.
DO NOT output any markdown blocks or text outside the JSON. Return only the raw JSON string.`;

export async function generateReview(diff: string, config: LLMConfig): Promise<ReviewResponse | null> {
  const prompt = `Review the following code diff:\n\n${diff}`;
  const finalSystemPrompt = config.customPrompt 
    ? `${SYSTEM_PROMPT}\n\nAdditional custom instructions from the user:\n${config.customPrompt}` 
    : SYSTEM_PROMPT;

  let jsonStr = '';

  try {
    if (config.provider === 'openai' || config.provider === 'openrouter') {
      const openai = new OpenAI({ 
        apiKey: config.apiKey,
        ...(config.provider === 'openrouter' && { baseURL: 'https://openrouter.ai/api/v1' })
      });
      
      const defaultModel = config.provider === 'openrouter' ? 'qwen/qwen-2.5-coder-32b-instruct:free' : 'gpt-4o';
      
      const requestOptions: any = {
        model: config.model || defaultModel,
        messages: [
          { role: 'system', content: finalSystemPrompt },
          { role: 'user', content: prompt }
        ]
      };

      if (config.provider === 'openai') {
        requestOptions.response_format = { type: 'json_object' };
      }

      const response = await openai.chat.completions.create(requestOptions);
      jsonStr = response.choices[0].message.content || '{}';
    } else if (config.provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(config.apiKey);
      const model = genAI.getGenerativeModel({ model: config.model || 'gemini-2.5-pro' });
      const response = await model.generateContent([finalSystemPrompt, prompt]);
      jsonStr = response.response.text();
    } else if (config.provider === 'claude') {
      const anthropic = new Anthropic({ apiKey: config.apiKey });
      const response = await anthropic.messages.create({
        model: config.model || 'claude-3-5-sonnet-20240620',
        max_tokens: 4096,
        system: finalSystemPrompt,
        messages: [
          { role: 'user', content: prompt }
        ]
      });
      jsonStr = response.content[0].type === 'text' ? response.content[0].text : '{}';
    }

    // Extract JSON block using regex to handle preamble/markdown formatting
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (match) {
      jsonStr = match[0];
    }
    
    return JSON.parse(jsonStr) as ReviewResponse;
  } catch (error) {
    console.error('Error generating review from LLM:', error);
    return null;
  }
}
