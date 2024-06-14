// cli/index.ts
import { program } from 'commander';
import { lintProject } from '../linter/index';
import { parseCollection, readPostmanCollection } from '../postman/collectionParser';

// Set up the CLI application using 'commander'
program
    .version('1.0.0') // Define the version of the CLI application
    .description('TypeScript API Linter')
    .option('-r, --requests <path>', 'Path to the directory containing request files')
    .option('-t, --types <path>', 'Path to the directory containing type definition files')
    .option('-c, --collection <path>', 'Path to the Postman collection JSON file')
    .parse(process.argv); // Parse the command-line arguments

// Extract the options provided by the user from the command-line arguments
const tsFilesPath = program.opts().requests;
const typeDefsPath = program.opts().types;
const collectionPath = program.opts().collection;

// Validate that all required paths have been provided
if (!tsFilesPath || !typeDefsPath || !collectionPath) {
  console.error('Please provide the required paths using the -r, -t, and -c options.'); // Log an error message if any required path is missing
  process.exit(1); // Exit the application with an error code
}

/**
 * Main function to run the linter process.
 * This function orchestrates reading the Postman collection, parsing the endpoints, and linting the TypeScript project.
 */
async function runLinter() {
  try {
    // Read and parse the Postman collection
    const postmanCollection = readPostmanCollection(collectionPath); // Read the Postman collection JSON file
    const postmanEndpoints = parseCollection(postmanCollection); // Parse the collection to extract endpoint definitions

    // Lint the TypeScript project by comparing the extracted endpoints
    const errors = await lintProject(tsFilesPath, typeDefsPath, postmanEndpoints);

    if (errors.length > 0) { // Check if there are any linting errors
      //console.error('Linting errors found:');
      errors.forEach((error, index) => { // Iterate over each error and log it to the console
        console.error(`${index + 1}. ${error}`); // Log the error with its index
      });
      process.exit(1); // Exit the application with an error code indicating failure
    } else {
      console.log('No linting errors found.'); // Log a message indicating that no linting errors were found
    }
  } catch (error) { // Catch and handle any errors that occur during the linter process
    console.error('An error occurred while running the linter:', error); // Log the error message to the console
    process.exit(1); // Exit the application with an error code indicating failure
  }
}

// Run the linter process by calling the main function
runLinter();
