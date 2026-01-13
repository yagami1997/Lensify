# <div align="center">Lensify 📷 ✨</div>

<div align="center">
  <img src="https://img.shields.io/badge/License-GPL_v3-blue.svg" alt="GPL v3">
  <img src="https://img.shields.io/badge/platform-Cloudflare_Workers-orange" alt="Cloudflare Workers">
  <img src="https://img.shields.io/badge/JavaScript-ES6-yellow" alt="ES6">
  <img src="https://img.shields.io/badge/CSS-Custom-blueviolet" alt="Custom">
  <img src="https://img.shields.io/badge/status-active-success" alt="active">
</div>

<div align="center">
  <strong>Precision tools for photographers and filmmakers - anywhere, anytime</strong>
</div>

<div align="center">
  <a href="https://lensify.kyowarp.com/">Live Demo</a> |
  <a href="#documentation">Documentation</a> |
  <a href="#installation">Installation</a> |
  <a href="#features">Features</a> |
  <a href="#api">API</a>
</div>

## 🌟 Overview

Lensify is a comprehensive calculator that helps photographers and cinematographers understand the complex relationships between sensor sizes, focal lengths, and apertures. Whether you're switching between cameras with different sensors or exploring the impact of changing lenses, Lensify provides precise calculations to help you visualize the results.

Perfect for:
- Professional photographers comparing equipment across platforms
- Filmmakers planning shots with various camera systems
- Smartphone photographers exploring the capabilities of mobile sensors
- Photography educators explaining sensor and lens relationships
- Digital nomads who need reliable creative tools on the go

## ✨ Features

### 📐 Sensor Size Calculations
- Support for **30+ sensor formats** from Medium Format to smartphone 1/4-inch sensors
- Accurate crop factor calculations with 2 decimal precision
- Dynamic equivalent sensor size determination when changing focal lengths

### 🌓 Aperture Equivalence
- F-stop conversion between different sensor formats
- Depth of field equivalence calculations
- Real-world light gathering comparisons

### 📏 Focal Length Analysis
- Field of view changes when switching focal lengths
- Perspective compression/expansion effects
- Equivalent focal length matching across different sensor formats

### 🚀 Technical Architecture
- **Frontend**: Vanilla JavaScript with custom CSS styling
- **Backend**: Serverless Cloudflare Workers API
- **Deployment**: Cloudflare Pages
- **Offline Support**: Local calculation fallbacks when API is unavailable

## 💻 Technical Implementation

### Architecture Overview

Lensify follows a hybrid architecture that balances serverless computing with client-side functionality:

1. **Static Frontend**: HTML/CSS/JS hosted on Cloudflare Pages
2. **API Backend**: Cloudflare Worker for calculations
3. **Resilient Design**: Fallback to local calculations when offline
4. **Global CDN**: Edge-deployed for fast access worldwide

This architecture enables Lensify to be both lightweight and powerful, with almost zero maintenance costs.

## 📋 Documentation

### Using the Calculators

#### Aperture Calculator
Calculate the equivalent aperture when using the same lens on different sensor sizes:

1. Select your sensor size (e.g., "APS-C")
2. Enter your aperture value (e.g., "f/2.8")
3. Get the full-frame equivalent aperture and depth of field

#### Focal Length Calculator
Understand what happens when you change focal lengths:

1. Choose your original sensor size
2. Enter original focal length
3. Enter new focal length
4. Input aperture value
5. View comprehensive results including:
   - Equivalent aperture
   - Field of view change
   - Perspective effect
   - Effective sensor size

### Example Calculations

| Scenario | Input | Result |
|---------|-------|--------|
| APS-C to Full Frame | f/2.8 on APS-C | f/4.2 equivalent on Full Frame |
| Focal Length Change | 50mm to 85mm on Full Frame | 70% perspective compression, -41.2% narrower field of view |
| Smartphone Camera | f/1.8 on 1/1.7-inch sensor | f/8.1 equivalent on Full Frame |

## 🔧 Installation & Deployment

Lensify uses Cloudflare's developer platform for fast, global deployment. Follow these steps to deploy your own instance:

### Prerequisites
- [Git](https://git-scm.com/)
- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### Step 1: Clone & Prepare

```bash
# Clone the repository
git clone https://github.com/yourusername/lensify.git
cd lensify

# Prepare Worker file
cp worker.example.js worker.js
```

Edit `worker.js` and replace `example.pages.dev` with your Cloudflare Pages domain.

### Step 2: Deploy the Worker

```bash
# Log in to Cloudflare
wrangler login

# Deploy the worker
wrangler deploy
```

Alternatively, you can deploy through the Cloudflare Dashboard:
1. Navigate to Workers & Pages
2. Click "Create Application"
3. Select "Create Worker"
4. Name your Worker (e.g., "lensify-calculator")
5. Paste the content of your modified `worker.js`
6. Click "Save and Deploy"

### Step 3: Deploy the Frontend

#### Using Cloudflare Dashboard:
1. In the Cloudflare Dashboard, go to "Workers & Pages"
2. Click "Create Application" → "Pages"
3. Connect your GitHub repository or upload directly
4. For build settings:
   - Build command: (leave empty for direct upload)
   - Build output directory: `public`
5. Click "Save and Deploy"

#### Using Direct Upload:
```bash
# Navigate to the Pages directory
cd public

# Deploy using Wrangler (if your site is already created)
wrangler pages publish .
```

## 🌐 API Documentation

Lensify provides a simple REST API for calculations:

### Calculate Aperture Equivalence
```
GET /api/calculate?sensorSize=aps-c&aperture=2.8
```

Response:
```json
{
  "sensorSize": "APS-C",
  "sensorId": "aps-c",
  "cropFactor": 1.5,
  "inputAperture": 2.8,
  "equivalentAperture": 4.2
}
```

### Calculate Focal Length Effects
```
GET /api/focal-equiv?originalSensor=full-frame&originalFocal=50&newFocal=85&aperture=2.8
```

Response:
```json
{
  "exactCropFactor": 0.59,
  "closestSensor": {
    "id": "medium-format",
    "name": "Medium Format",
    "cropFactor": 0.7
  },
  "effectiveSensorSize": "Medium Format",
  "cropFactorDifference": 0.11,
  "equivalentAperture": 1.65,
  "originalFocalLength": 50,
  "newFocalLength": 85,
  "originalSensor": {
    "id": "full-frame",
    "name": "Full Frame",
    "cropFactor": 1
  },
  "angleOfViewChange": "-41.2%",
  "perspectiveChange": "70.0%",
  "relativeSensorArea": 0.35,
  "areaRatio": 2.89,
  "originalEquivalentFocalLength": 50,
  "newEquivalentFocalLength": 50.2
}
```

## 🌈 Experience It Live

Try Lensify now: [https://lensify.kyowarp.com/](https://lensify.kyowarp.com/)

## 🔄 Offline Mode

Lensify automatically works offline by performing calculations locally when the API is unavailable. This makes it reliable for use in remote locations, on sets with poor connectivity, or when you're traveling.

## 📱 Responsive Design

Lensify is designed to work beautifully on any device:
- **Desktop**: Expanded interface with side-by-side results
- **Tablet**: Comfortable touch targets for field use
- **Mobile**: Fully responsive design for on-the-go calculations

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with Cloudflare Workers and Pages
- Inspired by the needs of photographers and cinematographers worldwide
- Special thanks to the photography community for feedback and testing

---

<div align="center">
  © 2025 Lensify - Precision tools for photographers and filmmakers
  
  <em>Crafted with ♥ for the global creative community</em>
</div>