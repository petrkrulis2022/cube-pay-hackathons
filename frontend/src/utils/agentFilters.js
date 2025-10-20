// NeAR Agents Filter Categorization Logic
// Based on comprehensive database analysis of 57 agents

/**
 * Categorizes agents based on the screenshot filter categories
 * Can be used directly in NeARAgentsMarketplace component
 *
 * @param {Object} agent - Agent object from database
 * @returns {string} - Category name matching screenshot filters
 */
export const categorizeAgent = (agent) => {
  if (!agent) return "Other";

  const name = (agent.name || "").toLowerCase();
  const agentType = (agent.agent_type || "").toLowerCase();
  const objectType = (agent.object_type || "").toLowerCase();
  const description = (agent.description || "").toLowerCase();

  // Direct type matches (highest priority)
  if (
    agentType === "intelligent assistant" ||
    objectType === "intelligent assistant"
  ) {
    return "Intelligent Assistant";
  }

  if (agentType === "bus stop agent" || objectType === "bus stop agent") {
    return "Bus Stop Agent";
  }

  if (agentType === "study_buddy" || agentType === "study buddy") {
    return "Study Buddy";
  }

  if (agentType === "tutor") {
    return "Tutor";
  }

  if (agentType === "content creator" || objectType === "content creator") {
    return "Content Creator";
  }

  // Description-based categorization
  if (
    description.includes("payment") ||
    description.includes("transaction") ||
    description.includes("terminal") ||
    name.includes("payment")
  ) {
    return "Payment Terminal";
  }

  if (
    description.includes("local service") ||
    description.includes("service") ||
    agentType.includes("service")
  ) {
    return "Local Services";
  }

  if (
    description.includes("game") ||
    description.includes("entertainment") ||
    name.includes("game")
  ) {
    return "Game Agent";
  }

  if (
    description.includes("security") ||
    description.includes("home security") ||
    name.includes("security")
  ) {
    return "Home Security";
  }

  if (
    description.includes("real estate") ||
    description.includes("broker") ||
    description.includes("property")
  ) {
    return "Real Estate Broker";
  }

  if (
    description.includes("landmark") ||
    description.includes("monument") ||
    agentType.includes("landmark")
  ) {
    return "Landmark";
  }

  if (
    description.includes("building") ||
    agentType.includes("building") ||
    objectType.includes("building")
  ) {
    return "Building";
  }

  // AR 3D Objects (common in your database)
  if (
    description.includes("3d cube") ||
    description.includes("cube object") ||
    name.includes("cube") ||
    description.includes("3d sphere") ||
    description.includes("spherical object") ||
    name.includes("sphere") ||
    description.includes("3d pyramid") ||
    description.includes("pyramid object") ||
    name.includes("pyramid")
  ) {
    return "AR 3D Object";
  }

  return "Other";
};

/**
 * Get filter categories with agent counts
 * @param {Array} agents - Array of all agents from database
 * @returns {Array} - Array of filter categories with counts
 */
export const getFilterCategoriesWithCounts = (agents) => {
  const categoryCounts = {};

  agents.forEach((agent) => {
    const category = categorizeAgent(agent);
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  // Screenshot filter categories in order
  const filterCategories = [
    "Intelligent Assistant",
    "Local Services",
    "Payment Terminal",
    "Game Agent",
    "Tutor",
    "Home Security",
    "Content Creator",
    "Real Estate Broker",
    "Bus Stop Agent",
    "Study Buddy",
    "Landmark",
    "Building",
    "AR 3D Object", // Custom category for your 3D objects
    // 'Other' - typically hidden in filters
  ];

  return filterCategories.map((category) => ({
    name: category,
    count: categoryCounts[category] || 0,
    enabled: (categoryCounts[category] || 0) > 0,
  }));
};

/**
 * Filter agents by category
 * @param {Array} agents - Array of all agents
 * @param {Array} selectedCategories - Array of selected category names
 * @returns {Array} - Filtered agents
 */
export const filterAgentsByCategories = (agents, selectedCategories) => {
  if (!selectedCategories || selectedCategories.length === 0) {
    return agents;
  }

  return agents.filter((agent) => {
    const agentCategory = categorizeAgent(agent);
    return selectedCategories.includes(agentCategory);
  });
};

/**
 * Usage example for NeARAgentsMarketplace component:
 *
 * ```jsx
 * import { categorizeAgent, getFilterCategoriesWithCounts, filterAgentsByCategories } from './agentFilters';
 *
 * const NeARAgentsMarketplace = () => {
 *   const [agents, setAgents] = useState([]);
 *   const [selectedFilters, setSelectedFilters] = useState([]);
 *
 *   // Get filter categories with counts
 *   const filterCategories = getFilterCategoriesWithCounts(agents);
 *
 *   // Filter agents based on selected categories
 *   const filteredAgents = filterAgentsByCategories(agents, selectedFilters);
 *
 *   return (
 *     <div>
 *       <FilterPanel
 *         categories={filterCategories}
 *         selected={selectedFilters}
 *         onChange={setSelectedFilters}
 *       />
 *       <AgentGrid agents={filteredAgents} />
 *     </div>
 *   );
 * };
 * ```
 */

// Current database analysis results (as of analysis):
export const CURRENT_AGENT_DISTRIBUTION = {
  "AR 3D Object": 30, // 52.6% - Cubes, spheres, pyramids
  Other: 16, // 28.1% - Uncategorized
  "Bus Stop Agent": 4, // 7.0% - Transport related
  "Intelligent Assistant": 3, // 5.3% - AI assistants
  "Content Creator": 2, // 3.5% - Content generation
  Tutor: 1, // 1.8% - Educational
  "Study Buddy": 1, // 1.8% - Study assistance

  // Zero counts (available for future agents):
  "Local Services": 0,
  "Payment Terminal": 0,
  "Game Agent": 0,
  "Home Security": 0,
  "Real Estate Broker": 0,
  Landmark: 0,
  Building: 0,
};

export default {
  categorizeAgent,
  getFilterCategoriesWithCounts,
  filterAgentsByCategories,
  CURRENT_AGENT_DISTRIBUTION,
};
