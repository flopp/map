# map

`map` is a TypeScript + Leaflet web application for planning, annotating, and sharing map-based data.
It is a reimplementation of [FloppsMap](https://github.com/flopp/FloppsMap) using Leaflet.

Production deployment: <https://flopp.net/>

## Features

- Interactive Leaflet map with multiple map types
- Marker and line management for route planning
- Distance and coordinate utilities
- Link sharing for map state
- Geolocation support ("locate me")
- Localized UI (English, German, French)
- Optional dialogs for projections, multi-marker workflows, and map tools

## Tech Stack

- TypeScript
- Leaflet
- Webpack
- Sass + Bulma
- i18next
- Vitest
- ESLint + Prettier

## Getting Started

### Prerequisites

- Node.js (current LTS recommended)
- npm

### Install Dependencies

```sh
make setup
```

## Development

Start the local development server:

```sh
make run-dev
```

This launches `webpack-dev-server` and opens the app in your browser.

## Build

Create a production build in `dist/`:

```sh
make build
```

The build step also generates version metadata files used by the app.

## Quality Checks

Run linting:

```sh
make lint
```

Run tests:

```sh
make test
```

Run spell checking for source files:

```sh
make spell
```

## Internationalization

Translations are stored in:

- `src/lang/en/translation.json`
- `src/lang/de/translation.json`
- `src/lang/fr/translation.json`

Update translation keys with:

```sh
make update-translation
```

## License

MIT, see [LICENSE](LICENSE).
