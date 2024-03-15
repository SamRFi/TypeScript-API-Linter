// src/postman/typeParser.ts
import { PostmanCollection, CollectionItem, RequestItem } from '../postman/collectionParser';

interface TypeDefinition {
  endpoint: string;
  method: string;
  requestBody: any;
}

function parseTypes(collection: PostmanCollection): TypeDefinition[] {
  const types: TypeDefinition[] = [];

  function extractTypes(items: CollectionItem[] | undefined): void {
    if (!items) {
      return;
    }

    items.forEach(item => {
      if (item.item) {
        extractTypes(item.item);
      } else if (item.request) {
        const { method, url, body } = item.request;
        const endpoint = url.path.join('/').replace(/^\//, '');

        let requestBody;
        if (body && body.mode === 'raw' && body.raw) {
          try {
            requestBody = JSON.parse(body.raw);
          } catch (error) {
            console.warn(`Failed to parse request body for endpoint: ${item.name}`);
          }
        }

        types.push({
          endpoint,
          method,
          requestBody
        });
      }
    });
  }

  extractTypes(collection.item);

  return types;
}

export { parseTypes, TypeDefinition };