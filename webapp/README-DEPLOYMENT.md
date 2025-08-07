# Deploying Novi Sad Transit Webapp on Vercel

This guide explains how to deploy the Novi Sad Transit webapp on Vercel to resolve CORS issues and enable real-time API integration with bgpp's nsmart API.

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/minicuby1234/transportr&project-name=novi-sad-transit&repository-name=novi-sad-transit&root-directory=webapp)

## Manual Deployment Steps

### 1. Prerequisites
- GitHub account with access to the transportr repository
- Vercel account (free tier works fine)

### 2. Connect Repository to Vercel

1. **Login to Vercel**: Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. **Import Project**: Click "New Project" and import `minicuby1234/transportr`
3. **Configure Build Settings**:
   - **Framework Preset**: Other
   - **Root Directory**: `webapp`
   - **Build Command**: Leave empty (static site)
   - **Output Directory**: Leave empty (uses root)
   - **Install Command**: Leave empty

### 3. Environment Configuration

The webapp automatically detects the deployment environment:
- **Local Development**: Uses `https://bgpp.fly.dev` directly (may have CORS issues)
- **Vercel Production**: Uses `/api` proxy routes to bypass CORS

### 4. Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to "Domains" tab
3. Add your custom domain (e.g., `novitransit.com`)
4. Follow DNS configuration instructions

## How CORS Resolution Works

The `vercel.json` configuration includes proxy routes that:

1. **Intercept API calls**: Routes starting with `/api/` are proxied
2. **Forward to bgpp**: Requests are forwarded to `https://bgpp.fly.dev/api/`
3. **Add CORS headers**: Proper CORS headers are added to responses
4. **Enable cross-origin**: Allows the webapp to access bgpp's API without CORS errors

## API Endpoints Available

Once deployed, these endpoints will work without CORS issues:

- **All Stations**: `/api/stations/ns/all`
- **Station Search**: `/api/stations/ns/search?id=1001`
- **Station Departures**: `/api/stations/ns/search?name=Trg%20Slobode`

## Testing Deployment

After deployment:

1. **Test Departures Mode**:
   - Select "Station ID" and enter `1001`
   - Click "Get Departures"
   - Should show real-time departure data

2. **Test Navigation Mode**:
   - Switch to Navigation mode
   - Enter "Trg Slobode" → "Železnička stanica"
   - Click "Find Routes"
   - Should show trip planning results

3. **Verify Real Data**:
   - Check browser console for successful API calls
   - Verify station names are not "undefined"
   - Confirm departure times are current

## Troubleshooting

### Build Failures
- Ensure `webapp` is set as root directory
- Check that all files are committed to the repository
- Verify `vercel.json` syntax is valid

### API Issues
- Check Vercel function logs for proxy errors
- Verify bgpp API is accessible from Vercel's servers
- Test API endpoints directly: `https://your-app.vercel.app/api/stations/ns/all`

### Performance
- Static files are cached by Vercel's CDN
- API responses are proxied in real-time
- Map tiles are loaded from OpenStreetMap CDN

## Local Development vs Production

| Feature | Local (localhost:8080) | Production (Vercel) |
|---------|----------------------|-------------------|
| API Access | Direct to bgpp (CORS issues) | Proxied through Vercel |
| CORS | Blocked by browser | Resolved by proxy |
| Performance | Local server | Global CDN |
| Real-time Data | Mock fallback | Live bgpp data |

## Support

For deployment issues:
1. Check Vercel deployment logs
2. Verify repository permissions
3. Test API endpoints manually
4. Check browser console for errors

The webapp should work perfectly on Vercel with real-time Novi Sad transit data!
