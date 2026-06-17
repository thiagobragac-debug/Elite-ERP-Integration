// Test file with linting errors that can't be auto-fixed
const unusedVariable = 'This should trigger a linting error';

function badFunction() {
  const x = 1;
  console.log('Debug message - should be warned');
  // This will cause a type error
  const result: string = 123;
  return x;
}

export default badFunction;
