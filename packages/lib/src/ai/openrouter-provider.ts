import { createOpenAI } from '@ai-sdk/openai';

/**
 * Creates an OpenRouter provider instance.
 *
 * The OpenRouter provider is compatible with the OpenAI SDK,
 * so we can use `createOpenAI` and just point it to the
 * OpenRouter base URL and provide the API key.
 *
 * @see https://openrouter.ai/docs/quickstart#using-the-openai-sdk
 *
 * @param apiKey The OpenRouter API key.
 * @returns An instance of the AI provider.
 */
export function createOpenRouterProvider(apiKey: string) {
  return createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
    headers: {
      'HTTP-Referer': 'https://codeweaver.dev', // Replace with your actual site URL
      'X-Title': 'CodeWeaver', // Replace with your actual app name
    },
  });
} 