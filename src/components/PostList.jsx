import { Link } from 'react-router-dom'
import { activeCheckpoints, checkpointStatus } from '../lib/core.js'

/** Postlisten (alternativ til kartet): nummer, navn og status med ikon og tekst, lenke til Kart med posten valgt. */
export default function PostList({ checkpoints, submissions, teamId, path }) {
  const posts = activeCheckpoints(checkpoints)
  if (!posts.length) return <p className="muted">Ingen poster lagt inn ennå.</p>
  return (
    <ol className="post-list">
      {posts.map((post, index) => {
        const st = checkpointStatus(post, submissions, teamId)
        return (
          <li key={post.id}>
            <Link className="post-list-item" to={`${path('kart')}?post=${encodeURIComponent(post.id)}`}>
              <span className="post-list-number" aria-hidden="true">{index + 1}</span>
              <span className="post-list-text"><strong>{post.title}</strong><small>+{post.points} poeng</small></span>
              <span className={`status ${st.submission}`}>{st.icon} {st.label}</span>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
