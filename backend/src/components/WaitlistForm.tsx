import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface WaitlistFormData {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  useCase: string;
  referralCode: string;
}

const WaitlistForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<WaitlistFormData>({
    email: "",
    firstName: "",
    lastName: "",
    company: "",
    useCase: "",
    referralCode: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [errors, setErrors] = useState<Partial<WaitlistFormData>>({});

  // Simulate live waitlist counter
  useEffect(() => {
    const interval = setInterval(() => {
      setWaitlistPosition((prev) =>
        prev
          ? prev + Math.floor(Math.random() * 3)
          : 2847 + Math.floor(Math.random() * 10)
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalSteps = 3;

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Partial<WaitlistFormData> = {};

    switch (currentStep) {
      case 1:
        if (!formData.email) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email))
          newErrors.email = "Invalid email format";
        if (!formData.firstName) newErrors.firstName = "First name is required";
        if (!formData.lastName) newErrors.lastName = "Last name is required";
        break;
      case 2:
        if (!formData.company) newErrors.company = "Company is required";
        if (!formData.useCase) newErrors.useCase = "Use case is required";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleInputChange = (field: keyof WaitlistFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    setIsSubmitting(true);

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate waitlist position assignment
      const position = Math.floor(Math.random() * 100) + 2800;
      setWaitlistPosition(position);
      setIsSubmitted(true);

      // Simulate referral code generation
      const newReferralCode = `AGENT${Math.random()
        .toString(36)
        .substr(2, 6)
        .toUpperCase()}`;
      setFormData((prev) => ({ ...prev, referralCode: newReferralCode }));
    } catch (error) {
      console.error("Waitlist signup failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const useCaseOptions = [
    "Education & Training",
    "Customer Service",
    "Healthcare & Medicine",
    "Real Estate",
    "Retail & E-commerce",
    "Event Management",
    "Tourism & Travel",
    "Enterprise Solutions",
    "Other",
  ];

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-auto text-center"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to AgentSphere!
        </h3>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6">
          <div className="text-3xl font-bold text-green-600 mb-2">
            #{waitlistPosition}
          </div>
          <div className="text-sm text-gray-600">
            Your position on the waitlist
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Your Referral Code</div>
            <div className="font-mono text-lg font-bold text-gray-900">
              {formData.referralCode}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Share this code to move up the waitlist!
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <div className="flex justify-between items-center">
              <span>Referrals:</span>
              <span className="font-semibold">{referralCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Early Access:</span>
              <span className="font-semibold text-green-600">
                {waitlistPosition && waitlistPosition < 1000
                  ? "Guaranteed"
                  : "Priority Queue"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() =>
              navigator.share?.({
                title: "Join AgentSphere Waitlist",
                text: `Join me on the AgentSphere waitlist with code ${formData.referralCode}`,
                url: window.location.href + `?ref=${formData.referralCode}`,
              })
            }
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors text-sm"
          >
            Share & Skip Queue
          </button>
          <button
            onClick={() => setIsSubmitted(false)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-semibold transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-auto"
    >
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {step} of {totalSteps}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round((step / totalSteps) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Join the Revolution
              </h3>
              <p className="text-gray-600">
                Get early access to AI agents in AR
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.firstName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="First name"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.lastName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Last name"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-4 rounded-lg font-semibold transition-all duration-300 hover:-translate-y-1 shadow-lg"
            >
              Continue →
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Tell Us About You
              </h3>
              <p className="text-gray-600">
                Help us personalize your experience
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.company ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Your company or organization"
              />
              {errors.company && (
                <p className="text-red-500 text-sm mt-1">{errors.company}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Use Case
              </label>
              <select
                value={formData.useCase}
                onChange={(e) => handleInputChange("useCase", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.useCase ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select your primary use case</option>
                {useCaseOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.useCase && (
                <p className="text-red-500 text-sm mt-1">{errors.useCase}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-4 rounded-lg font-semibold transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-4 rounded-lg font-semibold transition-all duration-300 hover:-translate-y-1 shadow-lg"
              >
                Continue →
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Almost Done!
              </h3>
              <p className="text-gray-600">Optional: Get early access faster</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referral Code (Optional)
              </label>
              <input
                type="text"
                value={formData.referralCode}
                onChange={(e) =>
                  handleInputChange(
                    "referralCode",
                    e.target.value.toUpperCase()
                  )
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter referral code"
              />
              <p className="text-sm text-gray-500 mt-1">
                Have a referral code? Skip ahead in the queue!
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-semibold text-green-800">
                  What happens next?
                </span>
              </div>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Instant waitlist confirmation email</li>
                <li>• Early access notification (coming soon)</li>
                <li>• Exclusive updates and sneak peeks</li>
                <li>• Your personal referral code to share</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-4 rounded-lg font-semibold transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-4 rounded-lg font-semibold transition-all duration-300 hover:-translate-y-1 shadow-lg disabled:opacity-50 disabled:transform-none"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Joining...</span>
                  </div>
                ) : (
                  "Join Waitlist 🚀"
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live counter at bottom */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span>{waitlistPosition || 2847}+ people ahead of you</span>
        </div>
      </div>
    </motion.div>
  );
};

export default WaitlistForm;
