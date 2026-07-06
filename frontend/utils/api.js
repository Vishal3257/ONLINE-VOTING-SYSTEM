// frontend/utils/api.js
const BASE_URL = "https://online-voting-system-x4i2.onrender.com/api";

export const apiRequest = async (endpoint, method = "GET", data = null) => {
    // Check both 'token' and 'accessToken' keys to avoid any naming mismatch
    let token = null;
    if (typeof window !== "undefined") {
        token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    }

    const headers = {
        "Content-Type": "application/json",
    };

    // --- FIX: Do not attach token for auth login and register endpoints ---
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
    
    // Handle potential non-JSON responses (like HTML error pages from Render/Django)
    const contentType = response.headers.get("content-type");
    let result = null;
    
    if (contentType && contentType.includes("application/json")) {
        result = await response.json();
    }

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
        } else {
            // If response is HTML instead of JSON, display status text
            errorMessage = `Server Error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
    }

    return result;
};