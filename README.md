# Zero to Invested, Toolkit

This is the real, deployable version of your ticker lookup dashboard. It pulls
live prices from Twelve Data through a private backend function, so your API
key never sits in the page itself.

Follow these steps in order. None of them require any coding, just account
setup and a few clicks.

## Step 1, Get a Twelve Data API key

1. Go to twelvedata.com and sign up for a free account.
2. Once logged in, find your API key on your account dashboard. It's a long
   string of letters and numbers.
3. Copy it somewhere safe, you'll paste it into Netlify in Step 3.

The free plan gives you 800 requests a day, which is plenty to start.

## Step 2, Create a Netlify account and deploy this folder

1. Go to netlify.com and sign up for a free account.
2. Once logged in, look for "Add new site" then "Deploy manually" (sometimes
   called "Deploy without Git" or a drag and drop upload area).
3. Drag this entire folder (the one containing this README, the `public`
   folder, and the `netlify` folder) onto that upload area.
4. Netlify will build and give you a live link, something like
   `random-name-123.netlify.app`. That's your dashboard's temporary address.

## Step 3, Add your API key to Netlify

Your key needs to live in Netlify, never in the code itself, that's what
keeps it private.

1. In your new Netlify site, go to Site configuration, then Environment
   variables.
2. Click Add a variable.
3. Key: `TWELVE_DATA_API_KEY`
4. Value: paste the key you copied in Step 1.
5. Save, then go to the Deploys tab and click "Trigger deploy" so the site
   picks up the new key.

## Step 4, Test it

Visit your Netlify link, type a ticker like AAPL or VOO into the search box,
and tap Look up. If it shows a live price, you're done, this is fully
functional.

If you see an error message instead, double check the key was pasted
correctly with no extra spaces, and that you triggered a new deploy after
adding it.

## Step 5, Point Stan Store to this link (when you're ready)

Once buyers purchase the $57 tier, deliver this Netlify link (or a custom
domain pointed at it, which Netlify also supports for free) as the digital
product they receive.

## What's live vs what's still sample based

- Price, daily change, and 52 week high and low: fully live for any ticker
  someone types in.
- Sector, expense ratio, and 5 year year by year returns: currently only
  shown for the ten starter tickers (AAPL, MSFT, TSLA, GOOGL, VOO, SPY, QQQ,
  VTI, SCHD, ARKK), since that level of detail needs a paid data tier to pull
  live for every possible ticker. You can expand this list any time by
  adding entries to the `STATIC_SUPPLEMENT` object near the top of the
  script in `public/index.html`.
- Portfolio overlap: still based on approximate sample holdings weightings
  for the same ten tickers, real ETF holdings data is a paid add on with
  most providers, worth revisiting once the toolkit has traction.

## If something breaks

The most common issue is the API key. Netlify's function logs (under
Functions in your site dashboard) will show the actual error if a lookup
fails, that's the first place to check.
