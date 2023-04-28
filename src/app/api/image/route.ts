export const dynamic = 'auto';
export const revalidate = 600;

export async function GET(request: Request) {
  try {
    const getUrlObject = new URL(request.url);
    const searchParams = getUrlObject.searchParams;
    const url = searchParams.get('url');
    if (typeof url !== 'string') {
      throw 'Param `url` is only string type';
    }

    const response = await fetch(url).then(async (response) => {
      return response;
    });
    if (!response) {
      return new Response('Not Found', {
        status: 404
      });
    }

    return new Response(await response.arrayBuffer(), {
      status: response.status,
      statusText: response.statusText
    });
  } catch (error) {
    return new Response(error as string, {
      status: 400
    });
  }
}
