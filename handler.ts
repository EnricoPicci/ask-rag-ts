// https://docs.aws.amazon.com/lambda/latest/dg/typescript-handler.html
import { Context, APIGatewayProxyCallback, APIGatewayEvent } from 'aws-lambda';

import { tap } from 'rxjs';
import { askRag$ } from './src/ask-rag';
import { getOpenaiClient } from './src/openai';
import { getCloudClient } from './src/qdrant';

export function askRag(event: APIGatewayEvent, context: Context, callback: APIGatewayProxyCallback) {
  const body = JSON.parse(event.body || "{}");
  let { query, prompt_instructions, embeddings_model, llm_model, collection_name, nchunks, verbose } = body;
  verbose = true;
  if (verbose) {
    console.log(`askRag: query=${query}`);
    console.log(`askRag: prompt_instructions=${prompt_instructions}`);
    console.log(`askRag: embeddings_model=${embeddings_model}`);
    console.log(`askRag: llm_model=${llm_model}`);
    console.log(`askRag: collection_name=${collection_name}`);
    console.log(`askRag: nchunks=${nchunks}`);
  }
  if (!query || !embeddings_model || !collection_name) {
    const missingParams: string[] = [];
    if (!query) missingParams.push('query');
    if (!embeddings_model) missingParams.push('embeddings_model');
    if (!collection_name) missingParams.push('collection_name');
    callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Missing required parameters: ' + missingParams.join(', '),
        input: event,
        params_sent: JSON.stringify(body),
      }),
    });
    return
  }
  prompt_instructions = prompt_instructions ||
    'You are an expert in this field. You have to answer the question based on the information I provide.';
  nchunks = nchunks || 3;
  llm_model = llm_model || "gpt-3.5-turbo-0125";
  verbose = verbose || false;

  const params = { query, prompt_instructions, embeddings_model, llm_model, collection_name, nchunks, verbose }

  const qdrantClient = getCloudClient();
  const openaiCLient = getOpenaiClient();

  askRag$(
    query,
    prompt_instructions,
    embeddings_model,
    llm_model,
    qdrantClient,
    openaiCLient,
    collection_name,
    nchunks,
    verbose
  ).pipe(
    tap(fullAnswer => {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          message: fullAnswer,
          input: event,
          params: JSON.stringify(params),
        }),
      });
    })
  ).subscribe(
    {
      next: fullAnswer => {
        callback(null, {
          statusCode: 200,
          body: JSON.stringify({
            message: fullAnswer,
            input: event,
            params: JSON.stringify(params),
          }),
        });
      },
      error: err => {
        console.error(err);
        callback(null, {
          statusCode: 500,
          body: JSON.stringify({
            message: err.message,
            input: event,
            params: JSON.stringify(params),
          }),
        });
      }
    }
  )
}
