import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { FaUserShield, FaTrash, FaBan, FaCheckCircle, FaUndo, FaUserTag } from "react-icons/fa";

const ROLES = [
  "User",
  "Assistant Manager",
  "Manager",
  "Moderator",
  "Admin"
];

export default function Management() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [groupLoading, setGroupLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "users"));
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchUsers();
  }, []);

  
  useEffect(() => {
    const fetchGroups = async () => {
      setGroupLoading(true);
      const snapshot = await getDocs(collection(db, "groups"));
      setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setGroupLoading(false);
    };
    fetchGroups();
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
 

  const handleRoleChange = async (userId, role) => {
    try {
      await updateDoc(doc(db, "users", userId), { role });
      setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
      setMessage("Role updated successfully!");
    } catch (error) {
      setMessage("Failed to update role.");
    }
  };

  const handleBan = async (userId) => {
    try {
      console.log("Banning user:", userId);
      await updateDoc(doc(db, "users", userId), { banned: true });
      setUsers(users.map(u => u.id === userId ? { ...u, banned: true } : u));
      setMessage("User banned.");
    } catch (error) {
      console.error("Ban error:", error);
      setMessage("Failed to ban user.");
    }
  };

  const handleUnban = async (userId) => {
    try {
      await updateDoc(doc(db, "users", userId), { banned: false });
      setUsers(users.map(u => u.id === userId ? { ...u, banned: false } : u));
      setMessage("User unbanned.");
    } catch (error) {
      setMessage("Failed to unban user.");
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers(users.filter(u => u.id !== userId));
      setMessage("User deleted.");
    } catch (error) {
      setMessage("Failed to delete user.");
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("Are you sure you want to delete this group? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "groups", groupId));
      setGroups(groups.filter(g => g.id !== groupId));
      setMessage("Group deleted.");
    } catch (error) {
      setMessage("Failed to delete group.");
    }
  };

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-[#232526] to-[#414345] text-white">
      <motion.h1 
        className="text-3xl font-bold mb-6"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
      </motion.h1>
      <AnimatePresence>
        {message && (
          <motion.div
            className="mb-4 p-3 rounded bg-green-600/80 text-white font-semibold shadow-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
      <section className="mb-12">
        <motion.h2 
          className="text-2xl font-semibold mb-4 flex items-center gap-2"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <FaUserShield className="text-purple-400" /> User Management
        </motion.h2>
        {loading ? (
          <div className="text-lg text-gray-300">Loading users...</div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-lg">
            <table className="min-w-full bg-[#23272f] rounded-lg">
              <thead>
                <tr className="bg-[#2d313a] text-purple-300">
                  <th className="py-3 px-4">Avatar</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Badge</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`border-b border-[#36393f] hover:bg-[#292b32] transition`}
                  >
                    <td className="py-2 px-4">
                      <img src={user.photoURL || "/default-avatar.png"} alt={user.displayName} className="w-10 h-10 rounded-full border-2 border-purple-400 shadow" />
                    </td>
                    <td className="py-2 px-4 font-semibold">{user.displayName}</td>
                    <td className="py-2 px-4 text-gray-300">{user.email}</td>
                    <td className="py-2 px-4">
                      <input
                        className="rounded px-2 py-1 bg-[#18191a] text-white border border-purple-400 w-20"
                        value={user.badge || ""}
                        onChange={e => handleBadgeChange(user.id, e.target.value)}
                        placeholder="Badge"
                        maxLength={8}
                      />
                    </td>
                    <td className="py-2 px-4">
                      <select
                        className="rounded px-2 py-1 bg-[#18191a] text-white border border-purple-400"
                        value={user.role || "User"}
                        onChange={e => handleRoleChange(user.id, e.target.value)}
                      >
                        {ROLES.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-4">
                      {user.banned ? (
                        <span className="text-red-400 font-bold flex items-center gap-1"><FaBan /> Banned</span>
                      ) : (
                        <span className="text-green-400 font-bold flex items-center gap-1"><FaCheckCircle /> Active</span>
                      )}
                    </td>
                    <td className="py-2 px-4 flex gap-2">
                      {!user.banned ? (
                        <button
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded flex items-center gap-1 transition"
                          onClick={() => handleBan(user.id)}
                          title="Ban User"
                        >
                          <FaBan /> Ban
                        </button>
                      ) : (
                        <button
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded flex items-center gap-1 transition"
                          onClick={() => handleUnban(user.id)}
                          title="Unban User"
                        >
                          <FaUndo /> Unban
                        </button>
                      )}
                      <button
                        className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded flex items-center gap-1 transition"
                        onClick={() => handleDelete(user.id)}
                        title="Delete User"
                      >
                        <FaTrash /> Delete
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="mb-12">
        <motion.h2 
          className="text-2xl font-semibold mb-4 flex items-center gap-2"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <FaUserTag className="text-blue-400" /> Role & Badge Analytics
        </motion.h2>
        <div className="flex flex-wrap gap-6">
          {ROLES.map(role => (
            <motion.div
              key={role}
              className="bg-[#23272f] rounded-lg shadow-lg p-6 min-w-[180px] flex-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-lg font-bold text-purple-300 mb-2">{role}</div>
              <div className="text-3xl font-extrabold text-white mb-1">
                {users.filter(u => (u.role || "User") === role).length}
              </div>
              <div className="text-sm text-gray-400">Users</div>
            </motion.div>
          ))}
          <motion.div
            className="bg-[#23272f] rounded-lg shadow-lg p-6 min-w-[180px] flex-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-lg font-bold text-yellow-300 mb-2">Badged Users</div>
            <div className="text-3xl font-extrabold text-white mb-1">
              {users.filter(u => u.badge).length}
            </div>
            <div className="text-sm text-gray-400">Users</div>
          </motion.div>
        </div>
      </section>
      <section>
        <motion.h2 
          className="text-2xl font-semibold mb-4 flex items-center gap-2"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <FaUserShield className="text-green-400" /> Monitoring & Activity
        </motion.h2>
        <div className="text-gray-300">
          {/* You can add more advanced analytics, activity logs, or monitoring here */}
          <p>Monitor user activity, login times, and more (feature coming soon).</p>
        </div>
      </section>
      {/* Group Management Section */}
      <section className="mb-12">
        <motion.h2
          className="text-2xl font-semibold mb-4 flex items-center gap-2"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <FaUserShield className="text-pink-400" /> Group Management
        </motion.h2>
        {groupLoading ? (
          <div className="text-lg text-gray-300">Loading groups...</div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-lg">
            <table className="min-w-full bg-[#23272f] rounded-lg">
              <thead>
                <tr className="bg-[#2d313a] text-pink-300">
                  <th className="py-3 px-4">Group Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Members</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(group => (
                  <motion.tr
                    key={group.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-b border-[#36393f] hover:bg-[#292b32] transition"
                  >
                    <td className="py-2 px-4 font-semibold">{group.name}</td>
                    <td className="py-2 px-4 text-gray-300">{group.description || "—"}</td>
                    <td className="py-2 px-4">{Array.isArray(group.members) ? group.members.length : 0}</td>
                    <td className="py-2 px-4">
                      <button
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded flex items-center gap-1 transition"
                        onClick={() => handleDeleteGroup(group.id)}
                        title="Delete Group"
                      >
                        <FaTrash /> Delete
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Advanced Analytics Section */}
      <section className="mb-12">
        <motion.h2
          className="text-2xl font-semibold mb-4 flex items-center gap-2"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          📊 Advanced Analytics
        </motion.h2>
        <div className="flex flex-wrap gap-6">
          <motion.div
            className="bg-[#23272f] rounded-lg shadow-lg p-6 min-w-[180px] flex-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-lg font-bold text-pink-300 mb-2">Total Groups</div>
            <div className="text-3xl font-extrabold text-white mb-1">{groups.length}</div>
            <div className="text-sm text-gray-400">Groups</div>
          </motion.div>
          <motion.div
            className="bg-[#23272f] rounded-lg shadow-lg p-6 min-w-[180px] flex-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-lg font-bold text-blue-300 mb-2">Total Users</div>
            <div className="text-3xl font-extrabold text-white mb-1">{users.length}</div>
            <div className="text-sm text-gray-400">Users</div>
          </motion.div>
          {/* Add more analytics cards as needed */}
        </div>
      </section>

      {/* Real-Time Monitoring Section */}
      <section>
        <motion.h2
          className="text-2xl font-semibold mb-4 flex items-center gap-2"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          🟢 Real-Time Monitoring
        </motion.h2>
        <div className="text-gray-300">
          <p>
            {/* You can implement real-time listeners for user/group activity here */}
            Real-time monitoring of user and group activity coming soon!
          </p>
        </div>
      </section>
    </div>
  );
}