// frontend/utils/api.js
const BASE_URL = "https://online-voting-system-x4i2.onrender.com/api";

export const apiRequest = async (endpoint, method = "GET", data = null) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    const headers = {
        "Content-Type": "application/json",
    };

    // ─── FIX: Login और Register endpoints पर जबरदस्ती टोकन नहीं भेजेंगे ───
    if (token && !endpoint.includes("auth/login") && !endpoint.includes("auth/register")) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    // ───────────────────────────────────────────────────────────────────

    const config = {
        method,
        headers,
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    const response = await fetch(`${BASE_URL}/${endpoint}`, config);
    const result = await response.json();

    if (!response.ok) {
        let errorMessage = "Something went wrong";
        if (result) {
            if (typeof result === 'object' && !Array.isArray(result)) {
                errorMessage = Object.entries(result)
                    .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                    .join(' | ');
            } else {
                errorMessage = result.message || result.non_field_errors?.[0] || String(result);
            }
        }
        throw new Error(errorMessage);
    }

    return result;
};