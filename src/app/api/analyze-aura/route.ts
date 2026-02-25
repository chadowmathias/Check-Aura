import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialisation du moteur interne (Revert 1.5 pour bypass quota 2.0)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
// Utilisation explicite de 'gemini-1.5-flash' (standard) et FORCAGE DE L'API V1
// pour éviter les erreurs 404 sur les endpoints v1beta instables ou restreints
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: "v1" });

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
        const result = await model.generateContent([prompt, imagePart]);

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
