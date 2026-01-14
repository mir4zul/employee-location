import { useState } from "react";

export default function useApi(apiFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn(...args);
      return res.data;
    } catch (err) {
      setError(err.response?.data || "Server error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { request, loading, error };
}
