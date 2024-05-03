export interface TSEndpoint {
    method: string;
    path: string;
    requestBodyType?: string | null;
    responseBodyType?: string | null;
}
  