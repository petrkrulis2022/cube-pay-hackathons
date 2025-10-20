import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import PaymentMethodsSelector from "../PaymentMethodsSelector";
import BankDetailsForm from "../BankDetailsForm";

// Test data
const mockPaymentMethods = {
  crypto_qr: { enabled: true, wallet_address: "0x742d35Cc6..." },
  bank_virtual_card: { enabled: false },
  bank_qr: { enabled: false },
  voice_pay: { enabled: true, wallet_address: "0x742d35Cc6..." },
  sound_pay: { enabled: false },
  onboard_crypto: { enabled: true },
};

const mockBankDetails = {
  account_holder: "John Doe",
  account_number: "1234567890",
  bank_name: "Test Bank",
  swift_code: "TESTUS33",
};

describe("PaymentMethodsSelector", () => {
  const mockOnChange = jest.fn();
  const mockWallet = "0x742d35Cc6...";

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  test("renders all 6 payment methods", () => {
    render(
      <PaymentMethodsSelector
        onPaymentMethodsChange={mockOnChange}
        connectedWallet={mockWallet}
      />
    );

    expect(screen.getByText("Crypto QR")).toBeInTheDocument();
    expect(screen.getByText("Bank Virtual Card")).toBeInTheDocument();
    expect(screen.getByText("Bank QR")).toBeInTheDocument();
    expect(screen.getByText("Voice Pay")).toBeInTheDocument();
    expect(screen.getByText("Sound Pay")).toBeInTheDocument();
    expect(screen.getByText("Onboard Me to Crypto")).toBeInTheDocument();
  });

  test("shows wallet connection status when wallet is connected", () => {
    render(
      <PaymentMethodsSelector
        onPaymentMethodsChange={mockOnChange}
        connectedWallet={mockWallet}
      />
    );

    expect(screen.getByText(/Wallet Connected/)).toBeInTheDocument();
    expect(screen.getByText(/0x742d...c6\.\.\./)).toBeInTheDocument();
  });

  test("disables crypto methods when wallet not connected", () => {
    render(
      <PaymentMethodsSelector
        onPaymentMethodsChange={mockOnChange}
        connectedWallet={null}
      />
    );

    const cryptoQRCheckbox = screen.getByLabelText(/Crypto QR/);
    const voicePayCheckbox = screen.getByLabelText(/Voice Pay/);
    const soundPayCheckbox = screen.getByLabelText(/Sound Pay/);

    expect(cryptoQRCheckbox).toBeDisabled();
    expect(voicePayCheckbox).toBeDisabled();
    expect(soundPayCheckbox).toBeDisabled();
  });

  test("enables selection of payment methods", () => {
    render(
      <PaymentMethodsSelector
        onPaymentMethodsChange={mockOnChange}
        connectedWallet={mockWallet}
      />
    );

    const cryptoQRCheckbox = screen.getByLabelText(/Crypto QR/);
    fireEvent.click(cryptoQRCheckbox);

    expect(mockOnChange).toHaveBeenCalled();
  });

  test("shows validation error when no payment method selected", () => {
    render(
      <PaymentMethodsSelector
        onPaymentMethodsChange={mockOnChange}
        connectedWallet={mockWallet}
      />
    );

    expect(
      screen.getByText(/At least one payment method must be selected/)
    ).toBeInTheDocument();
  });
});

describe("BankDetailsForm", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  test("renders all required bank detail fields", () => {
    render(
      <BankDetailsForm
        onBankDetailsChange={mockOnChange}
        paymentType="virtual_card"
      />
    );

    expect(screen.getByLabelText(/Account Holder Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Account Number \/ IBAN/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Bank Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/SWIFT\/BIC Code/)).toBeInTheDocument();
  });

  test("validates SWIFT code format", () => {
    render(
      <BankDetailsForm
        onBankDetailsChange={mockOnChange}
        paymentType="virtual_card"
      />
    );

    const swiftInput = screen.getByLabelText(/SWIFT\/BIC Code/);
    fireEvent.change(swiftInput, { target: { value: "INVALID" } });

    expect(screen.getByText(/Invalid SWIFT code format/)).toBeInTheDocument();
  });

  test("shows completion status when all fields are valid", () => {
    render(
      <BankDetailsForm
        onBankDetailsChange={mockOnChange}
        paymentType="virtual_card"
        initialDetails={mockBankDetails}
      />
    );

    expect(
      screen.getByText(/Bank details are complete and valid/)
    ).toBeInTheDocument();
  });

  test("calls onChange when valid details entered", () => {
    render(
      <BankDetailsForm
        onBankDetailsChange={mockOnChange}
        paymentType="virtual_card"
      />
    );

    // Fill in all required fields
    fireEvent.change(screen.getByLabelText(/Account Holder Name/), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText(/Account Number/), {
      target: { value: "1234567890" },
    });
    fireEvent.change(screen.getByLabelText(/Bank Name/), {
      target: { value: "Test Bank" },
    });
    fireEvent.change(screen.getByLabelText(/SWIFT\/BIC Code/), {
      target: { value: "TESTUS33" },
    });

    expect(mockOnChange).toHaveBeenCalledWith({
      account_holder: "John Doe",
      account_number: "1234567890",
      bank_name: "Test Bank",
      swift_code: "TESTUS33",
    });
  });
});

// Integration test for deployment flow
describe("Payment Cube Integration", () => {
  test("validates payment methods before deployment", () => {
    // Mock deployment validation
    const validatePaymentMethods = (methods: any): string[] => {
      const errors: string[] = [];

      if (!methods) {
        errors.push("Payment methods configuration is required");
        return errors;
      }

      const enabledMethods = Object.values(methods).some(
        (method: any) => method.enabled
      );
      if (!enabledMethods) {
        errors.push("At least one payment method must be selected");
      }

      return errors;
    };

    // Test with no methods
    const noMethodsErrors = validatePaymentMethods(null);
    expect(noMethodsErrors).toContain(
      "Payment methods configuration is required"
    );

    // Test with no enabled methods
    const noEnabledErrors = validatePaymentMethods({
      crypto_qr: { enabled: false },
      bank_virtual_card: { enabled: false },
    });
    expect(noEnabledErrors).toContain(
      "At least one payment method must be selected"
    );

    // Test with valid methods
    const validErrors = validatePaymentMethods({
      crypto_qr: { enabled: true, wallet_address: "0x..." },
    });
    expect(validErrors).toHaveLength(0);
  });
});
