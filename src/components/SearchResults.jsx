import { Link } from 'react-router-dom';

function SearchResults({ users }) {
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          <Link to={`/profile/${user.id}`}>
            <img src={user.photoURL} alt={user.displayName} />
            <span>{user.displayName}</span>
            {user.badge && (
              <span className="ml-2 text-xl" title="User Badge">
                {user.badge}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}