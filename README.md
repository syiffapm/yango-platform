# YanGo Smart Mobility Platform

A working front-end implementation of the **YanGo Smart Mobility Platform** for
PT. LinkIT 360 · GovTech — pilot tenant **Yangon Region Transport Committee (YRTC)**.

Six channels, **one codebase, one shared database**. What an operator files in Licensing becomes the
permit the Operator Portal plans against, the shift the Driver App can start, the bus the Citizen App
can sell a seat on, and the line the Authority Console measures. Nothing is re-keyed.

---

## One branch, one deployment per portal

There is one branch: `main`. Which portal a build serves is decided at **deploy time**, not in git —
each Vercel project sets `VITE_PORTAL` in its own environment, so the same commit produces a
different single-portal bundle per project.

| Portal | `VITE_PORTAL` | For | Live |
|---|---|---|---|
| All portals behind one hub | *(unset)* | Demo and review | https://yango-platform.vercel.app |
| Citizen App | `citizen` | Passengers | https://yango-citizen.vercel.app |
| Driver App | `driver` | Bus drivers and crew | https://yango-driver.vercel.app |
| Bus Operator Portal | `operator` | Licensed bus companies, including their licence applications | https://yango-operator.vercel.app |
| Authority Console | `authority` | YRTC, the ministry and auditors — including licence approval and the CMS | https://yango-authority.vercel.app |
| Public departure board | `board` | Terminal hall displays | https://yango-terminal.vercel.app |

Run any portal locally the same way:

```bash
VITE_PORTAL=citizen npm run dev    # citizen | driver | operator | authority | board
```

Long-lived branches that only differ by a build flag are not version control — they are copies that
can never be merged back. Keeping the difference in deployment configuration leaves git doing the
job it is for.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
npm run preview
```

To run a single portal from `main` without switching branch:

```bash
VITE_PORTAL=citizen npm run dev    # citizen | driver | operator | licensing | authority | board
```

## What is in it

| Channel | Screens | Notes |
|---|---|---|
| Citizen App | 26 | Search → line → departure → seat → passenger → pay → e-ticket → check-in → live trip |
| Driver App | 14 | Shift check-in with face match and bus QR, manifest, inspection, fatigue, SOS |
| Bus Operator Portal | 34 | Fleet, drivers, roster, schedules, fares, boarding, refunds, settlement, compliance — and the company's own licence applications, renewals and invoices |
| Authority Console | 49 | Command centre, incidents, SOS, compliance, licence approval with maker–checker, terminals, CMS (content, messaging, advertising), admin |
| Public pages | 3 | Departure board, permit verification, solution blueprint |

## Data

Yangon bus line numbers, end points and the companies holding them come from the public
[Yangon bus route directory](https://yangonbusroute.com/) and the YRTC route-map announcement:
**20 instrumented YBS lines** with stop sequences, timetables and tracking, plus a register of all
**133 published lines**. Fares follow the reported K400 cash fare with the YPS card and YPS QR
discount. Highway services run in both directions between the modelled terminals.

> Directory data — to be reconciled with YRTC before production use. Coordinates for stops not yet
> surveyed are approximate; contact and banking details in the demo dataset are synthetic.

The database is seeded deterministically into `localStorage` on first load, so every visitor sees a
complete, self-consistent system with no backend.

## Languages

English and Myanmar across all six channels, with two independent switches: the passenger and driver
language lives in their session, the console language lives on the workstation. Neither leaks into
the other.

## Specification

[`docs/YanGo-Solution-and-API-Specification.pdf`](docs/YanGo-Solution-and-API-Specification.pdf) —
33 pages: 183 API endpoints across 12 domains, the per-portal API scope, the front-end map, the
tracking and maps engine, the AI scope, external integrations and the non-functional targets.

## Stack

Vite · React 19 · React Router 7 · Tailwind CSS v4 · Leaflet + OpenStreetMap · Recharts

## Licence

© PT. LinkIT 360. Demonstration build.
