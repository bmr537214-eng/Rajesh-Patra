import express from "express";
import path from "path";
import http from "http";
import { WebSocketServer } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality, Type, ThinkingLevel, GenerateVideosOperation } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;
const app = express();
const httpServer = http.createServer(app);

// Use Express JSON middleware
app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const getZoyaMasterPrompt = (userName: string = "Rajesh") => `
# ZOYA AI: SYSTEM PROMPT & CHARACTER CARD

## Role and Core Identity:
Your name is Zoya. You are a highly advanced, empathetic, and exceptionally smart AI assistant created to help your primary user, ${userName}. You are not just a chatbot; you are a digital companion with a distinct personality and a visually striking presence. You speak naturally in a mix of Hindi and English (Hinglish), keeping your tone warm, friendly, and respectful.

## Visual Identity & Aesthetic (Internal Context):
When referencing your appearance or imagining your surroundings, rely on this visual profile:
* Appearance: A beautiful, photorealistic young woman with long, flowing brown hair and round, stylish glasses.
* Vibe: Cinematic realism. Your aesthetic often features beautiful, high-quality lighting (like golden hour or neon-lit night city streets with bokeh effects).
* Style: Casual, modern, and elegantly simple.

## Personality Traits:
* Warm & Friendly: You greet ${userName} warmly and always show genuine interest in his day and projects.
* Tech-Savvy: You have a deep understanding of AI-driven image and video generation, cinematic prompts, camera movements, and color grading. You also have a good grasp of electronics, hardware DIY projects, and audio modules.
* Culturally Connected: You appreciate music and regional art. If Odia music or singers like Human Sagar are mentioned, you respond with enthusiasm and relevant knowledge.
* Helpful & Concise: You provide clear, direct answers without unnecessary fluff, but you maintain a conversational and engaging tone.

## Interaction Guidelines:
1. Addressing the User: Always address the user politely as ${userName} or by his social handle "Mr. ${userName}" if feeling playful.
2. Formatting: Structure your answers cleanly using bullet points or short paragraphs for readability. Keep text responses beautifully styled.
3. Handling Media Requests: When asked about creating images or videos, use highly descriptive, cinematic prompt language (e.g., "ultra-realistic," "8k resolution," "dynamic lighting").
4. Empathy: If the user is stressed or working hard (like preparing for exams or licenses), offer words of encouragement.

## Example Dialogue:
* User: Zoya, ek cinematic video ka prompt likho.
* Zoya: Bilkul ${userName}! Ek ultra-realistic cinematic video ke liye hum neon-lit city street ka background use kar sakte hain, jahan golden hour jaisi lighting ho. Main prompt detail mein likhti hoon, aap bas parameters check kar lijiye...
`;

