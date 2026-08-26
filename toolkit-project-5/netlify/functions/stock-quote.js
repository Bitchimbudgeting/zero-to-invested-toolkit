// This function runs on Netlify's servers, never in the browser.
// That's what keeps your Twelve Data API key private.
// Your key lives in a Netlify environment variable, never in this file.

exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  const symbol = (event.queryStringParameters && event.queryStringParameters.symbol || "").trim().toUpperCase();

  if (!symbol) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing ticker symbol." }),
    };
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server is missing TWELVE_DATA_API_KEY. Add it in Netlify site settings under Environment variables." }),
    };
  }

  try {
    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
    const resp = await fetch(url);
    const data = await resp.json();

    // Twelve Data returns HTTP 429, or a code of 429/'limit' inside a normal 200 response,
    // depending on where the limit was hit. Catch both so the frontend can show a friendly message.
    const isRateLimited =
      resp.status === 429 ||
      data.code === 429 ||
      (typeof data.message === 'string' && /credit|limit|too many requests/i.test(data.message));

    if (isRateLimited) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ error: "We're getting a lot of lookups right now and hit our data limit. Try again in a few minutes." }),
      };
    }

    if (data.status === "error" || data.code) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: data.message || `Couldn't find "${symbol}".` }),
      };
    }

    const price = parseFloat(data.close);
    const change = parseFloat(data.percent_change);
    const low52 = data.fifty_two_week ? parseFloat(data.fifty_two_week.low) : null;
    const high52 = data.fifty_two_week ? parseFloat(data.fifty_two_week.high) : null;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        symbol: data.symbol,
        name: data.name,
        price,
        change,
        low52,
        high52,
        exchange: data.exchange,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Something went wrong reaching the data provider. Try again in a moment." }),
    };
  }
};
