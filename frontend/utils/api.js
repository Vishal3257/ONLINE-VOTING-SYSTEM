// frontend/utils/api.js
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://online-voting-system-x4i2.onrender.com/api";

export const apiRequest = async (endpoint, method = "GET", data = null) => {
    let token = null;
    if (typeof window !== "undefined") {
        token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    }

    const headers = {
        "Content-Type": "application/json",
    };

    // Clean leading and trailing slashes from endpoint
    let cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
    if (!cleanEndpoint.endsWith("/")) {
        cleanEndpoint = `${cleanEndpoint}/`;
    }

    // Do not attach token for any authentication / OTP endpoints
    const isAuthEndpoint = cleanEndpoint.startsWith("auth/");
    if (token && !isAuthEndpoint) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    // Final cleanly built URL
    const fullUrl = `${BASE_URL}/${cleanEndpoint}`;

    try {
        const response = await fetch(fullUrl, config);
        
        // Handle potential non-JSON responses
        const contentType = response.headers.get("content-type");
        let result = null;
        
        if (contentType && contentType.includes("application/json")) {
            result = await response.json();
        }

        if (!response.ok) {
            // Handle 401 Unauthorized (Expired token or Invalid Auth)
            if (response.status === 401 && typeof window !== "undefined") {
                localStorage.removeItem("token");
                localStorage.removeItem("accessToken");
                localStorage.removeItem("username");
                window.location.href = "/"; // Direct Home Page par redirect
            }

            let errorMessage = "Something went wrong";
            
            if (result) {
                if (typeof result === 'object' && !Array.isArray(result)) {
                    errorMessage = Object.entries(result)
                        .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                        .join(' | ');
                } else {
                    errorMessage = result.message || result.detail || result.non_field_errors?.[0] || String(result);
                }
            } else {
                errorMessage = `Server Error: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }

        return result;
    } catch (error) {
        throw error;
    }
};