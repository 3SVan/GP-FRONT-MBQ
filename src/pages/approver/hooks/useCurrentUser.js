// src/pages/approver/hooks/useCurrentUser.js
import { useEffect, useState } from "react";
import { UsersAPI } from "../../../api/users.api";

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const me = await UsersAPI.me();
        if (mounted) setCurrentUser(me);
      } catch (e) {
        console.warn("No se pudo cargar el usuario actual:", e?.message || e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { currentUser };
}