import axios from 'axios';

export interface NetworkDiagnostics {
  backendUrl: string;
  isReachable: boolean;
  responseTime?: number;
  error?: string;
  statusCode?: number;
}

export const testBackendConnection = async (url: string, timeoutMs: number = 5000): Promise<NetworkDiagnostics> => {
  const startTime = Date.now();
  try {
    console.log(`🔍 Testing connection to: ${url}`);
    const response = await axios.get(`${url}/api/health`, {
      timeout: timeoutMs,
    });
    const responseTime = Date.now() - startTime;
    console.log(`✅ Backend reachable! Response time: ${responseTime}ms`);
    return {
      backendUrl: url,
      isReachable: true,
      responseTime,
      statusCode: response.status,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const errorMsg = error.message || 'Unknown error';
    console.error(`❌ Backend unreachable: ${errorMsg}`);
    return {
      backendUrl: url,
      isReachable: false,
      responseTime,
      error: errorMsg,
      statusCode: error.response?.status,
    };
  }
};

export const BACKEND_CANDIDATES = [
  'http://10.212.0.135:10000',   // ← your current PC LAN IP (from `ipconfig`)
  'http://localhost:10000',
  'http://10.0.2.2:10000',       // Android emulator only
];

export const testMultipleBackends = async (): Promise<NetworkDiagnostics[]> => {
  console.log('🌐 Testing multiple backend URLs...');
  const results = await Promise.all(BACKEND_CANDIDATES.map(url => testBackendConnection(url)));
  
  const working = results.filter(r => r.isReachable);
  if (working.length > 0) {
    console.log(`✅ Working URLs: ${working.map(r => r.backendUrl).join(', ')}`);
  } else {
    console.error('❌ No working backend URLs found');
  }
  
  return results;
};

export const printNetworkDiagnostics = (diagnostics: NetworkDiagnostics) => {
  console.log('\n📊 Network Diagnostics:');
  console.log(`   Backend URL: ${diagnostics.backendUrl}`);
  console.log(`   Status: ${diagnostics.isReachable ? '✅ Reachable' : '❌ Unreachable'}`);
  if (diagnostics.responseTime !== undefined) {
    console.log(`   Response Time: ${diagnostics.responseTime}ms`);
  }
  if (diagnostics.statusCode) {
    console.log(`   HTTP Status: ${diagnostics.statusCode}`);
  }
  if (diagnostics.error) {
    console.log(`   Error: ${diagnostics.error}`);
  }
  console.log('');
};