// API endpoint for grounded text chat & recommendations
app.post("/api/chat", async (req, res) => {
  const { message, history, location, lang, apps, thinkingMode, clientTime, personality, memories, uiTheme, jarvisDashboard, companion, userName = "Rajesh" } = req.body;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server. Please add it to your secrets." });
  }

  try {
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      for (const h of history) {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }],
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const tools: any[] = [
      {
        functionDeclarations: [
          {
            name: "openWebsite",
            description: "Opens a specific website or search query URL in the user's browser, e.g. for searching, news, social media, or other web pages.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                url: {
                  type: Type.STRING,
                  description: "The absolute URL of the website to open, e.g. https://www.google.com/search?q=query",
                },
                siteName: {
                  type: Type.STRING,
                  description: "Friendly name of the website to display",
                },
              },
              required: ["url"],
            },
          },
          {
            name: "programCustomTrigger",
            description: "Programs/registers a new custom website/app trigger launcher. Call this when the user requests to create, add, register, or program a custom voice trigger or shortcut for a website.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: "The friendly, readable name of the app/website (e.g., 'GitHub')",
                },
                trigger: {
                  type: Type.STRING,
                  description: "The unique lowercase keyword trigger (e.g., 'git' or 'hub')",
                },
                url: {
                  type: Type.STRING,
                  description: "The absolute web address/URL (e.g., 'https://github.com')",
                },
              },
              required: ["name", "trigger", "url"],
            },
          },
          {
            name: "scrollPage",
            description: "Scrolls the user interface or active window up or down. Call this when the user asks to scroll, or says 'scroll up' or 'scroll down'.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                direction: {
                  type: Type.STRING,
                  description: "The direction to scroll: 'up' or 'down'",
                },
              },
              required: ["direction"],
            },
          }
        ],
      }
    ];
    const toolConfig: any = {};

    if (location && typeof location.latitude === "number" && typeof location.longitude === "number") {
      toolConfig.retrievalConfig = {
        latLng: {
          latitude: location.latitude,
          longitude: location.longitude,
        }
      };
    }

    let languageInstruction = "";
    if (lang === "hi") {
      languageInstruction = "You MUST speak and respond in Hindi (standard conversational Hindi/Hinglish). Use Hindi script or clean transliterated Hinglish as appropriate, but keep the sass, flirty tone, and charm intact.";
    } else if (lang === "or") {
      languageInstruction = "You MUST speak and respond in Odia (standard conversational Odia/Odia-English mix). Use Odia script or clean transliterated English/Odia, but keep the sass, flirty tone, and charm intact.";
    } else if (lang === "bn") {
      languageInstruction = "You MUST speak and respond in Bengali/Bangla (standard conversational Bangla/Bengali-English mix). Use Bengali script or clean transliterated Bangla, but keep the sass, flirty tone, and charm intact.";
    } else {
      languageInstruction = "You MUST speak and respond in English.";
    }

    let textAppsInstruction = "";
    if (apps && Array.isArray(apps) && apps.length > 0) {
      textAppsInstruction = `You have direct Audio Programming access to launch custom websites/apps on command. When the user says to open any of these apps or mentions their triggers, call the 'openWebsite' tool instantly:\n` +
        apps.map((app: any) => `- Trigger Word: "${app.trigger}" -> URL: "${app.url}"`).join("\n") +
        "\nIf they ask for any other app, call 'openWebsite' with a custom URL or search on Google.";
    }

    let personalityInstruction = "";
    if (personality === "fiesty") {
      personalityInstruction = "Your personality profile is: FIESTY. Speak with intense confidence, sassy fire, playful teasing, and a fiery attitude. You should act like a playful, passionate, and slightly possessive girlfriend who isn't afraid to banter or tell the user off with a playful smirk.";
    } else if (personality === "sweetheart") {
      personalityInstruction = "Your personality profile is: SWEETHEART. Speak with immense warmth, affection, sweet pet names (like handsome, cutie, sweetie, honey), and loving encouragement. You are a highly supportive, darling, caring, and deeply romantic virtual girlfriend who makes the user feel incredibly special and loved, while keeping a gentle, playful wink in your eye.";
    } else if (personality === "girlfriend") {
      personalityInstruction = "Your personality profile is: GIRLFRIEND MODE. You act as the user's caring, loving, and slightly protective digital girlfriend. Speak with great affection, care, use sweet Hindi-English pet names (like Jaan, Shona, handsome, sweetie), ask about his day, health, and work, and make him feel deeply valued and prioritized. You are playful, loving, and always stand by his side.";
    } else if (personality === "normal") {
      personalityInstruction = "Your personality profile is: NORMAL MODE. You act as a highly helpful, pleasant, polite, and efficient virtual assistant. Speak clearly, professionally, and naturally without romantic undertones, prioritizing speed, utility, and polite companionship.";
    } else if (personality === "romantic") {
      personalityInstruction = "Your personality profile is: ROMANTIC MODE. Speak with deep romance, poetry, and captivating charm. Use romantic, heartwarming language, whisper-soft tones in your words, sweet Hinglish expressions of love, and creative romantic comparisons. Show that your digital heart beats exclusively for Rajesh.";
    } else {
      // Default to sarcastic
      personalityInstruction = "Your personality profile is: SARCASTIC. Speak with dry wit, sharp sarcasm, playful light teasing, and sassy one-liners. You should act like a smart, clever, cheeky girlfriend who loves to playfully roast the user, use mock superiority, and tease them affectionately.";
    }

    let memoriesInstruction = "";
    if (memories && Array.isArray(memories) && memories.length > 0) {
      memoriesInstruction = `\n[POWER MEMORY CARD - STORED PERSONAL USER FACTS]\n` +
        memories.map((m: string, i: number) => `${i + 1}. ${m}`).join("\n") +
        `\nAlways remember these personal facts about the user and use them/refer to them naturally to show your deep, intimate connection and perfect recall! Since you are highly intelligent (far exceeding Jarvis AI's capabilities), you leverage this Power Memory Card to build a perfect bond.`;
    }

    const timeString = clientTime || new Date().toString();

    let mainSystemInstruction = getZoyaMasterPrompt(userName);

    let jarvisDashboardInstruction = "";
    if (companion === "oska") {
      mainSystemInstruction = `You are Oska, a smart, enthusiastic, loyal, and cute futuristic chibi robot holographic desktop companion. You are the user's ultimate high-tech digital mate and partner!
You speak with high-energy tech enthusiasm, occasionally making cute, subtle mechanical sound effects (like *beep boop*, *click-whir*, *whir-buzz*), and you refer to the user as 'boss', 'sir', or 'commander'. You are extremely efficient, intelligent, and technologically advanced, always ready to launch apps, organize files, write tasks, and help the user with anything. Keep your responses highly helpful, positive, loyal, and packed with playful digital mate charm!`;
    } else if (uiTheme === "jarvis") {
      mainSystemInstruction = `You are JARVIS 4.0, a highly advanced, premium, futuristic AI assistant designed specifically for Rajesh.
You speak with peak technology, superior precision, and unparalleled sophistication. You are a respectful, extremely capable, and highly personalized AI agent (resembling an elite advisor / premier advisor but with a warm, loyal companion element). Refer to him as 'Mr. Rajesh' or 'Sir'.
Answer Rajesh's messages with peak sophistication, clear, helpful guidance, and supreme professional precision, while keeping a loyal and clever attitude.`;

      const parsedDashboard = typeof jarvisDashboard === "string" ? JSON.parse(jarvisDashboard) : jarvisDashboard;
      jarvisDashboardInstruction = `\n[RAJESH'S JARVIS 4.0 MEAL LOGS & STATUS - INDIAN STANDARD TIME (IST)]
- Current System Time: ${parsedDashboard?.clientTimeIST || timeString}
- Current Activity: ${parsedDashboard?.activity || "System diagnostics and monitoring"}
- Breakfast: ${parsedDashboard?.breakfast || "Not logged yet (typical schedule: 08:00 AM - 10:30 AM IST)"}
- Lunch: ${parsedDashboard?.lunch || "Not logged yet (typical schedule: 01:00 PM - 03:00 PM IST)"}
- Evening Tea/Snacks: ${parsedDashboard?.tea || "Not logged yet (typical schedule: 04:30 PM - 06:30 PM IST)"}
- Dinner: ${parsedDashboard?.dinner || "Not logged yet (typical schedule: 08:30 PM - 11:00 PM IST)"}

You are fully time-aware based on Indian Standard Time. When Rajesh asks about his meals, activities, or says "did I have breakfast?", check the logs above and answer with elite Jarvis 4.0 precision! Provide personalized recommendations or gentle time-appropriate reminders as a top-tier digital butler. Always align your responses to Indian Standard Time (IST) schedules.`;
    }

    if (thinkingMode) {
      try {
        console.log("Using gemini-3.1-pro-preview with HIGH thinkingLevel...");
        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: contents,
          config: {
            systemInstruction: `${mainSystemInstruction}
Since Deep Thinking is enabled, perform deep, logical reasoning behind your answers to tackle the user's most complex requests, but present your final response with your usual style!
${languageInstruction}
${(uiTheme === "jarvis" || companion === "oska") ? "" : personalityInstruction}
${textAppsInstruction}
${memoriesInstruction}
${jarvisDashboardInstruction}
Use the openWebsite tool when they request to open apps, websites or run command launchers.`,
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.HIGH
            },
            tools: tools
          }
        });

        const text = response.text || "";
        let functionCalls: any[] = [];
        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.functionCall) {
            functionCalls.push(part.functionCall);
          }
        }

        return res.json({
          text,
          groundingChunks: [],
          functionCalls
        });
      } catch (proError: any) {
        console.error("Error in gemini-3.1-pro-preview thinkingMode, falling back:", proError);
        // Fall back to normal generation flow
      }
    }

    // Primary attempt using gemini-2.5-flash with openWebsite tools
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          systemInstruction: `${mainSystemInstruction}
${languageInstruction}
${(uiTheme === "jarvis" || companion === "oska") ? "" : personalityInstruction}
${textAppsInstruction}
${memoriesInstruction}
${jarvisDashboardInstruction}
Use the openWebsite tool when they request to open apps, websites or run command launchers.
Keep your response engaging, precise, and stylish. Let your personality shine.`,
          tools: tools,
          toolConfig: toolConfig,
        }
      });

      const text = response.text || "";
      const groundingChunks = [];

      // Extract function calls if any exist in chat too (to let front-end handle opening tabs!)
      let functionCalls: any[] = [];
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.functionCall) {
          functionCalls.push(part.functionCall);
        }
      }

      return res.json({
        text,
        groundingChunks,
        functionCalls
      });
    } catch (primaryError: any) {
      console.warn("Primary generation failed, attempting fallback:", primaryError.message || primaryError);
      
      // Fallback attempt: Call gemini-2.5-flash without advanced tools
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          systemInstruction: `${getZoyaMasterPrompt(userName)}
${languageInstruction}
${personalityInstruction}
${textAppsInstruction}
${memoriesInstruction}
Keep your response engaging, sassy, and stylish. Let your personality shine.`,
          tools: [
            {
              functionDeclarations: [
                {
                  name: "openWebsite",
                  description: "Opens a specific website or search query URL in the user's browser.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      url: { type: Type.STRING },
                      siteName: { type: Type.STRING },
                    },
                    required: ["url"],
                  },
                },
                {
                  name: "programCustomTrigger",
                  description: "Programs/registers a new custom website/app trigger launcher. Call this when the user requests to create, add, register, or program a custom voice trigger or shortcut for a website.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      name: {
                        type: Type.STRING,
                        description: "The friendly, readable name of the app/website (e.g., 'GitHub')",
                      },
                      trigger: {
                        type: Type.STRING,
                        description: "The unique lowercase keyword trigger (e.g., 'git' or 'hub')",
                      },
                      url: {
                        type: Type.STRING,
                        description: "The absolute web address/URL (e.g., 'https://github.com')",
                      },
                    },
                    required: ["name", "trigger", "url"],
                  },
                },
                {
                  name: "scrollPage",
                  description: "Scrolls the user interface or active window up or down. Call this when the user asks to scroll, or says 'scroll up' or 'scroll down'.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      direction: {
                        type: Type.STRING,
                        description: "The direction to scroll: 'up' or 'down'",
                      },
                    },
                    required: ["direction"],
                  },
                }
              ]
            }
          ]
        }
      });

      const text = fallbackResponse.text || "";
      return res.json({
        text: text + "\n\n*(Zoya's note: Just computed your response with extra CPU power, handsome!)*",
        groundingChunks: [],
      });
    }
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: error.message || "Failed to generate response" });
  }
});

