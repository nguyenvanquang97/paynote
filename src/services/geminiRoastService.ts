import type {BudgetAlertThreshold} from '../app/store';
import {buildFallbackRoastMessage} from './roastFallbackTemplates';

type AiToneMode = 'gentle' | 'cute' | 'sarcastic_strong' | 'angry';

interface RoastInput {
  apiKey: string;
  categoryId: string;
  categoryLabel: string;
  spent: number;
  limit: number;
  progress: number;
  threshold: BudgetAlertThreshold;
  monthKey: string;
  toneMode?: AiToneMode;
}

export interface RoastOutput {
  title: string;
  message: string;
  toneTag: AiToneMode;
  fallbackUsed: boolean;
  debugReason?: string;
}

const MODEL = 'gemini-2.5-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
let hasWarnedDirectKey = false;

const clampText = (text: string, max = 160): string => {
  const s = text.replace(/\s+/g, ' ').trim();
  if (s.length <= max) {return s;}
  return `${s.slice(0, max - 1).trim()}…`;
};

const formatCurrency = (amount: number): string =>
  `${new Intl.NumberFormat('vi-VN').format(Math.max(0, Math.round(amount)))} ₫`;

const fallbackTemplate = (input: RoastInput, debugReason: string): RoastOutput => {
  const percent = Math.round(input.progress * 100);
  const tone = input.toneMode || 'sarcastic_strong';
  const message = buildFallbackRoastMessage(tone, {
    categoryLabel: input.categoryLabel,
    percent,
    spentText: formatCurrency(input.spent),
    limitText: formatCurrency(input.limit),
    threshold: input.threshold,
  });
  return {
    title: 'Cảnh báo AI chi tiêu',
    message: clampText(`${message} (${formatCurrency(input.spent)} / ${formatCurrency(input.limit)})`),
    toneTag: tone,
    fallbackUsed: true,
    debugReason,
  };
};

const buildPrompt = (input: RoastInput): string => {
  const percent = Math.round(input.progress * 100);
  const toneMode = input.toneMode || 'sarcastic_strong';
  const toneInstruction =
    toneMode === 'gentle'
      ? 'Giọng nhẹ nhàng, đồng cảm, khích lệ.'
      : toneMode === 'cute'
        ? 'Giọng dễ thương, dí dỏm, ngắn gọn.'
        : toneMode === 'angry'
          ? 'Giọng cáu gắt rất mạnh, xưng tao-mày, mắng thẳng như người thật, câu dài hơn và có sức nặng nhưng không chửi bậy.'
          : 'Giọng xéo xắc mạnh, nói thẳng kiểu người thật, có chút châm biếm sâu cay nhưng văn minh.';
  return [
    'Bạn là trợ lý tài chính nói tiếng Việt.',
    `Tone: ${toneInstruction}`,
    'BẮT BUỘC:',
    '- Không chửi thề, không xúc phạm nhân phẩm, không body-shaming, không công kích cá nhân.',
    '- Không khuyến khích tự hại, không đe dọa.',
    '- Chỉ 1-2 câu ngắn, tự nhiên như người nói thật; nêu rõ hậu quả tài chính nếu tiếp tục tiêu quá tay.',
    `- Trả về JSON hợp lệ: {"title":"...","message":"...","toneTag":"${toneMode}"}`,
    `Dữ liệu: danh_muc=${input.categoryLabel}, monthKey=${input.monthKey}, nguong=${input.threshold}%, da_chi=${formatCurrency(input.spent)}, han_muc=${formatCurrency(input.limit)}, ty_le=${percent}%`,
  ].join('\n');
};

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs: number) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {...init, signal: controller.signal});
  } finally {
    clearTimeout(timer);
  }
};

const parseGeminiText = (payload: any): string => {
  return payload?.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

const parseOutput = (text: string): RoastOutput | null => {
  const raw = text.trim();
  if (!raw) {return null;}
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const candidate = jsonMatch ? jsonMatch[0] : raw;
  try {
    const parsed = JSON.parse(candidate);
    if (typeof parsed?.title !== 'string' || typeof parsed?.message !== 'string') {
      return null;
    }
    return {
      title: clampText(parsed.title, 48) || 'Cảnh báo AI chi tiêu',
      message: clampText(parsed.message, 170),
      toneTag: parsed?.toneTag === 'gentle' || parsed?.toneTag === 'cute' || parsed?.toneTag === 'angry' || parsed?.toneTag === 'sarcastic_strong' || parsed?.toneTag === 'strict'
        ? (parsed.toneTag === 'strict' ? 'angry' : parsed.toneTag)
        : 'sarcastic_strong',
      fallbackUsed: false,
    };
  } catch {
    return null;
  }
};

export const generateBudgetRoast = async (input: RoastInput): Promise<RoastOutput> => {
  if (!input.apiKey.trim()) {
    return fallbackTemplate(input, 'missing_api_key');
  }
  if (__DEV__ && !hasWarnedDirectKey) {
    hasWarnedDirectKey = true;
    console.warn('Gemini direct API key mode is for internal demo only. Use backend proxy for production.');
  }

  const body = {
    contents: [{parts: [{text: buildPrompt(input)}]}],
    generationConfig: {
      temperature: 0.85,
      topP: 0.92,
      maxOutputTokens: 180,
    },
  };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        `${GEMINI_URL}?key=${encodeURIComponent(input.apiKey.trim())}`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(body),
        },
        8500,
      );
      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch {
          errorText = '';
        }
        console.warn('Gemini roast non-OK response', {
          status: response.status,
          model: MODEL,
          body: errorText.slice(0, 300),
        });
        if (attempt === 0 && (response.status === 429 || response.status >= 500)) {continue;}
        return fallbackTemplate(input, `http_${response.status}`);
      }
      const payload = await response.json();
      const text = parseGeminiText(payload);
      const parsed = parseOutput(text);
      if (parsed) {return parsed;}
      console.warn('Gemini roast parse failed', {model: MODEL, text: String(text).slice(0, 300)});
      if (attempt === 1) {
        return fallbackTemplate(input, 'parse_failed');
      }
    } catch (error) {
      if (attempt === 0) {continue;}
      console.warn('Gemini roast failed, fallback used', error);
      return fallbackTemplate(input, 'network_or_timeout');
    }
  }

  return fallbackTemplate(input, 'unknown');
};
