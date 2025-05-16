# Setting up OAuth with an ngrok URL

When testing with ngrok, you need to configure your OAuth providers (like Google) to allow redirects to your ngrok URL. Here's how:

## Step 1: Add the ngrok URL to your .env.local file

Add this line to your `.env.local` file:

```bash
NEXTAUTH_URL=https://180f-98-207-86-33.ngrok-free.app
NEXT_PUBLIC_BASE_URL=https://180f-98-207-86-33.ngrok-free.app
```

## Step 2: Configure Google OAuth

1. Go to https://console.developers.google.com/
2. Select your project
3. Go to "Credentials"
4. Edit your OAuth 2.0 Client ID
5. Add your ngrok URL to "Authorized JavaScript origins":
   ```
   https://180f-98-207-86-33.ngrok-free.app
   ```
6. Add your ngrok URL to "Authorized redirect URIs":
   ```
   https://180f-98-207-86-33.ngrok-free.app/api/auth/callback/google
   ```

## Step 3: Restart your development server

```bash
npm run dev
```

## Step 4: Test login through the ngrok URL

Now you should be able to log in using the ngrok URL:
```
https://180f-98-207-86-33.ngrok-free.app
```

## Important Notes

1. This is only needed if you want to test the full user flow including login through the ngrok URL
2. For webhook testing specifically, you don't need to log in through the ngrok URL
3. Every time your ngrok URL changes, you'll need to update these settings again
