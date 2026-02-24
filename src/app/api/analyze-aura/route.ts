import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialisation du moteur interne
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

        // 2. NETTOYAGE CRUCIAL : Suppression du préfixe data:image/... si présent
        // Note: Dans notre cas, Buffer.toString('base64') ne met pas le préfixe, 
        // mais par sécurité on applique le nettoyage strict.
        const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

        // 3. Préparation du payload avec structure stricte
        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: file.type || "image/jpeg"
            }
        };

        const prompt = `Tu es une voyante Gen-Z sarcastique. Analyse cette photo. Détermine l'énergie de la personne en fonction de son expression, ses vêtements et la lumière. 
    Prends impérativement en compte l'arrière-plan et le décor autour de la personne pour juger son aura et faire tes vannes.
    
    Renvoie UNIQUEMENT un objet JSON avec 3 clés :
    - 'color': choisis une couleur d'aura parmi ['purple', 'red', 'blue', 'gold', 'dark', 'neon-green'].
    - 'score': un nombre entier dramatique entre -5000 et +99999 (les points d'aura).
    - 'description': une phrase courte (max 2 phrases) très sarcastique, drôle, utilisant de l'argot internet.`;

        console.log("--- CONNEXION À L'ÉTHER ---");
        // 4. Appel de l'API avec la syntaxe moderne recommandée
        const result = await model.generateContent([prompt, imagePart]);

        const response = await result.response;
        let responseText = response.text();
        console.log("LOG INTERNE (BRUT):", responseText);

        // 5. Nettoyage du JSON (enlever les balises markdown ```json ... ```)
        responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
            const aiResult = JSON.parse(responseText);
            return NextResponse.json({
                ...aiResult,
                image: `data:${file.type};base64,${base64Image}`, // On garde l'image complète pour le front
            });
        } catch (parseError) {
            console.error("ERREUR DE LECTURE DES SIGNES (JSON):", parseError);
            console.log("CHAÎNE TENTÉE :", responseText);
            return NextResponse.json(
                { error: "Les esprits ont divagué dans leur réponse. Retente le scan." },
                { status: 500 }
            );
        }

    } catch (error: any) {
        console.error("--- ERREUR CRITIQUE DANS LE RITUEL ---");
        console.error(error);

        return NextResponse.json(
            { error: "Les énergies cosmiques sont instables en ce moment. Réessaie dans un instant ✨" },
            { status: 500 }
        );
    }
}
