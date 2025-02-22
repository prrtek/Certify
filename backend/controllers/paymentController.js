import asyncHandler from "express-async-handler";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// To buy credits
export const buyCredits = asyncHandler(async (req, res) => {
  const { count } = req.body;

  if (isNaN(count) || count <= 0) {
    res.status(400);
    throw new Error("Invalid request, count must be a positive number");
  }

  if (count > 999999) {
    res.status(400);
    throw new Error("Amount to large");
  }

  const customer = await stripe.customers.create({
    metadata: {
      userId: req.user.id,
      creditsPurchased: count,
    },
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    customer: customer.id,
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: {
            name: "AutoCerti Credits",
          },
          unit_amount: 1 * 100,
        },
        quantity: count,
      },
    ],
    // phone_number_collection: {
    //     enabled: true,
    // },

    mode: "payment",
    success_url: `${process.env.CLIENT_URL}/account?payment_success=true`,
    cancel_url: `${process.env.CLIENT_URL}/account?payment_failed=true`,
  });

  res.json({ id: session.id });
});
