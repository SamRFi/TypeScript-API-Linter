export interface PostmanCollection {
    info: {
        _postman_id: string;
        name: string;
        schema: string;
    };
    item: CollectionItem[];
}

export interface CollectionItem {
    request: any;
    name: string;
    item?: RequestItem[]; // Collections can have nested items
}

export interface RequestItem {
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

export interface EndpointDefinition {
    method: string;
    path: string;
    name: string;
    requestBody?: any;
}