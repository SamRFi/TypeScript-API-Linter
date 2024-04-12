# How to use?
## Issues
Make sure the typescript files are compiled to javascript files.
```npx tsc src\cli\index.ts```  
make sure ```#!/usr/bin/env node``` is at the top of the src/cli/index.js file
## Install dependencies
```
npm install
```
## Run the application

```
npm install -g
typescript-api-linter -r "C:\Users\samra\Documents\Sam\Howest\Sync\Modules\BAP\repos\typescript-api-linter\src\mockFiles\failingMockRequests" -t "C:\Users\samra\Documents\Sam\Howest\Sync\Modules\BAP\repos\typescript-api-linter\src\mockFiles\failingMockTypes" -c "C:\Users\samra\Documents\Sam\Howest\Sync\Modules\BAP\repos\typescript-api-linter\src\mockFiles\mockPostmanCollection.json"
```
## Run the tests
```
npm test
```