export async function GET(request: Request) {
  try {
    const getUrlObject = new URL(request.url);
    const searchParams = getUrlObject.searchParams;
    const url = searchParams.get('url');
    if (typeof url !== 'string') {
      throw 'Param `url` is only string type';
    }

    const image = await fetch(url);

    if (!image.ok) {
      throw 'not found';
    }

    const contentType = image.headers.get('Content-Type');

    const imageBase64 = await image.arrayBuffer();

    return new Response(imageBase64, {
      headers: {
        'Content-Type': contentType || 'image/png',
        'Content-Length': String(imageBase64.byteLength || 0),
        'Cache-Control': 'public, max-age=600'
      },
      status: 200
    });
  } catch (error) {
    return new Response(error as string, {
      status: 400
    });
  }
}
