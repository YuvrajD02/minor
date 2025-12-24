import express from "express";
import axios from "axios";

const router = express.Router();

// Connects to Python AI service
router.post("/", async (req, res) => {
  try {
    const { healthData } = req.body;

    if (!healthData || typeof healthData !== 'object') {
      return res.status(400).json({
        message: "Please provide health data as an object",
        example: {
          healthData: {
            "Age": 25,
            "Heart_Rate_bpm": 72,
            "Body_Temperature_C": 37.0,
            "Oxygen_Saturation_": 98,
            "Gender_Male": 1,
            "Systolic": 120,
            "Diastolic": 80,
            "Body ache": 0,
            "Cough": 1,
            "Fatigue": 1,
            "Fever": 1,
            "Headache": 0,
            "Runny nose": 0,
            "Shortness of breath": 0,
            "Sore throat": 1
          }
        }
      });
    }

    console.log("🔍 Received health data:", healthData);

    // Transform healthData into symptoms array format expected by the model
    const symptoms = [];
    const symptomMapping = {
      'Body ache': 'body_aches',
      'Cough': 'cough',
      'Fatigue': 'fatigue',
      'Fever': 'fever',
      'Headache': 'headache',
      'Runny nose': 'runny_nose',
      'Shortness of breath': 'shortness_of_breath',
      'Sore throat': 'sore_throat'
    };

    // Extract symptoms from healthData (where value is 1)
    for (const [key, mappedSymptom] of Object.entries(symptomMapping)) {
      if (healthData[key] === 1) {
        symptoms.push(mappedSymptom);
      }
    }

    console.log("🔄 Transformed symptoms:", symptoms);

    if (symptoms.length === 0) {
      return res.status(400).json({
        message: "No symptoms detected in health data"
      });
    }

    const response = await axios.post(process.env.AI_SERVICE_URL, {
      symptoms,
    }, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log("✅ Model prediction successful");

    // Forward the model response
    res.json({
      success: true,
      data: response.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ AI Prediction Error:", error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        message: "AI model service is not available. Please make sure the model server is running on port 5000.",
        error: "CONNECTION_REFUSED"
      });
    }

    if (error.response) {
      return res.status(error.response.status).json({
        message: "AI model returned an error",
        error: error.response.data
      });
    }

    res.status(500).json({
      message: "AI Prediction Service Error",
      error: error.message
    });
  }
});

// Health check endpoint
router.get("/health", async (req, res) => {
  try {
    const response = await axios.get(`${process.env.AI_SERVICE_URL.replace('/predict', '/health')}`, {
      timeout: 5000
    });

    res.json({
      backend: "healthy",
      model_service: response.data
    });
  } catch (error) {
    res.status(503).json({
      backend: "healthy",
      model_service: "unavailable",
      error: error.message
    });
  }
});

export default router;
