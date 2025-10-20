import {
  normalizeAgentType,
  formatAgentTypeDisplay,
  toR3FAgentType,
  enhanceAgentObject,
  isValidAgentType,
} from "../utils/agentTypeUtils";

// Test data simulating different agent type formats
const testAgents = [
  { name: "Test 1", object_type: "intelligent_assistant" },
  { name: "Test 2", agent_type: "Content Creator" },
  { name: "Test 3", object_type: "local_services" },
  { name: "Test 4", agent_type: "Tutor/Teacher" },
  { name: "Test 5", object_type: "game_agent" },
  { name: "Test 6", agent_type: "Payment Terminal" },
  { name: "Test 7", object_type: "unknown_type" },
];

console.log("🧪 Testing Agent Type Normalization");
console.log("====================================");

testAgents.forEach((agent) => {
  const enhanced = enhanceAgentObject(agent);
  console.log(`\n📝 Agent: ${agent.name}`);
  console.log(`   Raw type: ${agent.agent_type || agent.object_type}`);
  console.log(`   Normalized: ${enhanced.agent_type}`);
  console.log(`   Display: ${enhanced.agent_type_display}`);
  console.log(`   R3F Format: ${enhanced.agent_type_r3f}`);
  console.log(`   Valid: ${isValidAgentType(enhanced.agent_type)}`);
});

console.log("\n🔍 Direct Function Tests");
console.log("========================");

const testCases = [
  "intelligent_assistant",
  "Intelligent Assistant",
  "content_creator",
  "Content Creator",
  "Tutor/Teacher",
  "tutor_teacher",
  "ai_agent",
  "unknown_format",
];

testCases.forEach((testCase) => {
  console.log(`\nInput: "${testCase}"`);
  console.log(`  Normalized: "${normalizeAgentType(testCase)}"`);
  console.log(`  Display: "${formatAgentTypeDisplay(testCase)}"`);
  console.log(`  R3F: "${toR3FAgentType(testCase)}"`);
});

export default {};
