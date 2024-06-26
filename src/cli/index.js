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
// cli/index.ts
var commander_1 = require("commander");
var index_1 = require("../linter/index");
var collectionParser_1 = require("../postman/collectionParser");
// Set up the CLI application using 'commander'
commander_1.program
    .version('1.0.0') // Define the version of the CLI application
    .description('TypeScript API Linter')
    .option('-r, --requests <path>', 'Path to the directory containing request files')
    .option('-t, --types <path>', 'Path to the directory containing type definition files')
    .option('-c, --collection <path>', 'Path to the Postman collection JSON file')
    .parse(process.argv); // Parse the command-line arguments
// Extract the options provided by the user from the command-line arguments
var tsFilesPath = commander_1.program.opts().requests;
var typeDefsPath = commander_1.program.opts().types;
var collectionPath = commander_1.program.opts().collection;
// Validate that all required paths have been provided
if (!tsFilesPath || !typeDefsPath || !collectionPath) {
    console.error('Please provide the required paths using the -r, -t, and -c options.'); // Log an error message if any required path is missing
    process.exit(1); // Exit the application with an error code
}
/**
 * Main function to run the linter process.
 * This function orchestrates reading the Postman collection, parsing the endpoints, and linting the TypeScript project.
 */
function runLinter() {
    return __awaiter(this, void 0, void 0, function () {
        var postmanCollection, postmanEndpoints, errors, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    postmanCollection = (0, collectionParser_1.readPostmanCollection)(collectionPath);
                    postmanEndpoints = (0, collectionParser_1.parseCollection)(postmanCollection);
                    return [4 /*yield*/, (0, index_1.lintProject)(tsFilesPath, typeDefsPath, postmanEndpoints)];
                case 1:
                    errors = _a.sent();
                    if (errors.length > 0) { // Check if there are any linting errors
                        //console.error('Linting errors found:');
                        errors.forEach(function (error, index) {
                            console.error("".concat(index + 1, ". ").concat(error)); // Log the error with its index
                        });
                        process.exit(1); // Exit the application with an error code indicating failure
                    }
                    else {
                        console.log('No linting errors found.'); // Log a message indicating that no linting errors were found
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error('An error occurred while running the linter:', error_1); // Log the error message to the console
                    process.exit(1); // Exit the application with an error code indicating failure
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Run the linter process by calling the main function
runLinter();
