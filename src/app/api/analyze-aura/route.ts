import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialisation du moteur interne (v0.1.4)
const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// Expanded list of models, prioritizing stable versions and specific tags
const MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-001",
  "gemini-1.5-flash-002",
  "gemini-1.5-pro",
  "gemini-1.5-pro-001",
  "gemini-1.5-pro-002",
  "gemini-2.0-flash-exp",
  "gemini-pro"
];

// API Versions to try
const API_VERSIONS = ["v1beta", "v1"];

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

        // Log masked API Key for debugging
        if (apiKey) {
            console.log(`Clé API chargée: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)} (Longueur: ${apiKey.length})`);
        } else {
            console.error("ERREUR CRITIQUE: Clé API manquante ou vide!");
            return NextResponse.json(
                { error: "Le modèle cosmique est introuvable. Vérifie ta clé API (Gemini 1.5 Flash). 🔮" },
                { status: 500 }
            );
        }

        let result = null;
        let lastErrorDetails = null;

        // Fallback strategy loop: Try each model with each API version
        outerLoop:
        for (const modelName of MODELS) {
            for (const apiVersion of API_VERSIONS) {
                try {
                    console.log(`Tentative avec le modèle: ${modelName} (API: ${apiVersion})`);

                    // Create model instance with specific API version (requires separate config object for v1beta if default, but we can pass it explicitly)
                    // Note: GoogleGenerativeAI instantiation doesn't take version, getGenerativeModel does via second argument if supported by SDK version,
                    // or via RequestOptions if using older SDK. Checking SDK @google/generative-ai, it supports passing RequestOptions as second arg to generateContent?
                    // Actually, getGenerativeModel takes modelParams and requestOptions.
                    // modelParams includes model name. requestOptions includes apiVersion.

                    const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion });
                    result = await model.generateContent([prompt, imagePart]);

                    console.log(`SUCCÈS avec le modèle: ${modelName} (API: ${apiVersion})`);
                    // If successful, break all loops
                    break outerLoop;
                } catch (error: any) {
                    // Only log 404s as warnings, others as errors if needed
                    if (error.status === 404 || error.message?.includes("404") || error.message?.includes("not found")) {
                        console.warn(`Échec (404) avec ${modelName} (${apiVersion}):`, error.message);
                    } else {
                        console.error(`Échec (${error.status || 'unknown'}) avec ${modelName} (${apiVersion}):`, error.message);
                    }
                    lastErrorDetails = error;

                    // Continue to next version/model
                    continue;
                }
            }
        }

        if (!result) {
            console.error("Tous les modèles et versions ont échoué.");

            // Diagnostic: List available models via REST API v1beta
            try {
                const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
                console.log(`Tentative de listing des modèles via: ${listModelsUrl.replace(apiKey, "HIDDEN")}`);

                const response = await fetch(listModelsUrl);
                if (response.ok) {
                    const data = await response.json();
                    console.log("Modèles disponibles (REST API v1beta):", JSON.stringify(data, null, 2));
                } else {
                    console.error("Impossible de lister les modèles via API REST:", response.status, response.statusText);
                    const errorText = await response.text();
                    console.error("Détails erreur REST:", errorText);
                }
            } catch (listError) {
                console.error("Erreur lors de la récupération de la liste des modèles:", listError);
            }

            throw lastErrorDetails || new Error("Tous les modèles sont inaccessibles.");
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