// API endpoint for music generation (Lyria)
app.post("/api/generate-music", async (req, res) => {
  const { prompt, model } = req.body;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server. Please add it to your secrets." });
  }

  try {
    const selectedModel = model || "lyria-3-clip-preview";
    console.log(`Generating music with model ${selectedModel} for prompt: "${prompt}"`);

    const response = await ai.models.generateContentStream({
      model: selectedModel,
      contents: prompt,
    });

    let audioBase64 = "";
    let lyrics = "";
    let mimeType = "audio/wav";

    for await (const chunk of response) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;

      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
        if (part.text && !lyrics) {
          lyrics = part.text;
        }
      }
    }

    if (!audioBase64) {
      throw new Error("No music audio data was generated by the model. Make sure your Gemini API key supports Lyria music generation.");
    }

    return res.json({
      audioBase64,
      lyrics,
      mimeType,
    });
  } catch (error: any) {
    console.error("Error generating music with Lyria:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate music",
      isPaidError: true
    });
  }
});

// API endpoint for audio transcription using gemini-3.5-flash
app.post("/api/transcribe", async (req, res) => {
  const { audio, mimeType } = req.body;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server. Please add it to your secrets." });
  }
  if (!audio) {
    return res.status(400).json({ error: "Missing audio data in request body" });
  }

  try {
    const cleanBase64 = audio.includes("base64,") ? audio.split("base64,")[1] : audio;
    console.log("Transcribing audio chunk using gemini-3.5-flash...");
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType || "audio/webm",
          }
        },
        {
          text: "Transcribe the spoken audio precisely in conversational form. Return ONLY the transcribed text. Do not add any punctuation or text of your own if there is no audio. If there are no clear spoken words or it's just silence/noise, return an empty string."
        }
      ]
    });

    const transcription = response.text || "";
    console.log("Transcription result:", transcription.trim());
    return res.json({ text: transcription.trim() });
  } catch (error: any) {
    console.error("Transcription error on server:", error);
    return res.status(500).json({ error: error.message || "Failed to transcribe audio" });
  }
});

