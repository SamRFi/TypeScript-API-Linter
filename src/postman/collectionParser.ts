// src/postman/collectionParser.ts

import * as fs from 'fs';

interface PostmanCollection {
    info: {
        _postman_id: string;
        name: string;
        schema: string;
    };
    item: CollectionItem[];
}

interface CollectionItem {
    request: any;
    name: string;
    item?: RequestItem[]; // Collections can have nested items
}

interface RequestItem {
    name: string;
    request: {
        method: string;
        header: any[];
        body?: {
            mode: string;
            raw: string;
            options?: {
                raw: {
                    language: string;
                };
            };
        };
        url: {
            raw: string;
            host: string[];
            path: string[];
        };
    };
    response: any[];
}

interface EndpointDefinition {
    method: string;
    path: string;
    name: string;
    requestBody?: any;
}

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