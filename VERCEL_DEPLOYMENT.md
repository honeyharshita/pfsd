# Vercel Deployment Guide for MindfulAI

## Frontend Deployment to Vercel (React/Vite)

### Step 1: Go to Vercel and Create Project
1. Visit https://vercel.com/new
2. Sign in with GitHub (if not already logged in)
3. Search for `pfsd` repository and select it

### Step 2: Configure Project Settings
The `vercel.json` file in the root is already configured with:
- **Build Command**: `cd pfsd && npm run build`
- **Output Directory**: `pfsd/dist`
- **Framework**: Vite (auto-detected)

### Step 3: Set Environment Variables
In Vercel Dashboard → Settings → Environment Variables, add:

```
VITE_API_URL=https://your-backend-url.com
```

Replace `https://your-backend-url.com` with your backend URL (see Backend Deployment section below).

### Step 4: Deploy
Click "Deploy" - Vercel will automatically build and deploy your frontend.

---

## Backend Deployment Options

Your Express.js backend needs a separate hosting solution since Vercel is primarily for frontend hosting. Here are your options:

### Option A: Railway (Recommended - Easy)
1. Go to https://railway.app
2. Create account with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `pfsd` repository
5. Railway auto-detects Express.js, set:
   - **Root Directory**: `backend`
   - **Start Command**: `npm start`
   - **Port**: `5000`
6. Add environment variables (OPENAI_API_KEY, etc.)
7. Deploy and get your Railway URL (e.g., `https://your-app.up.railway.app`)

### Option B: Render (Free tier available)
1. Go to https://render.com
2. Create new "Web Service"
3. Connect GitHub repository
4. Configure:
   - **Root Directory**: `backend`
   - **Start Command**: `npm start`
   - **Port**: `5000`
5. Add environment variables
6. Deploy

### Option C: Fly.io
1. Go to https://fly.io
2. Install `flyctl` CLI
3. Run `fly launch` in your `backend` folder
4. Configure and deploy

---

## Quick Start: Complete Deployment

### For Frontend (Vercel):
```bash
# 1. Commit vercel.json
git add vercel.json
git commit -m "add: vercel.json for frontend deployment"
git push

# 2. Go to https://vercel.com/new and import repo
# 3. Click Deploy
# 4. Your frontend will be live at https://your-project-name.vercel.app
```

### For Backend (Railway - Recommended):
```bash
# 1. Go to https://railway.app
# 2. Click "New Project"
# 3. Select "Deploy from GitHub repo"
# 4. Find and select your pfsd repo
# 5. Set Root Directory to: backend
# 6. Add env vars (OPENAI_API_KEY, etc.)
# 7. Deploy
# 8. Copy your Railway URL
```

### Then Link Them:
```bash
# 1. Go to Vercel Dashboard → Settings → Environment Variables
# 2. Add: VITE_API_URL = https://your-railway-url.railway.app
# 3. Redeploy on Vercel (click "Deployments" → "Redeploy")
```

---

## Environment Variables to Set

### Frontend (Vercel):
- `VITE_API_URL` - Your backend URL (from Railway/Render/Fly.io)

### Backend (Railway/Render):
- `OPENAI_API_KEY` - Your OpenAI API key (if needed)
- `GROQ_API_KEY` - Your Groq API key
- `CLAUDE_API_KEY` - Your Claude API key (if using)
- `NODE_ENV` - Set to `production`

---

## Testing After Deployment

Once both are deployed:
1. Visit your Vercel frontend URL
2. Try the chat feature - it should connect to your Railway backend
3. Monitor Railway/Render logs for any errors

---

## Support

If you encounter issues:
- Check Vercel build logs: Dashboard → Project → Deployments
- Check Railway logs: Railway → Your Project → Logs tab
- Verify environment variables are set correctly
- Ensure both services are running (green status indicators)

---

## Your GitHub Repo
https://github.com/honeyharshita/pfsd

All commits are already pushed. Vercel will auto-detect updates when you push to main branch.
