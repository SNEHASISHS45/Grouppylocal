import { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

export default function BadgeManager() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchUsers();
  }, []);

  const handleBadgeChange = async (userId, badge) => {
    try {
      await updateDoc(doc(db, "users", userId), { badge });
      setUsers(users.map(u => u.id === userId ? { ...u, badge } : u));
      setMessage("Badge updated successfully!");
    } catch (error) {
      setMessage("Failed to update badge.");
    }
  };

  return (
    <div>
      <h2>Badge Management</h2>
      {message && <p>{message}</p>}
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.displayName}
            <input
              value={user.badge || ""}
              onChange={e => handleBadgeChange(user.id, e.target.value)}
              placeholder="Enter badge (emoji or text)"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}