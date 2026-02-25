import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialisation du moteur interne (v0.1.4)
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("ERREUR: GEMINI_API_KEY manquante.");
}
const genAI = new GoogleGenerativeAI(apiKey || "");

const MODEL_NAMES = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-1.5-pro-latest",
    "gemini-2.0-flash-exp"
];

export async function POST(req: NextRequest) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("Clé API Gemini non configurée.");
        }

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
        let lastError = null;

        // Boucle de tentative sur les modèles
        for (const modelName of MODEL_NAMES) {
            try {
                console.log(`Tentative avec le modèle: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });

                // Timeout interne de 15s pour l'API Gemini
                const currentResult: any = await Promise.race([
                    model.generateContent([prompt, imagePart]),
                    new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Timeout Gemini API")), 15000))
                ]);

                if (currentResult && currentResult.response) {
                    result = currentResult;
                    console.log(`Succès avec le modèle: ${modelName}`);
                    break; // Succès, on sort de la boucle
                }
            } catch (error: any) {
                console.warn(`Échec avec le modèle ${modelName}:`, error.message);
                lastError = error;
            }
        }

        if (!result) {
            console.error("Tous les modèles ont échoué.");
            throw lastError || new Error("Impossible de contacter les esprits (Modèles épuisés).");
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

        if (error?.status === 404 || error?.message?.includes("not found")) {
             return NextResponse.json(
                { error: "Le modèle cosmique est introuvable. Vérifie ta clé API (Gemini 1.5 Flash). 🔮" },
                { status: 404 }
            );
        }

        if (error?.message === "Timeout Gemini API") {
             return NextResponse.json(
                { error: "Les esprits mettent trop de temps à répondre. Réessaie. ⏳" },
                { status: 504 }
            );
        }

        return NextResponse.json(
            { error: "Les énergies cosmiques sont instables en ce moment. Réessaie dans un instant ✨" },
            { status: 500 }
        );
    }
}
