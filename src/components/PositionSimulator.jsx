import { moveBy, positionAtPost } from '../lib/geo.js'

/** Posisjonssimulator for demo-modus (Story 3.3, UX-DR10). Posisjonen holdes bare i minnet i Kart-siden. */
export default function PositionSimulator({ posts, simulated, onSet, onClear }) {
  return (
    <div className="position-simulator">
      <div className="position-simulator-head">
        <strong>Posisjonssimulator</strong>
        <span className="pill">Demo</span>
      </div>
      <p className="micro">Trykk på kartet for å flytte deg dit, gå til en post, eller flytt deg 100 m med knappene.</p>
      <div className="position-simulator-buttons">
        {posts.map((post, index) => (
          <button key={post.id} type="button" className="button small outline" disabled={!positionAtPost(post)} onClick={() => onSet(positionAtPost(post))}>
            Gå til post {index + 1}
          </button>
        ))}
        <button type="button" className="button small ghost" disabled={!simulated} onClick={onClear}>Fjern posisjon</button>
      </div>
      <div className="position-simulator-buttons" role="group" aria-label="Flytt posisjonen 100 meter">
        {[['Nord', 100, 0], ['Sør', -100, 0], ['Øst', 0, 100], ['Vest', 0, -100]].map(([label, north, east]) => (
          <button key={label} type="button" className="button small outline" disabled={!simulated} onClick={() => onSet(moveBy(simulated, north, east) ?? simulated)}>100 m {label.toLowerCase()}</button>
        ))}
      </div>
      <p className="micro" role="status">{simulated ? `Simulert posisjon: ${simulated.lat.toFixed(5)}, ${simulated.lng.toFixed(5)}` : 'Ingen posisjon er satt ennå. Geolåste poster er låst.'}</p>
    </div>
  )
}
