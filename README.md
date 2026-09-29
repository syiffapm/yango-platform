# YanGo — All portals (hub)

The combined build: every portal behind one hub, sharing one database, so the cross-portal chain can be demonstrated end to end.

**Live:** https://yango-platform.vercel.app
**For:** Demo and review

---

## What this is

Part of the **YanGo Smart Mobility Platform** built for PT. LinkIT 360 · GovTech, pilot tenant
**Yangon Region Transport Committee (YRTC)**. Six channels share one codebase and one seeded
database: what an operator files in Licensing becomes the permit the Operator Portal plans against,
the shift the Driver App can start, the bus the Citizen App can sell a seat on, and the line the
Authority Console measures. Nothing is re-keyed.

This repository builds the **combined hub**: every portal behind one deployment, which is how the
cross-portal chain is demonstrated on a single shared database.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173/
npm run build    # production bundle in dist/
npm run preview  # serve the built bundle
```

## Data

Yangon bus line numbers, end points and the companies holding them come from the public
[Yangon bus route directory](https://yangonbusroute.com/) and the YRTC route-map announcement:
20 instrumented YBS lines plus a register of all 133 published lines. Fares follow the reported
K400 cash fare with the YPS card and YPS QR discount.

> Directory data — to be reconciled with YRTC before production use. Coordinates for stops not yet
> surveyed are approximate; contact and banking details in the demo dataset are synthetic.

The database is seeded deterministically into `localStorage` on first load, so every visitor sees a
complete, self-consistent system with no backend.

## Stack

Vite · React 19 · React Router 7 · Tailwind CSS v4 · Leaflet + OpenStreetMap · Recharts

## The other portals

| Portal | Repository |
|---|---|
| [Citizen App](https://yango-citizen.vercel.app) | `yango-citizen` |
| [Driver App](https://yango-driver.vercel.app) | `yango-driver` |
| [Bus Operator Portal](https://yango-operator.vercel.app) | `yango-operator` |
| [Licensing Portal](https://yango-licensing.vercel.app) | `yango-licensing` |
| [Authority Console](https://yango-authority.vercel.app) | `yango-authority` |
| [Public Departure Board](https://yango-terminal.vercel.app) | `yango-terminal` |
| [All portals (hub)](https://yango-platform.vercel.app) | `yango-platform` |

## Specification

The end-to-end solution and API specification — 183 endpoints across 12 domains, the front-end map,
the tracking and maps engine, and the AI scope — lives in the
[`yango-platform`](https://yango-platform.vercel.app) repository under `docs/`.

## Licence

© PT. LinkIT 360. Demonstration build.
