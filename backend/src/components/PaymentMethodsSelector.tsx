import React, { useState, useEffect, useRef } from "react";
import {
  Wallet,
  CreditCard,
  QrCode,
  Mic,
  Volume2,
  UserPlus,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface BankDetails {
  account_holder: string;
  account_number: string;
  bank_name: string;
  swift_code: string;
}

interface PaymentMethod {
  crypto_qr: {
    enabled: boolean;
    wallet_address?: string;
    supported_chains?: string[];
  };
  bank_virtual_card: {
    enabled: boolean;
    bank_details?: BankDetails;
  };
  bank_qr: {
    enabled: boolean;
    bank_details?: BankDetails;
  };
  voice_pay: {
    enabled: boolean;
    wallet_address?: string;
  };
  sound_pay: {
    enabled: boolean;
    wallet_address?: string;
  };
  onboard_crypto: {
    enabled: boolean;
  };
}

interface PaymentMethodsSelectorProps {
  onPaymentMethodsChange: (methods: PaymentMethod) => void;
  connectedWallet?: string | null;
  initialMethods?: PaymentMethod;
}

const PaymentMethodsSelector: React.FC<PaymentMethodsSelectorProps> = ({
  onPaymentMethodsChange,
  connectedWallet,
  initialMethods,
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod>({
    crypto_qr: { enabled: false },
    bank_virtual_card: { enabled: false },
    bank_qr: { enabled: false },
    voice_pay: { enabled: false },
    sound_pay: { enabled: false },
    onboard_crypto: { enabled: false },
  });

  const [showBankForm, setShowBankForm] = useState<
    "virtual_card" | "bank_qr" | null
  >(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Track if this is the initial render
  const isInitialMount = useRef(true);

  // Initialize with provided methods
  useEffect(() => {
    if (initialMethods) {
      setPaymentMethods(initialMethods);
    }
  }, [initialMethods]);

  // Validate payment methods selection and notify parent
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const errors: string[] = [];
    const enabledMethods = Object.values(paymentMethods).some(
      (method) => method.enabled
    );

    if (!enabledMethods) {
      errors.push("At least one payment method must be selected");
    }

    // Check crypto methods require wallet connection
    const cryptoMethods = [
      paymentMethods.crypto_qr,
      paymentMethods.voice_pay,
      paymentMethods.sound_pay,
    ];
    const hasCryptoEnabled = cryptoMethods.some((method) => method.enabled);

    if (hasCryptoEnabled && !connectedWallet) {
      errors.push(
        "Please connect your wallet to enable crypto payment methods"
      );
    }

    // Check bank methods require details
    if (
      paymentMethods.bank_virtual_card.enabled &&
      !paymentMethods.bank_virtual_card.bank_details?.account_holder
    ) {
      errors.push(
        "Bank account details are required for virtual card payments"
      );
    }

    if (
      paymentMethods.bank_qr.enabled &&
      !paymentMethods.bank_qr.bank_details?.account_holder
    ) {
      errors.push("Bank account details are required for bank QR payments");
    }

    setValidationErrors(errors);
  }, [paymentMethods, connectedWallet]);

  // Separate effect to notify parent - only when payment methods change
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      return;
    }

    onPaymentMethodsChange(paymentMethods);
  }, [paymentMethods]); // Deliberately only depend on paymentMethods

  const updatePaymentMethod = (
    methodKey: keyof PaymentMethod,
    enabled: boolean,
    additionalData?: any
  ) => {
    setPaymentMethods((prev) => {
      const updated = { ...prev };
      updated[methodKey] = { ...updated[methodKey], enabled };

      if (enabled && additionalData) {
        updated[methodKey] = { ...updated[methodKey], ...additionalData };
      }

      // Auto-populate wallet address for crypto methods
      if (
        enabled &&
        ["crypto_qr", "voice_pay", "sound_pay"].includes(methodKey) &&
        connectedWallet
      ) {
        updated[methodKey].wallet_address = connectedWallet;
      }

      return updated;
    });

    // Show bank form if needed
    if (
      enabled &&
      (methodKey === "bank_virtual_card" || methodKey === "bank_qr")
    ) {
      setShowBankForm(
        methodKey === "bank_virtual_card" ? "virtual_card" : "bank_qr"
      );
    }
  };

  const paymentMethodConfig = [
    {
      key: "crypto_qr" as keyof PaymentMethod,
      title: "Crypto QR",
      subtitle: "Pure Crypto Payments",
      icon: QrCode,
      color: "bg-blue-500",
      requiresWallet: true,
      description: "QR code-based cryptocurrency payments",
    },
    {
      key: "bank_virtual_card" as keyof PaymentMethod,
      title: "Bank Virtual Card",
      subtitle: "Traditional Banking",
      icon: CreditCard,
      color: "bg-green-500",
      requiresWallet: false,
      description: "Virtual card payments through banking system",
    },
    {
      key: "bank_qr" as keyof PaymentMethod,
      title: "Bank QR",
      subtitle: "Bank QR Payments",
      icon: QrCode,
      color: "bg-purple-500",
      requiresWallet: false,
      description: "QR code payments through banking system",
    },
    {
      key: "voice_pay" as keyof PaymentMethod,
      title: "Voice Pay",
      subtitle: "Voice Crypto Commands",
      icon: Mic,
      color: "bg-orange-500",
      requiresWallet: true,
      description: "Voice command-based crypto payments",
    },
    {
      key: "sound_pay" as keyof PaymentMethod,
      title: "Sound Pay",
      subtitle: "Audio Signal Payments",
      icon: Volume2,
      color: "bg-red-500",
      requiresWallet: true,
      description: "Audio signal-based crypto transfers",
    },
    {
      key: "onboard_crypto" as keyof PaymentMethod,
      title: "Onboard Me to Crypto",
      subtitle: "Crypto Education",
      icon: UserPlus,
      color: "bg-indigo-500",
      requiresWallet: false,
      description: "Help users get started with crypto payments",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Payment Methods Configuration
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Select the payment methods you want to offer to your customers. Each
          method will appear as a face on the 3D payment cube in AR.
        </p>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h4 className="text-red-800 font-medium">Configuration Issues</h4>
              <ul className="text-red-700 text-sm mt-1 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Connection Status */}
      {connectedWallet && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <span className="text-green-800 font-medium">
                Wallet Connected:{" "}
              </span>
              <span className="text-green-700 font-mono text-sm">
                {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paymentMethodConfig.map((config) => {
          const method = paymentMethods[config.key];
          const IconComponent = config.icon;
          const isDisabled = config.requiresWallet && !connectedWallet;

          return (
            <div
              key={config.key}
              className={`relative border-2 rounded-lg p-4 transition-all ${
                method.enabled
                  ? "border-blue-500 bg-blue-50"
                  : isDisabled
                  ? "border-gray-200 bg-gray-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              } ${
                isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
              onClick={() =>
                !isDisabled && updatePaymentMethod(config.key, !method.enabled)
              }
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`p-2 rounded-lg ${config.color} ${
                    isDisabled ? "opacity-50" : ""
                  }`}
                >
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900 truncate">
                      {config.title}
                    </h4>
                    <input
                      type="checkbox"
                      checked={method.enabled}
                      onChange={(e) =>
                        !isDisabled &&
                        updatePaymentMethod(config.key, e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      disabled={isDisabled}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {config.subtitle}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {config.description}
                  </p>
                  {config.requiresWallet && (
                    <div className="flex items-center mt-2">
                      <Wallet className="h-3 w-3 text-gray-400 mr-1" />
                      <span className="text-xs text-gray-500">
                        Requires wallet connection
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Methods Summary */}
      {Object.values(paymentMethods).some((method) => method.enabled) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">
            Selected Payment Methods
          </h4>
          <div className="flex flex-wrap gap-2">
            {paymentMethodConfig
              .filter((config) => paymentMethods[config.key].enabled)
              .map((config) => (
                <span
                  key={config.key}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {config.title}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodsSelector;
