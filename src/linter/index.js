"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lintProject = void 0;
var lintRules_1 = require("./lintRules");
var requestParser_1 = require("./requestParser");
var typeParser_1 = require("./typeParser");
var ts_morph_1 = require("ts-morph");
/**
 * Main function to lint a project by comparing TypeScript API definitions with Postman API definitions.
 * @param requestFilesDirectory The directory containing the TypeScript files that define API endpoints
 * @param typesDirectory The directory containing TypeScript files that define types
 * @param postmanEndpoints An array of endpoint definitions extracted from a Postman collection
 * @returns An array of linting error messages if discrepancies are found
 */
function lintProject(requestFilesDirectory, typesDirectory, postmanEndpoints) {
    return __awaiter(this, void 0, void 0, function () {
        var project, requestEndpoints, typeDefinitions, errors;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    project = new ts_morph_1.Project();
                    // Add all source files in the request files directory to the project
                    project.addSourceFilesAtPaths("".concat(requestFilesDirectory, "/**/*"));
                    // Add all source files in the types directory to the project
                    project.addSourceFilesAtPaths("".concat(typesDirectory, "/**/*"));
                    return [4 /*yield*/, (0, requestParser_1.tsParser)(project)];
                case 1:
                    requestEndpoints = _a.sent();
                    typeDefinitions = (0, typeParser_1.parseTypes)(typesDirectory);
                    errors = (0, lintRules_1.lintEndpointRules)(postmanEndpoints, requestEndpoints, typeDefinitions);
                    if (errors.length > 0) {
                        // Uncomment the following lines to log errors to the console
                        //console.log('Linting errors found:');
                        //errors.forEach(error => console.log(error));
                    }
                    else {
                        // Uncomment the following line to log success message to the console
                        //console.log('No linting errors found.');
                    }
                    return [2 /*return*/, errors]; // Return the array of linting error messages
            }
        });
    });
}
exports.lintProject = lintProject;
