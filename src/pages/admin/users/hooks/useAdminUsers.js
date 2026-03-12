// src/pages/admin/users/hooks/useAdminUsers.js
import { useCallback, useState } from "react";
import { AdminAPI } from "../../../../api/admin.api";
import { mapUser } from "../utils/userMappers";

export default function useAdminUsers() {
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const fetchUsers = useCallback(async (params = {}) => {
    setLoadingUsers(true);
    try {
      const res = await AdminAPI.listUsers(params);

      const raw =
        Array.isArray(res.data) ? res.data :
        Array.isArray(res.data?.data) ? res.data.data :
        Array.isArray(res.data?.users) ? res.data.users :
        [];

      setUsuarios(raw.map(mapUser));
    } catch (error) {
      console.error("fetchUsers:", error);
      setUsuarios([]);
      throw error;
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  return { usuarios, loadingUsers, fetchUsers, setUsuarios };
}
