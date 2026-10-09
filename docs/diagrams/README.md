# Diagrams (draw.io)

Editable draw.io source (`.drawio`) plus a rendered PNG export for each. Open the `.drawio`
files directly in [app.diagrams.net](https://app.diagrams.net) or the draw.io desktop app to
edit; the PNGs are what's embedded in docs/slides/reports.

| File | What it shows |
|---|---|
| `use-case-diagram.drawio` / `.png` | Actors (Guest, Customer, Carrier, Admin) and their use cases across the platform, including the shared `Login` use case and the `Create Shipment --include--> Get Shipping Quotes` relationship. |
| `er-diagram.drawio` / `.png` | Conceptual entity-relationship diagram across all three databases (PostgreSQL, MySQL, MongoDB), color-coded by engine. Solid ER lines are real foreign keys within one database; dashed red lines are cross-service logical references (e.g. `Shipment.customer_id -> User.id` across separate databases/services - no DB-enforced constraint, just a shared UUID). |
| `data-flow-diagram.drawio` / `dfd-level0.png`, `dfd-level1.png`, `dfd-level2.png` | Leveled data-flow diagram (Gane-Sarson) in **three pages** of one `.drawio` file, one PNG per page. **L0** context: the platform as a single process with its four roles and the SMTP relay. **L1** decomposition: eleven processes behind the gateway, each with its own store, plus the quote flow, the SOAP hop, and the fire-and-forget analytics bus. **L2**: explosion of process 5.0, the create-shipment path, end to end. Traced from the gateway's real prefix table and the actual inter-service clients, not from the spec. |
| `schema-diagram.drawio` / `.png` | Physical schema: every table/collection with its full column list, types, and keys, taken directly from each service's `db/migrate.js` (Postgres/MySQL) or Mongoose model (MongoDB) - this is the literal implemented schema, not just a design sketch. |
| [`sequence-diagrams.md`](../sequence-diagrams.md) | Master guide containing three complete sequence diagrams with Actors, Lifelines, Messages, `alt`/`loop` constructs, and Viva Defense Guide. |
| `sequence-diagram-shipment-creation.drawio` / `.jpg` | Scenario 1: End-to-End Shipment Creation & Dynamic Pricing with SOAP WSDL Partner Fallback. |
| `sequence-diagram-carrier-update.drawio` / `.jpg` | Scenario 2: Carrier Shipment Status Update, State Machine Check, OCC Versioning, and Subscriber Notifications. |
| `sequence-diagram-graphql-dashboard.drawio` / `.jpg` | Scenario 3: Unified GraphQL Dashboard Aggregation with Opossum Circuit Breaker and Exponential Backoff Retries. |

The DFD has a page count, so it lives as one multi-page `.drawio`; draw.io exports one PNG per
page. To re-export after editing (draw.io desktop CLI, pages are **1-based**):

```bash
for n in 1 2 3; do
  drawio -x -f png -p $n --scale 2 --border 20 -o "dfd-level$((n-1)).png" data-flow-diagram.drawio
done
```

These complement (don't replace) the Mermaid versions in [`../architecture.md`](../architecture.md)
and [`../er-diagrams.md`](../er-diagrams.md), which render inline in GitHub/any Markdown viewer
without needing draw.io. A narrative, annotated walk-through of the same three levels is in
[`../data-flow-diagram.html`](../data-flow-diagram.html).
