import { QdrantClient } from "@qdrant/js-client-rest";
import OpenAI from "openai";
import { concatMap, map, tap } from "rxjs";

import { qsearch$ } from "./qdrant-openai";
import { answer$ } from "./openai";

export function askRag$(
    query: string,
    prompt_instructions: string,
    embeddings_model: string,
    llm_model: string,
    qclient: QdrantClient,
    openai_client: OpenAI,
    collection_name: string,
    nchunks: number,
    verbose = false,
) {
    if (verbose) {
        console.log(`askRag: query=${query}`);
        console.log(`askRag: prompt_instructions=${prompt_instructions}`);
        console.log(`askRag: embeddings_model=${embeddings_model}`);
        console.log(`askRag: llm_model=${llm_model}`);
        console.log(`askRag: collection_name=${collection_name}`);
        console.log(`askRag: nchunks=${nchunks}`);
    }
    return qsearch$(qclient, openai_client, embeddings_model, query, collection_name, nchunks).pipe(
        tap((textsSources) => {
            if (verbose) {
                textsSources.forEach((item: any) => {
                    console.log(`Best chunks: ${item.text} - source: ${item.source}`);
                });
                console.log('Answering the question...')
            }
        }),
        concatMap((textsSources) => {
            const chunks = textsSources.map((item: any) => item.text);
            return answer$(query, prompt_instructions, chunks, llm_model, verbose).pipe(
                map((answer) => {
                    const sources = textsSources.map(({ source }) => `- *${source}*`).join("\n");
                    const fullMessage = `${answer}\n\n${sources}`;
                    return fullMessage
                })
            )
        })
    );
}