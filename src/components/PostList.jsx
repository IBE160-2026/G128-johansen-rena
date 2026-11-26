import { Link } from 'react-router-dom'
import { checkpointStatus, visibleCheckpoints } from '../lib/core.js'

/** Postlisten (alternativ til kartet). Den følger ikke posisjonen: sporingen kjører bare på Kart, så geolåste poster står som låst her.
 * nummer, navn og status med ikon og tekst, lenke til Kart med posten valgt. */
export default function PostList({ checkpoints, submissions, teamId, path }) {
  const posts = visibleCheckpoints(checkpoints)
  if (!posts.length) return <p className="muted">Ingen poster lagt inn ennå.</p>
  return (
    <ol className="post-list">
      {posts.map((post, index) => {
        const st = checkpointStatus(post, submissions, teamId)
        return (
          <li key={post.id} className={st.deactivated ? 'deactivated' : undefined}>
            <Link className="post-list-item" to={`${path('kart')}?post=${encodeURIComponent(post.id)}`}>
              <span className="post-list-number" aria-hidden="true">{index + 1}</span>
              <span className="post-list-text"><strong>{post.title}</strong><small>+{post.points} poeng</small></span>
              <span className={`status ${st.submission}`}>{st.icon} {st.label}</span>{st.chip && <span className="status deactivated"> ⊘ Deaktivert</span>}
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
