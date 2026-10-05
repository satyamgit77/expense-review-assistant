const logger = require('../utils/logger');
const PROVIDER = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
const MODEL = process.env.AI_MODEL || 'gemini-flash-latest';
const CONFIDENCE_THRESHOLD = Number(process.env.AI_CONFIDENCE_THRESHOLD) || 0.75;


let geminiClient = null;
let anthropicClient = null;

const generateWithGemini = async ({ system, prompt, json }) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in .env');
  }
  if (!geminiClient) {
    const { GoogleGenAI } = require('@google/genai');
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  const response = await geminiClient.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction: system,
      temperature: 0.3,
      ...(json ? { responseMimeType: 'application/json' } : {}),
    },
  });
  return response.text;
};

const generateWithAnthropic = async ({ system, prompt }) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set in .env');
  }
  if (!anthropicClient) {
    const Anthropic = require('@anthropic-ai/sdk');
    const Client = Anthropic.default || Anthropic;
    anthropicClient = new Client({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  const response = await anthropicClient.messages.create({
    model: MODEL,
    max_tokens: 1000,
    system,
    messages: [{ role: 'user', content: prompt }],
  });
  return response.content[0].text;
};

const generateOnce = async ({ system = '', prompt, json = false }) => {
  if (PROVIDER === 'gemini') return generateWithGemini({ system, prompt, json });
  if (PROVIDER === 'anthropic') return generateWithAnthropic({ system, prompt, json });
  throw new Error(`Unknown AI_PROVIDER: ${PROVIDER}`);
};

// Temporary errors (overload, rate limit, server error) par dobara try karna
const isRetryable = (error) => {
  const code = Number(error.status || error.code);
  if ([429, 500, 503, 504].includes(code)) return true;
  return /\b(429|500|503|504)\b|UNAVAILABLE|overloaded/i.test(error.message || '');
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const MAX_ATTEMPTS = 3;

// Baaki poora app sirf isi function ko call karega
const generateText = async (options) => {
  const { operation = 'generate', log = logger, ...request } = options;
  const started = Date.now();
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const attemptStart = Date.now();
    try {
      const text = await generateOnce(request);
      log.info('ai_call_succeeded', {
        operation,
        provider: PROVIDER,
        model: MODEL,
        attempt,
        latencyMs: Date.now() - attemptStart,
        totalMs: Date.now() - started,
        outputChars: text ? text.length : 0,
      });
      return text;
    } catch (error) {
      lastError = error;
      const willRetry = isRetryable(error) && attempt < MAX_ATTEMPTS;
      const retryInMs = 1000 * 2 ** (attempt - 1); // 1s, 2s

      log[willRetry ? 'warn' : 'error'](willRetry ? 'ai_call_retrying' : 'ai_call_failed', {
        operation,
        provider: PROVIDER,
        model: MODEL,
        attempt,
        latencyMs: Date.now() - attemptStart,
        status: error.status || error.code,
        error: String(error.message).slice(0, 300),
        ...(willRetry ? { retryInMs } : {}),
      });

      if (!willRetry) break;
      await sleep(retryInMs);
    }
  }

  throw lastError;
};

module.exports = { generateText, PROVIDER, MODEL, CONFIDENCE_THRESHOLD };













// const Anthropic = require('@anthropic-ai/sdk');

// const Client = Anthropic.default || Anthropic;

// const MODEL = process.env.AI_MODEL || 'claude-haiku-4-5-20251001';
// const CONFIDENCE_THRESHOLD = Number(process.env.AI_CONFIDENCE_THRESHOLD) || 0.75;

// let client = null;

// // Client tab banta hai jab pehli baar zaroorat padti hai,
// // taaki key na ho to poora server na ruke
// const getClient = () => {
//   if (!process.env.ANTHROPIC_API_KEY) {
//     throw new Error('ANTHROPIC_API_KEY is not set in .env');
//   }
//   if (!client) {
//     client = new Client({ apiKey: process.env.ANTHROPIC_API_KEY });
//   }
//   return client;
// };

// module.exports = { getClient, MODEL, CONFIDENCE_THRESHOLD };

