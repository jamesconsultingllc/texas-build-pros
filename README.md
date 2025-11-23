# Texas Build Pros

A modern portfolio website for Texas Build Pros real estate rehab company built with React, TypeScript, and Azure Static Web Apps.

## 🚀 Features

- **Public Portfolio** - Showcase completed rehab projects
- **Admin Dashboard** - Manage projects, images, and content
- **Authentication** - Secure admin access via Microsoft Entra ID
- **Telemetry** - Enterprise-grade monitoring with Azure Application Insights
- **Responsive Design** - Mobile-first design with Tailwind CSS
- **Modern Stack** - React 18, TypeScript, Vite, shadcn/ui

## 📁 Project Structure

```
texas-build-pros/
├── src/
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts (Auth, etc.)
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities (API client, telemetry)
│   ├── pages/           # Page components
│   └── types/           # TypeScript types
├── docs/                # Documentation
│   ├── telemetry-quick-start.md
│   ├── telemetry-implementation.md
│   ├── TELEMETRY-COMPLETE.md
│   └── TELEMETRY-CHECKLIST.md
└── public/              # Static assets
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **React Router** - Routing
- **React Query** - Data fetching
- **Application Insights** - Telemetry

### Backend (Coming Soon)
- **C# Azure Functions** - Serverless API
- **Azure Cosmos DB** - NoSQL database
- **Azure Blob Storage** - Image storage
- **Microsoft Entra ID** - Authentication

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js 18+ and npm
- Azure subscription (for Application Insights)

### Installation

1. **Clone the repository**
```sh
git clone https://github.com/YOUR_USERNAME/texas-build-pros.git
cd texas-build-pros
```

2. **Install dependencies**
```sh
npm install
```

3. **Install Application Insights**
```sh
npm install @microsoft/applicationinsights-web
```

4. **Configure environment variables**

Create `.env.local`:
```env
VITE_APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx...
```

Get your connection string from Azure Portal → Application Insights → Properties

5. **Start development server**
```sh
npm run dev
```

Visit http://localhost:5173

## 📊 Telemetry & Monitoring

This project includes complete Azure Application Insights integration:

- ✅ Automatic page view tracking
- ✅ API call monitoring
- ✅ Error tracking
- ✅ Performance metrics
- ✅ User authentication tracking
- ✅ Custom event tracking

**Quick Setup:** See [Telemetry Quick Start](./docs/telemetry-quick-start.md)

**Full Documentation:** See [Telemetry Implementation](./docs/telemetry-implementation.md)

## 📖 Documentation

- **[Telemetry Quick Start](./docs/telemetry-quick-start.md)** - Get monitoring working in 5 minutes
- **[Telemetry Implementation](./docs/telemetry-implementation.md)** - Complete guide
- **[Telemetry Checklist](./docs/TELEMETRY-CHECKLIST.md)** - Step-by-step setup
- **[Authentication Plan](./docs/authentication-implementation-plan.md)** - Auth implementation guide

## 🚀 Deployment

### Build for Production
```sh
npm run build
```

### Deploy to Azure Static Web Apps

This project is configured for Azure Static Web Apps deployment via GitHub Actions.

1. Create Azure Static Web App resource
2. Connect to GitHub repository
3. Configure environment variables in Azure Portal
4. Push to main branch to trigger deployment

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm run swa:start` - Start with Azure SWA CLI
- `npm run swa:build` - Build and start with SWA CLI

## 🔐 Authentication

Uses Microsoft Entra ID (Azure AD) for secure admin access:

- Azure Static Web Apps built-in authentication
- Role-based access control
- Admin-only routes protected
- User context tracked in telemetry

## 🎨 UI Components

Built with shadcn/ui component library:
- Buttons, Cards, Forms
- Dialogs, Dropdowns, Tabs
- Toast notifications
- Skeleton loaders
- And 40+ more components

## 📱 Routes

### Public Routes
- `/` - Home page
- `/portfolio` - Project gallery
- `/portfolio/:slug` - Project details

### Admin Routes (Protected)
- `/admin` - Dashboard
- `/admin/projects` - Manage projects
- `/admin/projects/new` - Create project
- `/admin/projects/:id/edit` - Edit project

## 🧪 Testing

### Manual Testing
1. Start dev server
2. Navigate through pages
3. Check browser console for telemetry confirmation
4. Check Azure Portal → Application Insights → Live Metrics

### Verify Telemetry
```javascript
// In browser console
throw new Error("Test error"); // Should appear in Failures
```

## 🔧 Configuration Files

- `vite.config.ts` - Vite configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `staticwebapp.config.json` - Azure SWA configuration
- `.env.local` - Local environment variables (not in git)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🆘 Support

- **Documentation:** See `/docs` folder
- **Issues:** Open an issue on GitHub
- **Azure Support:** Azure Portal → Support

## 🎯 Roadmap

- [x] Frontend UI implementation
- [x] Telemetry & monitoring setup
- [x] Error boundary & error tracking
- [ ] C# API implementation
- [ ] Cosmos DB integration
- [ ] Image upload to Azure Blob Storage
- [ ] Admin authentication configuration
- [ ] Production deployment
- [ ] Custom dashboards & alerts

## 📊 Project Status

**Current Phase:** Frontend Complete + Telemetry Implemented ✅

**Next Phase:** Backend API Implementation

---

Built with ❤️ by Texas Build Pros
