# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/e4cce269-0ddb-46c0-8401-035391dbecce

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/e4cce269-0ddb-46c0-8401-035391dbecce) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/e4cce269-0ddb-46c0-8401-035391dbecce) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Required environment variables

Several Supabase Edge functions depend on environment variables for Supabase and Stripe access. Create a `.env` file in the `supabase` directory with at least the following keys:

```
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_ANON_KEY=<your-anon-key>
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>
```

Make sure these are set when deploying functions so the API calls succeed.

### Supabase and Stripe setup

1. **Create accounts** – Sign up for [Supabase](https://supabase.com) and [Stripe](https://stripe.com) if you haven't already.
2. **Create a Supabase project** – After logging in, create a new project and obtain the Project URL and API keys from `Settings > API`.
3. **Configure environment variables** – Copy the values into a `.env` file inside the `supabase` directory as shown above.
4. **Install the Supabase CLI** – Run `npm install -g supabase` and authenticate with `supabase login`.
5. **Deploy functions** – From the project root, run `supabase functions deploy --project-ref <project-ref>` to upload the Edge functions.
6. **Set up Stripe** – In the Stripe dashboard create API keys and a webhook secret, then add them to your `.env` file.
7. **Configure webhooks** – Point the Stripe webhook URL to `/functions/v1/stripe-webhook` on your Supabase project.

After these steps the serverless functions will have the credentials they need for Supabase and Stripe access.

## Two‑factor authentication

The `TwoFactorManager` component now generates a secure TOTP secret using browser crypto and verifies tokens locally. When enabling 2FA, scan the displayed OTP URL with an authenticator app and enter the generated code to complete setup.
