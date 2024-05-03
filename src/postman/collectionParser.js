"use strict";
// src/postman/collectionParser.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCollection = exports.readPostmanCollection = void 0;
var fs = require("fs");
function readPostmanCollection(filePath) {
    var rawData = fs.readFileSync(filePath, 'utf8');
    var collection = JSON.parse(rawData);
    return collection;
}
exports.readPostmanCollection = readPostmanCollection;
function parseCollection(collection) {
    var endpoints = [];
    function extractEndpoints(items) {
        if (!items) {
            return;
        }
        items.forEach(function (item) {
            if (item.item) {
                extractEndpoints(item.item);
            }
            else if (item.request) {
                var _a = item.request, method = _a.method, url = _a.url, body = _a.body;
                var fullPath = '';
                if (url && url.path && Array.isArray(url.path)) {
                    fullPath = url.path.join('/');
                }
                else if (url && url.raw) {
                    fullPath = url.raw.replace(/^https?:\/\/[^/]+/, '');
                }
                var requestBody = void 0;
                if (body && body.mode === 'raw' && body.raw) {
                    try {
                        requestBody = JSON.parse(body.raw);
                    }
                    catch (error) {
                        console.warn("Failed to parse request body for endpoint: ".concat(item.name));
                    }
                }
                var responseBody = void 0;
                if (item.request.method === 'GET') {
                    if (item.response && item.response.length > 0) {
                        var exampleResponse = item.response[0];
                        if (exampleResponse.body) {
                            try {
                                responseBody = JSON.parse(exampleResponse.body);
                            }
                            catch (error) {
                                console.warn("Failed to parse response body for endpoint: ".concat(item.name));
                            }
                        }
                    }
                }
                endpoints.push({
                    method: method,
                    path: fullPath.replace(/^\//, ''),
                    name: item.name,
                    requestBody: requestBody,
                    responseBody: responseBody // Add the response body to the endpoint definition
                });
            }
        });
    }
    extractEndpoints(collection.item);
    return endpoints;
}
exports.parseCollection = parseCollection;
