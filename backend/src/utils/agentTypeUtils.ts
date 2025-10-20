/**
 * Agent Type Utility Functions
 *
 * This file provides functions to normalize and convert agent types between different formats
 * to ensure compatibility between A-Frame and React Three Fiber workspaces.
 */

// Type mapping for normalization
export const AGENT_TYPE_MAPPINGS = {
  // Standard underscore format (database format)
  intelligent_assistant: "intelligent_assistant",
  local_services: "local_services",
  payment_terminal: "payment_terminal",
  game_agent: "game_agent",
  "3d_world_builder": "3d_world_builder",
  home_security: "home_security",
  content_creator: "content_creator",
  real_estate_broker: "real_estate_broker",
  bus_stop_agent: "bus_stop_agent",

  // Title case format (R3F format)
  "Intelligent Assistant": "intelligent_assistant",
  "Local Services": "local_services",
  "Payment Terminal": "payment_terminal",
  "Game Agent": "game_agent",
  "3D World Builder": "3d_world_builder",
  "Home Security": "home_security",
  "Content Creator": "content_creator",
  "Real Estate Broker": "real_estate_broker",
  "Bus Stop Agent": "bus_stop_agent",

  // Alternative formats
  "Tutor/Teacher": "tutor_teacher",
  tutor_teacher: "tutor_teacher",
  tutor: "tutor_teacher",

  // Legacy support
  ai_agent: "intelligent_assistant",
  "AI Agent": "intelligent_assistant",
  study_buddy: "tutor_teacher",
  "Study Buddy": "tutor_teacher",
  landmark: "landmark",
  building: "building",
  trailing_payment_terminal: "payment_terminal",
  my_ghost: "my_ghost",
} as const;

/**
 * Normalize agent type to lowercase underscore format
 * This is the canonical format used internally
 */
export const normalizeAgentType = (type: string | undefined | null): string => {
  if (!type) return "unknown";

  // Check direct mapping first
  if (AGENT_TYPE_MAPPINGS[type as keyof typeof AGENT_TYPE_MAPPINGS]) {
    return AGENT_TYPE_MAPPINGS[type as keyof typeof AGENT_TYPE_MAPPINGS];
  }

  // Convert to lowercase with underscores for consistent handling
  const normalized = type
    .toLowerCase()
    .replace(/[\s/-]+/g, "_")
    .replace(/[()]/g, "")
    .replace(/[^\w_]/g, "")
    .trim();

  console.log(`🔧 Normalizing agent type: "${type}" → "${normalized}"`);
  return normalized;
};

/**
 * Convert normalized type to title case for display
 */
export const formatAgentTypeDisplay = (type: string): string => {
  if (!type) return "Unknown";

  const normalized = normalizeAgentType(type);

  const displayFormat = normalized
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace(/3d/i, "3D");

  console.log(`📝 Formatting display type: "${type}" → "${displayFormat}"`);
  return displayFormat;
};

/**
 * Convert to React Three Fiber compatible format
 */
export const toR3FAgentType = (type: string): string => {
  return formatAgentTypeDisplay(type);
};

/**
 * Get agent type from database object with fallbacks
 */
export const extractAgentType = (obj: any): string => {
  const rawType = obj.agent_type || obj.object_type || obj.type || "";
  return normalizeAgentType(rawType);
};

/**
 * Enhanced database object with normalized agent_type
 */
export const enhanceAgentObject = (obj: any): any => {
  const normalizedType = extractAgentType(obj);

  return {
    ...obj,
    agent_type: normalizedType,
    object_type: normalizedType, // Keep both for compatibility
    agent_type_display: formatAgentTypeDisplay(normalizedType),
    agent_type_r3f: toR3FAgentType(normalizedType),
  };
};

/**
 * Validate if agent type is supported
 */
export const isValidAgentType = (type: string): boolean => {
  const normalized = normalizeAgentType(type);
  const supportedTypes = [
    "intelligent_assistant",
    "local_services",
    "payment_terminal",
    "game_agent",
    "3d_world_builder",
    "home_security",
    "content_creator",
    "real_estate_broker",
    "bus_stop_agent",
    "tutor_teacher",
    "ai_agent",
    "study_buddy",
    "landmark",
    "building",
    "my_ghost",
  ];

  return supportedTypes.includes(normalized);
};

/**
 * Get all supported agent types in different formats
 */
export const getSupportedAgentTypes = () => {
  return {
    normalized: Object.values(AGENT_TYPE_MAPPINGS).filter(
      (v, i, arr) => arr.indexOf(v) === i
    ),
    display: Object.keys(AGENT_TYPE_MAPPINGS).filter((k) => k.includes(" ")),
    database: Object.keys(AGENT_TYPE_MAPPINGS).filter((k) => k.includes("_")),
  };
};

export default {
  normalizeAgentType,
  formatAgentTypeDisplay,
  toR3FAgentType,
  extractAgentType,
  enhanceAgentObject,
  isValidAgentType,
  getSupportedAgentTypes,
  AGENT_TYPE_MAPPINGS,
};
