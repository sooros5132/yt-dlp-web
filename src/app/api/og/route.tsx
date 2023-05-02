/* eslint-disable import/no-anonymous-default-export */
import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          textAlign: 'center',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background:
            'linear-gradient(to right top, #973c70, #933e80, #8a4390, #7b49a0, #6451b0, #5261bf, #3970cc, #007ed6, #0095dd, #00a9da, #00bbce, #1fcbc0)',
          color: 'white',
          fontSize: 128,
          fontWeight: 'bold',
          textShadow: '3px 4px 5px #202034'
        }}
      >
        📹 yt-dlp-web
      </div>
    ),
    {
      width: 1200,
      height: 600
    }
  );
}
