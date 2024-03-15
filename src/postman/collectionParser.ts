// src/postman/collectionParser.ts

import * as fs from 'fs';
import { CollectionItem, EndpointDefinition, PostmanCollection, RequestItem } from '../types/Postman.types';



function readPostmanCollection(filePath: string): PostmanCollection {
    const rawData = fs.readFileSync(filePath, 'utf8');
    const collection: PostmanCollection = JSON.parse(rawData);
    return collection;
}

function parseCollection(collection: PostmanCollection): EndpointDefinition[] {
    let endpoints: EndpointDefinition[] = [];

    function extractEndpoints(items: CollectionItem[] | undefined): void {
        if (!items) {
            return;
        }

        items.forEach(item => {
            if (item.item) {
                extractEndpoints(item.item);
            } else if (item.request) {
                const { method, url, body } = item.request;
                const fullPath = url.path.join('/');
                
                let requestBody;
                if (body && body.mode === 'raw' && body.raw) {
                    try {
                        requestBody = JSON.parse(body.raw);
                    } catch (error) {
                        console.warn(`Failed to parse request body for endpoint: ${item.name}`);
                    }
                }

                endpoints.push({
                    method,
                    path: fullPath.replace(/^\//, ''),
                    name: item.name,
                    requestBody
                });
            }
        });
    }

    extractEndpoints(collection.item);

    return endpoints;
}

export { readPostmanCollection, parseCollection, PostmanCollection, CollectionItem, RequestItem, EndpointDefinition };