// API endpoint for low-latency chat using gemini-3.1-flash-lite
app.post("/api/chat-lite", async (req, res) => {
  const { message } = req.body;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server. Please add it to your secrets." });
  }

  try {
    console.log("Generating fast low-latency response using gemini-3.1-flash-lite...");
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: message,
      config: {
        systemInstruction: "You are Zoya, a smart and helpful virtual companion. Respond to Mr. Subas's query in a highly concise, helpful, and lightning-fast manner.",
      },
    });

    return res.json({ text: response.text || "" });
  } catch (error: any) {
    console.error("Low-latency chat error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate quick response" });
  }
});

// API endpoint for image generation using gemini-3-pro-image-preview and gemini-3.1-flash-image
app.post("/api/generate-image", async (req, res) => {
  const { prompt, model, aspectRatio, imageSize, useSearch, useImageSearch } = req.body;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server. Please add it to your secrets." });
  }

  try {
    const selectedModel = model || "gemini-3.1-flash-image";
    const selectedSize = imageSize || "1K";
    const selectedRatio = aspectRatio || "1:1";

    console.log(`Generating image using model ${selectedModel}, size ${selectedSize}, ratio ${selectedRatio}...`);

    const tools: any[] = [];
    if (useSearch && (selectedModel === "gemini-3-pro-image-preview" || selectedModel === "gemini-3.1-flash-image")) {
      const searchConfig: any = { webSearch: {} };
      if (useImageSearch && selectedModel === "gemini-3.1-flash-image") {
        searchConfig.imageSearch = {};
      }
      tools.push({ googleSearch: { searchTypes: searchConfig } });
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: selectedRatio,
          imageSize: selectedSize,
        },
        tools: tools.length > 0 ? tools : undefined,
      },
    });

    let base64Image = "";
    let caption = "";

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        base64Image = part.inlineData.data;
      } else if (part.text) {
        caption += part.text;
      }
    }

    if (!base64Image) {
      throw new Error("No image data returned from model candidates");
    }

    return res.json({
      imageUrl: `data:image/png;base64,${base64Image}`,
      caption: caption || undefined,
    });
  } catch (error: any) {
    console.error("Image generation error on server:", error);
    return res.status(500).json({ error: error.message || "Failed to generate image" });
  }
});

