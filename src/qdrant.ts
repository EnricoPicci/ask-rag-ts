import { QdrantClient } from "@qdrant/js-client-rest";

export function getCloudClient() {
    const apiKey = process.env['QDRANT_API_KEY']
    if (!apiKey) {
        throw new Error('QDRANT_API_KEY is required');
    }
    const url = process.env['QDRANT_API_URL']
    if (!url) {
        throw new Error('QDRANT_API_URL is required');
    }

    const client = new QdrantClient({
        url,
        apiKey,
    });

    return client;
}