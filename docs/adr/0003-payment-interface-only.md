# Payment is an interface only — no gateway wired up

Shopstart defines a `Payment` record shape and a `PaymentProvider` interface, but does not integrate a real gateway (Stripe or otherwise). We considered shipping a working Stripe integration as the template's reference implementation, since payment integration is normally the most tedious part of building a store and would be the single highest-value thing to hand adopters pre-built.

We chose the interface-only route instead: baking in one vendor would force that vendor's account setup, SDK, and webhook model onto every adopter regardless of what they actually want to use, mirroring the exact vendor-lock-in problem we removed by dropping Supabase. Adopters implement `PaymentProvider` against whatever gateway fits their store. This is a deliberate scope boundary, not an oversight — don't "complete" it by wiring in Stripe without revisiting this decision.
