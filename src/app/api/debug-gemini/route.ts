import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();

    if (!apiKey) {
        return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    try {
        const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(listModelsUrl);

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({
                error: `Failed to list models (Status: ${response.status})`,
                details: errorText,
                url: listModelsUrl.replace(apiKey, "HIDDEN")
            }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json({
            success: true,
            models: data.models,
            count: data.models?.length || 0,
            keyLength: apiKey.length,
            keyStart: apiKey.substring(0, 4),
            keyEnd: apiKey.substring(apiKey.length - 4)
        });

    } catch (error: any) {
        return NextResponse.json({
            error: "Internal Server Error during model discovery",
            message: error.message
        }, { status: 500 });
    }
}
