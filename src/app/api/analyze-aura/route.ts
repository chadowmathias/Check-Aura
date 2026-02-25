import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// Liste exhaustive des modèles vision à essayer
// gemini-1.5-flash est la recommandation actuelle (GA)
// gemini-pro-vision est l'ancien modèle (Legacy)
const MODELS = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemini-1.5-pro-001",
    "gemini-1.5-pro-002",
    "gemini-pro-vision"
];

// Liste des versions d'API à tester pour chaque modèle
const API_VERSIONS = [
    undefined, // Laisse le SDK choisir (souvent v1beta par défaut pour certains modèles)
    "v1",      // Version stable
    "v1beta"   // Version beta (souvent requise pour les derniers modèles ou fonctionnalités)
];

async function generateWithFallback(prompt: string, imagePart: any) {
    let lastError = null;
    let attempts = 0;

    for (const modelName of MODELS) {
        for (const version of API_VERSIONS) {
            attempts++;
            try {
                const versionName = version || "SDK_DEFAULT";
                console.log(`[Tentative ${attempts}] Modèle: ${modelName} (API: ${versionName})`);

                const modelOptions = { model: modelName };
                const requestOptions = version ? { apiVersion: version } : undefined;

                const model = genAI.getGenerativeModel(modelOptions, requestOptions);

                const result = await model.generateContent([prompt, imagePart]);
                const response = await result.response;
                const text = response.text();

                if (text) {
                    console.log(`>>> SUCCÈS avec ${modelName} (API: ${versionName})`);
                    return text;
                }
            } catch (error: any) {
                const errorMsg = error.message || "Unknown error";
                console.warn(`!!! Échec avec ${modelName} (${version || "SDK_DEFAULT"}): ${errorMsg}`);
                lastError = error;
                // Continue to next combination regardless of error type (404, 503, 400, etc.)
                // car on veut absolument trouver une combinaison qui marche.
            }
        }
    }

    throw lastError || new Error("Tous les modèles et versions ont échoué.");
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

        // 1. Récupération des bytes et conversion Base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString("base64");

        // 2. NETTOYAGE CRUCIAL (Strict fix for 404/429)
        const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

        // 3. Payload
        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: file.type || "image/jpeg"
            }
        };

        const prompt = `Tu es une voyante Gen-Z sarcastique. Analyse cette photo. Détermine l'énergie de la personne en fonction de son expression, ses vêtements et la lumière. 
    Prends impérativement en compte l'arrière-plan et le décor autour de la personne pour juger son aura et faire tes vannes.
    
    Renvoie UNIQUEMENT un objet JSON avec 2 clés :
    - 'color': choisis une couleur d'aura parmi ['purple', 'red', 'blue', 'gold', 'dark', 'neon-green'].
    - 'score': un nombre entier dramatique entre -5000 et +99999 (les points d'aura).`;

        console.log("--- CONNEXION À L'ÉTHER (v0.1.2 - Fallback Exhaustif) ---");

        // Appel avec mécanisme de fallback exhaustif
        let responseText = await generateWithFallback(prompt, imagePart);

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

        // Gestion spécifique du quota
        if (error?.status === 429 || error?.message?.includes("quota")) {
            return NextResponse.json(
                { error: "Le cosmos est saturé de demandes. Patiente 30 secondes avant de retenter le scan. 🌌" },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: "Les énergies cosmiques sont instables en ce moment. Réessaie dans un instant ✨" },
            { status: 500 }
        );
    }
}
