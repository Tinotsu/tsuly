export function DetachedPrompterWindow({
  lines,
  currentLine,
  fontSize,
  lineHighlight,
}: {
  lines: string[]
  currentLine: number
  fontSize: number
  lineHighlight: boolean
}) {
  const lineHeight = Math.round(fontSize * 1.35)
  const firstVisibleLine = Math.max(0, currentLine - 1)
  const visibleLines = lines.slice(firstVisibleLine, firstVisibleLine + 3)

  return (
    <div
      style={{
        alignItems: 'center',
        background: '#111',
        boxSizing: 'border-box',
        color: '#fff',
        display: 'flex',
        fontFamily: 'system-ui, sans-serif',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 18,
        textAlign: 'center',
        textShadow: '0 2px 14px rgb(0 0 0 / 0.75)',
      }}
    >
      <div style={{ width: '100%' }}>
        {visibleLines.map((line, index) => {
          const lineIndex = firstVisibleLine + index

          return (
            <p
              key={`${line}-${lineIndex}`}
              style={{
                background:
                  lineHighlight && lineIndex === currentLine ? 'rgb(0 0 0 / 0.4)' : 'transparent',
                borderRadius: 8,
                fontSize,
                fontWeight: 700,
                lineHeight: `${lineHeight}px`,
                margin: '0 auto',
                maxWidth: '92%',
                opacity: lineHighlight && lineIndex !== currentLine ? 0.45 : 1,
                padding: '0 8px',
              }}
            >
              {line}
            </p>
          )
        })}
      </div>
    </div>
  )
}
