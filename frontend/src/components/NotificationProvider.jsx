// Enhanced Notification System for AR QR Payments
import React, { useState, useEffect, createContext, useContext } from "react";

// Notification context
const NotificationContext = createContext();

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
  PAYMENT: "payment",
};

// Notification component
const NotificationItem = ({ notification, onDismiss }) => {
  const { type, title, message, duration, action } = notification;

  // Auto-dismiss after duration
  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(notification.id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, notification.id, onDismiss]);

  const getNotificationStyles = () => {
    const baseStyles =
      "bg-black/90 backdrop-blur-sm rounded-lg p-4 text-white border shadow-lg max-w-sm w-full";

    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return `${baseStyles} border-green-500/30 bg-green-500/10`;
      case NOTIFICATION_TYPES.ERROR:
        return `${baseStyles} border-red-500/30 bg-red-500/10`;
      case NOTIFICATION_TYPES.WARNING:
        return `${baseStyles} border-yellow-500/30 bg-yellow-500/10`;
      case NOTIFICATION_TYPES.PAYMENT:
        return `${baseStyles} border-purple-500/30 bg-purple-500/10`;
      default:
        return `${baseStyles} border-blue-500/30 bg-blue-500/10`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return "✅";
      case NOTIFICATION_TYPES.ERROR:
        return "❌";
      case NOTIFICATION_TYPES.WARNING:
        return "⚠️";
      case NOTIFICATION_TYPES.PAYMENT:
        return "💳";
      default:
        return "ℹ️";
    }
  };

  return (
    <div className={`${getNotificationStyles()} animate-slide-in-right`}>
      <div className="flex items-start space-x-3">
        <div className="text-lg">{getIcon()}</div>
        <div className="flex-1">
          {title && <div className="font-semibold text-sm mb-1">{title}</div>}
          <div className="text-sm text-gray-200">{message}</div>

          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
            >
              {action.label}
            </button>
          )}
        </div>

        <button
          onClick={() => onDismiss(notification.id)}
          className="text-gray-400 hover:text-white text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Notification provider component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: NOTIFICATION_TYPES.INFO,
      duration: 5000,
      ...notification,
    };

    setNotifications((prev) => [...prev, newNotification]);
    console.log("📢 Notification added:", newNotification);

    return id;
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    console.log("📢 Notification removed:", id);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    console.log("📢 All notifications cleared");
  };

  // Specific notification helpers
  const showSuccess = (message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      message,
      ...options,
    });
  };

  const showError = (message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.ERROR,
      message,
      duration: 7000, // Longer duration for errors
      ...options,
    });
  };

  const showWarning = (message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.WARNING,
      message,
      ...options,
    });
  };

  const showInfo = (message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.INFO,
      message,
      ...options,
    });
  };

  const showPayment = (message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.PAYMENT,
      message,
      ...options,
    });
  };

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showPayment,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}

      {/* Notification container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <NotificationItem
              notification={notification}
              onDismiss={removeNotification}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

// Custom hook to use notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

// Global notification functions (for backward compatibility)
export const createGlobalNotificationFunctions = (notificationContext) => {
  if (typeof window !== "undefined") {
    window.showNotification = notificationContext.addNotification;
    window.showSuccess = notificationContext.showSuccess;
    window.showError = notificationContext.showError;
    window.showWarning = notificationContext.showWarning;
    window.showInfo = notificationContext.showInfo;
    window.showPayment = notificationContext.showPayment;

    console.log("🌐 Global notification functions created");
  }
};

// Default export for the provider
export default NotificationProvider;
