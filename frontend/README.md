# CivicPulse Frontend

Modern React frontend for the CivicPulse civic complaint management platform with AI-powered analytics.

## Features

- 🏠 **Landing Page** - Showcase platform capabilities with hero section, features, and call-to-action
- 📝 **Submit Complaints** - User-friendly form for submitting civic complaints with categories and location
- 📊 **User Dashboard** - Track complaint status, view analytics, and see resolution trends
- 👨‍💼 **Admin Dashboard** - Advanced analytics, pattern detection, trend analysis, and complaint prioritization
- 🔐 **Authentication** - Role-based login (Citizen/Administrator)
- 📱 **Responsive Design** - Mobile-friendly interface using Tailwind CSS
- ⚡ **Modern Stack** - React 18, Vite, Tailwind CSS, React Router

## Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Icons**: Lucide React

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file for configuration:
```
VITE_API_BASE_URL=http://localhost:8000
```

## Running the Development Server

```bash
npm run dev
```

The application will start at `http://localhost:3000`

## Building for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navbar.jsx
│   ├── FeatureCard.jsx
│   ├── StatCard.jsx
│   └── StepCard.jsx
├── pages/              # Page components
│   ├── Landing.jsx     # Home page
│   ├── Login.jsx       # Authentication
│   ├── SubmitComplaint.jsx
│   ├── Dashboard.jsx   # User dashboard
│   └── AdminDashboard.jsx
├── App.jsx             # Main app component
├── main.jsx            # Entry point
└── index.css           # Global styles
```

## Pages

### Landing Page (`/`)
- Hero section with call-to-action
- Feature showcase (NLP Pattern Detection, Real-Time Analytics, Trend Prediction)
- How it works section
- Statistics
- Footer with links

### Login (`/login`)
- Role-based authentication
- Support for Citizen and Administrator roles
- Demo credentials provided

### Submit Complaint (`/submit`)
- Form for submitting new complaints
- Category selection
- Location input
- Description field
- Phone number (optional)

### User Dashboard (`/dashboard`)
- Statistics overview
- Complaints by category chart
- Resolution trends
- Table of submitted complaints

### Admin Dashboard (`/admin`)
- Key metrics and KPIs
- Pattern detection and trend analysis
- Complaint prioritization
- Geographic distribution insights
- Detailed complaint analysis

## API Integration

The frontend is configured to communicate with a Django backend running on `http://localhost:8000`. Update the proxy configuration in `vite.config.js` if your backend runs on a different port.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=CivicPulse
```

## Future Enhancements

- Real API integration with Django backend
- File upload for complaint images
- Real-time notifications
- Interactive heatmaps
- Advanced search and filtering
- Export functionality for reports
- Multiple language support

## License

MIT
