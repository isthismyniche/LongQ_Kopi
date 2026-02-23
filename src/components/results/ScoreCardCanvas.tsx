import { forwardRef } from 'react'

interface ScoreCardCanvasProps {
  name: string
  score: number
  drinksServed: number
  avgSeconds: number
  level: number
  levelName: string
  formattedDate: string
  qrDataURL: string
}

const ScoreCardCanvas = forwardRef<HTMLDivElement, ScoreCardCanvasProps>(
  ({ name, score, drinksServed, avgSeconds, level, levelName, formattedDate, qrDataURL }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: 800,
          height: 500,
          backgroundColor: '#FFF8E7',
          position: 'relative',
          fontFamily: '"Fredoka", sans-serif',
          padding: '40px 48px',
          boxSizing: 'border-box',
          overflow: 'hidden',
          borderRadius: 24,
          border: '3px solid rgba(92, 61, 46, 0.2)',
        }}
      >
        {/* Top accent stripe */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 7,
            backgroundColor: '#C41E3A',
            borderRadius: '24px 24px 0 0',
          }}
        />

        {/* Subtle dot grid background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(92,61,46,0.05) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Logo / wordmark */}
        <div style={{ position: 'relative' }}>
          <p style={{ margin: 0, fontSize: 30, fontWeight: 700, color: '#5C3D2E', letterSpacing: '-0.3px' }}>
            LongQ Kopi ☕
          </p>
          <p
            style={{
              margin: '3px 0 0',
              fontSize: 14,
              color: 'rgba(92,61,46,0.5)',
              fontFamily: '"Nunito", sans-serif',
              fontWeight: 400,
            }}
          >
            Singapore Hawker Drink Game
          </p>
        </div>

        {/* Main content row */}
        <div style={{ display: 'flex', marginTop: 28, gap: 32 }}>
          {/* Left: score info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: 'rgba(92,61,46,0.5)',
                fontFamily: '"Nunito", sans-serif',
              }}
            >
              Player
            </p>
            <p
              style={{
                margin: '2px 0 14px',
                fontSize: 34,
                fontWeight: 700,
                color: '#5C3D2E',
                lineHeight: 1.1,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}
            >
              {name}
            </p>

            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: 'rgba(92,61,46,0.5)',
                fontFamily: '"Nunito", sans-serif',
              }}
            >
              Score
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 84, fontWeight: 700, color: '#C41E3A', lineHeight: 1 }}>
              {score}
            </p>
            <p
              style={{
                margin: '0 0 22px',
                fontSize: 16,
                color: 'rgba(92,61,46,0.5)',
                fontFamily: '"Nunito", sans-serif',
              }}
            >
              points
            </p>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#5C3D2E' }}>{drinksServed}</p>
                <p
                  style={{
                    margin: '3px 0 0',
                    fontSize: 12,
                    color: 'rgba(92,61,46,0.5)',
                    fontFamily: '"Nunito", sans-serif',
                  }}
                >
                  drinks served
                </p>
              </div>
              <div style={{ width: 1, height: 40, backgroundColor: 'rgba(92,61,46,0.15)', alignSelf: 'center' }} />
              <div>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#5C3D2E' }}>{avgSeconds.toFixed(1)}s</p>
                <p
                  style={{
                    margin: '3px 0 0',
                    fontSize: 12,
                    color: 'rgba(92,61,46,0.5)',
                    fontFamily: '"Nunito", sans-serif',
                  }}
                >
                  avg per drink
                </p>
              </div>
              <div style={{ width: 1, height: 40, backgroundColor: 'rgba(92,61,46,0.15)', alignSelf: 'center' }} />
              <div>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#5C3D2E' }}>Lv. {level}</p>
                <p
                  style={{
                    margin: '3px 0 0',
                    fontSize: 12,
                    color: 'rgba(92,61,46,0.5)',
                    fontFamily: '"Nunito", sans-serif',
                  }}
                >
                  {levelName}
                </p>
              </div>
            </div>
          </div>

          {/* Right: QR code */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 8,
              paddingBottom: 30,
            }}
          >
            {qrDataURL && (
              <img
                src={qrDataURL}
                width={130}
                height={130}
                alt="Scan to play"
                style={{ borderRadius: 8, border: '2px solid rgba(92,61,46,0.15)', display: 'block' }}
              />
            )}
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: 'rgba(92,61,46,0.45)',
                fontFamily: '"Nunito", sans-serif',
                textAlign: 'center',
              }}
            >
              Scan to play
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: 48,
            right: 48,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: 'rgba(92,61,46,0.4)',
              fontFamily: '"Nunito", sans-serif',
            }}
          >
            {formattedDate}
          </p>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#C41E3A' }}>longqkopi.vercel.app</p>
        </div>
      </div>
    )
  },
)

ScoreCardCanvas.displayName = 'ScoreCardCanvas'

export { ScoreCardCanvas }
