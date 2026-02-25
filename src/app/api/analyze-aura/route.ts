import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// API Key sanitization
const API_KEY = (process.env.GEMINI_API_KEY || "").trim();
const genAI = new GoogleGenerativeAI(API_KEY);

// Preferred models in order of priority
const PREFERRED_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-001",
  "gemini-1.5-flash-002",
  "gemini-1.5-pro",
  "gemini-1.5-pro-001",
  "gemini-1.5-pro-002",
  "gemini-2.0-flash-exp",
  "gemini-pro",
  "gemini-1.0-pro"
];

// Helper to list models and find best match
async function discoverBestModel(): Promise<{ name: string; apiVersion: string } | null> {
    console.log("--- DISCOVERY PHASE: Listing available models ---");

    // Try listing via v1beta first (most comprehensive)
    try {
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
        const response = await fetch(listUrl);

        if (!response.ok) {
            console.error(`Discovery failed (v1beta): ${response.status} ${response.statusText}`);
            // Try v1 as fallback
            const listUrlV1 = `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`;
            const responseV1 = await fetch(listUrlV1);
            if (!responseV1.ok) {
                console.error(`Discovery failed (v1): ${responseV1.status} ${responseV1.statusText}`);
                return null;
            }
            const dataV1 = await responseV1.json();
            return findBestMatch(dataV1.models, "v1");
        }

        const data = await response.json();
        return findBestMatch(data.models, "v1beta");

    } catch (error) {
        console.error("Discovery error:", error);
        return null;
    }
}

function findBestMatch(availableModels: any[], apiVersion: string): { name: string; apiVersion: string } | null {
    if (!availableModels || !Array.isArray(availableModels)) return null;

    const availableNames = availableModels.map((m: any) => m.name.replace("models/", ""));
    console.log("Modèles disponibles:", availableNames.join(", "));

    for (const pref of PREFERRED_MODELS) {
        if (availableNames.includes(pref)) {
            console.log(`Match trouvé: ${pref} (${apiVersion})`);
            return { name: pref, apiVersion };
        }
    }

    // If no exact match, return the first one that looks like 'gemini'
    const fallback = availableNames.find(n => n.includes("gemini"));
    if (fallback) {
        console.log(`Fallback sur le premier modèle Gemini disponible: ${fallback} (${apiVersion})`);
        return { name: fallback, apiVersion };
    }

    return null;
}

export async function POST(req: NextRequest) {
    try {
        const data = await req.formData();
        const file: File | null = data.get("file") as unknown as File;

        if (!file) {
            return NextResponse.json(
                { error: "Les ondes sont vides. Choisis une image pour commencer le rituel." },
                { status: 400 }
            );
        }

        if (!API_KEY) {
            console.error("ERREUR CRITIQUE: Clé API manquante ou vide!");
            return NextResponse.json(
                { error: "Le modèle cosmique est introuvable. Vérifie ta clé API (Gemini 1.5 Flash). 🔮" },
                { status: 500 }
            );
        }

        // 1. Récupération des bytes et conversion Base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString("base64");

        // 2. Nettoyage Base64 strict
        const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

        // 3. Payload
        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: file.type || "image/jpeg"
            }
        };

        const prompt = `Tu es une voyante Gen-Z sarcastique. Analyse cette photo d'utilisateur. 
    Tu dois juger son 'aura' en fonction de sa pose, son expression et son décor.
    
    Renvoie UNIQUEMENT un objet JSON avec 2 clés :
    - 'color': une couleur parmi ['purple', 'red', 'blue', 'gold', 'dark', 'neon-green'].
    - 'score': un nombre entier entre -10000 et +10000 (points d'aura).
    
    NE GÉNÈRE AUCUN TEXTE, UNIQUEMENT LE JSON.`;

        console.log("--- SCAN VIBRATOIRE v0.1.4 ---");
        console.log(`Clé API chargée: ${API_KEY.substring(0, 4)}... (L: ${API_KEY.length})`);

        let result = null;
        let lastErrorDetails = null;

        // Smart Strategy:
        // 1. Try Primary Model (Optimistic)
        // 2. If 404/403 -> Discovery -> Retry with Found Model

        const primaryModelName = PREFERRED_MODELS[0]; // gemini-1.5-flash
        const primaryApiVersion = "v1beta";

        try {
            console.log(`Tentative initiale: ${primaryModelName} (${primaryApiVersion})`);
            const model = genAI.getGenerativeModel({ model: primaryModelName }, { apiVersion: primaryApiVersion });
            result = await model.generateContent([prompt, imagePart]);
        } catch (initialError: any) {
            console.warn(`Échec initial (${initialError.status || 'unknown'}):`, initialError.message);
            lastErrorDetails = initialError;

            // Trigger Smart Discovery only on auth/not-found errors
            if (initialError.message?.includes("404") || initialError.message?.includes("not found") || initialError.message?.includes("403")) {
                const discovered = await discoverBestModel();

                if (discovered) {
                    try {
                        console.log(`Tentative avec le modèle découvert: ${discovered.name} (${discovered.apiVersion})`);
                        // Re-instantiate with discovered model
                        const retryModel = genAI.getGenerativeModel({ model: discovered.name }, { apiVersion: discovered.apiVersion });
                        result = await retryModel.generateContent([prompt, imagePart]);
                    } catch (retryError: any) {
                        console.error(`Échec avec le modèle découvert:`, retryError.message);
                        lastErrorDetails = retryError;
                    }
                } else {
                    console.error("Aucun modèle compatible trouvé via Discovery.");
                }
            }
        }

        if (!result) {
            console.error("Tous les modèles ont échoué.");

            // Try fallback to last-resort legacy model if discovery failed
            if (!lastErrorDetails?.message?.includes("gemini-pro")) {
                 try {
                    console.log("Tentative de la dernière chance: gemini-pro (v1)");
                    const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" }, { apiVersion: "v1" });
                    result = await fallbackModel.generateContent([prompt, imagePart]);
                 } catch (finalError) {
                     console.error("Échec ultime:", finalError);
                 }
            }
        }

        if (!result) {
             throw lastErrorDetails || new Error("Service indisponible.");
        }

        const response = await result.response;
        let responseText = response.text();
        console.log("LOG INTERNE (BRUT):", responseText);

        // 5. Nettoyage JSON
        responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
            const aiResult = JSON.parse(responseText);
            return NextResponse.json({
                ...aiResult,
                image: `data:${file.type};base64,${base64Image}`,
            });
        } catch (parseError) {
            console.error("ERREUR JSON:", parseError);
            return NextResponse.json(
                { error: "Les esprits ont divagué dans leur réponse. Retente le scan." },
                { status: 500 }
            );
        }

    } catch (error: any) {
        console.error("--- ERREUR CRITIQUE ---");
        console.error(error);

        if (error?.status === 429 || error?.message?.includes("quota")) {
            return NextResponse.json(
                { error: "Le cosmos est saturé. Patiente 30 secondes... 🌌" },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: "Les énergies cosmiques sont instables en ce moment. Réessaie dans un instant ✨" },
            { status: 500 }
        );
    }
}
