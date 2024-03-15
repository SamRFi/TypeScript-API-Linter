export interface TypeDefinition {
    name: string;
    properties: { [key: string]: string };
    usages: string[];
}