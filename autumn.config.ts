import { feature, plan, item } from "atmn";

export const bookings = feature({
  id: "bookings",
  name: "Bookings",
  type: "metered",
  consumable: false,
});

export const aiMessages = feature({
  id: "ai_messages",
  name: "AI Messages",
  type: "metered",
  consumable: true,
});

export const free = plan({
  id: "free",
  name: "Free",
  autoEnable: true,
  items: [
    item({ featureId: bookings.id, included: 5, reset: { interval: "month" } }),
    item({ featureId: aiMessages.id, included: 20, reset: { interval: "month" } }),
  ],
});

export const pro = plan({
  id: "pro",
  name: "Pro",
  price: { amount: 7900, interval: "month" },
  items: [
    item({ featureId: bookings.id, included: 0, unlimited: true }),
    item({ featureId: aiMessages.id, included: 500, reset: { interval: "month" } }),
  ],
});

export const elite = plan({
  id: "elite",
  name: "Elite",
  price: { amount: 14900, interval: "month" },
  items: [
    item({ featureId: bookings.id, included: 0, unlimited: true }),
    item({ featureId: aiMessages.id, included: 0, unlimited: true }),
  ],
});

export default {
  features: [bookings, aiMessages],
  plans: [free, pro, elite],
};
