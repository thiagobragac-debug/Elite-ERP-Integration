// Test file with linting errors
const unusedVariable = 'This should trigger a linting error';

function badFunction() {
  const x = 1;
  console.log('Debug message - should be warned');
  return x;
}

export default badFunction;
