# Diagrams (draw.io)

Editable draw.io source (`.drawio`) plus a rendered PNG export for each. Open the `.drawio`
files directly in [app.diagrams.net](https://app.diagrams.net) or the draw.io desktop app to
edit; the PNGs are what's embedded in docs/slides/reports.

| File | What it shows |
|---|---|
| `use-case-diagram.drawio` / `.png` | Actors (Guest, Customer, Carrier, Admin) and their use cases across the platform, including the shared `Login` use case and the `Create Shipment --include--> Get Shipping Quotes` relationship. |
| `er-diagram.drawio` / `.png` | Conceptual entity-relationship diagram across all three databases (PostgreSQL, MySQL, MongoDB), color-coded by engine. Solid ER lines are real foreign keys within one database; dashed red lines are cross-service logical references (e.g. `Shipment.customer_id -> User.id` across separate databases/services - no DB-enforced constraint, just a shared UUID). |
| `schema-diagram.drawio` / `.png` | Physical schema: every table/collection with its full column list, types, and keys, taken directly from each service's `db/migrate.js` (Postgres/MySQL) or Mongoose model (MongoDB) - this is the literal implemented schema, not just a design sketch. |

These complement (don't replace) the Mermaid versions in [`../architecture.md`](../architecture.md)
and [`../er-diagrams.md`](../er-diagrams.md), which render inline in GitHub/any Markdown viewer
without needing draw.io.