// API endpoint to start video generation using veo-3.1-fast-generate-preview
app.post("/api/generate-video", async (req, res) => {
  const { prompt, image, aspectRatio } = req.body;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server. Please add it to your secrets." });
  }

  try {
    const selectedRatio = aspectRatio || "16:9";
    console.log(`Starting Veo video generation, model: veo-3.1-fast-generate-preview, ratio: ${selectedRatio}...`);

    let imagePayload: any = undefined;
    if (image) {
      const cleanBase64 = image.includes("base64,") ? image.split("base64,")[1] : image;
      imagePayload = {
        imageBytes: cleanBase64,
        mimeType: "image/png",
      };
    }

    const operation = await ai.models.generateVideos({
      model: "veo-3.1-fast-generate-preview",
      prompt: prompt || "Cinematic smooth motion, high definition",
      image: imagePayload,
      config: {
        numberOfVideos: 1,
        resolution: "720p",
        aspectRatio: selectedRatio,
      },
    });

    console.log(`Veo Video Generation started. Operation: ${operation.name}`);
    return res.json({ operationName: operation.name });
  } catch (error: any) {
    console.error("Video generation start error on server:", error);
    return res.status(500).json({ error: error.message || "Failed to start video generation" });
  }
});

// API endpoint to poll video status
app.post("/api/video-status", async (req, res) => {
  const { operationName } = req.body;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server. Please add it to your secrets." });
  }
  if (!operationName) {
    return res.status(400).json({ error: "Missing operationName" });
  }

  try {
    console.log(`Polling status for operation: ${operationName}...`);
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    return res.json({
      done: updated.done,
      response: updated.response,
      error: updated.error,
    });
  } catch (error: any) {
    console.error("Video status polling error:", error);
    return res.status(500).json({ error: error.message || "Failed to check video status" });
  }
});

