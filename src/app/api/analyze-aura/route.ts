import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialisation du moteur de vibration (Gemini) - Interne
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

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

        // Validation de la taille (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: "L'énergie de cette image est trop lourde pour nos canaux. (Max 10MB)" },
                { status: 400 }
            );
        }

        // Conversion pour le moteur interne
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString("base64");

        const prompt = `Tu es une voyante Gen-Z sarcastique. Analyse cette photo. Détermine l'énergie de la personne en fonction de son expression, ses vêtements et la lumière. 
    Prends impérativement en compte l'arrière-plan et le décor autour de la personne pour juger son aura et faire tes vannes.
    
    Renvoie UNIQUEMENT un objet JSON avec 3 clés :
    - 'color': choisis une couleur d'aura parmi ['purple', 'red', 'blue', 'gold', 'dark', 'neon-green'].
    - 'score': un nombre entier dramatique entre -5000 et +99999 (les points d'aura).
    - 'description': une phrase courte (max 2 phrases) très sarcastique, drôle, utilisant de l'argot internet.`;

        console.log("--- CONNEXION À L'ÉTHER ---");
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: file.type
                }
            }
        ]);

        const responseObject = await result.response;
        const textResponse = responseObject.text();
        console.log("LOG INTERNE (BRUT):", textResponse);

        // Extraction JSON robuste
        let jsonString = textResponse;
        const jsonBlockMatch = textResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonBlockMatch) {
            jsonString = jsonBlockMatch[1];
        } else {
            const bracesMatch = textResponse.match(/\{[\s\S]*\}/);
            if (bracesMatch) {
                jsonString = bracesMatch[0];
            }
        }

        try {
            const aiResult = JSON.parse(jsonString.trim());
            return NextResponse.json({
                ...aiResult,
                image: `data:${file.type};base64,${base64Image}`,
            });
        } catch (parseError) {
            console.error("ERREUR DE LECTURE DES SIGNES (JSON):", parseError);
            console.log("CHAÎNE ANALYSÉE :", jsonString);
            return NextResponse.json(
                { error: "Les esprits ont divagué dans leur réponse. Retente le scan." },
                { status: 500 }
            );
        }

    } catch (error: any) {
        console.error("--- ERREUR CRITIQUE DANS LE RITUEL ---");
        console.error(error); // Log complet pour le débug F12/Terminal

        // Message "Marque Blanche" pour l'utilisateur
        return NextResponse.json(
            { error: "Les énergies cosmiques sont instables en ce moment. Réessaie dans un instant ✨" },
            { status: 500 }
        );
    }
}
