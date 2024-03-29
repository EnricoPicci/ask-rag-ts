import { tap } from "rxjs";
import { askRag$ } from "./ask-rag";
import { getOpenaiClient } from "./openai";
import { getCloudClient } from "./qdrant";
import { expect } from "chai";

const qdrantClient = getCloudClient();
const openaiCLient = getOpenaiClient();

describe(`askRag$`, () => {
    it(`ask the rag engine a question`, (done) => {
        const query = 'Which is the best football player ever'
        const prompt_instructions = 'You are a football expert. You have to answer the question based on the information I provide.'
        const embeddingsModel = 'text-embedding-3-small';
        const llmModel = "gpt-3.5-turbo-0125"
        const collectionName = `jira_stories_small`;

        askRag$(query, prompt_instructions, embeddingsModel, llmModel, qdrantClient, openaiCLient, collectionName, 3).pipe(
            tap((answer) => {
                expect(answer).not.null;
                expect(typeof answer).equal('string');
                expect(answer?.length).greaterThan(0)
            }),
        )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
});