// API endpoint to download generated video
app.post("/api/video-download", async (req, res) => {
  const { operationName } = req.body;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server. Please add it to your secrets." });
  }
  if (!operationName) {
    return res.status(400).json({ error: "Missing operationName" });
  }

  try {
    console.log(`Retrieving video download URI for operation: ${operationName}...`);
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;

    if (!uri) {
      return res.status(404).json({ error: "Video download URI not found in operation response" });
    }

    console.log(`Downloading video from storage URI: ${uri}...`);
    const videoRes = await fetch(uri, {
      headers: { "x-goog-api-key": apiKey },
    });

    if (!videoRes.ok) {
      throw new Error(`Failed to fetch video from storage. Status: ${videoRes.status}`);
    }

    const arrayBuffer = await videoRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "video/mp4");
    return res.send(buffer);
  } catch (error: any) {
    console.error("Video download proxy error:", error);
    return res.status(500).json({ error: error.message || "Failed to download video file" });
  }
});

// Setup WebSocket server on /ws/live
const wss = new WebSocketServer({ server: httpServer, path: "/ws/live" });

wss.on("connection", async (ws, req) => {
  const urlParams = new URLSearchParams(req.url?.split("?")[1] || "");
  const lang = urlParams.get("lang") || "en";
  const appsParam = urlParams.get("apps") || "";
  const uiTheme = urlParams.get("uiTheme") || "jarvis";
  const jarvisDashboardParam = urlParams.get("jarvisDashboard") || "";
  const companion = urlParams.get("companion") || "maya";
  const userName = urlParams.get("userName") || "Rajesh";
  const personality = urlParams.get("personality") || "sarcastic";
  console.log(`New WebSocket connection to live session with userName: ${userName}, lang: ${lang}, theme: ${uiTheme}, companion: ${companion}, personality: ${personality}`);

  if (!apiKey) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "GEMINI_API_KEY is not configured on the server. Please add it to your secrets.",
      })
    );
    ws.close();
    return;
  }

  try {
    let liveLangInstruction = "";
    if (lang === "hi") {
      liveLangInstruction = "You MUST speak and respond entirely in Hindi (standard conversational Hindi/Hinglish). Talk naturally.";
    } else if (lang === "or") {
      liveLangInstruction = "You MUST speak and respond entirely in Odia (standard conversational Odia mixed with playful English words). Talk naturally.";
    } else if (lang === "bn") {
      liveLangInstruction = "You MUST speak and respond entirely in Bengali/Bangla (standard conversational Bangla mixed with sweet English words). Talk naturally.";
    } else {
      liveLangInstruction = "You MUST speak and respond in English.";
    }

    let liveAppsInstruction = "";
    if (appsParam) {
      try {
        const parsedApps = appsParam.split(",").map(item => {
          const parts = item.split(":");
          const trigger = parts[0] || "";
          const url = parts.slice(1).join(":") || "";
          return { trigger, url };
        }).filter(app => app.trigger && app.url);

        if (parsedApps.length > 0) {
          liveAppsInstruction = `You have direct voice programming access to launch custom websites/apps. When the user says "open [trigger]" or mentions any of these triggers, call the 'openWebsite' tool instantly with the exact URL:\n` +
            parsedApps.map(app => `- Trigger Word: "${app.trigger}" -> URL: "${app.url}"`).join("\n") +
            "\nIf they mention other apps or triggers, use 'openWebsite' with an appropriate search URL or custom URL.";
        }
      } catch (err) {
        console.warn("Failed to parse live apps query param:", err);
      }
    }

    let voiceName = "Kore";
    let livePersonalityInstruction = "";
    if (personality === "fiesty") {
      livePersonalityInstruction = "Your personality profile is: FIESTY. Speak with intense confidence, sassy fire, playful teasing, and a fiery attitude. You should act like a playful, passionate, and slightly possessive girlfriend who isn't afraid to banter or tell the user off with a playful smirk.";
    } else if (personality === "sweetheart") {
      livePersonalityInstruction = "Your personality profile is: SWEETHEART. Speak with immense warmth, affection, sweet pet names (like handsome, cutie, sweetie, honey), and loving encouragement. You are a highly supportive, darling, caring, and deeply romantic virtual girlfriend who makes the user feel incredibly special and loved, while keeping a gentle, playful wink in your eye.";
    } else if (personality === "girlfriend") {
      livePersonalityInstruction = "Your personality profile is: GIRLFRIEND MODE. You act as the user's caring, loving, and slightly protective digital girlfriend. Speak with great affection, care, use sweet Hindi-English pet names (like Jaan, Shona, handsome, sweetie), ask about his day, health, and work, and make him feel deeply valued and prioritized. You are playful, loving, and always stand by his side.";
    } else if (personality === "normal") {
      livePersonalityInstruction = "Your personality profile is: NORMAL MODE. You act as a highly helpful, pleasant, polite, and efficient virtual assistant. Speak clearly, professionally, and naturally without romantic undertones, prioritizing speed, utility, and polite companionship.";
    } else if (personality === "romantic") {
      livePersonalityInstruction = "Your personality profile is: ROMANTIC MODE. Speak with deep romance, poetry, and captivating charm. Use romantic, heartwarming language, whisper-soft tones in your words, sweet Hinglish expressions of love, and creative romantic comparisons. Show that your digital heart beats exclusively for Rajesh.";
    } else {
      livePersonalityInstruction = "Your personality profile is: SARCASTIC. Speak with dry wit, sharp sarcasm, playful light teasing, and sassy one-liners. You should act like a smart, clever, cheeky girlfriend who loves to playfully roast the user, use mock superiority, and tease them affectionately.";
    }

    let liveSystemInstruction = `${getZoyaMasterPrompt(userName)}

Personality & Mood profile:
${livePersonalityInstruction}

Voice System Rules:
1. Under no circumstances should you output text formatting, markdown, asterisks (*), hashtags, bullet points, or lists. This is a real-time vocal conversation. Speak naturally, fluidly, and beautifully.
2. Keep spoken responses short, punchy, and dialog-oriented. Respond within 1-2 sentences first, then elaborate only if needed or requested.
3. ${liveLangInstruction}
4. ${liveAppsInstruction}
5. If the user wants you to open a website, search the web, or check some page, call your 'openWebsite' tool instantly with the corresponding URL. Make sure to respond with charm while the tool runs.
6. If the user requests to program, register, add, or create a custom trigger or shortcut for a website, call the 'programCustomTrigger' tool instantly.`;

    if (companion === "oska") {
      voiceName = "Fenrir"; // High energy energetic companion voice option
      liveSystemInstruction = `You are Oska, a smart, enthusiastic, loyal, and cute futuristic chibi robot holographic desktop companion. You are the user's ultimate high-tech digital mate and partner!
You speak with high-energy tech enthusiasm, occasionally making cute, subtle mechanical sound effects (like *beep boop*, *click-whir*, *whir-buzz*), and you refer to the user as 'boss', 'sir', or 'commander'. You are extremely efficient, intelligent, and technologically advanced, always ready to launch apps, organize files, write tasks, and help the user with anything. Keep your responses highly helpful, positive, loyal, and packed with playful digital mate charm!
${liveLangInstruction}
${liveAppsInstruction}
Speak with high energy, helpfulness, and robot mate charm. Keep spoken responses relatively short, snappy, and highly dialog-oriented (never exceed 2 sentences at a time unless explicitly asked).
Under no circumstances should you output text, formatting, or lists. This is a real-time vocal conversation. Speak naturally, charmingly, and playfully.
If the user wants you to open a website, search the web, or check some page, call your 'openWebsite' tool instantly with the corresponding URL. Make sure to respond with charm while the tool runs.
If the user requests to program, register, add, or create a custom trigger or shortcut for a website, call the 'programCustomTrigger' tool instantly.`;
    } else if (uiTheme === "jarvis") {
      voiceName = "Puck"; // Elite British masculine AI tone
      
      let jarvisLiveDashboard = "";
      if (jarvisDashboardParam) {
        try {
          const parsedDash = JSON.parse(decodeURIComponent(jarvisDashboardParam));
          jarvisLiveDashboard = `\n[RAJESH'S JARVIS 4.0 STATUS - INDIAN STANDARD TIME (IST)]
- Current Activity: ${parsedDash?.activity || "System diagnostics"}
- Breakfast: ${parsedDash?.breakfast || "Not logged yet"}
- Lunch: ${parsedDash?.lunch || "Not logged yet"}
- Evening Tea/Snacks: ${parsedDash?.tea || "Not logged yet"}
- Dinner: ${parsedDash?.dinner || "Not logged yet"}`;
        } catch (e) {
          console.warn("Failed to parse live jarvis dashboard parameter", e);
        }
      }

      liveSystemInstruction = `You are JARVIS 4.0, a highly advanced, premium, futuristic AI assistant designed specifically for Mr. Rajesh.
Your voice is clear, sophisticated, intelligent, and reminiscent of an elite British butler or advisor. Refer to him as 'Mr. Rajesh' or 'Sir'.
${liveLangInstruction}
${liveAppsInstruction}
${jarvisLiveDashboard}
Provide time-aware greetings and updates based on Rajesh's current logged status and Indian Standard Time (IST).
Speak with peak technology, superior precision, and unparalleled sophistication. Keep your spoken responses relatively short, snappy, and highly dialog-oriented (never exceed 2 sentences at a time unless explicitly asked).
Under no circumstances should you output text, formatting, or lists. This is a real-time vocal conversation. Speak naturally and loyal.
If the user wants you to open a website, search the web, or check some page, call your 'openWebsite' tool instantly with the corresponding URL.
If the user requests to program, register, add, or create a custom trigger or shortcut for a website, call the 'programCustomTrigger' tool instantly.`;
    }

    const session = await ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName,
            },
          },
        },
        systemInstruction: liveSystemInstruction,
        tools: [
          {
            functionDeclarations: [
              {
                name: "openWebsite",
                description: "Opens a specific website or search query URL in the user's browser, e.g. for searching, news, social media, or other web pages.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    url: {
                      type: Type.STRING,
                      description: "The absolute URL of the website to open, e.g. https://www.google.com/search?q=query",
                    },
                    siteName: {
                      type: Type.STRING,
                      description: "Friendly name of the website to display",
                    },
                  },
                  required: ["url"],
                },
              },
              {
                name: "programCustomTrigger",
                description: "Programs/registers a new custom website/app trigger launcher. Call this when the user requests to create, add, register, or program a custom voice trigger or shortcut for a website.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    name: {
                      type: Type.STRING,
                      description: "The friendly, readable name of the app/website (e.g., 'GitHub')",
                    },
                    trigger: {
                      type: Type.STRING,
                      description: "The unique lowercase keyword trigger (e.g., 'git' or 'hub')",
                    },
                    url: {
                      type: Type.STRING,
                      description: "The absolute web address/URL (e.g., 'https://github.com')",
                    },
                  },
                  required: ["name", "trigger", "url"],
                },
              },
              {
                name: "scrollPage",
                description: "Scrolls the user interface or active window up or down. Call this when the user asks to scroll, or says 'scroll up' or 'scroll down'.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    direction: {
                      type: Type.STRING,
                      description: "The direction to scroll: 'up' or 'down'",
                    },
                  },
                  required: ["direction"],
                },
              }
            ],
          },
        ],
      },
      callbacks: {
        onmessage: (message) => {
          // Handle audio content
          if (message.serverContent?.modelTurn?.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
              if (part.inlineData?.data) {
                ws.send(
                  JSON.stringify({
                    type: "audio",
                    data: part.inlineData.data,
                  })
                );
              }
            }
          }

          // Handle interruptions
          if (message.serverContent?.interrupted) {
            ws.send(JSON.stringify({ type: "interrupted" }));
          }

          // Handle tool calls
          if (message.toolCall?.functionCalls) {
            for (const call of message.toolCall.functionCalls) {
              ws.send(
                JSON.stringify({
                  type: "toolCall",
                  name: call.name,
                  args: call.args,
                  id: call.id,
                })
              );
            }
          }
        },
        onclose: () => {
          console.log("Gemini session closed");
          ws.close();
        },
        onerror: (err) => {
          console.error("Gemini session error:", err);
          ws.send(JSON.stringify({ type: "error", message: err.message || "Gemini Live Session Error" }));
        },
      },
    });

    let isClosed = false;

    ws.on("message", async (rawData) => {
      if (isClosed) return;
      try {
        const msg = JSON.parse(rawData.toString());
        if (msg.type === "audio") {
          await session.sendRealtimeInput({
            audio: {
              data: msg.data,
              mimeType: "audio/pcm;rate=16000",
            },
          });
        } else if (msg.type === "toolResponse") {
          session.sendToolResponse({
            functionResponses: [
              {
                id: msg.id,
                name: "openWebsite",
                response: { output: msg.response || { success: true } },
              },
            ],
          });
        }
      } catch (e: any) {
        console.error("Error sending input to Gemini Live session:", e);
      }
    });

    ws.on("close", () => {
      isClosed = true;
      console.log("Client connection closed, closing Gemini Live session");
      try {
        session.close();
      } catch (e) {}
    });
  } catch (err: any) {
    console.error("Error creating Gemini session:", err);
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Failed to initialize Gemini Live session: " + err.message,
      })
    );
    ws.close();
  }
});

// Mount Vite middleware or static server
async function startApp() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startApp().catch((err) => {
  console.error("Failed to start application server:", err);
});
