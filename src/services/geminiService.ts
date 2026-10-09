/**
 * ISTIKHAR AI - Gemini AI Gateway & Secure Architecture Adapter
 * 
 * Communicates with the secure server-side endpoint (/api/gemini/plan and /api/gemini/status).
 * The API key is NEVER stored or sent to the browser.
 * If the key is not set in the server environment, clear setup instructions are provided
 * and ISTIKHAR AI seamlessly uses its deterministic local planner.
 */

export interface GeminiServerStatus {
  configured: boolean;
  model: string;
  securityMode: string;
  setupGuide: {
    isConfigured: boolean;
    instructions: string;
    envVar: string;
  };
}

export interface GeminiPlannedStep {
  id: string;
  label: string;
  detail?: string;
  status: 'completed' | 'failed' | 'in_progress' | 'pending';
  requiresNativeAndroid?: boolean;
  nativeRequirementType?: string;
}

export interface GeminiPlanResult {
  intent: string;
  category: string;
  isNativeAndroidRequired: boolean;
  summary: string;
  responseMessage: string;
  steps: GeminiPlannedStep[];
  androidIntentPayload?: {
    action: string;
    requiredPermission?: string;
    requiredService?: string;
  };
}

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  
  // 1. Check if native bridge provides custom server URL
  try {
    const bridge = (window as any).IstikharNativeBridge;
    if (bridge && typeof bridge.getServerUrl === 'function') {
      const url = bridge.getServerUrl();
      if (url && typeof url === 'string' && url.trim().length > 0) {
        return url.trim().replace(/\/+$/, '');
      }
    }
  } catch {
    // Ignore bridge errors
  }

  // 2. Check localStorage for user configured backend URL
  try {
    const saved = localStorage.getItem('istikhar_backend_url');
    if (saved && saved.trim().length > 0) {
      return saved.trim().replace(/\/+$/, '');
    }
  } catch {
    // Ignore storage errors
  }

  // 3. Check window global
  if ((window as any).__ISTIKHAR_BACKEND_URL__) {
    return String((window as any).__ISTIKHAR_BACKEND_URL__).trim().replace(/\/+$/, '');
  }

  // 4. In Android WebView when assets are loaded from file:// or androidplatform.net
  if (typeof window !== 'undefined' && window.location) {
    const proto = window.location.protocol || '';
    const host = window.location.hostname || '';
    if (proto === 'file:' || host.includes('androidplatform.net')) {
      return 'https://ais-dev-hqxlnltapeg2s4amsx2t7n-104712320688.asia-southeast1.run.app';
    }
  }

  return '';
}

export function buildApiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  if (!base) return endpoint;
  return `${base}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}

export class GeminiArchitectureAdapter {
  private serverStatus: GeminiServerStatus = {
    configured: false,
    model: 'gemini-3.8-flash',
    securityMode: 'Server-Side Isolated Proxy (No client key exposure)',
    setupGuide: {
      isConfigured: false,
      instructions: 'Checking server connection...',
      envVar: 'GEMINI_API_KEY',
    },
  };
  private hasCheckedStatus: boolean = false;

  constructor() {
    this.refreshStatus();
  }

  public async refreshStatus(): Promise<GeminiServerStatus> {
    if (typeof window === 'undefined') return this.serverStatus;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(buildApiUrl('/api/gemini/status'), {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        this.serverStatus = data;
      }
    } catch {
      this.serverStatus.configured = false;
      this.serverStatus.setupGuide.instructions =
        'Backend server endpoint offline. Running in standalone mode with local deterministic planner.';
    }

    this.hasCheckedStatus = true;
    return this.serverStatus;
  }

  public getCachedStatus(): GeminiServerStatus {
    return this.serverStatus;
  }

  public isConfigured(): boolean {
    return this.serverStatus.configured;
  }

  /**
   * Request task decomposition from the secure server-side Gemini 3.8 Flash endpoint.
   * If server is unconfigured, returns null to trigger local engine fallback.
   */
  public async planTaskWithServer(
    command: string,
    language: 'hi' | 'en' = 'hi'
  ): Promise<GeminiPlanResult | null> {
    if (typeof window === 'undefined') return null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000);
      const res = await fetch(buildApiUrl('/api/gemini/plan'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, language }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      if (data.configured && data.success && data.plan) {
        return data.plan as GeminiPlanResult;
      }
    } catch (err) {
      console.warn('Server Gemini plan request failed or timed out:', err);
    }

    return null;
  }

  /**
   * Request direct chat response from the secure server-side Gemini 3.8 Flash endpoint.
   */
  public async chatWithServer(
    message: string,
    language: 'hi' | 'en' = 'hi'
  ): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000);
      const res = await fetch(buildApiUrl('/api/gemini/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, language }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      if (data.configured && data.success && data.reply) {
        return data.reply as string;
      }
    } catch (err) {
      console.warn('Server Gemini chat request failed or timed out:', err);
    }

    return null;
  }
}

export const geminiAdapter = new GeminiArchitectureAdapter();
