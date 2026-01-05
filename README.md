# CosmosBuilder

A realistic, massive space simulation built with Three.js.

## Features

- **N-Body Physics**: Barnes-Hut Octree implementation for simulating thousands of bodies.
- **Realistic Rendering**: Procedural star shaders, atmospheric scattering, and trail rendering.
- **Massive Content**:
  - Procedurally generated Star Catalog (>3000 stars).
  - Exoplanet and Asteroid catalogs.
  - Deep Mechanics: Chemistry engine (Material Database) and Civilization engine (Tech Tree, Events).
- **Interactive UI**: Inspect planets, view composition, population, and technology levels.

## Installation & Running

This project uses modern JavaScript modules and requires a local development server to run correctly. **Opening `index.html` directly in your browser will NOT work** due to browser security restrictions (CORS).

1.  **Install Node.js**: Ensure you have Node.js installed on your computer.
2.  **Install Dependencies**:
    Open a terminal in the project folder and run:
    ```bash
    npm install
    ```
3.  **Run the Simulation**:
    Start the local development server:
    ```bash
    npm run dev
    ```
4.  **Open in Browser**:
    Click the link shown in the terminal (usually `http://localhost:5173` or `http://localhost:3000`).

## Controls

- **Left Click + Drag**: Rotate Camera
- **Right Click + Drag**: Pan Camera
- **Scroll**: Zoom
- **Click on a Body**: Select it to view details (Mass, Radius, Composition, Civilization stats).
- **GUI Panel**:
  - **Time Speed**: Speed up or slow down time.
  - **Gravity G**: Adjust gravitational constant.
  - **Load Scenario**: Switch between Solar System, Galaxy, Massive Catalog, etc.
