import { expect } from "chai";
import { answer$, embedSentece$, getOpenaiClient } from "./openai";
import { tap } from "rxjs";

const openaiClient = getOpenaiClient()

describe(`embedSentece$`, () => {
    it(`create embeddings for a sentence`, (done) => {
        const model = 'text-embedding-3-small';
        const sentence = 'I am a sentence with a profound meaning';

        embedSentece$(openaiClient, model, sentence)
            .pipe(
                tap((embedding) => {
                    expect(embedding).not.null;
                    // embeddings must be an array
                    expect(embedding).instanceof(Array);
                    expect(embedding.length).equal(1536);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
});

describe(`answer$`, () => {
    it(`answer to a question`, (done) => {
        const query = 'Which is the best football player ever'
        const prompt_instructions = 'You are a football expert. You have to answer the question based on the information I provide.'
        const chunks = [
            'Some say that Pele is the best football player ever',
            'Others say that Maradona is the best football player ever',
            'Others say that Calloni is the best football player ever',
        ]
        const model = "gpt-3.5-turbo-0125"

        answer$(query, prompt_instructions, chunks, model)
            .pipe(
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
