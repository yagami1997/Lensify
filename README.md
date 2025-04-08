# Lensify

A comprehensive calculator for photographers and cinematographers to compute sensor size relationships, equivalent apertures, and focal length effects. Built with Cloudflare Workers and Pages, Lensify helps you understand the impact of different sensor sizes on your imaging.

## Overview

Lensify solves several common challenges in photography and cinematography:
- Calculate equivalent aperture values across different sensor sizes
- Determine the effective sensor size when using partial sensor readout
- Compute perspective and field of view changes when switching focal lengths
- Find equivalent focal lengths between different sensor formats

## Features

- **Sensor Size Calculations**
  - Support for 30+ sensor formats from Medium Format to 1/4-inch
  - Accurate crop factor calculations
  - Equivalent sensor size determination
  
- **Aperture Equivalence**
  - F-stop conversion between sensor formats
  - Depth of field equivalence calculations
  - Real-world light gathering comparisons
  
- **Focal Length Analysis**
  - Field of view changes
  - Perspective compression/expansion effects
  - Equivalent focal length matching

- **Modern Architecture**
  - Serverless deployment on Cloudflare
  - Fast, responsive interface
  - Global edge network distribution

## Deployment Guide

### 1. Fork and Clone
```bash
git clone https://github.com/yourusername/Lensify.git
cd Lensify
```

### 2. Deploy the Worker

1. Copy the worker template:
   ```bash
   cp worker.example.js worker.js
   ```

2. Edit `worker.js`:
   - Replace `example.pages.dev` with your Pages domain
   - Save the file

3. Deploy to Cloudflare Workers:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to "Workers & Pages" → "Create Application"
   - Choose "Create Worker"
   - Name your worker (e.g., "lensify-calculator")
   - Paste your modified `worker.js` content
   - Click "Save and Deploy"

### 3. Deploy the Frontend

1. Configure your Pages project:
   - In Cloudflare Dashboard, go to "Workers & Pages"
   - Click "Create Application" → "Pages"
   - Connect your GitHub repository or upload directly
   
2. Build Settings:
   - Build command: (leave empty for direct upload)
   - Build output directory: `public`
   - Environment variables: (none required)

3. Deploy:
   - Click "Save and Deploy"
   - Wait for the deployment to complete
   - Note your Pages URL (e.g., `https://your-project.pages.dev`)

## Usage Guide

### Basic Aperture Calculation
1. Select your sensor size (e.g., "APS-C")
2. Enter your aperture value (e.g., "f/2.8")
3. Get the full-frame equivalent aperture

### Advanced Focal Length Comparison
1. Choose your original sensor size
2. Enter original focal length
3. Enter new focal length
4. Input aperture value
5. View comprehensive results:
   - Equivalent aperture
   - Field of view change
   - Perspective effect
   - Effective sensor size

### Example Calculations

1. **APS-C to Full Frame**
   - Original: f/2.8 on APS-C
   - Result: f/4.2 equivalent on Full Frame
   
2. **Focal Length Change**
   - 50mm to 85mm on Full Frame
   - Results in 70% perspective compression
   - -41.2% narrower field of view

## API Documentation

### Endpoint: /api/calculate
Calculate basic aperture equivalence
```javascript
GET /api/calculate?sensorSize=aps-c&aperture=2.8
```

### Endpoint: /api/focal-equivalent
Calculate comprehensive focal length effects
```javascript
GET /api/focal-equiv?originalSensor=full-frame&originalFocal=50&newFocal=85&aperture=2.8
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with Cloudflare Workers and Pages
- Inspired by the needs of photographers and cinematographers
- Special thanks to the photography community for feedback and testing

## Support

For issues and feature requests, please use the GitHub issues page.
