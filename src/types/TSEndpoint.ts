export interface TSEndpoint {
    method: string;
    path: string;
    requestBodyType?: string | null;
    responseBodyType?: string | null;
    isRequestBodyArray?: boolean;  // Indicates if the request body is expected to be an array
    isResponseBodyArray?: boolean;
}
  