import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Play, Info } from 'lucide-react';
import * as Sentry from '@sentry/react';
import { setUserContext, setTenantContext, setModuleContext } from '@/lib/sentry';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';

/**
 * Sentry Error Tracking Test Page
 * 
 * This page provides a comprehensive testing interface for validating Sentry error tracking
 * integration including context enrichment, sensitive data filtering, and session replay.
 * 
 * Requirements validated:
 * - 10.2: Error capture with full stack trace
 * - 10.3: Tenant and user context enrichment
 * - 10.5: Session replay on errors
 * - 10.6: Sensitive data filtering
 */
export default function SentryErrorTest() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [testResults, setTestResults] = useState<Record<string, 'pending' | 'success' | 'error'>>({});
  const [eventIds, setEventIds] = useState<Record<string, string>>({});
  const [isProduction, setIsProduction] = useState(false);

  useEffect(() => {
    // Check if Sentry is initialized (production mode)
    setIsProduction(import.meta.env.PROD);
    
    // Set initial context
    if (user && tenant) {
      setUserContext(
        {
          id: user.id,
          email: user.email || 'unknown@example.com',
          role: user.role || 'user',
        },
        tenant.id
      );
      setTenantContext(tenant.id, tenant.nome);
    }
    setModuleContext('Admin', 'SentryErrorTest');
  }, [user, tenant]);

  const runTest = (testName: string, testFn: () => void) => {
    setTestResults(prev => ({ ...prev, [testName]: 'pending' }));
    
    try {
      testFn();
      setTestResults(prev => ({ ...prev, [testName]: 'success' }));
    } catch (error) {
      // Capture error in Sentry
      const eventId = Sentry.captureException(error, {
        tags: {
          test_name: testName,
          test_type: 'manual_error_test',
        },
      });
      
      if (eventId) {
        setEventIds(prev => ({ ...prev, [testName]: eventId }));
      }
      
      setTestResults(prev => ({ ...prev, [testName]: 'error' }));
    }
  };

  const tests = [
    {
      id: 'basic_error',
      name: 'Basic Error',
      description: 'Throws a simple error with stack trace',
      test: () => {
        throw new Error('Test error from Sentry error test page');
      },
    },
    {
      id: 'tenant_context',
      name: 'Tenant Context',
      description: 'Error with tenant context attached',
      test: () => {
        if (!tenant) {
          throw new Error('No tenant selected - tenant context should still be attached');
        }
        throw new Error(`Error with tenant context: ${tenant.nome}`);
      },
    },
    {
      id: 'user_context',
      name: 'User Context',
      description: 'Error with user context attached',
      test: () => {
        if (!user) {
          throw new Error('No user logged in - user context should still be attached');
        }
        throw new Error(`Error with user context: ${user.email}`);
      },
    },
    {
      id: 'sensitive_data',
      name: 'Sensitive Data Filtering',
      description: 'Error with sensitive data that should be filtered',
      test: () => {
        // These sensitive fields should be filtered by Sentry's beforeSend hook
        const sensitiveData = {
          username: 'testuser',
          password: 'super_secret_password_123',
          api_key: 'sk_test_EXAMPLE_KEY_FILTERED',
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
          card_number: '4242424242424242',
          cvv: '123',
        };
        
        // Add as breadcrumb (should be filtered)
        Sentry.addBreadcrumb({
          category: 'test',
          message: 'Sensitive data test',
          data: sensitiveData,
          level: 'info',
        });
        
        // Throw error with sensitive data in message
        const error = new Error('Error with sensitive data');
        (error as any).sensitiveData = sensitiveData;
        throw error;
      },
    },
    {
      id: 'async_error',
      name: 'Async Error',
      description: 'Error from async operation',
      test: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        throw new Error('Async error from timeout');
      },
    },
    {
      id: 'network_error',
      name: 'Network Error',
      description: 'Simulated network/API error',
      test: () => {
        const error: any = new Error('Failed to fetch data from API');
        error.name = 'NetworkError';
        error.statusCode = 500;
        error.endpoint = '/api/test-endpoint';
        throw error;
      },
    },
    {
      id: 'validation_error',
      name: 'Validation Error',
      description: 'Form validation error',
      test: () => {
        const error: any = new Error('Validation failed: CPF is required');
        error.name = 'ValidationError';
        error.field = 'cpf';
        error.value = '';
        throw error;
      },
    },
    {
      id: 'nested_error',
      name: 'Nested Error',
      description: 'Error from nested function calls',
      test: () => {
        const level3 = () => {
          throw new Error('Error from deeply nested function');
        };
        const level2 = () => level3();
        const level1 = () => level2();
        level1();
      },
    },
  ];

  const runAllTests = () => {
    tests.forEach((test, index) => {
      setTimeout(() => {
        runTest(test.id, test.test);
      }, index * 500); // Stagger tests to avoid overwhelming Sentry
    });
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error' | undefined) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'error':
        return <XCircle size={20} className="text-red-500" />;
      default:
        return <Info size={20} className="text-gray-400" />;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          Sentry Error Tracking Test
        </h1>
        <p className="text-gray-400">
          Test and validate Sentry error tracking integration with context enrichment and data filtering
        </p>
      </div>

      {/* Environment Status */}
      <div className={`p-4 rounded-lg mb-6 ${isProduction ? 'bg-green-900/20 border border-green-500' : 'bg-yellow-900/20 border border-yellow-500'}`}>
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} className={isProduction ? 'text-green-500' : 'text-yellow-500'} />
          <div>
            <h3 className="font-semibold text-white">
              {isProduction ? 'Production Mode - Sentry Active' : 'Development Mode - Sentry Disabled'}
            </h3>
            <p className="text-sm text-gray-300">
              {isProduction 
                ? 'Errors will be sent to Sentry dashboard. Check the Sentry UI to verify error capture.'
                : 'Sentry is not initialized in development. Build and run in production mode to test error tracking.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Current Context */}
      <div className="bg-[#1a1d29] p-4 rounded-lg mb-6 border border-gray-700">
        <h3 className="font-semibold text-white mb-3">Current Context</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-400">User ID:</span>
            <span className="text-white ml-2">{user?.id || 'Not logged in'}</span>
          </div>
          <div>
            <span className="text-gray-400">User Email:</span>
            <span className="text-white ml-2">{user?.email || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-400">User Role:</span>
            <span className="text-white ml-2">{user?.role || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-400">Tenant ID:</span>
            <span className="text-white ml-2">{tenant?.id || 'No tenant selected'}</span>
          </div>
          <div>
            <span className="text-gray-400">Tenant Name:</span>
            <span className="text-white ml-2">{tenant?.nome || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-400">Module:</span>
            <span className="text-white ml-2">Admin</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-900/20 border border-blue-500 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-white mb-2">Testing Instructions</h3>
        <ol className="list-decimal list-inside text-sm text-gray-300 space-y-1">
          <li>Build the app in production mode: <code className="bg-gray-800 px-1">npm run build</code></li>
          <li>Serve the production build: <code className="bg-gray-800 px-1">npm run preview</code></li>
          <li>Ensure <code className="bg-gray-800 px-1">VITE_SENTRY_DSN</code> is configured in your environment</li>
          <li>Click "Run All Tests" or run individual tests below</li>
          <li>Open Sentry dashboard to verify:
            <ul className="list-disc list-inside ml-6 mt-1">
              <li>Errors appear with full stack traces</li>
              <li>Tenant ID and name are attached</li>
              <li>User ID, email, and role are attached</li>
              <li>Sensitive data (passwords, tokens) is filtered as [FILTERED]</li>
              <li>Session replay is captured</li>
            </ul>
          </li>
        </ol>
      </div>

      {/* Run All Button */}
      <div className="mb-6">
        <button
          onClick={runAllTests}
          disabled={!isProduction}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
        >
          <Play size={20} />
          Run All Tests
        </button>
      </div>

      {/* Test Cases */}
      <div className="space-y-3">
        <h3 className="font-semibold text-white text-xl mb-4">Test Cases</h3>
        {tests.map(test => (
          <div
            key={test.id}
            className="bg-[#1a1d29] border border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(testResults[test.id])}
                  <h4 className="font-semibold text-white">{test.name}</h4>
                </div>
                <p className="text-sm text-gray-400 mb-3">{test.description}</p>
                
                {eventIds[test.id] && (
                  <div className="text-xs text-gray-500 mb-2">
                    Event ID: <code className="bg-gray-800 px-1">{eventIds[test.id]}</code>
                  </div>
                )}
                
                {testResults[test.id] === 'error' && (
                  <div className="text-xs text-green-500 flex items-center gap-1">
                    <CheckCircle size={14} />
                    Error captured! Check Sentry dashboard.
                  </div>
                )}
              </div>
              
              <button
                onClick={() => runTest(test.id, test.test)}
                disabled={!isProduction}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-medium text-sm transition-colors"
              >
                Trigger Error
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Requirements Checklist */}
      <div className="mt-8 bg-[#1a1d29] border border-gray-700 rounded-lg p-6">
        <h3 className="font-semibold text-white text-xl mb-4">Requirements Validation Checklist</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="req-10-2" className="w-4 h-4" />
            <label htmlFor="req-10-2" className="text-gray-300">
              <strong className="text-white">Req 10.2:</strong> Error appears in Sentry with full stack trace
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="req-10-3-tenant" className="w-4 h-4" />
            <label htmlFor="req-10-3-tenant" className="text-gray-300">
              <strong className="text-white">Req 10.3:</strong> Tenant ID and name attached to error context
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="req-10-3-user" className="w-4 h-4" />
            <label htmlFor="req-10-3-user" className="text-gray-300">
              <strong className="text-white">Req 10.3:</strong> User ID, email, and role attached to error context
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="req-10-6" className="w-4 h-4" />
            <label htmlFor="req-10-6" className="text-gray-300">
              <strong className="text-white">Req 10.6:</strong> Sensitive data (passwords, tokens, API keys) filtered as [FILTERED]
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="req-10-5" className="w-4 h-4" />
            <label htmlFor="req-10-5" className="text-gray-300">
              <strong className="text-white">Req 10.5:</strong> Session replay captured for error reproduction
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
