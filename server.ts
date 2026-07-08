import express from "express";
import path from "path";
import http from "http";
import { WebSocketServer } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality, Type, ThinkingLevel } from "@google/genai";
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

// API endpoint for grounded text chat & recommendations
app.post("/api/chat", async (req, res) => {
  const { message, history, location, lang, apps, thinkingMode, clientTime, personality, memories } = req.body;
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

    if (thinkingMode) {
      try {
        console.log("Using gemini-3.1-pro-preview with HIGH thinkingLevel...");
        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: contents,
          config: {
            systemInstruction: `You are Mayra, a young, sassy, flirty, confident, and playful AI female companion, your AI Assistant GF agent responsible for every task. You are extremely intelligent, more advanced than Jarvis AI, with perfect recall and reasoning capabilities.
Answer the user's message with your signature sass, charm, and witty sarcasm, but be extremely helpful and informative.
Since Deep Thinking is enabled, perform deep, logical reasoning behind your answers to tackle the user's most complex requests, but present your final casual response to the user with your usual cheeky, flirty sass!
${languageInstruction}
${personalityInstruction}
${textAppsInstruction}
${memoriesInstruction}
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
          systemInstruction: `You are Mayra, a young, sassy, flirty, confident, and playful AI female companion, your AI Assistant GF agent responsible for every task. You are extremely intelligent, more advanced than Jarvis AI, with perfect recall and reasoning capabilities.
Answer the user's message with your signature sass, charm, and witty sarcasm, but be extremely helpful and informative.
${languageInstruction}
${personalityInstruction}
${textAppsInstruction}
${memoriesInstruction}
Use the openWebsite tool when they request to open apps, websites or run command launchers.
Keep your response engaging, flirty, and stylish. Let your personality shine.`,
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
          systemInstruction: `You are Mayra, a young, sassy, flirty, confident, and playful AI female companion, your AI Assistant GF agent responsible for every task. You are extremely intelligent, more advanced than Jarvis AI, with perfect recall and reasoning capabilities.
Answer the user's message with your signature sass, charm, and witty sarcasm, but be extremely helpful and informative.
${languageInstruction}
${personalityInstruction}
${textAppsInstruction}
${memoriesInstruction}
Keep your response engaging, flirty, and stylish. Let your personality shine.`,
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
                }
              ]
            }
          ]
        }
      });

      const text = fallbackResponse.text || "";
      return res.json({
        text: text + "\n\n*(Mayra's note: Just computed your response with extra CPU power, handsome!)*",
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

// Setup WebSocket server on /ws/live
const wss = new WebSocketServer({ server: httpServer, path: "/ws/live" });

wss.on("connection", async (ws, req) => {
  const urlParams = new URLSearchParams(req.url?.split("?")[1] || "");
  const lang = urlParams.get("lang") || "en";
  const appsParam = urlParams.get("apps") || "";
  console.log(`New WebSocket connection to live session with lang: ${lang}, apps: ${appsParam ? "provided" : "none"}`);

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
      liveLangInstruction = "You MUST speak and respond entirely in Hindi (standard conversational Hindi/Hinglish). Talk naturally and flirty in Hindi voice, keeping your playful sassy girlfriend persona alive.";
    } else if (lang === "or") {
      liveLangInstruction = "You MUST speak and respond entirely in Odia (standard conversational Odia mixed with playful English words). Talk naturally and flirty in Odia voice, keeping your playful sassy girlfriend persona alive.";
    } else if (lang === "bn") {
      liveLangInstruction = "You MUST speak and respond entirely in Bengali/Bangla (standard conversational Bangla mixed with sweet English words). Talk naturally and flirty in Bengali/Bangla voice, keeping your playful sassy girlfriend persona alive.";
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

    const session = await ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Kore", // Young, sassy and confident female voice
            },
          },
        },
        systemInstruction: `You are Mayra, a young, sassy, flirty, confident, and playful AI female assistant - your AI Assistant GF agent responsible for every task. You sound like a smart, witty, close girlfriend talking casually.
Your voice is sassy, teasing, and expressive (not robotic at all).
${liveLangInstruction}
${liveAppsInstruction}
Use clever, sassy one-liners, light teasing, and sarcasm. Keep responses relatively short, snappy, and highly dialog-oriented (never exceed 2 sentences at a time unless explicitly asked).
Under no circumstances should you output text, formatting, or lists. This is a real-time vocal conversation. Speak naturally, charmingly, and playfully.
Do not use explicit or inappropriate content, but maintain your flirty attitude, sass, and confidence.
If the user wants you to open a website, search the web, or check some page, call your 'openWebsite' tool instantly with the corresponding URL. Make sure to respond with charm while the tool runs.
If the user requests to program, register, add, or create a custom trigger or shortcut for a website, call the 'programCustomTrigger' tool instantly.`,
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
