// src/hooks/useQueryState.js
import { useMemo, useState } from "react";

export function useQueryState(initial = {}) {
  const [query, setQuery] = useState(initial);

  const params = useMemo(() => {
    // limpia null/"" para no ensuciar querystring
    const clean = {};
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === "") continue;
      clean[k] = v;
    }
    return clean;
  }, [query]);

  return { query, setQuery, params };
}
