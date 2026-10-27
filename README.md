This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Map tiles

All maps use OpenStreetMap Standard tiles by default; no API key is needed.
Keep the on-map attribution visible and follow the
[OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/).
The public tile service has limited capacity and best-effort availability; for a
busy production site, configure a suitable hosted provider.

To use the CARTO Voyager style instead, request a
[CARTO Basemaps API key](https://www.carto.com/basemaps/apikey/index.html) and add
this to `.env.local` (and your hosting environment when deployed):

```dotenv
NEXT_PUBLIC_CARTO_API_KEY=your_basemaps_key
```

Restart the development server, or rebuild and redeploy, after changing the key.
This is a browser-visible key; configure website restrictions in CARTO's dashboard.
CARTO now requires a key on tile requests; missing keys cause the “API key required”
watermark. Mapbox's `NEXT_PUBLIC_MAPBOX_TOKEN` is separate and only powers location
search and reverse geocoding.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
