# 🚆 RailBD Journey — Bangladesh Railway Journey Simulator

**Explore Bangladesh, one railway journey at a time.**

RailBD Journey is a browser-based railway journey simulator inspired by the charm of 2D pixel-art train games. Experience a virtual train journey through Bangladesh-inspired landscapes, featuring animated trains, interactive railway routes, dynamic weather, a simulated day-and-night cycle, and immersive railway sound effects.

The project aims to bring the atmosphere of a Bangladesh railway journey to life through interactive visuals, synchronized simulation systems, and contextual audio.

## ✨ Features

### 🚂 Train Simulation
- Animated 2D pixel-art train movement.
- Train speed and journey progress simulation.
- Railway track movement and environmental animations.
- Station arrival, stopping, and departure sequences.
- Smooth transitions between different journey states.

### 🗺️ Interactive Railway Map
- Interactive map displaying the selected railway route.
- Animated train marker synchronized with the train journey.
- Route progress and station information.
- Support for structured railway route and station data.
- Clear distinction between verified railway routes and illustrative demo routes.

### 🌄 Animated Bangladesh-Inspired Landscapes
Explore original pixel-art scenery inspired by Bangladesh, including:
- Green rice fields and rural villages.
- Palm trees and countryside landscapes.
- Rivers, railway bridges, and open fields.
- Railway stations and platforms.
- Atmospheric backgrounds with parallax scrolling.

### 🌦️ Dynamic Weather System
Choose different simulated weather conditions:
- ☀️ Sunny
- 🌤️ Partly Cloudy
- ☁️ Overcast
- 🌧️ Rainy
- 🌫️ Foggy
- ⛈️ Stormy

Weather conditions influence the visual atmosphere and, where implemented, environmental audio.

### 🌅 Day-and-Night Cycle
- Simulated morning, afternoon, evening, and night.
- Adjustable simulation speed.
- Smooth transitions in scene lighting.
- Journey progression synchronized with simulated time.

### 🔊 Immersive Railway Audio
The planned audio system supports context-aware sound effects, including:

- Train wheels rolling along railway tracks.
- Engine and carriage movement ambience.
- Train horn with manual controls.
- Braking and stopping sounds.
- Railway station crowd ambience.
- Platform activity and Bengali announcements.
- Rain, wind, thunder, and countryside ambience.
- Smooth audio transitions during station arrivals and departures.
- Independent volume controls and mute options.

*Audio availability depends on the sound assets installed and the features implemented in the current build.*

### 🎮 Interactive Controls
- Start, pause, and resume the journey.
- Adjust simulation speed.
- Change simulated weather conditions.
- Control train horn and audio settings.
- View journey progress and station information.
- Interact with the railway map.

## 🛠️ Technology Stack

The planned technology stack includes:

| Technology | Purpose |
|---|---|
| React | User interface |
| TypeScript | Type-safe application development |
| Vite | Development server and build tooling |
| Tailwind CSS | Styling and responsive layouts |
| PixiJS | 2D pixel-art rendering and animation |
| MapLibre GL JS | Interactive railway route map |
| GeoJSON | Route geometry and geographic data |
| Zustand | Shared simulation state management |
| Vitest | Unit and integration testing |
| Playwright | Browser-based end-to-end testing |

*The final technology list should reflect the dependencies actually installed in the repository.*

## 🏗️ Application Architecture

RailBD Journey is designed around a shared simulation engine.

The train animation, route map, weather, time of day, and audio system use the same authoritative simulation state to keep the experience synchronized.

```text
                 RailBD Journey
                        |
                Simulation Engine
                        |
          +-------------+-------------+
          |             |             |
      Train State    World State   Journey State
          |             |             |
       PixiJS       Weather & Time   Route Map
          |             |             |
          +-------------+-------------+
                        |
                   Audio Engine
                        |
           Train, Horn, Station & Weather
                    Sound Effects
```

This architecture helps prevent inconsistencies between the train's visual position, map marker, journey progress, and contextual sound effects.

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) — a version supported by the project's dependencies.
- npm, included with Node.js.
- Git.

### Installation

**1. Clone the repository**

Replace the placeholder below with your actual GitHub repository URL.

```bash
git clone https://github.com/YOUR_USERNAME/railbd-journey.git
```

**2. Open the project directory**

```bash
cd railbd-journey
```

**3. Install dependencies**

```bash
npm install
```

**4. Start the development server**

```bash
npm run dev
```

Open the local URL printed in your terminal, usually:

```text
http://localhost:5173
```

### Production Build

Build the project for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Run tests if the corresponding scripts are configured:

```bash
npm run test
```

```bash
npm run test:e2e
```

Check `package.json` for the actual available scripts.

## 🔊 Audio Assets

Audio assets should be stored in an organized directory structure, for example:

```text
public/
└── audio/
    ├── train/
    ├── horn/
    ├── station/
    ├── crowd/
    ├── announcements/
    ├── weather/
    ├── environment/
    └── ui/
```

Use properly licensed audio files or original recordings. Keep track of asset sources, licensing conditions, and attribution requirements.

Do not assume that every audio category is available until its files have been added and tested.

## 🗺️ Railway Route Data

Routes should contain structured station information, geographic coordinates, route geometry, and verification status.

Illustrative routes may be used for development and demonstrations, but they must not be presented as verified real-world railway connections.

Before publishing a route as accurate, verify its station sequence and geographic data against reliable sources. Follow the applicable terms and attribution requirements for map data.

## 📱 Responsive Design

The interface is intended to support desktop and mobile browsers, with responsive controls and layouts that preserve the main journey experience across screen sizes.

## 🧪 Testing and Quality

The project aims to test:
- Train movement and simulation progression.
- Synchronization between the train animation and map marker.
- Weather and time transitions.
- Station arrival and departure behavior.
- Audio playback controls and sound transitions.
- Missing asset handling.
- Responsive interface behavior.
- Production build reliability.

## 🛣️ Roadmap

- [ ] Complete the core train journey simulation.
- [ ] Implement original pixel-art scenery and train animations.
- [ ] Synchronize train movement with the interactive route map.
- [ ] Add configurable time and weather simulation.
- [ ] Implement train horn and movement sound effects.
- [ ] Add station crowd ambience and Bengali announcements.
- [ ] Expand the library of verified railway routes.
- [ ] Improve mobile responsiveness and accessibility.
- [ ] Add automated tests and optimize performance.
- [ ] Deploy a public playable version.

## 🎨 Design Philosophy

RailBD Journey takes inspiration from the relaxing atmosphere of 2D pixel-art train games while developing its own Bangladesh-inspired identity.

The goal is to combine the charm of a side-scrolling railway journey with an interactive map, contextual sound design, and a dynamic simulation of the surrounding environment.

All original artwork, UI elements, and code should be developed independently. The project does not require proprietary assets from other games.

## 🤝 Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement and test your changes.
4. Commit your work with a descriptive message.
5. Open a pull request explaining your changes.

Please ensure that contributed assets have appropriate licenses.

## 📄 License

Choose and add an appropriate open-source license before distributing the project. Until a license is included, the repository should not be assumed to grant permission for unrestricted reuse.

## 👨‍💻 Author

**Nahin Arafat**

- GitHub: [@araf212](https://github.com/araf212)
- Portfolio: [Nahin Arafat](https://github.com/araf212/animated-portfolio-Nahin)

---

*RailBD Journey — Experience the beauty of Bangladesh through a virtual railway journey.* 🚆🇧🇩
