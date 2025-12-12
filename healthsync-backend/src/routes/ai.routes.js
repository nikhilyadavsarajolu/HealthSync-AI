const express = require("express");
const multer = require("multer");
const fs = require("fs");
const auth = require("../middleware/auth");
const geminiModel = require("../config/gemini");

const router = express.Router();

// store uploaded images temporarily
const upload = multer({ dest: "uploads/" });

// Helper: strip fences / markdown and try to extract a JSON object substring
function extractJsonString(raw) {
  if (!raw || typeof raw !== "string") return null;
  let s = raw.trim();

  // Remove common fenced code blocks: ```json ... ``` or ``` ... ```
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  // Remove single backticks wrapping
  s = s.replace(/^`/, "").replace(/`$/, "");

  // If still has leading text before `{`, find first { and last } and slice
  const firstBrace = s.indexOf("{");
  const lastBrace = s.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return s.slice(firstBrace, lastBrace + 1).trim();
  }

  // If it looks like JSON already, return it
  return s;
}

// Helper: robust parse with fallback attempt to pull the first {...} group
function safeParseJson(raw) {
  const cleaned = extractJsonString(raw);
  if (!cleaned) throw new Error("No JSON-like content found in model response");

  // Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Try regex to find first {...} block
    const m = cleaned.match(/(\{[\s\S]*\})/);
    if (m && m[1]) {
      try {
        return JSON.parse(m[1]);
      } catch (_) {
        // fallthrough
      }
    }
    throw new Error("JSON parse failed after cleaning: " + err.message);
  }
}

// Build a strict prompt (no markdown, return only JSON)
function buildPrompt() {
  return [
    "You are an extractor that MUST return only valid JSON and nothing else. DO NOT include any markdown, code fences, backticks, or any explanation.",
    "Return EXACTLY one JSON object matching this schema (keys only):",
    '{"name": string | null, "strength": string | null, "expiry": "YYYY-MM-DD" | null, "brand": string | null}',
    "If a field cannot be read or is missing, set it to null.",
    "Respond ONLY with the JSON object, nothing else. Example of correct output (do NOT wrap in backticks):",
    '{"name":"Paracetamol","strength":"500 mg","expiry":"2024-07-31","brand":"PARACIP-500"}'
  ].join("\n");
}

router.post("/scan-medicine", auth, upload.single("image"), async (req, res) => {
  let imagePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");

    // First prompt (polite)
    const prompt = `
Extract the following information from the medicine strip or box image and return STRICT JSON (no markdown, no text):

{"name": string | null, "strength": string | null, "expiry": "YYYY-MM-DD" | null, "brand": string | null}

If a field cannot be read, set it to null.
    `.trim();

    // function to call Gemini (adjust options according to your gemini client)
    async function callGemini(promptText) {
      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              { text: promptText },
              {
                inlineData: {
                  mimeType: req.file.mimetype || "image/jpeg",
                  data: base64Image,
                },
              },
            ],
          },
        ],
        // model-level options (if supported by your wrapper)
        // the exact location of temperature options depends on your gemini client.
        // try passing temperature at top-level if your config supports it.
      };

      const result = await geminiModel.generateContent(payload);
      // result.response.text() should return the text output (depends on SDK)
      const text = typeof result?.response?.text === "function" ? result.response.text() : String(result?.response || "");
      return text;
    }

    // TRY 1: call gemini with the normal prompt
    let rawText = null;
    try {
      rawText = await callGemini(prompt);
    } catch (gErr) {
      console.error("Gemini API error (first attempt):", gErr?.message || gErr);
      rawText = null;
    }

    let parsed = null;
    if (rawText) {
      try {
        parsed = safeParseJson(rawText);
      } catch (parseErr) {
        console.warn("First parse failed:", parseErr.message);
        // keep rawText for logging and retry
      }
    }

    // If parse failed, retry once with a stricter ONLY JSON prompt
    if (!parsed) {
      try {
        const strictPrompt = buildPrompt();
        const rawText2 = await callGemini(strictPrompt);
        // try parse
        try {
          parsed = safeParseJson(rawText2);
          rawText = rawText2; // swap to latest raw for logging/return
        } catch (parseErr2) {
          console.warn("Second parse failed:", parseErr2.message);
          // keep parsed null; we'll fallback
          // but log first 1000 chars of raw responses for debugging
          console.error("Gemini raw (first attempt, first 1000 chars):", (rawText || "").slice(0, 1000));
          console.error("Gemini raw (second attempt, first 1000 chars):", (rawText2 || "").slice(0, 1000));
        }
      } catch (retryErr) {
        console.error("Gemini API error (retry):", retryErr?.message || retryErr);
      }
    }

    // cleanup temp file
    if (imagePath) {
      try { fs.unlinkSync(imagePath); } catch (_) {}
      imagePath = null;
    }

    // If AI failed or response invalid, use a fallback structure with nulls
    if (!parsed) {
      parsed = { name: null, strength: null, expiry: null, brand: null };
    }

    const source = parsed && parsed.name ? "gemini" : "fallback";

    return res.json({
      success: true,
      source,
      data: parsed,
      raw: typeof rawText === "string" ? rawText.slice(0, 2000) : undefined, // include truncated raw output for debugging in dev
    });
  } catch (err) {
    console.error("AI scan error (wrapper):", err?.message || err);
    return res.status(500).json({ message: "Error scanning medicine" });
  } finally {
    // ensure cleanup if something threw before we removed file
    if (imagePath) {
      try { fs.unlinkSync(imagePath); } catch (_) {}
    }
  }
});

module.exports = router;
