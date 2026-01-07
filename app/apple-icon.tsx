import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, rgba(37,99,235,1) 0%, rgba(29,78,216,1) 100%)',
          borderRadius: 32,
        }}
      >
        <div
          style={{
            fontSize: 112,
            fontWeight: 900,
            color: '#fff',
            lineHeight: 1,
            fontFamily:
              'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
          }}
        >
          R
        </div>
      </div>
    ),
    size
  );
}
