# Lensify - Sensor & Aperture Calculator

A web-based calculator for determining equivalent aperture values across different sensor sizes. Built with Cloudflare Workers and Cloudflare Pages.

## Project Structure

```
lensify/
├── worker.js                # Cloudflare Worker code
├── public/                  # Static files for Cloudflare Pages
│   ├── yosemite.html        # Main HTML file
│   ├── malibu.css           # CSS styles
│   └── sanfrancisco.js      # JavaScript frontend logic
└── README.md                # This file
```

## Features

- Calculate equivalent aperture based on sensor size and input aperture
- Support for a wide range of sensor sizes from medium format to tiny smartphone sensors
- Clean, responsive user interface
- Serverless architecture using Cloudflare

## Deployment Instructions

### 1. Deploy the Cloudflare Worker

1. Log in to your Cloudflare dashboard at https://dash.cloudflare.com
2. Navigate to "Workers & Pages"
3. Click "Create application" and select "Create Worker"
4. Give your worker a name (e.g., "lensify-calculator")
5. Paste the contents of `worker.js` into the editor
6. Click "Save and Deploy"
7. Note your worker's URL (e.g., `https://lensify-calculator.your-worker-subdomain.workers.dev`)

### 2. Update the API URL in Frontend Code

1. Open `public/sanfrancisco.js`
2. Update the `API_URL` constant with your Worker URL:
   ```javascript
   const API_URL = "https://lensify-calculator.your-worker-subdomain.workers.dev";
   ```

### 3. Deploy to Cloudflare Pages

1. From your Cloudflare dashboard, go to "Workers & Pages"
2. Click "Create application" and select "Pages"
3. Set up your deployment method (connect to Git repository or direct upload)
4. For direct upload:
   - Select "Upload Assets"
   - Upload the contents of the `public` directory
5. Configure your build settings if using Git:
   - Build command: (leave blank for direct upload)
   - Build output directory: `public`
6. Click "Save and Deploy"

## Local Development

For local development and testing:

1. Clone this repository
2. Open `public/yosemite.html` in your browser
3. The application will automatically use mock data for calculations when run locally

## Customization

### Adding New Sensor Sizes

To add new sensor sizes, update the `SENSORS` object in `worker.js`:

```javascript
const SENSORS = {
  // Add your new sensor here
  "new-sensor-id": { cropFactor: 1.23, name: "New Sensor Name" },
  // Existing sensors...
};
```

Then add the corresponding option to the select element in `public/yosemite.html`:

```html
<option value="new-sensor-id">New Sensor Name</option>
```

## License

[MIT License](LICENSE)

## Credits

- Developed as part of the Lensify project
- Powered by Cloudflare Workers and Pages 