import { PDFParse } from "pdf-parse";

export async function extractSourceText(file?: Express.Multer.File, fallback = "") {
  if (!file) return fallback;

  if (file.mimetype === "text/plain") {
    return file.buffer.toString("utf8").slice(0, 18000);
  }

  if (file.mimetype === "application/pdf") {
    const parser = new PDFParse({ data: file.buffer });
    try {
      const parsed = await parser.getText();
      return parsed.text.trim().slice(0, 18000) || fallback;
    } finally {
      await parser.destroy();
    }
  }

  if (file.mimetype.startsWith("image/")) {
    return describeImage(file, fallback);
  }

  return fallback;
}

async function describeImage(file: Express.Multer.File, fallback: string) {
  if (!process.env.GROQ_API_KEY) {
    return fallback || `Uploaded image: ${file.originalname}`;
  }

  const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.GROQ_VISION_MODEL ?? "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the tutorial/worksheet content from this image. Preserve numbered questions, formulas, diagrams described in words, and topic names. Return plain text only."
            },
            { type: "image_url", image_url: { url: dataUrl } }
          ]
        }
      ],
      temperature: 0.1
    })
  });

  if (!response.ok) {
    return fallback || `Uploaded image: ${file.originalname}`;
  }

  const completion = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return completion.choices?.[0]?.message?.content?.slice(0, 18000) || fallback;
}
