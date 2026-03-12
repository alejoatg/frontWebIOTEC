"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, User as UserIcon } from "lucide-react";
import { fetchUsers } from "../../api/usersApi";
import type { UserListItem } from "../../api/usersApi";
import styles from "./UserSelector.module.scss";

export interface UserSelectorProps {
  value: string | null;
  onSelect: (userId: string | null, user: UserListItem | null) => void;
  disabled?: boolean;
}

export default function UserSelector({
  value,
  onSelect,
  disabled = false,
}: UserSelectorProps) {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const data = await fetchUsers();
        setUsers(data);
        if (value) {
          const user = data.find((u) => u.id === value);
          setSelectedUser(user || null);
        }
      } catch (err) {
        console.error("Error loading users:", err);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = (user: UserListItem) => {
    setSelectedUser(user);
    onSelect(user.id, user);
    setOpen(false);
    setSearch("");
  };

  const handleClear = () => {
    setSelectedUser(null);
    onSelect(null, null);
    setSearch("");
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <label className={styles.label}>Usuario asociado (opcional)</label>

      {!selectedUser ? (
        <div className={styles.inputWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.input}
            placeholder="Buscar usuario por nombre o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setOpen(true)}
            disabled={disabled || loading}
          />
        </div>
      ) : (
        <div className={styles.selected}>
          <div className={styles.selectedUser}>
            {selectedUser.picture ? (
              <img
                src={selectedUser.picture}
                alt=""
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <UserIcon size={16} />
              </div>
            )}
            <div className={styles.userInfo}>
              <span className={styles.userName}>{selectedUser.name}</span>
              <span className={styles.userEmail}>{selectedUser.email}</span>
            </div>
          </div>
          <button
            type="button"
            className={styles.clearBtn}
            onClick={handleClear}
            disabled={disabled}
            aria-label="Quitar usuario"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {open && !selectedUser && (
        <div className={styles.dropdown}>
          {loading ? (
            <div className={styles.loading}>Cargando usuarios...</div>
          ) : filteredUsers.length === 0 ? (
            <div className={styles.empty}>No se encontraron usuarios</div>
          ) : (
            <ul className={styles.list}>
              {filteredUsers.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    className={styles.option}
                    onClick={() => handleSelect(user)}
                  >
                    {user.picture ? (
                      <img
                        src={user.picture}
                        alt=""
                        className={styles.avatar}
                      />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        <UserIcon size={16} />
                      </div>
                    )}
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{user.name}</span>
                      <span className={styles.userEmail}>{user.email}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <span className={styles.hint}>
        Si seleccionas un usuario, sus datos se rellenarán automáticamente
      </span>
    </div>
  );
}
