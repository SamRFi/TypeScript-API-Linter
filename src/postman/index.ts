import { readPostmanCollection, parseCollection } from './collectionParser';

const collectionFilePath = 'path/to/your/postman/collection.json'; // Update this path
const postmanCollection = readPostmanCollection(collectionFilePath);
const endpointDefinitions = parseCollection(postmanCollection);

export { endpointDefinitions };
