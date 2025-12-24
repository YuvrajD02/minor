import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { predictDisease, checkServiceHealth } from "../api/predict.js";

const Diagnose = () => {
  const [formData, setFormData] = useState({
    Age: '',
    Heart_Rate_bpm: '',
    Body_Temperature_C: '',
    Oxygen_Saturation_: '',
    Gender_Male: '',
    Systolic: '',
    Diastolic: '',
    'Body ache': '',
    'Cough': '',
    'Fatigue': '',
    'Fever': '',
    'Headache': '',
    'Runny nose': '',
    'Shortness of breath': '',
    'Sore throat': ''
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [serviceStatus, setServiceStatus] = useState({ backend: "checking", model_service: "checking" });
  const [error, setError] = useState('');

  // Check service health on component mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await checkServiceHealth();
        setServiceStatus(health);
      } catch (error) {
        setServiceStatus({ backend: "error", model_service: "unavailable" });
      }
    };
    checkHealth();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when input changes
  };

  const validateForm = () => {
    const requiredFields = ['Age', 'Heart_Rate_bpm', 'Body_Temperature_C', 'Oxygen_Saturation_', 'Gender_Male', 'Systolic', 'Diastolic'];
    const symptomFields = ['Body ache', 'Cough', 'Fatigue', 'Fever', 'Headache', 'Runny nose', 'Shortness of breath', 'Sore throat'];

    // Check required fields
    for (let field of requiredFields) {
      if (!formData[field] || formData[field] === '') {
        return `Please fill in ${field.replace('_', ' ')}`;
      }
    }

    // Check if at least one symptom is selected
    const hasSymptom = symptomFields.some(symptom => formData[symptom] !== '');
    if (!hasSymptom) {
      return "Please select at least one symptom";
    }

    // Validate numeric ranges
    const age = parseInt(formData.Age);
    const heartRate = parseInt(formData.Heart_Rate_bpm);
    const temp = parseFloat(formData.Body_Temperature_C);
    const oxygen = parseFloat(formData.Oxygen_Saturation_);
    const systolic = parseInt(formData.Systolic);
    const diastolic = parseInt(formData.Diastolic);

    if (age < 0 || age > 120) return "Age must be between 0 and 120";
    if (heartRate < 30 || heartRate > 220) return "Heart rate must be between 30 and 220 bpm";
    if (temp < 35 || temp > 42) return "Body temperature must be between 35°C and 42°C";
    if (oxygen < 70 || oxygen > 100) return "Oxygen saturation must be between 70% and 100%";
    if (systolic < 70 || systolic > 250) return "Systolic pressure must be between 70 and 250";
    if (diastolic < 40 || diastolic > 150) return "Diastolic pressure must be between 40 and 150";

    return null;
  };

  const handlePredictDisease = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsAnalyzing(true);
    setResults(null);
    setError('');

    try {
      // Convert form data to the format expected by the model
      const modelInput = {
        ...formData,
        // Convert string values to numbers where needed
        Age: parseInt(formData.Age),
        Heart_Rate_bpm: parseInt(formData.Heart_Rate_bpm),
        Body_Temperature_C: parseFloat(formData.Body_Temperature_C),
        Oxygen_Saturation_: parseFloat(formData.Oxygen_Saturation_),
        Gender_Male: parseInt(formData.Gender_Male),
        Systolic: parseInt(formData.Systolic),
        Diastolic: parseInt(formData.Diastolic),
        // Convert symptoms to integers (empty string becomes 0)
        'Body ache': formData['Body ache'] === '' ? 0 : parseInt(formData['Body ache']),
        'Cough': formData['Cough'] === '' ? 0 : parseInt(formData['Cough']),
        'Fatigue': formData['Fatigue'] === '' ? 0 : parseInt(formData['Fatigue']),
        'Fever': formData['Fever'] === '' ? 0 : parseInt(formData['Fever']),
        'Headache': formData['Headache'] === '' ? 0 : parseInt(formData['Headache']),
        'Runny nose': formData['Runny nose'] === '' ? 0 : parseInt(formData['Runny nose']),
        'Shortness of breath': formData['Shortness of breath'] === '' ? 0 : parseInt(formData['Shortness of breath']),
        'Sore throat': formData['Sore throat'] === '' ? 0 : parseInt(formData['Sore throat'])
      };

      console.log("🔍 Sending data to API:", modelInput);
      const response = await predictDisease(modelInput);
      console.log("📥 Received response:", response);

      if (response.success && response.data.predictions) {
        setResults(response.data.predictions.length > 0 ? response.data.predictions : []);
      } else {
        setError("No predictions received from the model");
      }
    } catch (error) {
      setError(error.message || "Failed to get prediction from AI model");
      setResults([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadReport = () => {
    alert("Report download started");
    // In a real app, generate and download PDF here
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 text-[#133D3E]">AI Health Diagnosis</h1>
            <p className="text-lg text-gray-600">
              Select your symptoms to get an AI-powered health analysis
            </p>

            {/* Service Status */}
            <div className="mt-4 flex justify-center">
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm border flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${serviceStatus.model_service === 'healthy' || serviceStatus.model_service?.status === 'healthy'
                  ? 'bg-green-500'
                  : serviceStatus.model_service === 'checking'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                  }`}></span>
                <span className="text-sm text-gray-600">
                  AI Model: {
                    serviceStatus.model_service === 'healthy' || serviceStatus.model_service?.status === 'healthy'
                      ? 'Ready'
                      : serviceStatus.model_service === 'checking'
                        ? 'Checking...'
                        : 'Offline'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <span className="text-red-500 text-xl mr-2">⚠️</span>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Health Data Form */}
          <div className="bg-white rounded-lg shadow-md mb-8 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2 text-[#133D3E] flex items-center gap-2">
                📋 Health Information
              </h2>
              <p className="text-gray-600">
                Please provide your vital signs and basic health information for accurate diagnosis.
              </p>
            </div>

            {/* Vital Signs Section */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-[#133D3E]">Vital Signs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="Age" className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    id="Age"
                    name="Age"
                    value={formData.Age}
                    onChange={handleInputChange}
                    placeholder="Enter your age"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1CA5A8] focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="Gender_Male" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    id="Gender_Male"
                    name="Gender_Male"
                    value={formData.Gender_Male}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1CA5A8] focus:border-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="1">Male</option>
                    <option value="0">Female</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="Heart_Rate_bpm" className="block text-sm font-medium text-gray-700 mb-1">Heart Rate (bpm)</label>
                  <input
                    type="number"
                    id="Heart_Rate_bpm"
                    name="Heart_Rate_bpm"
                    value={formData.Heart_Rate_bpm}
                    onChange={handleInputChange}
                    placeholder="60-100 normal"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1CA5A8] focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="Body_Temperature_C" className="block text-sm font-medium text-gray-700 mb-1">Body Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    id="Body_Temperature_C"
                    name="Body_Temperature_C"
                    value={formData.Body_Temperature_C}
                    onChange={handleInputChange}
                    placeholder="37.0 normal"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1CA5A8] focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="Oxygen_Saturation_" className="block text-sm font-medium text-gray-700 mb-1">Oxygen Saturation (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    id="Oxygen_Saturation_"
                    name="Oxygen_Saturation_"
                    value={formData.Oxygen_Saturation_}
                    onChange={handleInputChange}
                    placeholder="95-100 normal"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1CA5A8] focus:border-transparent"
                  />
                </div>
                <div></div>
                <div>
                  <label htmlFor="Systolic" className="block text-sm font-medium text-gray-700 mb-1">Systolic Blood Pressure</label>
                  <input
                    type="number"
                    id="Systolic"
                    name="Systolic"
                    value={formData.Systolic}
                    onChange={handleInputChange}
                    placeholder="120 normal"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1CA5A8] focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="Diastolic" className="block text-sm font-medium text-gray-700 mb-1">Diastolic Blood Pressure</label>
                  <input
                    type="number"
                    id="Diastolic"
                    name="Diastolic"
                    value={formData.Diastolic}
                    onChange={handleInputChange}
                    placeholder="80 normal"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1CA5A8] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Symptoms Section */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-[#133D3E]">Current Symptoms</h3>
              <p className="text-gray-600 mb-3">Select "Yes" for symptoms you are currently experiencing:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['Body ache', 'Cough', 'Fatigue', 'Fever', 'Headache', 'Runny nose', 'Shortness of breath', 'Sore throat'].map((symptom) => (
                  <div key={symptom}>
                    <label htmlFor={symptom} className="block text-sm font-medium text-gray-700 mb-1">{symptom}</label>
                    <select
                      id={symptom}
                      name={symptom}
                      value={formData[symptom]}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1CA5A8] focus:border-transparent"
                    >
                      <option value="">Select...</option>
                      <option value="1">Yes</option>
                      <option value="0">No</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handlePredictDisease}
                disabled={isAnalyzing || (serviceStatus.model_service !== 'healthy' && serviceStatus.model_service?.status !== 'healthy')}
                className="flex-1 bg-[#1CA5A8] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#17888A] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <span className="mr-2">⏳</span>
                    Analyzing with AI...
                  </>
                ) : (
                  "Get AI Diagnosis"
                )}
              </button>
              <button
                onClick={() => setFormData({
                  Age: '', Heart_Rate_bpm: '', Body_Temperature_C: '', Oxygen_Saturation_: '',
                  Gender_Male: '', Systolic: '', Diastolic: '', 'Body ache': '', 'Cough': '',
                  'Fatigue': '', 'Fever': '', 'Headache': '', 'Runny nose': '',
                  'Shortness of breath': '', 'Sore throat': ''
                })}
                className="bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Results */}
          {results !== null && (
            <div className="space-y-6">
              {results.length > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-[#133D3E]">Diagnosis Results</h2>
                    <button
                      onClick={downloadReport}
                      className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition"
                    >
                      📥 Download Report
                    </button>
                  </div>
                  {results.map((result, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-md border-2 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold mb-2 text-[#133D3E]">{result.disease}</h3>
                          <p className="text-gray-600 text-base">
                            {result.description}
                          </p>
                        </div>
                        <span
                          className={`text-base px-4 py-1 rounded-full font-semibold ${result.confidence > 70
                            ? "bg-[#1CA5A8] text-white"
                            : "bg-gray-200 text-gray-700"
                            }`}
                        >
                          {result.confidence}% Match
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 text-[#133D3E]">Preventive Measures:</h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                          {result.preventive.map((tip, i) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="font-bold mb-2 text-yellow-800 flex items-center gap-2">
                      ⚠️ Important Notice
                    </h3>
                    <p className="text-yellow-700 mb-4">
                      This is an AI-based preliminary analysis and should not replace professional medical advice.
                      Please consult with a healthcare provider for proper diagnosis and treatment.
                    </p>
                    <Link to="/doctors">
                      <button className="bg-[#1CA5A8] text-white py-2 px-6 rounded-lg font-semibold hover:bg-[#17888A] transition">
                        Consult a Doctor
                      </button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold mb-2 text-[#133D3E]">No Strong Matches Found</h3>
                  <p className="text-gray-600 mb-4">
                    We couldn't find a strong match for your symptoms. This doesn't mean nothing is wrong -
                    we recommend consulting with a healthcare professional for a proper evaluation.
                  </p>
                  <Link to="/doctors">
                    <button className="bg-[#1CA5A8] text-white py-2 px-6 rounded-lg font-semibold hover:bg-[#17888A] transition">
                      Find a Doctor
                    </button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Diagnose;
