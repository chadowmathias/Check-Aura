import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialisation du moteur interne (v0.1.4)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
  "gemini-1.5-pro-latest",
  "gemini-2.0-flash-exp",
  "gemini-1.5-flash-8b",
  "gemini-pro",
  "gemini-1.0-pro"
];

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

        let result = null;
        let errorDetails = null;

        // Fallback strategy loop
        for (const modelName of MODELS) {
            try {
                console.log(`Tentative avec le modèle: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                result = await model.generateContent([prompt, imagePart]);

                // If successful, break the loop
                break;
            } catch (error: any) {
                console.error(`Échec avec le modèle ${modelName}:`, error.message);
                errorDetails = error;

                // Continue to next model on 404 or other errors
                continue;
            }
        }

        if (!result) {
            console.error("Tous les modèles ont échoué.");

            // Diagnostic: List available models to help debug why the configured models are failing
            try {
                const apiKey = process.env.GEMINI_API_KEY;
                if (apiKey) {
                    const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
                    const response = await fetch(listModelsUrl);
                    if (response.ok) {
                        const data = await response.json();
                        console.log("Modèles disponibles pour cette clé API:", JSON.stringify(data, null, 2));
                    } else {
                        console.error("Impossible de lister les modèles via API REST:", response.status, response.statusText);
                    }
                }
            } catch (listError) {
                console.error("Erreur lors de la récupération de la liste des modèles:", listError);
            }

            throw errorDetails || new Error("Tous les modèles sont inaccessibles.");
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
