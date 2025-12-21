import axios from "axios";

const API_URL = "https://ml-vxmh.onrender.com";

// Call the backend prediction API
export const predictDisease = async (healthData) => {
    try {
        console.log("📤 Sending to backend:", { healthData });
        const response = await axios.post(`${API_URL}/predict`,
            { healthData },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("📨 Backend response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Prediction error:", error);
        console.error("Error response:", error.response?.data);
        const errorMessage = error.response?.data?.message || error.message || 'Prediction failed';
        throw new Error(errorMessage);
    }
};// Check if the AI service is healthy
export const checkServiceHealth = async () => {
    try {
        const response = await axios.get(`${API_URL}/predict/health`);
        return response.data;
    } catch (error) {
        console.error("Health check error:", error);
        return { backend: "error", model_service: "unavailable" };
    }
};
