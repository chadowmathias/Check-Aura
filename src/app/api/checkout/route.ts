import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe lazily to avoid build errors if env var is missing
let stripeInstance: Stripe | null = null;

const getStripe = () => {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      // Return null or throw a specific error that can be caught
      throw new Error("Missing STRIPE_SECRET_KEY environment variable");
    }
    stripeInstance = new Stripe(key, {
      apiVersion: "2023-10-16" as any,
    });
  }
  return stripeInstance;
};

export async function POST(req: NextRequest) {
  try {
    let stripe;
    try {
        stripe = getStripe();
    } catch (configError: any) {
        console.error("Configuration Error:", configError.message);
        return NextResponse.json(
            { error: "Configuration Stripe incomplète (Clé secrète manquante).", details: configError.message },
            { status: 500 }
        );
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "AuraCheck Premium - Sans Filigrane & HD",
              description: "Débloque ton aura cosmique en haute définition, sans aucune marque.",
              images: ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"],
            },
            unit_amount: 99, // 0.99 EUR in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/?payment=success`,
      cancel_url: `${origin}/?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la création de la session de paiement.", details: err.message },
      { status: 500 }
    );
  }
}
