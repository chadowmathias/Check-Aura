import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// Liste des modèles à essayer par ordre de préférence (Flash > Pro > Vision)
const MODELS_TO_TRY = [
    "gemini-1.5-flash",        // Standard current
    "gemini-1.5-flash-latest", // Latest alias
    "gemini-1.5-flash-001",    // Specific version
    "gemini-1.5-flash-002",    // Newer specific version
    "gemini-1.5-pro",          // Fallback to Pro
    "gemini-1.5-pro-latest",   // Pro alias
    "gemini-pro-vision"        // Legacy fallback (might be deprecated but worth a shot)
];

async function generateWithFallback(prompt: string, imagePart: any) {
    let lastError = null;

    for (const modelName of MODELS_TO_TRY) {
        try {
            console.log(` Tentative avec le modèle : ${modelName}`);
            // On ne force pas la version API ici, on laisse le SDK gérer (défaut v1 ou v1beta selon le modèle)
            const model = genAI.getGenerativeModel({ model: modelName });

            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();

            if (text) {
                console.log(` SUCCÈS avec ${modelName}`);
                return text;
            }
        } catch (error: any) {
            console.warn(` Échec avec ${modelName}: ${error.message}`);
            lastError = error;
            // On continue vers le prochain modèle si c'est une 404 ou 503
            if (error.status === 404 || error.message?.includes("not found") || error.status === 503) {
                continue;
            }
            // Pour les autres erreurs (ex: API key invalid), on arrête peut-être ?
            // Dans le doute, on continue la boucle de fallback pour être robuste.
        }
    }

    throw lastError || new Error("Tous les modèles ont échoué.");
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

        console.log("--- CONNEXION À L'ÉTHER (v0.1.2) ---");

        // Appel avec mécanisme de fallback
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
