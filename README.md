# YanGo Smart Mobility Platform

A working front-end implementation of the **YanGo Smart Mobility Platform** for
PT. LinkIT 360 · GovTech — pilot tenant **Yangon Region Transport Committee (YRTC)**.

Six channels, **one codebase, one shared database**. What an operator files in Licensing becomes the
permit the Operator Portal plans against, the shift the Driver App can start, the bus the Citizen App
can sell a seat on, and the line the Authority Console measures. Nothing is re-keyed.

---

## One repository, one branch per portal

`main` holds the whole platform and builds the combined hub. Each portal has a branch that is
`main` plus a single pinned build variable, so it deploys on its own URL without a second copy of
the source.

| Branch | Portal | For | Live |
|---|---|---|---|
| `main` | All portals behind one hub | Demo and review | https://yango-platform.vercel.app |
| `citizen` | Citizen App | Passengers | https://yango-citizen.vercel.app |
| `driver` | Driver App | Bus drivers and crew | https://yango-driver.vercel.app |
| `operator` | Bus Operator Portal | Licensed bus companies | https://yango-operator.vercel.app |
| `licensing` | Licensing Portal | Applicants and licensing officers | https://yango-licensing.vercel.app |
| `authority` | Authority Console | YRTC, the ministry and auditors | https://yango-authority.vercel.app |
| `board` | Public departure board | Terminal hall displays | https://yango-terminal.vercel.app |

**Work on `main`.** To carry a change into the portals:

```bash
for b in citizen driver operator licensing authority board; do
  git checkout $b && git merge main --no-edit
done
git checkout main
```

A portal branch differs from `main` only in the `dev` and `build` scripts in `package.json`
(`VITE_PORTAL=<portal>`) and in this README, so those merges stay clean.

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
| Bus Operator Portal | 26 | Fleet, drivers, roster, schedules, fares, boarding, refunds, settlement, compliance |
| Licensing Portal | 15 | Application wizard, invoice, verification, inspection, approval with maker–checker |
| Authority Console | 42 | Command centre, incidents, SOS, compliance, licensing oversight, terminals, content, ads, admin |
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
