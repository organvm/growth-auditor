import { NextResponse } from "next/server";
import Stripe from "stripe";
import { LRUCache } from "lru-cache";

const stripeSecret = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";
const stripe = new Stripe(stripeSecret, {
  apiVersion: "2026-02-25.clover",
});
const stripeProPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "price_placeholder_pro";

const rateLimit = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 60,
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const currentUsage = (rateLimit.get(ip) as number) || 0;
    
    if (currentUsage >= 10) {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
    }
    rateLimit.set(ip, currentUsage + 1);

    const { email, priceId } = await request.json();

    if (!email || !priceId) {
      return NextResponse.json({ error: "Email and priceId are required" }, { status: 400 });
    }

    if (priceId === "price_placeholder_pro" || stripeProPriceId === "price_placeholder_pro") {
      return NextResponse.json({ error: "NEXT_PUBLIC_STRIPE_PRO_PRICE_ID must be set for Pro subscriptions" }, { status: 500 });
    }

    if (stripeSecret === "sk_test_placeholder") {
      console.warn("Using placeholder Stripe key. Simulating subscription checkout URL.");
      return NextResponse.json({ url: "https://checkout.stripe.com/pay/cs_test_mock123" });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${baseUrl}/results?success=true&subscription=active`,
      cancel_url: `${baseUrl}/settings?canceled=true`,
      subscription_data: {
        metadata: {
          userEmail: email,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Subscription Checkout Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
