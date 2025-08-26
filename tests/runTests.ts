import { runWorkingAuthTests } from './workingAuthTests';
import { runUtilTests } from './utilTests';

async function runAllTests() {
  console.log('🚀 K2A Backend Test Suite\n');
  console.log('Running all tests...\n');

  const startTime = Date.now();

  try {
    // Run utility tests first (no server required)
    console.log('=' .repeat(50));
    await runUtilTests();
    
    console.log('\n' + '='.repeat(50));
    // Run API tests (server required)
    await runWorkingAuthTests();
    
    const totalTime = Date.now() - startTime;
    console.log('\n' + '='.repeat(50));
    console.log('🎉 All tests completed successfully!');
    console.log(`⏱️  Total execution time: ${totalTime}ms`);
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run all tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

export { runAllTests };
