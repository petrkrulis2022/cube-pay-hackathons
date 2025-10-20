import React, { useState, useEffect } from "react";
import { Building, CreditCard, AlertCircle } from "lucide-react";

interface BankDetails {
  account_holder: string;
  account_number: string;
  bank_name: string;
  swift_code: string;
}

interface BankDetailsFormProps {
  onBankDetailsChange: (details: BankDetails) => void;
  paymentType: "virtual_card" | "bank_qr";
  initialDetails?: BankDetails;
}

const BankDetailsForm: React.FC<BankDetailsFormProps> = ({
  onBankDetailsChange,
  paymentType,
  initialDetails,
}) => {
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    account_holder: "",
    account_number: "",
    bank_name: "",
    swift_code: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Initialize with provided details
  useEffect(() => {
    if (initialDetails) {
      setBankDetails(initialDetails);
    }
  }, [initialDetails]);

  // Validate form fields
  useEffect(() => {
    const newErrors: { [key: string]: string } = {};

    if (!bankDetails.account_holder.trim()) {
      newErrors.account_holder = "Account holder name is required";
    }

    if (!bankDetails.account_number.trim()) {
      newErrors.account_number = "Account number/IBAN is required";
    } else if (bankDetails.account_number.length < 8) {
      newErrors.account_number = "Account number must be at least 8 characters";
    }

    if (!bankDetails.bank_name.trim()) {
      newErrors.bank_name = "Bank name is required";
    }

    if (!bankDetails.swift_code.trim()) {
      newErrors.swift_code = "SWIFT/BIC code is required";
    } else if (
      !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(
        bankDetails.swift_code.toUpperCase()
      )
    ) {
      newErrors.swift_code = "Invalid SWIFT code format (e.g., ABCDUS33XXX)";
    }

    setErrors(newErrors);

    // Only call onChange if no errors
    if (
      Object.keys(newErrors).length === 0 &&
      bankDetails.account_holder.trim()
    ) {
      onBankDetailsChange(bankDetails);
    }
  }, [bankDetails, onBankDetailsChange]);

  const updateField = (field: keyof BankDetails, value: string) => {
    setBankDetails((prev) => ({
      ...prev,
      [field]: field === "swift_code" ? value.toUpperCase() : value,
    }));
  };

  const getFieldError = (field: keyof BankDetails): string | undefined => {
    return errors[field];
  };

  const paymentTypeTitle =
    paymentType === "virtual_card" ? "Virtual Card" : "Bank QR";

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-4">
      <div className="flex items-center mb-4">
        {paymentType === "virtual_card" ? (
          <CreditCard className="h-6 w-6 text-green-600 mr-2" />
        ) : (
          <Building className="h-6 w-6 text-purple-600 mr-2" />
        )}
        <h4 className="text-lg font-semibold text-gray-900">
          {paymentTypeTitle} - Bank Account Details
        </h4>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        Please provide your bank account details for{" "}
        {paymentTypeTitle.toLowerCase()} payments. This information will be
        securely stored and used for payment processing.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Holder Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Holder Name *
          </label>
          <input
            type="text"
            value={bankDetails.account_holder}
            onChange={(e) => updateField("account_holder", e.target.value)}
            placeholder="Enter full name as on bank account"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              getFieldError("account_holder")
                ? "border-red-300"
                : "border-gray-300"
            }`}
          />
          {getFieldError("account_holder") && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {getFieldError("account_holder")}
            </p>
          )}
        </div>

        {/* Account Number/IBAN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Number / IBAN *
          </label>
          <input
            type="text"
            value={bankDetails.account_number}
            onChange={(e) => updateField("account_number", e.target.value)}
            placeholder="Enter account number or IBAN"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              getFieldError("account_number")
                ? "border-red-300"
                : "border-gray-300"
            }`}
          />
          {getFieldError("account_number") && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {getFieldError("account_number")}
            </p>
          )}
        </div>

        {/* Bank Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bank Name *
          </label>
          <input
            type="text"
            value={bankDetails.bank_name}
            onChange={(e) => updateField("bank_name", e.target.value)}
            placeholder="Enter bank name"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              getFieldError("bank_name") ? "border-red-300" : "border-gray-300"
            }`}
          />
          {getFieldError("bank_name") && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {getFieldError("bank_name")}
            </p>
          )}
        </div>

        {/* SWIFT Code */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SWIFT/BIC Code *
          </label>
          <input
            type="text"
            value={bankDetails.swift_code}
            onChange={(e) => updateField("swift_code", e.target.value)}
            placeholder="e.g., ABCDUS33XXX"
            maxLength={11}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              getFieldError("swift_code") ? "border-red-300" : "border-gray-300"
            }`}
          />
          {getFieldError("swift_code") && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {getFieldError("swift_code")}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            SWIFT/BIC code format: 8 or 11 characters (e.g., ABCDUS33 or
            ABCDUS33XXX)
          </p>
        </div>
      </div>

      {/* Validation Summary */}
      {Object.keys(errors).length === 0 &&
        bankDetails.account_holder.trim() && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center text-green-800">
              <AlertCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium">
                Bank details are complete and valid
              </span>
            </div>
          </div>
        )}

      {/* Security Notice */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-blue-800 text-sm">
            <p className="font-medium mb-1">Security & Privacy</p>
            <p>
              Your bank details are encrypted and stored securely. They will
              only be used for processing {paymentTypeTitle.toLowerCase()}{" "}
              payments through your AgentSphere agents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankDetailsForm;
