# Vercel Deployment Guide

This guide will help you deploy your Rentverse project to Vercel with separate deployments for frontend and backend.

## Prerequisites

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

## Project Structure

Your project has three separate services:
- **Frontend**: `rentverse-frontend` (Next.js)
- **Backend**: `rentverse-backend` (Node.js/Express)
- **AI Service**: `rentverse-ai-service` (Python/FastAPI)

## Deployment Steps

### 1. Deploy Frontend

```bash
cd rentverse-frontend
vercel
```

**Follow the prompts:**
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N** (first time) or **Y** (if already created)
- What's your project's name? `rentverse-frontend`
- In which directory is your code located? `./`
- Want to override the settings? **N**

**Environment Variables:**
After deployment, add these in Vercel Dashboard (Settings > Environment Variables):
- `NEXT_PUBLIC_API_URL` - Your backend API URL (e.g., https://rentverse-backend.vercel.app)
- `NEXT_PUBLIC_AI_API_URL` - Your AI service URL (e.g., https://rentverse-ai.vercel.app)
- Any other environment variables from your `.env.local`

### 2. Deploy Backend

```bash
cd ../rentverse-backend
vercel
```

**Follow the prompts:**
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N** (first time) or **Y** (if already created)
- What's your project's name? `rentverse-backend`
- In which directory is your code located? `./`
- Want to override the settings? **N**

**Environment Variables:**
Add these in Vercel Dashboard:
- `DATABASE_URL` - Your PostgreSQL database URL (use Vercel Postgres or external provider)
- `JWT_SECRET` - Your JWT secret key
- `NODE_ENV=production`
- `PORT=3000`
- All other environment variables from your `.env` file

**Important for Backend:**
- Vercel Postgres: You can create a database directly in Vercel
- External Database: Use services like Supabase, Railway, or Neon for PostgreSQL
- Run migrations after deployment: `vercel env pull && npx prisma migrate deploy`

### 3. Deploy AI Service

```bash
cd ../rentverse-ai-service
vercel
```

**Follow the prompts:**
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N** (first time) or **Y** (if already created)
- What's your project's name? `rentverse-ai-service`
- In which directory is your code located? `./`
- Want to override the settings? **N**

**Environment Variables:**
Add these in Vercel Dashboard:
- Any environment variables from your `.env` file
- Model files: Upload to cloud storage (S3, Google Cloud Storage) and reference them

## Post-Deployment

### Update Frontend API URLs

Once you have the backend and AI service URLs, update your frontend environment variables:

1. Go to Vercel Dashboard > rentverse-frontend > Settings > Environment Variables
2. Update:
   - `NEXT_PUBLIC_API_URL=https://your-backend-url.vercel.app`
   - `NEXT_PUBLIC_AI_API_URL=https://your-ai-service-url.vercel.app`
3. Redeploy frontend: `vercel --prod`

### Database Setup (Backend)

1. **Using Vercel Postgres:**
   ```bash
   cd rentverse-backend
   vercel env pull
   npx prisma migrate deploy
   npx prisma db seed
   ```

2. **Using External Database:**
   - Create database on your provider
   - Add DATABASE_URL to Vercel environment variables
   - Run migrations from local: `DATABASE_URL="your-url" npx prisma migrate deploy`

### Production Deployment

After testing, deploy to production:

```bash
# Frontend
cd rentverse-frontend
vercel --prod

# Backend
cd ../rentverse-backend
vercel --prod

# AI Service
cd ../rentverse-ai-service
vercel --prod
```

## Troubleshooting

### Backend Issues

1. **Database Connection:**
   - Ensure DATABASE_URL is correctly set
   - Check if database allows connections from Vercel IPs

2. **File Uploads:**
   - Vercel serverless functions have read-only filesystem
   - Use cloud storage (Cloudinary, S3) for file uploads
   - Your code already uses Cloudinary ✓

3. **Puppeteer:**
   - Your code uses @sparticuz/chromium ✓
   - Ensure it's properly configured for serverless

### AI Service Issues

1. **Model Files:**
   - Vercel has 250MB deployment limit
   - Store large model files in cloud storage
   - Load models from URL on startup

2. **Cold Starts:**
   - First request may be slow
   - Consider using Vercel Pro for better performance

### Frontend Issues

1. **API Connection:**
   - Verify NEXT_PUBLIC_API_URL is correct
   - Check CORS settings on backend

2. **Build Errors:**
   - Check build logs in Vercel Dashboard
   - Ensure all dependencies are in package.json

## Monitoring

- View logs: `vercel logs <deployment-url>`
- Dashboard: https://vercel.com/dashboard
- Analytics: Enable in Vercel Dashboard

## Custom Domains

1. Go to Vercel Dashboard > Your Project > Settings > Domains
2. Add your custom domain
3. Configure DNS according to Vercel instructions

## CI/CD

Connect your Git repository to Vercel for automatic deployments:
1. Go to Vercel Dashboard
2. Import Git Repository
3. Select the repository
4. Configure each service separately
5. Every push to main will trigger deployment

## URLs After Deployment

- Frontend: `https://rentverse-frontend.vercel.app`
- Backend: `https://rentverse-backend.vercel.app`
- AI Service: `https://rentverse-ai-service.vercel.app`

(Replace with your actual project names)
