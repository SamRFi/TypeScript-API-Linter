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
                let fullPath = '';

                if (url && url.path && Array.isArray(url.path)) {
                    fullPath = url.path.join('/');
                } else if (url && url.raw) {
                    fullPath = url.raw.replace(/^https?:\/\/[^/]+/, '');
                }

                let requestBody;
                if (body && body.mode === 'raw' && body.raw) {
                    try {
                        const parsedBody = JSON.parse(body.raw);
                        if (Array.isArray(parsedBody)) {
                            requestBody = parsedBody[1];
                        } else {
                            requestBody = parsedBody;
                        }
                    } catch (error) {
                        console.warn(`Failed to parse request body for endpoint: ${item.name}`);
                    }
                }
                
                let responseBody;
                if (item.response && item.response.length > 0) {
                    const exampleResponse = item.response.find(res => res.code === 200 || res.code === 201);
                    if (exampleResponse && exampleResponse.body) {
                        try {
                            responseBody = JSON.parse(exampleResponse.body);
                        } catch (error) {
                            console.warn(`Failed to parse response body for endpoint: ${item.name}`);
                        }
                    }
                }
                
        
                endpoints.push({
                    method,
                    path: fullPath.replace(/^\//, ''),
                    name: item.name,
                    requestBody,
                    responseBody // Add the response body to the endpoint definition
                });
            }
        });
    }

    extractEndpoints(collection.item);

    return endpoints;
}

export { readPostmanCollection, parseCollection, PostmanCollection, CollectionItem, RequestItem, EndpointDefinition };