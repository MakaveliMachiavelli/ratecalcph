# RateCalcPH — Freelancer Rate Calculator (free + PRO ₱99)

**Live:** https://makavelimachiavelli.github.io/ratecalcph/

## What it is
"Ano ang tamang singil mo?" — target net income + expenses + effective tax + billable % + dead-months buffer → **hourly / day / weekly / monthly retainer / 5-day project rates**, with a Taglish explanation line showing the derivation. PRO: service-menu builder (per-service pricing from your rate) + CSV price list.

## Persona & positioning
The pricing step of the Closer funnel: Closer (find clients) → RateCalcPH (price your work) → InvoicePH (bill) → TaxCalcPH (pay correct tax). PH freelancers setting Upwork/direct rates. Demand note (honest): rate *calculators* are mostly free content; the *paid* market is pricing courses/ebooks and template packs — this product's edge is funnel synergy + PH-specific taxes/buffers rather than a standalone paid niche.

## Math (tested)
grossMonthly = (net + expenses) × 12 / (1 − tax%) / (working months fraction); billableHours = h/wk × 4.33 × billable%; hourly = grossMonthly / billableHours. Defaults (₱40k net, ₱5k exp, 8%, 40h, 60%, 10% buffer) → ₱523.11/hr.

## Verification
21/21 jsdom assertions (rate math, all levers, service cap → paywall, PRO, CSV, persistence).

## Deploy
`../toolkit/deploy-pages.sh . ratecalcph`
