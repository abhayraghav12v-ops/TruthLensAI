import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const BASE = 'https://api.sightengine.com/1.0';

function creds() {
  const api_user = process.env.SIGHTENGINE_API_USER;
  const api_secret = process.env.SIGHTENGINE_API_SECRET;
  if (!api_user || !api_secret) {
    const err = new Error('Sightengine API credentials are not configured');
    err.status = 500;
    err.code = 'MISSING_CREDENTIALS';
    throw err;
  }
  return { api_user, api_secret };
}

async function postForm(url, form, timeout = 120000) {
  try {
    const { data } = await axios.post(url, form, {
      headers: form.getHeaders(),
      timeout,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    if (data?.status === 'failure') {
      const err = new Error(data?.error?.message || 'Sightengine API failure');
      err.status = 502;
      err.code = 'SIGHTENGINE_ERROR';
      err.details = data;
      throw err;
    }
    return data;
  } catch (e) {
    if (e.code === 'SIGHTENGINE_ERROR' || e.code === 'MISSING_CREDENTIALS') throw e;
    const err = new Error(
      e.response?.data?.error?.message || e.message || 'Sightengine API request failed',
    );
    err.status = e.response?.status || 502;
    err.code = 'SIGHTENGINE_ERROR';
    err.details = e.response?.data;
    throw err;
  }
}

/** Image: check.json with models=genai,deepfake */
export async function analyzeImage(filePath, originalName) {
  const { api_user, api_secret } = creds();
  const form = new FormData();
  form.append('media', fs.createReadStream(filePath), originalName);
  form.append('models', 'genai,deepfake');
  form.append('api_user', api_user);
  form.append('api_secret', api_secret);
  return postForm(`${BASE}/check.json`, form);
}

/** Video: sync endpoint with genai + deepfake (short clips) */
export async function analyzeVideo(filePath, originalName) {
  const { api_user, api_secret } = creds();
  const form = new FormData();
  form.append('media', fs.createReadStream(filePath), originalName);
  form.append('models', 'genai,deepfake');
  form.append('api_user', api_user);
  form.append('api_secret', api_secret);
  return postForm(`${BASE}/video/check-sync.json`, form, 180000);
}

/** Audio: AI speech detection */
export async function analyzeAudio(filePath, originalName) {
  const { api_user, api_secret } = creds();
  const form = new FormData();
  form.append('audio', fs.createReadStream(filePath), originalName);
  form.append('models', 'ai_speech');
  form.append('api_user', api_user);
  form.append('api_secret', api_secret);
  return postForm(`${BASE}/audio/check.json`, form);
}

const GENERATOR_LABELS = {
  dalle: 'DALL-E',
  firefly: 'Firefly',
  flux: 'Flux',
  gan: 'GAN',
  gpt: 'GPT image',
  higgsfield: 'Higgsfield',
  ideogram: 'Ideogram',
  kling: 'Kling',
  imagen: 'Imagen',
  midjourney: 'Midjourney',
  qwen: 'Qwen',
  recraft: 'Recraft',
  reve: 'Reve',
  seedream: 'Seedream',
  stable_diffusion: 'Stable Diffusion',
  wan: 'Wan',
  z_image: 'Z-image',
  other: 'Other AI generator',
  sora: 'Sora',
  veo: 'Veo',
  runway: 'Runway',
  pika: 'Pika',
  hailuo: 'Hailuo',
  hunyuan: 'Hunyuan',
  seedance: 'Seedance',
};

/**
 * Extract a 0–1 probability and human-readable flags from a Sightengine response.
 */
export function extractScoreAndFlags(data, mediaType) {
  let probability = 0;
  const flags = [];
  const FLAG_THRESHOLD = 0.4;

  // Image response: type.ai_generated, type.deepfake, type.ai_generators
  if (mediaType === 'image') {
    const type = data?.type || {};
    const aiGen = Number(type.ai_generated) || 0;
    const deepfake = Number(type.deepfake) || 0;
    probability = Math.max(aiGen, deepfake);

    if (aiGen >= FLAG_THRESHOLD) {
      flags.push('AI-generated image signature detected');
    }
    if (deepfake >= FLAG_THRESHOLD) {
      flags.push('Deepfake face swap detected');
    }

    const generators = type.ai_generators || {};
    for (const [key, val] of Object.entries(generators)) {
      if (Number(val) >= FLAG_THRESHOLD) {
        const label = GENERATOR_LABELS[key] || key;
        flags.push(`${label} fingerprint detected`);
      }
    }
  }

  // Video sync response: data.frames[].type
  if (mediaType === 'video') {
    const frames = data?.data?.frames || [];
    let maxAi = 0;
    let maxDeepfake = 0;
    const genMax = {};

    for (const frame of frames) {
      const type = frame?.type || {};
      maxAi = Math.max(maxAi, Number(type.ai_generated) || 0);
      maxDeepfake = Math.max(maxDeepfake, Number(type.deepfake) || 0);
      const generators = type.ai_generators || {};
      for (const [key, val] of Object.entries(generators)) {
        genMax[key] = Math.max(genMax[key] || 0, Number(val) || 0);
      }
    }

    // Fallback if top-level type exists
    if (!frames.length && data?.type) {
      maxAi = Number(data.type.ai_generated) || 0;
      maxDeepfake = Number(data.type.deepfake) || 0;
    }

    probability = Math.max(maxAi, maxDeepfake);

    if (maxAi >= FLAG_THRESHOLD) flags.push('AI-generated video content detected');
    if (maxDeepfake >= FLAG_THRESHOLD) flags.push('Deepfake face manipulation detected');
    for (const [key, val] of Object.entries(genMax)) {
      if (val >= FLAG_THRESHOLD) {
        flags.push(`${GENERATOR_LABELS[key] || key} fingerprint detected`);
      }
    }
  }

  // Audio: type.ai_speech
  if (mediaType === 'audio') {
    const type = data?.type || {};
    const aiSpeech = Number(type.ai_speech) || 0;
    probability = aiSpeech;

    if (aiSpeech >= FLAG_THRESHOLD) {
      flags.push('AI-generated speech detected');
    }
    if (aiSpeech >= 0.7) {
      flags.push('Voice clone signature');
    }

    const generators = type.ai_speech_generators || type.ai_generators || {};
    for (const [key, val] of Object.entries(generators)) {
      if (Number(val) >= FLAG_THRESHOLD) {
        flags.push(`${GENERATOR_LABELS[key] || key} voice signature`);
      }
    }
  }

  // Deduplicate flags, cap at 5
  const unique = [...new Set(flags)].slice(0, 5);
  return { probability, flags: unique };
}
