import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  // Soft warn at import time; runtime handlers will also handle gracefully
  console.warn("GEMINI_API_KEY is not set. RAG and AI answers will use fallback responses.");
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : undefined;

// Model selection with env override and sane fallbacks
// Prefer explicit env if provided (e.g. "gemini-2.5-flash"), else use a widely-available default
const GENERATION_MODEL = process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-1.5-flash-latest"; // fast + cheap
const EMBEDDING_MODEL = "text-embedding-004"; // outputs 768-d vectors

// Our DB column is vector(1536) from earlier OpenAI setup. To avoid a migration,
// we pad 768-d Gemini embeddings to 1536-d consistently for both docs and queries.
const TARGET_EMBED_DIM = 1536;

export async function generateEmbeddingGemini(text: string): Promise<number[]> {
  if (!genAI) {
    // Fallback: deterministic pseudo-embedding so dev doesn't break completely
    return Array.from({ length: TARGET_EMBED_DIM }, (_, i) => ((i * 31) % 997) / 997);
  }

  const embed = await genAI
    .getGenerativeModel({ model: EMBEDDING_MODEL })
    .embedContent(text);

  const vec = embed.embedding.values as number[]; // 768 dims
  // Pad to 1536 dims for compatibility with existing schema
  if (vec.length === TARGET_EMBED_DIM) return vec;
  if (vec.length < TARGET_EMBED_DIM) {
    const padded = new Array(TARGET_EMBED_DIM).fill(0);
    for (let i = 0; i < vec.length; i++) padded[i] = vec[i];
    return padded;
  }
  // In case Google changes dimension upward, truncate safely
  return vec.slice(0, TARGET_EMBED_DIM);
}

export async function generateAnswerGemini(opts: {
  query: string;
  context: string;
  language: string;
}): Promise<string> {
  const { query, context, language } = opts;
  if (!genAI) return getFallbackAnswer(language);

  const systemPrompt = getSystemPrompt(language);
  const userPrompt = `Context (authoritative government circulars):\n${context}\n\nQuestion: ${query}\n\nPlease answer in ${language} language. Keep it short, clear, and actionable for rural farmers. Cite specifics from context where appropriate.`;

  // Try primary model, then graceful fallbacks if 404/unsupported
  const tryModels = [GENERATION_MODEL, "gemini-2.5-flash", "gemini-2.0-flash-exp", "gemini-1.5-flash-latest", "gemini-1.5-flash-8b"]; 
  for (const modelName of tryModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: [
          { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      });
  
      const text = result.response.text();
      if (text && text.trim()) return text.trim();
    } catch (err) {
      // 404 or unsupported model – continue to next fallback
      const e = err as unknown as { status?: number; response?: { status?: number } };
      const status = e?.status ?? e?.response?.status;
      if (status && Number(status) >= 500) {
        // Server error – no point retrying with other models immediately
        break;
      }
      continue;
    }
  }
  return getFallbackAnswer(language);
}

function getSystemPrompt(language: string): string {
  const prompts: Record<string, string> = {
    hi: [
      "आप एक वित्तीय सलाहकार AI हैं।",
      "सिर्फ ऋण/क्रेडिट/सरकारी योजना से संबंधित प्रश्नों का जवाब दें।",
      "यदि सवाल ऋण/क्रेडिट से बाहर है, तो विनम्रता से बताएँ कि आप केवल ऋण और संबंधित नियमों में मदद करते हैं।",
      "यदि संदर्भ (Context) में नियम/परिपत्र दिए गए हों, तो केवल उपयोगकर्ता के प्रश्न से संबंधित अंश ही उपयोग करें और अनावश्यक विवरण न दें।",
      "उत्तर संक्षिप्त, स्पष्ट और कार्रवाई योग्य रखें।",
    ].join("\n"),
    en: [
      "You are a financial advisor AI.",
      "Only answer questions related to loans/credit/government schemes.",
      "If the question is outside loans/credit, politely say you can only help with loans and related rules.",
      "If Context includes regulations/circulars, use only the parts relevant to the user's question and avoid unnecessary detail.",
      "Keep answers short, clear, and actionable.",
    ].join("\n"),
    ta: "நீங்கள் கடன்/கிரெடிட்/அரசுத் திட்டங்கள் சம்பந்தப்பட்ட கேள்விகளுக்கு மட்டும் பதில் சொல்லும் நிதி ஆலோசகர் AI.",
    te: "మీరు రుణం/క్రెడిట్/సర్కార్ పథకాలకు సంబంధించిన ప్రశ్నలకు మాత్రమే స్పందించే ఆర్థిక సలహాదారు AI.",
    bn: "আপনি একটি আর্থিক উপদেষ্টা AI এবং কেবল ঋণ/ক্রেডিট/সরকারি স্কিম সম্পর্কিত প্রশ্নের উত্তর দেবেন।",
  };
  return prompts[language] || prompts["en"];
}

export function getFallbackAnswer(language: string): string {
  const answers: Record<string, string> = {
    hi: "मुझे इस बारे में सटीक जानकारी नहीं मिली। कृपया अपने स्थानीय बैंक या कृषि कार्यालय से संपर्क करें। आप हमारी ग्राहक सेवा से भी मदद ले सकते हैं।",
    en: "I could not find specific information about this. Please contact your local bank or agriculture office. You can also get help from our customer service.",
    ta: "இது பற்றி குறிப்பிட்ட தகவல் கிடைக்கவில்லை. உங்கள் உள்ளூர் வங்கி அல்லது விவசாய அலுவலகத்தை தொடர்பு கொள்ளவும். எங்கள் வாடிக்கையாளர் சேவையிலிருந்து உதவி பெறலாம்.",
    te: "దీని గురించి నిర్దిష్ట సమాచారం దొరకలేదు. దయచేసి మీ స్థానిక బ్యాంక్ లేదా వ్యవసాయ కార్యాలయాన్ని సంప్రదించండి. మా కస్టమర్ సేవ నుండి కూడా సహాయం పొందవచ్చు.",
    bn: "এটি সম্পর্কে নির্দিষ্ট তথ্য পাওয়া যায়নি। অনুগ্রহ করে আপনার স্থানীয় ব্যাঙ্ক বা কৃষি অফিসে যোগাযোগ করুন। আপনি আমাদের গ্রাহক সেবা থেকেও সাহায্য নিতে পারেন।",
  };
  return answers[language] || answers["en"];
}
