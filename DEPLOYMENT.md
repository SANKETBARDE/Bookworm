# Deployment

This project is set up for a Render backend and a Netlify frontend.

## Backend on Render

Use `render.yaml` from the repo root, or create a Render Web Service manually with these settings:

- Root directory: `backend`
- Runtime: Python
- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn wsgi:app`
- Health check path: `/`

Set these Render environment variables:

```env
PYTHON_VERSION=3.11.11
SECRET_KEY=generate-a-long-random-secret
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_ANON_KEY=your-supabase-anon-key
FRONTEND_URL=https://your-netlify-site.netlify.app
```

`SUPABASE_SERVICE_ROLE_KEY` must stay on Render only. Do not add it to Netlify.

After the service deploys, your backend URL will look like:

```text
https://bookworm-backend.onrender.com
```

The frontend can use either that origin or the `/api` URL as `VITE_API_URL`.

## Frontend on Netlify

`netlify.toml` configures the frontend build:

- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `dist`
- Node version: `22.12.0`

Set this Netlify environment variable:

```env
VITE_API_URL=https://bookworm-backend.onrender.com
```

Then trigger a new Netlify deploy after setting the variable.

## Final Cross-Check

After both services are live:

1. Set Render `FRONTEND_URL` to your exact Netlify URL.
2. Set Netlify `VITE_API_URL` to your exact Render backend URL.
3. Redeploy both services.
4. Visit the Render backend root URL and confirm it returns the backend running message.
5. Visit the Netlify site and test register/login.

## Supabase Buckets

Create these public storage buckets in Supabase:

```text
books
book-covers
```

The backend uploads PDFs to `books` and cover images to `book-covers`.
