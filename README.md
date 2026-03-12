# Claims Management Portal

A comprehensive enterprise claims management portal for Home HO-5 insurance claims officers. Built with React, TypeScript, and the UiPath SDK, this application provides real-time visibility into active claims, detailed case analytics, stage progression tracking, and comprehensive audit trails.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/swati354/claims-management-portal)

## Overview

The Claims Management Portal integrates with UiPath Case Management v1.0.4 to deliver a professional, enterprise-grade interface for managing insurance claims. The application features a clean dashboard with key metrics, searchable claims lists, and detailed case views with comprehensive data management capabilities.

## Key Features

- **Analytics Dashboard** - Real-time metrics including total claims, active claims, pending tasks, and completion rates with trend visualization
- **Active Claims Management** - Comprehensive table view with search, filter, and sort capabilities for efficient claim tracking
- **Detailed Case Views** - Complete claim information organized in intuitive tabs:
  - **Case Data** - Process variables displayed in structured format
  - **Case Documents** - Document management with download capabilities via Buckets service
  - **Case Tasks** - Action Center task management with assign/complete actions
  - **Case Audit** - Full execution history timeline with stage-specific metadata
- **Case Timeline Visualization** - Visual representation of all stages with completion status and current stage indicators
- **Real-time Updates** - Automatic polling for live data synchronization
- **Professional UI** - Clean enterprise aesthetic with neutral color schemes and information-dense displays

## Technology Stack

### Core Framework
- **React 18** - Modern UI library with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server

### UiPath Integration
- **@uipath/uipath-typescript** - Official UiPath SDK for Orchestrator, Case Management, and Action Center integration

### UI Components & Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components built on Radix UI
- **Radix UI** - Unstyled, accessible component primitives
- **Lucide React** - Beautiful icon library
- **Recharts** - Composable charting library for data visualization

### State Management & Data
- **Zustand** - Lightweight state management
- **React Hook Form** - Performant form handling
- **date-fns** - Modern date utility library
- **Zod** - TypeScript-first schema validation

### Development Tools
- **ESLint** - Code linting and quality
- **PostCSS** - CSS processing

### Deployment
- **Cloudflare Pages** - Global edge deployment platform

## Prerequisites

- **Bun** - Fast JavaScript runtime and package manager (v1.0.0 or higher)
- **UiPath Account** - Access to UiPath Orchestrator with appropriate permissions
- **OAuth Client** - Configured OAuth application in UiPath Cloud

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd claims-management-portal
```

2. **Install dependencies**
```bash
bun install
```

3. **Configure environment variables**

Create a `.env` file in the project root with your UiPath credentials:

```env
VITE_UIPATH_BASE_URL=https://api.uipath.com
VITE_UIPATH_ORG_NAME=your-org-name
VITE_UIPATH_TENANT_NAME=your-tenant-name
VITE_UIPATH_CLIENT_ID=your-client-id
VITE_UIPATH_REDIRECT_URI=http://localhost:3000
VITE_UIPATH_SCOPE=OR.Administration OR.Administration.Read OR.Execution OR.Execution.Read OR.Folders OR.Jobs OR.Tasks OR.Tasks.Read PIMS Traces.Api DataFabric.Data.Read DataFabric.Data.Write DataFabric.Schema.Read
```

**Required OAuth Scopes:**
- `OR.Execution` / `OR.Execution.Read` - Process execution access
- `OR.Tasks` / `OR.Tasks.Read` - Action Center task management
- `OR.Administration` / `OR.Administration.Read` - Bucket/document access
- `PIMS` - Case Management and Maestro process access
- `DataFabric.Data.Read` / `DataFabric.Data.Write` - Data Service access
- `DataFabric.Schema.Read` - Entity schema access

## Development

### Start the development server

```bash
bun run dev
```

The application will be available at `http://localhost:3000`

### Build for production

```bash
bun run build
```

### Preview production build

```bash
bun run preview
```

### Lint code

```bash
bun run lint
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── layout/         # Layout components
├── hooks/              # Custom React hooks
│   ├── useAuth.tsx     # Authentication hook
│   └── usePolling.ts   # Real-time data polling
├── pages/              # Application pages/views
├── lib/                # Utility functions
└── main.tsx           # Application entry point
```

## Usage

### Authentication

The application uses OAuth 2.0 for authentication with UiPath Cloud. On first access, users will be redirected to the UiPath login page. After successful authentication, the session is maintained automatically.

### Dashboard

The main dashboard displays:
- **Metric Cards** - Key performance indicators for claims management
- **Trend Charts** - Visual representation of claims volume over time
- **Status Distribution** - Pie chart showing claim status breakdown
- **Quick Actions** - Direct access to common operations

### Claims List

Navigate to the claims list to:
- View all active claims in a sortable, filterable table
- Search by claim number, policyholder name, or other criteria
- Click any claim row to open detailed view
- Monitor real-time status updates

### Claim Detail View

The detail view provides comprehensive information through four tabs:

1. **Case Data** - All process variables in a clean key-value format
2. **Documents** - List of attachments with download functionality
3. **Tasks** - Pending Action Center tasks with completion actions
4. **Audit** - Complete execution history with timestamps

The case timeline shows visual progression through all stages with completion indicators.

## Deployment

### Deploy to Cloudflare Pages

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/swati354/claims-management-portal)

#### Manual Deployment

1. **Build the application**
```bash
bun run build
```

2. **Deploy to Cloudflare Pages**
```bash
npx wrangler pages deploy dist
```

3. **Configure environment variables in Cloudflare Dashboard**

Navigate to your Pages project settings and add all required environment variables from your `.env` file.

**Important:** Update `VITE_UIPATH_REDIRECT_URI` to match your production URL:
```
VITE_UIPATH_REDIRECT_URI=https://your-app.pages.dev
```

#### Automatic Deployment

Connect your repository to Cloudflare Pages for automatic deployments on every push:

1. Go to Cloudflare Dashboard → Pages
2. Create new project from Git
3. Select your repository
4. Configure build settings:
   - **Build command:** `bun run build`
   - **Build output directory:** `dist`
5. Add environment variables
6. Deploy

## Configuration

### Case Management Process

The application is configured to work with the **Home HO-5 Claims** case management process (v1.0.4). To use a different process:

1. Update the process name filter in the dashboard component
2. Ensure the process has the required stages and variables
3. Verify Action Center task integration is configured

### Polling Intervals

Real-time updates use a 5-second polling interval by default. To adjust:

```typescript
// In component files using usePolling hook
const { data } = usePolling({
  fetchFn: fetchData,
  interval: 5000, // Change this value (milliseconds)
  enabled: true,
});
```

## Troubleshooting

### Authentication Issues

- Verify OAuth client ID and redirect URI match your UiPath Cloud configuration
- Ensure all required scopes are granted in the OAuth application
- Check browser console for specific error messages

### Data Not Loading

- Confirm the Case Management process is deployed and accessible
- Verify folder permissions in UiPath Orchestrator
- Check network tab for API errors

### Build Errors

- Clear node_modules and reinstall: `rm -rf node_modules && bun install`
- Ensure Bun version is up to date: `bun upgrade`
- Check for TypeScript errors: `bun run lint`

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Review the UiPath SDK documentation in `prompts/sdk-reference/`
- Check the template usage guide in `prompts/usage.md`
- Consult UiPath Community forums for platform-specific questions