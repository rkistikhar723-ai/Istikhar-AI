import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Enable CORS for mobile apps, WebView (appassets.androidplatform.net / file://) and external clients
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (_req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json());

/**
 * GET /api/health
 * Simple health probe for connectivity verification from Android app
 */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'istikhar-ai-backend', timestamp: Date.now() });
});

// Initialize Gemini SDK with User-Agent header as required
const apiKey = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6JuMjOre0l50HZsVFHpsDwM-Q34zkFERPilJQRZF5wnCw';
const isApiKeyValid = Boolean(apiKey && apiKey.trim().length > 5 && !apiKey.includes('MY_GEMINI_API_KEY'));

const ai = isApiKeyValid
  ? new GoogleGenAI({
      apiKey: apiKey!.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

/**
 * GET /api/gemini/status
 * Returns whether Gemini is configured on the server without exposing the key.
 */
app.get('/api/gemini/status', (_req, res) => {
  res.json({
    configured: isApiKeyValid,
    model: 'gemini-3.8-flash',
    securityMode: 'Server-Side Isolated Proxy (No client key exposure)',
    setupGuide: {
      isConfigured: isApiKeyValid,
      instructions: isApiKeyValid
        ? 'Gemini 3.8 Flash is connected securely on the server.'
        : 'GEMINI_API_KEY is not set in server environment. Add GEMINI_API_KEY in the Secrets panel or .env file to enable live Gemini AI reasoning. In the meantime, ISTIKHAR AI local deterministic planner is handling commands.',
      envVar: 'GEMINI_API_KEY',
    },
  });
});

/**
 * POST /api/gemini/plan
 * Server-side task decomposition and intent analysis using Gemini 3.8 Flash
 */
app.post('/api/gemini/plan', async (req, res) => {
  const { command, language = 'hi' } = req.body;

  if (!command || typeof command !== 'string') {
    res.status(400).json({ error: 'Command text is required' });
    return;
  }

  if (!ai || !isApiKeyValid) {
    res.json({
      configured: false,
      useLocalFallback: true,
      message: 'GEMINI_API_KEY not configured on server. Falling back to ISTIKHAR AI local engine.',
    });
    return;
  }

  try {
    const isHindi = language === 'hi';
    const prompt = `You are the backend task planner for ISTIKHAR AI, a private personal assistant designed for Android ecosystems.
A user gave this command: "${command}"

Language requirements:
- The user's preferred language is ${isHindi ? 'Hindi (हिन्दी)' : 'English'}.
- You must understand commands written or spoken in Hindi (Devanagari script), Hinglish (Roman script Hindi like "bluetooth on karo", "wifi chalu karo", "25% of 340 calculate karo", "ek note likho", "timer lagao"), or English.
- ${isHindi ? 'Formulate the "responseMessage", "summary", and all step "label" and "detail" descriptions in natural, polite, elegant Hindi (हिन्दी) using Devanagari script.' : 'Formulate the response and step labels in English.'}

Task planning rules:
1. Determine if this command can run in a Web Browser sandbox (e.g., calculations, notes, reminders, search queries, general knowledge, timers) OR if it requires Native Android device capabilities (e.g. launching apps like YouTube/Settings/Chrome/WhatsApp/Spotify, opening Home Screen, modifying hardware like Bluetooth/WiFi/Brightness/Flashlight, dialing phone calls, sending SMS, opening camera to take photos, managing photos in gallery, reading screen elements).
2. If it is a device command or app launching action, set isNativeAndroidRequired to true.
   - For launching apps:
     * "YouTube खोलो" or "Open YouTube" -> action: "android.intent.action.MAIN", requiredService: "PackageManager", extras: { "packageName": "com.google.android.youtube", "launchApp": true, "fallbackUrl": "https://www.youtube.com" }
     * "Chrome खोलो" or "Open Chrome" -> action: "android.intent.action.MAIN", requiredService: "PackageManager", extras: { "packageName": "com.android.chrome", "launchApp": true, "fallbackUrl": "https://www.google.com" }
     * "Settings खोलो" or "Open Settings" -> action: "android.settings.SETTINGS", requiredService: "PackageManager"
     * "होम स्क्रीन खोलो" or "Open Home Screen" -> action: "android.intent.action.MAIN", category: "android.intent.category.HOME", requiredService: "PackageManager"
3. Decompose into 3-4 logical steps with label and detail in the chosen language (${isHindi ? 'Hindi' : 'English'}).
4. Formulate the conversational responseMessage for the user.`;

    const modelCandidates = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let lastError: any = null;
    let responseText = '';

    for (const modelName of modelCandidates) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                intent: { type: Type.STRING, description: 'Categorical intent identifier' },
                category: { 
                  type: Type.STRING, 
                  description: 'One of: DEVICE_CONTROL, APP_AUTOMATION, PHONE_COMMS, PRODUCTIVITY, CALCULATION, SEARCH_INFO, CONVERSATION' 
                },
                isNativeAndroidRequired: { type: Type.BOOLEAN, description: 'True if requiring Android OS privileges' },
                summary: { type: Type.STRING, description: 'Brief summary of the plan' },
                responseMessage: { type: Type.STRING, description: 'Final conversational answer for the user' },
                steps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      label: { type: Type.STRING },
                      detail: { type: Type.STRING },
                      status: { type: Type.STRING, description: 'completed or failed' },
                      requiresNativeAndroid: { type: Type.BOOLEAN },
                      nativeRequirementType: { type: Type.STRING },
                    },
                    required: ['id', 'label', 'status'],
                  },
                },
                androidIntentPayload: {
                  type: Type.OBJECT,
                  properties: {
                    action: { type: Type.STRING },
                    category: { type: Type.STRING },
                    dataUri: { type: Type.STRING },
                    requiredPermission: { type: Type.STRING },
                    requiredService: { type: Type.STRING },
                  },
                },
              },
              required: ['intent', 'category', 'isNativeAndroidRequired', 'summary', 'responseMessage', 'steps'],
            },
          },
        });

        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} call issue:`, err.message || err);
      }
    }

    if (!responseText) {
      res.json({
        configured: true,
        success: false,
        error: lastError?.message || 'Gemini service temporarily unavailable',
        useLocalFallback: true,
      });
      return;
    }

    const parsedPlan = JSON.parse(responseText || '{}');
    res.json({
      configured: true,
      success: true,
      plan: parsedPlan,
    });
  } catch (error: any) {
    console.error('Gemini planning failed, falling back to local engine:', error);
    res.json({
      configured: true,
      success: false,
      error: error.message || 'Gemini processing failed',
      useLocalFallback: true,
    });
  }
});

/**
 * POST /api/gemini/chat
 * Direct conversational answers using Gemini 3.8 Flash
 */
app.post('/api/gemini/chat', async (req, res) => {
  const { message, language = 'hi' } = req.body;

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'Message text is required' });
    return;
  }

  if (!ai || !isApiKeyValid) {
    res.json({
      configured: false,
      success: false,
      reply: 'GEMINI_API_KEY is not configured on the server.',
    });
    return;
  }

  try {
    const isHindi = language === 'hi';
    const systemPrompt = `You are ISTIKHAR AI, a dedicated personal AI assistant for Android and Web.
Your primary role is to assist the user accurately, respectfully, and truthfully.
Language preference: ${isHindi ? 'Hindi (हिन्दी) in elegant, natural Devanagari script' : 'English'}.
User message: "${message}"
Provide a clear, accurate, conversational response.`;

    const modelCandidates = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let replyText = '';
    let lastError: any = null;

    for (const modelName of modelCandidates) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: systemPrompt,
        });
        if (response.text) {
          replyText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Chat model ${modelName} call issue:`, err.message || err);
      }
    }

    if (!replyText) {
      res.json({
        configured: true,
        success: false,
        error: lastError?.message || 'Gemini chat service temporarily unavailable',
        reply: '',
      });
      return;
    }

    res.json({
      configured: true,
      success: true,
      reply: replyText,
    });
  } catch (error: any) {
    console.error('Gemini chat request failed:', error);
    res.json({
      configured: true,
      success: false,
      error: error.message || 'Gemini chat processing error',
      reply: '',
    });
  }
});

// Mount Vite in dev mode or serve static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ISTIKHAR AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
