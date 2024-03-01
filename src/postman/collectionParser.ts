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

function readPostmanCollection(filePath: string): PostmanCollection {
    const rawData = fs.readFileSync(filePath, 'utf8');
    const collection: PostmanCollection = JSON.parse(rawData);
    return collection;
}

// src/postman/collectionParser.ts

// Assuming PostmanCollection, CollectionItem, and RequestItem interfaces are already defined above

interface EndpointDefinition {
    method: string;
    path: string;
    name: string;
}

function parseCollection(collection: PostmanCollection): EndpointDefinition[] {
    let endpoints: EndpointDefinition[] = [];

    function extractEndpoints(items: CollectionItem[] | undefined, basePath: string[] = []): void {
        if (!items) {
            return;
        }
    
        items.forEach(item => {
            // If the item has nested items, it's a folder/group
            if (item.item) {
                // Only pass basePath if you want to include the folder's name in the path
                extractEndpoints(item.item);
            } else if (item.request) {
                // This is an actual request, so let's extract its details
                const { method, url } = item.request;
                const fullPath = url.path.join('/'); // Directly use the path from the request
                endpoints.push({
                    method,
                    path: fullPath.replace(/^\//, ''), // Ensure no leading slash
                    name: item.name
                });
            }
        });
    }
    

    extractEndpoints(collection.item);

    return endpoints;
}


export { readPostmanCollection, parseCollection, PostmanCollection, CollectionItem, RequestItem };
