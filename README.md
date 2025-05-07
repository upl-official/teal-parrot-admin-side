# Teal Parrot E-commerce Admin Dashboard

A comprehensive admin dashboard for managing e-commerce operations including products, categories, orders, and customers.

## Features

- Product management (CRUD operations)
- Category, material, and grade management
- Order tracking and processing
- Discount and coupon management
- User profile management
- Responsive design for desktop and mobile

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Authentication**: JWT-based auth
- **API Integration**: RESTful APIs
- **State Management**: React Hooks

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Git

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/yourusername/teal-parrot-ecommerce-admin.git
   cd teal-parrot-ecommerce-admin
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   pnpm install
   \`\`\`

3. Set up environment variables:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   Then update the environment variables in `.env.local` as needed.

4. Run the development server:
   \`\`\`bash
   pnpm dev
   \`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

### API Configuration

The dashboard connects to a backend API. Update the `API_BASE_URL` and `NEXT_PUBLIC_API_URL` in the `.env.local` file to point to your API endpoint.

## Project Structure

- `/app` - Next.js app router pages and layouts
- `/components` - Reusable UI components
- `/lib` - Utility functions and API client
- `/public` - Static assets
- `/styles` - Global CSS

## Authentication

To log in to the dashboard, use the following credentials:

- Email: `admin@example.com`
- Password: `password`

These credentials are for development purposes only. In production, you should use secure credentials and ensure proper authentication flow.

## Deployment

This project can be deployed on Vercel, Netlify, or any other hosting platform that supports Next.js.

### Deploying to Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import the project in Vercel
3. Set the environment variables in the Vercel dashboard
4. Deploy

Alternatively, you can use the Vercel CLI:

\`\`\`bash
pnpm global add vercel
vercel
\`\`\`

## Troubleshooting

### Common Issues

1. **API Connection Issues**: Ensure your API endpoints are correctly set in `.env.local`
2. **Authentication Errors**: Check that your API is returning the expected token format
3. **Image Loading Issues**: Verify that the domains in `next.config.js` include all image sources

### Build Errors

If you encounter build errors, try the following:

1. Clear the `.next` folder: `rm -rf .next`
2. Clear the pnpm cache: `pnpm store prune`
3. Reinstall dependencies: `pnpm install`
4. Rebuild the project: `pnpm build`

## License

[MIT](LICENSE)
\`\`\`

Let's create a .env.local file with default values (this will be gitignored but useful for local development):

```plaintext file=".env.local"
# API Configuration
API_BASE_URL=https://backend-project-r734.onrender.com
NEXT_PUBLIC_API_URL=https://backend-project-r734.onrender.com

# Authentication
AUTH_SECRET=local-development-secret-key
