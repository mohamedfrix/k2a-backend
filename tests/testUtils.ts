// Test utilities for API testing
import fetch from 'node-fetch';

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

export class TestRunner {
  private results: TestResult[] = [];
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
  }

  async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    try {
      await testFn();
      this.results.push({
        name,
        passed: true,
        duration: Date.now() - startTime
      });
      console.log(`✅ ${name}`);
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      this.results.push({
        name,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      console.log(`❌ ${name}: ${error instanceof Error ? error.message : String(error)}`);
      // Add small delay even on failure
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  async apiCall(method: string, endpoint: string, options: {
    body?: any;
    headers?: Record<string, string>;
    expectStatus?: number;
  } = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const { body, headers = {}, expectStatus = 200 } = options;

    const fetchOptions: any = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
    
    if (response.status !== expectStatus) {
      console.log(`API Call Failed: ${method} ${endpoint}`);
      console.log(`Expected Status: ${expectStatus}, Got: ${response.status}`);
      console.log(`Response:`, responseData);
      throw new Error(`Expected status ${expectStatus}, got ${response.status}`);
    }

    return responseData;
  }

  async expect(actual: any, expected: any, message?: string): Promise<void> {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`${message || 'Assertion failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  }

  async expectToExist(value: any, message?: string): Promise<void> {
    if (value === undefined || value === null) {
      throw new Error(`${message || 'Expected value to exist'}, but got ${value}`);
    }
  }

  async expectToNotExist(value: any, message?: string): Promise<void> {
    if (value !== undefined && value !== null) {
      throw new Error(`${message || 'Expected value to not exist'}, but got ${value}`);
    }
  }

  async expectToContain(container: any, item: any, message?: string): Promise<void> {
    if (!container || typeof container !== 'object') {
      throw new Error(`${message || 'Container is not an object'}`);
    }
    if (!(item in container)) {
      throw new Error(`${message || 'Item not found in container'}: expected to contain ${item}`);
    }
  }

  async expectStringToContain(text: string, substring: string, message?: string): Promise<void> {
    if (typeof text !== 'string') {
      throw new Error(`${message || 'Expected text to be a string'}, but got ${typeof text}`);
    }
    if (!text.includes(substring)) {
      throw new Error(`${message || 'String does not contain expected substring'}: expected "${text}" to contain "${substring}"`);
    }
  }

  getResults(): TestResult[] {
    return this.results;
  }

  printSummary(): void {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    console.log('\n📊 Test Summary:');
    console.log(`Total: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed > 0) {
      console.log('\n💥 Failed Tests:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`   - ${result.name}: ${result.error}`);
      });
    }

    const totalTime = this.results.reduce((sum, r) => sum + (r.duration || 0), 0);
    console.log(`⏱️  Total time: ${totalTime}ms`);
  }

  hasFailures(): boolean {
    return this.results.some(r => !r.passed);
  }
}

export async function waitForServer(baseUrl: string = 'http://localhost:5000', maxAttempts: number = 10): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}

export function generateRandomEmail(): string {
  return `test${Math.random().toString(36).substring(7)}@k2a.com`;
}

export function generateStrongPassword(): string {
  return `Test${Math.random().toString(36).substring(2)}123!`;
}
