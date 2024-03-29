import { expect } from "chai";

import { tap } from "rxjs";

import { qsearch$ } from "./qdrant-openai";
import { getCloudClient } from "./qdrant";
import { getOpenaiClient } from "./openai";


const qdrantClient = getCloudClient();
const openaiCLient = getOpenaiClient();

describe(`qsearch$`, () => {
    it(`search quadrant vector db`, (done) => {
        const embeddingsModel = 'text-embedding-3-small';
        const query = 'Please create a new Jira story following the standard template';
        const cname = 'jira_stories_small';
        const nchunks = 3;

        qsearch$(qdrantClient, openaiCLient, embeddingsModel, query, cname, nchunks)
            .pipe(
                tap((textsSources) => {
                    expect(textsSources).not.null;
                    // textsSources must be an array
                    expect(textsSources).instanceof(Array);
                    expect(textsSources.length).equal(nchunks);
                    for (const item of textsSources) {
                        expect(item).to.have.property('text');
                        expect(item).to.have.property('source');
                    }
                    for (const item of textsSources) {
                        // each item has text and source which are strings
                        expect(typeof item.text).equal('string');
                        expect(typeof item.source).equal('string');
                    }
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
});