import axios from "axios";

/**
 * Lovara API Service
 * Centralized axios instance with luxury-grade error handling and request management.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/";
export const BACKEND_URL = API_BASE_URL.replace("/api", "").endsWith('/')
    ? API_BASE_URL.replace("/api", "").slice(0, -1)
    : API_BASE_URL.replace("/api", "");

/**
 * Simple JWT decode function to check expiration
 */
export const isTokenExpired = (token) => {
    if (!token) return true;
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        const { exp } = JSON.parse(jsonPayload);
        return exp < Date.now() / 1000;
    } catch (e) {
        return true;
    }
};

/**
 * Removes expired token from local storage
 */
export const clearExpiredToken = () => {
    const token = localStorage.getItem("token") || localStorage.getItem("access");
    if (token && isTokenExpired(token)) {
        localStorage.removeItem("token");
        localStorage.removeItem("access");
        localStorage.removeItem("user");
        return true;
    }
    return false;
};

const api = axios.create({
    baseURL: API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`,
    headers: {
        Accept: "application/json",
    },
    timeout: 10000,
});

// Request Interceptor: Attach Auth Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token") || localStorage.getItem("access");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global Errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
        }

        // Handle Laravel/Django/Node style error structures
        const data = error.response?.data;
        let message = "An unexpected connection error occurred";

        if (data) {
            if (typeof data === 'string') message = data;
            else if (data.message) message = data.message;
            else if (data.detail) message = data.detail;
            else if (data.errors) {
                // Handle multiple validation errors
                const firstKey = Object.keys(data.errors)[0];
                message = Array.isArray(data.errors[firstKey])
                    ? data.errors[firstKey][0]
                    : data.errors[firstKey];
            }
        } else if (error.request) {
            message = "Cannot connect to server. Please check if your backend is running.";
        }

        const customError = {
            message,
            status: error.response?.status,
            details: data || null,
        };

        return Promise.reject(customError);
    }
);

/**
 * Auth API Endpoints
 */
export const authService = {
    login: (credentials) => api.post("login/", credentials),
    register: (userData) => api.post("register/", userData),
    sendOtp: (email) => api.post("send_otp/", { email }),
    logout: () => {
        localStorage.removeItem("token");
        return Promise.resolve();
    },
    // Admin Endpoints
    getPendingVendors: () => api.get("pending-vendors/"),
    approveVendor: (vendorId) => api.patch(`approve_vendor/${vendorId}/`),
    rejectVendor: (vendorId) => api.patch(`reject_vendor/${vendorId}/`),
    getAllUsers: () => api.get("all_users/"),
    getAllVendors: () => api.get("all-vendors/"),
};

/**
 * Vendor API Endpoints
 */
export const vendorService = {
    createWork: (workData) => api.post("vendor/work/", workData),
    getVendorWorks: () => api.get("vendor/my-works/"),
    uploadWorkImages: (workId, formData) => api.post(`upload/${workId}/images/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    updateWork: (workId, workData) => api.patch(`vendor/work/${workId}/`, workData),
    deleteWork: (workId) => api.delete(`vendor/work/${workId}/delete/`),
    deleteWorkImage: (workId, imageId) => api.delete(`works/${workId}/images/${imageId}/delete/`),
    // Vendor Booking Management
    getVendorBookings: () => api.get("vendor_allbookings/"),
    updateBookingStatus: (bookingId, status) => api.patch(`approve_booking/${bookingId}/`, { status }),
};

/**
 * General/Public API Endpoints
 */
export const generalService = {
    getAllWorks: () => api.get("works/"),
    getWorkById: (workId) => api.get(`works/${workId}/`),
    toggleFavorite: (workId) => api.post(`works/${workId}/favorite/`),
    addReview: (workId, reviewData) => api.post(`works/${workId}/review/`, reviewData),
    getWorkReviews: (workId) => api.get(`works/${workId}/reviews/`),
    deleteReview: (reviewId) => api.delete(`reviews/${reviewId}/delete/`),
    // Booking Endpoints (Client)
    createBooking: (workId, bookingData) => api.post(`add_booking/${workId}/`, bookingData),
    cancelBooking: (bookingId) => api.delete(`cancel-booking/${bookingId}/`),
    getUserBookings: () => api.get("my-bookings/"),
    getBookingWeather: (bookingId) => api.get(`booking/${bookingId}/weather/`),
    getWorksByVendor: (vendorId) => api.get(`vendor/${vendorId}/works/`),
    getRecommendation: (data) => api.post(`recommendation/`, data),
    aiSearch: (query) => api.post("ai_search/", { query }),
};

/**
 * Chat API Endpoints
 */
export const chatService = {
    getOrCreateRoom: (vendorId) => api.post("chat/create_room/", { vendor_id: vendorId }),
    getUserRooms: () => api.get("chat/rooms/"),
};

/**
 * General API Wrapper
 */
export const request = {
    get: (url, config) => api.get(url, config),
    post: (url, data, config) => api.post(url, data, config),
    put: (url, data, config) => api.put(url, data, config),
    delete: (url, config) => api.delete(url, config),
    patch: (url, data, config) => api.patch(url, data, config),
};

export default api;
