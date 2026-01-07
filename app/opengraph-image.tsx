import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background:
            'linear-gradient(135deg, rgba(37,99,235,1) 0%, rgba(79,70,229,1) 50%, rgba(124,58,237,1) 100%)',
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 24,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 44,
              fontWeight: 900,
            }}
          >
            R
          </div>
          <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1 }}>
            RouteRank
          </div>
        </div>

        <div
          style={{
            marginTop: 28,
            fontSize: 44,
            fontWeight: 800,
            lineHeight: 1.15,
            maxWidth: 980,
          }}
        >
          SEO & Performance Audits built for Next.js
        </div>

        <div
          style={{
            marginTop: 22,
            fontSize: 28,
            opacity: 0.92,
            maxWidth: 980,
            lineHeight: 1.35,
          }}
        >
          App Router-aware insights, Core Web Vitals, and actionable fixes.
        </div>
      </div>
    ),
    size
  );
}
