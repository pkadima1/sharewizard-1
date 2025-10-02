# Netlify Deployment Environment Variables

## Required Environment Variables for Netlify

Add these environment variables in your Netlify dashboard:
**Site Settings > Environment Variables**

### Firebase Configuration
```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Optional (if using social media features)
```
VITE_INSTAGRAM_CLIENT_SECRET=your_instagram_secret
VITE_INSTAGRAM_ACCESS_TOKEN=your_instagram_token
VITE_INSTAGRAM_APP_ID=your_instagram_app_id
VITE_TWITTER_API_KEY=your_twitter_api_key
```

## Build Settings for Netlify

### Build Command
```
npm run build
```

### Publish Directory
```
dist
```

### Node Version
```
18
```

## Additional Notes

1. The `netlify.toml` file has been created with proper configuration
2. The `_redirects` file handles SPA routing
3. All security headers are configured
4. Static assets are properly cached

## Troubleshooting

If deployment fails:
1. Check that all required environment variables are set
2. Ensure Node version is set to 18 in Netlify settings
3. Verify the build command is `npm run build`
4. Verify the publish directory is `dist`
5. Check the build logs for specific error messages