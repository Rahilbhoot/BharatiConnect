import { ChatOllama } from '@langchain/ollama';
import { env } from './env';
import axios from 'axios';

export const ollamaModel = new ChatOllama({
  baseUrl: env.OLLAMA_BASE_URL,
  model: env.OLLAMA_MODEL,
});

export async function checkOllamaHealth(): Promise<boolean> {
  try {
    await axios.get(`${env.OLLAMA_BASE_URL}/api/tags`, { timeout: 3000 });
    return true;
  } catch {
    console.warn('[Ollama] Local Ollama service is not reachable. Proof verification will route to needs_review.');
    return false;
  }
}
