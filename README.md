# Volatility Arbitrage Detector UI

A professional React application designed to visualize and analyze implied volatility surfaces, detect static arbitrage opportunities, and interact with the Volatility Arbitrage backend engine.

## Overview

This application provides a comprehensive dashboard for quantitative analysts and options traders to:
- **Visualize Volatility Surfaces**: Interactive 3D charts rendering raw and arbitrage-free volatility surfaces.
- **Detect Arbitrage**: Instantly identify calendar, butterfly, and monotonicity arbitrage violations using real-time data from the C++ computational engine.
- **Correct Surfaces**: Integrate with quadratic programming (QP) solvers to project invalid surfaces onto the arbitrage-free cone and view the corrected volatility smiles.
- **Real-time Engine Interaction**: Communicate seamlessly with the high-performance C++ arbitrage detection engine.

## Features

- **Interactive Market Data Upload**: Easily upload JSON market quotes representing options chains.
- **Advanced 3D Modeling**: Utilizing Plotly for rich, interactive top-down and 3D wireframe plots of the SVI-fitted surface.
- **Live Arbitrage Indicators**: Detailed tabular output highlighting specific points of butterfly or calendar arbitrage.
- **Responsive Modern Design**: Built with React, TypeScript, and Vite for lightning-fast performance and a dynamic, user-friendly interface using Tailwind CSS and Lucide React icons.

## Quick Start

### Prerequisites
- Node.js (v18+)
- Volatility Arbitrage backend execution engine

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Architecture

The frontend is built on a modern stack:
* **Framework**: React 18 + Vite
* **Language**: TypeScript
* **Styling**: Tailwind CSS for utility-first styling
* **Icons**: Lucide React
* **Charts**: Plotly.js for both 2D slices and complex 3D surface charts

The UI delegates heavy calculation to the highly optimized C++ mathematical engine, focusing on providing a seamless and highly responsive user experience.
