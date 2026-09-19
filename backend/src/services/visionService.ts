import { ChatOllama } from '@langchain/ollama';
import { z } from 'zod';
import { env } from '../config/env';

const visionModel = new ChatOllama({
  baseUrl: env.OLLAMA_BASE_URL,
  model: env.OLLAMA_MODEL,
});

const ProofOutputSchema = z.object({
  hasBook: z.boolean().describe("Is there a physical book visible in the photo?"),
  hasPageNumbers: z.boolean().describe("Are page numbers visible on the book pages?"),
  pageNumbers: z.array(z.number()).describe("The list of page numbers visible in the photo, if any."),
  textLegible: z.boolean().describe("Is there legible text visible on the pages?"),
  confidence: z.number().min(0).max(1).describe("Confidence score of this assessment from 0.0 to 1.0"),
  reasoning: z.string().describe("Brief explanation of why you made these conclusions.")
});

export class VisionService {
  static async verifyProof(base64Image: string) {
    const prompt = `You are an AI assistant specialized in verifying photos of books.
Please analyze the provided image and extract information according to the schema.
Look specifically for open books, visible text, and page numbers.`;

    const structuredLlm = visionModel.withStructuredOutput(ProofOutputSchema);

    const response = await structuredLlm.invoke([
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
        ]
      }
    ]);

    return response;
  }
}
