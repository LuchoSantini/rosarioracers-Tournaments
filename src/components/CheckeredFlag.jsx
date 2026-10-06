// Mini bandera a cuadros: marca las fechas que ya se disputaron.
export default function CheckeredFlag({ size = 22, title = 'Ya se disputó' }) {
  const cells = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      cells.push(<rect key={`${row}-${col}`} x={6 + col * 4} y={3 + row * 4} width="4" height="4" fill={(row + col) % 2 === 0 ? '#fff' : '#111'} />);
    }
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={title} style={{ flexShrink: 0, display: 'block' }}>
      <title>{title}</title>
      <rect x="3.2" y="2" width="2" height="20" rx="1" fill="#c9cfd8" />
      {cells}
      <rect x="6" y="3" width="16" height="12" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" />
    </svg>
  );
}
