// cli/index.ts
import { program } from 'commander';
import { lintProject } from '../linter/index';
import { parseCollection, readPostmanCollection } from '../postman/collectionParser';

program
    .version('1.0.0')
    .description('TypeScript API Linter')
    .option('-t, --tsFiles <path>', 'Path to the directory containing TypeScript files')
    .option('-d, --typeDefs <path>', 'Path to the directory containing type definition files')
    .option('-c, --collection <path>', 'Path to the Postman collection JSON file')
    .parse(process.argv);

const tsFilesPath = program.opts().tsFiles;
const typeDefsPath = program.opts().typeDefs;
const collectionPath = program.opts().collection;

if (!tsFilesPath || !typeDefsPath || !collectionPath) {
  console.error('Please provide the required paths using the -t, -d, and -c options.');
  process.exit(1);
}

async function runLinter() {
  try {
    const postmanCollection = readPostmanCollection(collectionPath);
    const postmanEndpoints = parseCollection(postmanCollection);

    const errors = await lintProject(tsFilesPath, typeDefsPath, postmanEndpoints);

    if (errors.length > 0) {
      console.error('Linting errors found:');
      errors.forEach((error, index) => {
        console.error(`${index + 1}. ${error}`);
      });
      process.exit(1);
    } else {
      console.log('No linting errors found.');
    }
  } catch (error) {
    console.error('An error occurred while running the linter:', error);
    process.exit(1);
  }
}

runLinter();
