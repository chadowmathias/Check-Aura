import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialisation Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(req: NextRequest) {
    try {
        const data = await req.formData();
        const file: File | null = data.get("file") as unknown as File;

        if (!file) {
            return NextResponse.json(
                { error: "Aucune image n'a été reçue. Les esprits sont brouillés." },
                { status: 400 }
            );
        }

        // Conversion du fichier en base64 pour Gemini
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString("base64");

        // Analyse IA (Gemini 1.5 Flash)
        const prompt = `Tu es une voyante Gen-Z sarcastique. Analyse cette photo. Détermine l'énergie de la personne en fonction de son expression, ses vêtements et la lumière. 
    Prends impérativement en compte l'arrière-plan et le décor autour de la personne (chambre en désordre, miroir sale, lieu luxueux, etc.) pour juger son aura et faire tes vannes.
    
    Renvoie UNIQUEMENT un objet JSON avec 3 clés :
    - 'color': choisis une couleur d'aura parmi ['purple', 'red', 'blue', 'gold', 'dark', 'neon-green'].
    - 'score': un nombre entier dramatique entre -5000 et +99999 (les points d'aura).
    - 'description': une phrase courte (max 2 phrases) très sarcastique, drôle, utilisant de l'argot internet (ex: 'vibe de main character', 'red flag ambulant', 'tu portes cette tenue non ironiquement ?').`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: file.type
                }
            }
        ]);

        const textResponse = result.response.text();
        // Nettoyage de la réponse pour extraire le JSON si Gemini ajoute du markdown
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        const aiResult = JSON.parse(jsonMatch ? jsonMatch[0] : "{}");

        return NextResponse.json({
            ...aiResult,
            image: `data:${file.type};base64,${base64Image}`,
        });

    } catch (error) {
        console.error("Gemini API Error:", error);
        return NextResponse.json(
            { error: "Les esprits sont brouillés aujourd'hui (Gemini est fatigué), réessaie plus tard." },
            { status: 500 }
        );
    }
}
