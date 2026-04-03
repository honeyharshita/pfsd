import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export function hasGeminiKey() {
  return Boolean(API_KEY?.trim());
}

export async function invokeGemini({ prompt, mimeType = null, imageData = null }) {
  if (!genAI) {
    throw new Error('Gemini API key not configured');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let result;
    if (imageData && mimeType) {
      // Vision request with image
      result = await model.generateContent([
        {
          inlineData: {
            mimeType,
            data: imageData // expects base64
          }
        },
        prompt
      ]);
    } else {
      // Text-only request
      result = await model.generateContent(prompt);
    }

    const responseText = result.response.text();
    console.log('[Gemini] model=gemini-1.5-flash promptLen=%d responseLen=%d', prompt.length, responseText.length);
    return responseText;
  } catch (error) {
    console.error('[Gemini Error]', error.message);
    throw error;
  }
}

export async function invokeGeminiJSON({ prompt, mimeType = null, imageData = null }) {
  if (!genAI) {
    throw new Error('Gemini API key not configured');
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash'
    });

    const jsonPrompt = `${prompt}\n\nRespond with ONLY valid JSON, no markdown or explanations.`;

    let result;
    if (imageData && mimeType) {
      result = await model.generateContent([
        {
          inlineData: {
            mimeType,
            data: imageData
          }
        },
        jsonPrompt
      ]);
    } else {
      result = await model.generateContent(jsonPrompt);
    }

    const responseText = result.response.text();
    try {
      return JSON.parse(responseText);
    } catch {
      console.warn('[Gemini] Parsed response not JSON, returning as text');
      return { response: responseText };
    }
  } catch (error) {
    console.error('[Gemini JSON Error]', error.message);
    throw error;
  }
}
