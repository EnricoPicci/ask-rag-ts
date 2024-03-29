import { completion } from "litellm";
import OpenAI from "openai";
import { from, map } from "rxjs";

export const EMBEDDINGS_MODELS = [
    "text-embedding-3-small",
    "text-embedding-3-large",
    "text-embedding-ada-002",
]

export const GENERATION_MODELS = ["gpt-3.5-turbo-0125", "gpt-4-0125-preview"]

export function getOpenaiClient() {
    const openaiApiKey = process.env['OPENAI_API_KEY']
    if (!openaiApiKey) {
        throw new Error('OPENAI_API_KEY is required');
    }
    const openaiClient = new OpenAI({
        apiKey: openaiApiKey, // This is the default and can be omitted
    });

    return openaiClient;
}

export function embedSentece$(openaiClient: OpenAI, model: string, query: string) {
    const params: OpenAI.Embeddings.EmbeddingCreateParams = {
        model,
        input: query,
    }
    return from(openaiClient.embeddings.create(params)).pipe(
        map((response) => response.data[0].embedding),
    );
}

export function answer$(query: string, prompt_instructions: string, chunks: string[], model = "gpt-3.5-turbo-0125", verbose = false) {
    // the llm model must be one of the GENERATION_MODELS
    if (!GENERATION_MODELS.includes(model)) {
        throw new Error(`model must be one of ${GENERATION_MODELS}`);
    }

    const content = `${prompt_instructions}. 

                            Domanda: ${query}
                            Informazioni: ${chunks.join('\n\n')}
                            Answer:`
    const role = 'user'

    if (verbose) {
        console.log(`Message content: ${content}`);
        console.log(`Message role: ${role}`);
        console.log(`Model: ${model}`);
    }

    return from(completion({
        model,
        messages: [{ content, role }],
    })).pipe(
        map((response) => response.choices[0].message.content),
    )
}