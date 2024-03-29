import OpenAI from "openai";
import { getCloudClient } from "./qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";
import { embedSentece$, getOpenaiClient } from "./openai";
import { concatMap, map } from "rxjs";

export function getOpenaiQdrantClients() {
    const openaiClient = getOpenaiClient();

    const qdrantClient = getCloudClient();

    return { openaiClient, qdrantClient };
}

export function qsearch$(
    qdrantClient: QdrantClient,
    openaiClient: OpenAI,
    embeddingsModel: string,
    query: string,
    cname: string,
    nchunks: number
) {
    return embedSentece$(openaiClient, embeddingsModel, query).pipe(
        map(vector => {
            const params = { vector, limit: nchunks }
            return params
        }),
        concatMap(params => qdrantClient.search(cname, params)),
        map(response => {
            const textsSources = response.map((item: any) => {
                return { text: item.payload.text, source: item.payload.source }
            });
            return textsSources
        })
    );
}