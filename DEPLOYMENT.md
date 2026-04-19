# Deployment Guide

This guide covers deploying the Kirana Cashflow AI application to **Vercel** (frontend) and **Render.com** (backend).

## Prerequisites

- GitHub account with the code pushed to a repository
- Vercel account (free tier available)
- Render.com account (free tier available)
- API credentials:
  - Google Gemini API Key (for vision analysis)
  - Google Places API Key (optional, for location data)

## Backend Deployment (Render.com)

### Step 1: Connect Repository to Render

1. Go to [render.com](https://render.com)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository (`purushottam54/Store-cashflow-ai`)
4. Choose the `main` branch

### Step 2: Configure Backend Service

**Name:** `kirana-cashflow-api`

**Runtime:** Python 3.11

**Build Command:**
```
pip install -r requirements.txt
```

**Start Command:**
```
uvicorn main:app --host 0.0.0.0 --port $PORT
```

**Root Directory:** `backend`

### Step 3: Set Environment Variables on Render

In the Render dashboard, add these environment variables:

- `GEMINI_API_KEY`: Your Google Gemini API key
- `GOOGLE_PLACES_API_KEY`: Your Google Places API key (if available)
- `ALLOWED_ORIGINS`: Your Vercel frontend URL (you'll get this after deploying frontend)

**Example:**
```
ALLOWED_ORIGINS=https://your-app-name.vercel.app,http://localhost:3000
```

### Step 4: Deploy Backend

Click "Create Web Service" and wait for the deployment to complete. Once successful, you'll get a URL like:
```
https://kirana-cashflow-api.onrender.com
```

**Note:** Render free tier services spin down after 15 minutes of inactivity. For production, consider upgrading to a paid plan.

---

## Frontend Deployment (Vercel)

### Step 1: Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository (`purushottam54/Store-cashflow-ai`)

### Step 2: Configure Frontend Settings

**Project Name:** `kirana-cashflow-ai`

**Framework Preset:** Next.js

**Root Directory:** `frontend`

**Build Command:** `npm run build`

**Output Directory:** `.next`

### Step 3: Set Environment Variables on Vercel

Add this environment variable:

- `NEXT_PUBLIC_API_URL`: Your Render backend URL

**Example:**
```
NEXT_PUBLIC_API_URL=https://kirana-cashflow-api.onrender.com
```

### Step 4: Deploy Frontend

Click "Deploy" and wait for the build to complete. Your application will be available at:
```
https://your-project-name.vercel.app
```

---

## Post-Deployment Steps

### 1. Update Backend CORS

After deploying the frontend, update `ALLOWED_ORIGINS` on Render with your Vercel frontend URL:

```
ALLOWED_ORIGINS=https://your-project-name.vercel.app,http://localhost:3000
```

### 2. Test the Application

1. Visit your Vercel frontend URL
2. Test the image upload and analysis features
3. Check browser console for any API errors

### 3. Monitor Logs

- **Backend**: View logs on Render dashboard under "Logs"
- **Frontend**: View logs on Vercel dashboard under "Function Logs"

---

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:

1. Check that `NEXT_PUBLIC_API_URL` on Vercel includes the full backend URL
2. Check that `ALLOWED_ORIGINS` on Render includes the Vercel frontend URL
3. Both URLs must exactly match what's in the environment variables

### API Connection Issues

1. Test the backend health endpoint: `https://your-backend-url/api/health`
2. Check Render logs for any Python errors
3. Verify API keys are correctly set in Render environment

### Build Failures

**Frontend:**
- Check that the root directory is set to `frontend`
- Ensure Node.js version is compatible (currently using ^18)

**Backend:**
- Check that the root directory is set to `backend`
- Verify Python version is 3.11
- Check requirements.txt for any dependency issues

---

## Environment Variables Reference

### Render (Backend)

| Variable | Required | Example |
|----------|----------|---------|
| `GEMINI_API_KEY` | Yes | `AIzaSy...` |
| `GOOGLE_PLACES_API_KEY` | No | `AIzaSy...` |
| `ALLOWED_ORIGINS` | Yes | `https://your-app.vercel.app,http://localhost:3000` |

### Vercel (Frontend)

| Variable | Required | Example |
|----------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Yes | `https://kirana-cashflow-api.onrender.com` |

---

## Cost Considerations

- **Vercel**: Free tier includes unlimited deployments
- **Render**: Free tier includes 750 compute hours/month
- **Google APIs**: Usage-based billing (Gemini API, Places API)

For production workloads, consider upgrading to paid tiers.

---

## Additional Resources

- [Vercel Docs - Next.js Deployment](https://vercel.com/docs/frameworks/nextjs)
- [Render Docs - Python Deployment](https://render.com/docs/deploy-python-web-scraper)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
