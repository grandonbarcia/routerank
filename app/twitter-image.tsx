import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 1200,
  height: 600,
};

export const contentType = 'image/png';

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 80,
          background:
            'linear-gradient(135deg, rgba(17,24,39,1) 0%, rgba(30,41,59,1) 50%, rgba(17,24,39,1) 100%)',
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1 }}>
            RouteRank
          </div>
          <div style={{ marginTop: 16, fontSize: 34, fontWeight: 700 }}>
            Next.js SEO + Performance audits
          </div>
        </div>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 32,
            background:
              'linear-gradient(135deg, rgba(37,99,235,1) 0%, rgba(29,78,216,1) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 56,
            fontWeight: 900,
          }}
        >
          R
        </div>
      </div>
    ),
    size
  );
}
