export async function onRequestGet(context) {
  try {
    const overview = await context.env.DB
      .prepare("SELECT * FROM v_house_overview LIMIT 1")
      .first();

    return new Response(
      JSON.stringify(
        {
          ok: true,
          service: "POSTCARD Intelligence",
          database: "connected",
          house: overview
        },
        null,
        2
      ),
      {
        status: 200,
        headers: {
          "content-type": "application/json; charset=UTF-8",
          "cache-control": "no-store"
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify(
        {
          ok: false,
          database: "error",
          message: error.message
        },
        null,
        2
      ),
      {
        status: 500,
        headers: {
          "content-type": "application/json; charset=UTF-8",
          "cache-control": "no-store"
        }
      }
    );
  }
}
