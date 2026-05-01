# Lensify

Lensify is a lightweight photography calculator for sensor size, focal length, and aperture equivalence.

It is built for one job: give photographers a fast, defensible answer without hiding the math behind a bloated app shell.

## What It Does

Lensify currently ships with two calculators:

- `Aperture equivalence`: converts a given aperture to its full-frame depth-of-field equivalent
- `Focal length analysis`: keeps the sensor fixed and shows what changes when you switch lenses

The focal length calculator now reports:

- original sensor and crop factor
- original focal length and new focal length
- input aperture
- DOF equivalent aperture
- original and new full-frame equivalent focal lengths
- original and new horizontal angle of view
- angle-of-view change
- perspective change
- relative framing area

## Note

Lensify is intentionally small.

The point is not to simulate every photographic decision or build a social product around calculators. The point is to preserve a clean tool that answers a narrow question correctly, quickly, and in a way that respects the physical model underneath. When the math is wrong, the product is wrong. When the product becomes heavy, the tool loses its reason to exist.

That constraint is part of the philosophy here: prefer correctness over novelty, clarity over feature count, and a small surface area over framework churn.

## Current Sensor Coverage

Lensify includes common camera and phone sensor formats, including:

- Medium Format
- Full Frame
- APS-H
- APS-C
- APS-C (Canon)
- Micro Four Thirds
- 1-inch
- common phone sensor classes down to `1/4-inch`

The current phone-facing list includes `1/1.12-inch` as the largest small-sensor preset.

## API

### Aperture equivalence

```txt
GET /api/calculate?sensorSize=aps-c&aperture=2.8
```

Example response:

```json
{
  "sensorSize": "APS-C",
  "sensorId": "aps-c",
  "cropFactor": 1.5,
  "inputAperture": 2.8,
  "equivalentAperture": 4.2
}
```

### Focal length analysis

```txt
GET /api/focal-equiv?originalSensor=full-frame&originalFocal=50&newFocal=85&aperture=2.8
```

Example response:

```json
{
  "originalSensor": {
    "id": "full-frame",
    "name": "Full Frame",
    "cropFactor": 1
  },
  "originalFocalLength": 50,
  "newFocalLength": 85,
  "inputAperture": 2.8,
  "equivalentAperture": 2.8,
  "originalEquivalentFocalLength": 50,
  "newEquivalentFocalLength": 85,
  "originalHorizontalAngleOfView": 39.6,
  "newHorizontalAngleOfView": 23.9,
  "angleOfViewChange": "-39.6%",
  "perspectiveChange": "70%",
  "relativeFramingArea": 0.35
}
```

## Architecture

Current deployment model:

- `lensify/public/`: static frontend
- `lensify/functions/api/`: Cloudflare Pages Functions API
- `lensify/lib/`: shared sensor data and calculation core
- `worker.js`: Cloudflare Worker entry for routed `/api` traffic and Pages proxying

The calculation core is shared between Worker and Pages Functions so the same request does not produce different answers depending on the path it took.

## Local Structure

```txt
.
├── lensify
│   ├── functions
│   │   └── api
│   ├── lib
│   └── public
├── worker.js
├── wrangler.example.toml
└── README.md
```

## Deployment

Production is deployed on Cloudflare:

- Pages project: `lensify`
- Worker: `lensify-calculator`

Typical deploy flow:

```bash
npx wrangler deploy
cd lensify
npx wrangler pages deploy public --project-name lensify
```

If you use the Worker route in production, set `PAGES_URL` in `wrangler.toml` or through Cloudflare environment variables so non-API requests proxy to the intended Pages origin.

## Development Notes

- Focal length inputs accept decimals
- Frontend calls the API through relative paths such as `/api/calculate`
- The frontend still contains a minimal local fallback for degraded cases, but the intended path is the shared API

## License

GPL v3. See [LICENSE](LICENSE).
