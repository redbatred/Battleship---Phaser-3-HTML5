# Battleship Game

A responsive Battleship game built with Phaser 3 and TypeScript.

## Features

- Responsive design that works on desktop and mobile devices
- Beautiful UI with animations and sound effects
- Classic Battleship gameplay
- Ship placement and rotation
- AI opponent (to be implemented)

## Technologies Used

- Phaser 3 - Game framework
- TypeScript - Type-safe JavaScript
- Webpack - Bundling and development server
- Rex UI Plugin - Enhanced UI components

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository or download the source code
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

### Development

To start the development server:

```bash
npm start
```

This will start a development server with hot reloading and automatically open your browser.

Alternative development commands:

```bash
npm run dev         # Basic webpack dev server
npm run dev:safe    # Kills any existing server on port 8080 before starting
npm run dev:robust  # Robust server start with error handling
```

To check for TypeScript errors:

```bash
npm run check-ts
```

### Building for Production

To build the game for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

- `src/` - Source code
  - `scenes/` - Phaser scenes (Boot, Preload, MainMenu, Game, GameOver)
  - `objects/` - Game objects (Ship, Grid)
  - `assets/` - Game assets (images, audio)
- `dist/` - Built files (created after building)
- `scripts/` - Utility scripts for development

## Game Controls

- Mouse/Touch - Select and place ships, make attacks
- Spacebar - Rotate ships during placement (to be implemented)

## Troubleshooting

If you encounter an `EADDRINUSE` error (port 8080 already in use), try:

```bash
npm run dev:safe
```

Or to kill the process manually:

```bash
node scripts/kill-server.js
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Phaser - https://phaser.io/
- Rex's Plugins for Phaser 3 - https://rexrainbow.github.io/phaser3-rex-notes/docs/site/ 