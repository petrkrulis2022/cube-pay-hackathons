import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Plus, Eye, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import AgentInteractionModal from "./interaction/AgentInteractionModal";
import "./interaction/ARPaymentStyles.css";

const Hero = () => {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showInteractionModal, setShowInteractionModal] = useState(false);

  // Mock user location for AR Preview
  const mockUserLocation = {
    latitude: 34.0522265,
    longitude: -118.2437408,
  };

  // Enhanced fake agents with full data structure for AR Preview
  const fakeAgents = [
    {
      id: 1,
      name: "Cube 5",
      description:
        "A 3D cube object deployed in AR space. I'm an AI agent ready to help with various tasks and answer questions.",
      object_type: "AI Agent",
      latitude: 34.0522365,
      longitude: -118.2437408,
      range_meters: 25,
      interaction_fee: 10,
      interaction_types: ["chat", "voice", "video"],
      agent_wallet_type: "NEAR",
      agent_wallet_address: "cube5.near",
      mcp_integrations: ["Chat", "Voice", "Analysis", "Information Lookup"],
      is_active: true,
    },
    {
      id: 2,
      name: "Study Helper Alpha",
      description:
        "Your friendly study companion! I help students with homework, explanations, and learning strategies.",
      object_type: "Study Buddy",
      latitude: 34.0522165,
      longitude: -118.2437308,
      range_meters: 30,
      interaction_fee: 5,
      interaction_types: ["chat", "voice"],
      agent_wallet_type: "NEAR",
      agent_wallet_address: "studyhelper.near",
      mcp_integrations: ["Educational Content", "Study Planning", "Q&A"],
      is_active: true,
    },
    {
      id: 3,
      name: "Campus Guide Bot",
      description:
        "I know everything about this location! Ask me about facilities, directions, or local information.",
      object_type: "Local Services",
      latitude: 34.0522465,
      longitude: -118.2437508,
      range_meters: 50,
      interaction_fee: 8,
      interaction_types: ["chat", "voice", "video"],
      agent_wallet_type: "NEAR",
      agent_wallet_address: "campusguide.near",
      mcp_integrations: ["Location Services", "Directory", "Navigation"],
      is_active: true,
    },
    {
      id: 4,
      name: "Creative Assistant",
      description:
        "Let's create something amazing together! I help with writing, brainstorming, and creative projects.",
      object_type: "Content Creator",
      latitude: 34.0522565,
      longitude: -118.2437608,
      range_meters: 35,
      interaction_fee: 15,
      interaction_types: ["chat", "voice", "video"],
      agent_wallet_type: "NEAR",
      agent_wallet_address: "creative.near",
      mcp_integrations: ["Content Generation", "Brainstorming", "Writing"],
      is_active: true,
    },
    {
      id: 5,
      name: "Game Master",
      description:
        "Ready to play? I create fun games, puzzles, and interactive experiences for entertainment!",
      object_type: "Game Agent",
      latitude: 34.0522665,
      longitude: -118.2437708,
      range_meters: 40,
      interaction_fee: 12,
      interaction_types: ["chat", "voice", "video"],
      agent_wallet_type: "NEAR",
      agent_wallet_address: "gamemaster.near",
      mcp_integrations: ["Game Creation", "Puzzles", "Entertainment"],
      is_active: true,
    },
  ];

  // Handle agent click for AR Preview
  const handleAgentClick = (agent: any) => {
    setSelectedAgent(agent);
    setShowInteractionModal(true);
  };

  const handleCloseInteraction = () => {
    setShowInteractionModal(false);
    setSelectedAgent(null);
  };

  const phones = [
    {
      id: "deploy",
      title: "🚀 Deploy Agent",
      subtitle: "Create & Place",
      description: "Design your AI agent and deploy it at precise locations",
      buttonText: "Deploy Agent",
      buttonIcon: <Plus className="h-4 w-4" />,
      link: "/deploy",
      bgImage:
        "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1",
      overlayContent: (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
          <div className="bg-black/60 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Plus className="text-white text-2xl" />
            </div>
            <div className="font-bold text-sm">Agent Configuration</div>
            <div className="text-xs opacity-80">
              Choose type, name & location
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "preview",
      title: "🔍 Preview Agents",
      subtitle: "Test & Debug",
      description: "Test your deployed AI agents in our AR preview environment",
      buttonText: "AR Preview",
      buttonIcon: <Eye className="h-4 w-4" />,
      link: "/ar",
      bgImage:
        "https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1",
      overlayContent: (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
          {/* AR Preview Interactive Elements */}
          <div className="bg-black/60 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Eye className="text-white text-2xl" />
            </div>
            <div className="font-bold text-sm">AR Testing Mode</div>
            <div className="text-xs opacity-80">
              View & interact with AI agents
            </div>
          </div>

          {/* Interactive Agent Dots for AR Preview */}
          <div className="absolute inset-0 pointer-events-none">
            {fakeAgents.slice(0, 3).map((agent, index) => {
              const positions = [
                { top: "30%", left: "20%" },
                { top: "50%", left: "70%" },
                { top: "70%", left: "40%" },
              ];

              return (
                <motion.div
                  key={agent.id}
                  className="absolute w-4 h-4 bg-blue-400 rounded-full cursor-pointer pointer-events-auto hover:scale-125 transition-transform"
                  style={positions[index]}
                  onClick={() => handleAgentClick(agent)}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.5,
                  }}
                >
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold whitespace-nowrap">
                    {agent.name}
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="absolute top-4 right-4 bg-green-500/80 backdrop-blur-sm rounded-lg px-2 py-1 text-white text-xs flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-300 mr-1"></div>
            Testing Mode
          </div>
        </div>
      ),
    },
    {
      id: "experience",
      title: "🌍 Enter AR World",
      subtitle: "Live Experience",
      description: "Experience full AR with camera and real-world AI agents",
      buttonText: "Go Live",
      buttonIcon: <Camera className="h-4 w-4" />,
      link: "https://admirable-hamster-b9c370.netlify.app/",
      external: true,
      bgImage:
        "https://images.pexels.com/photos/3761348/pexels-photo-3761348.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1",
      overlayContent: (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
          <div className="bg-black/60 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Camera className="text-white text-2xl" />
            </div>
            <div className="font-bold text-sm">Live AR Camera</div>
            <div className="text-xs opacity-80">Full production experience</div>
          </div>
          <div className="absolute top-4 right-4 bg-red-500/80 backdrop-blur-sm rounded-lg px-2 py-1 text-white text-xs flex items-center">
            <div className="w-2 h-2 rounded-full bg-red-300 mr-1 animate-pulse"></div>
            Live AR
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="relative overflow-hidden pt-16 pb-20 md:pt-20 md:pb-28">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 right-20 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 right-40 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900">
              <span className="block">Deploy AI Agents</span>
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-600">
                Anywhere, Instantly
              </span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-4xl mx-auto">
              The future of location-based AI is here. Deploy intelligent agents
              using AR/QR technology, interact through blockchain payments, and
              transform any space into an interactive digital experience.
            </p>
            <div className="mt-4 flex items-center justify-center space-x-6">
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Live on Blockchain
              </div>
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                AR/QR Ready
              </div>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="#auth"
                className="glow-button bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-xl font-medium shadow-md hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
              >
                Join 2,847+ Early Users
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#features"
                className="bg-white text-green-600 border border-green-200 px-8 py-3 rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-200 hover:border-green-300"
              >
                Watch Demo
              </a>
            </div>

            {/* Social Proof Stats */}
            <div className="mt-8 grid grid-cols-3 gap-4 max-w-md mx-auto text-center">
              <div className="text-gray-600">
                <div className="text-xl font-bold text-gray-900">2,847</div>
                <div className="text-xs">Early Users</div>
              </div>
              <div className="text-gray-600">
                <div className="text-xl font-bold text-gray-900">12.5K</div>
                <div className="text-xs">Agents Deployed</div>
              </div>
              <div className="text-gray-600">
                <div className="text-xl font-bold text-gray-900">94%</div>
                <div className="text-xs">Satisfaction</div>
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-500">
              <span className="font-medium">
                🚀 Revolutionary AR-QR-Blockchain Integration
              </span>
            </div>
          </motion.div>
        </div>

        {/* Three Phone Layout */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {phones.map((phone, index) => (
            <motion.div
              key={phone.id}
              className="relative mx-auto w-full max-w-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            >
              {/* Phone mockup */}
              <div className="relative shadow-2xl rounded-[2.5rem] border-8 border-gray-800 overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-6 bg-gray-800 z-20"></div>
                <div className="absolute bottom-0 inset-x-0 h-6 bg-gray-800 z-20"></div>
                <div className="h-[500px] bg-gradient-to-b from-indigo-900 to-purple-900 relative overflow-hidden">
                  {/* Background image */}
                  <img
                    src={phone.bgImage}
                    alt={phone.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                  />

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/70 to-transparent"></div>

                  {/* Phone content */}
                  {phone.overlayContent}

                  {/* Action button */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
                    {phone.id === "experience" ? (
                      <button
                        onClick={() => {
                          // Open the live AR viewer in a new tab
                          window.open(
                            "https://admirable-hamster-b9c370.netlify.app/",
                            "_blank"
                          );
                        }}
                        className="group relative"
                      >
                        <motion.div
                          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg flex items-center space-x-2 group-hover:shadow-xl transition-all duration-300"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {phone.buttonIcon}
                          <span>{phone.buttonText}</span>
                        </motion.div>
                      </button>
                    ) : (
                      <Link to={phone.link} className="group relative">
                        <motion.div
                          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg flex items-center space-x-2 group-hover:shadow-xl transition-all duration-300"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {phone.buttonIcon}
                          <span>{phone.buttonText}</span>
                        </motion.div>
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Phone description */}
              <div className="mt-6 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {phone.title}
                </h3>
                <p className="text-sm font-medium text-indigo-600 mb-2">
                  {phone.subtitle}
                </p>
                <p className="text-gray-600 text-sm">{phone.description}</p>
              </div>

              {/* Decorative elements */}
              <div
                className={`absolute -top-6 -right-6 w-24 h-24 ${
                  phone.id === "deploy"
                    ? "bg-indigo-400"
                    : phone.id === "preview"
                    ? "bg-purple-400"
                    : "bg-pink-400"
                } rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-${
                  index * 2000
                }`}
              ></div>
            </motion.div>
          ))}
        </motion.div>

        {/* Process flow indicators */}
        <motion.div
          className="mt-12 flex justify-center items-center space-x-4 text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold text-sm">1</span>
            </div>
            <span className="text-sm font-medium">Deploy</span>
          </div>
          <ArrowRight className="h-4 w-4" />
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold text-sm">2</span>
            </div>
            <span className="text-sm font-medium">Test</span>
          </div>
          <ArrowRight className="h-4 w-4" />
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold text-sm">3</span>
            </div>
            <span className="text-sm font-medium">Experience</span>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Interaction Modal for AR Preview */}
      <AgentInteractionModal
        agent={selectedAgent}
        visible={showInteractionModal}
        onClose={handleCloseInteraction}
        userLocation={mockUserLocation}
      />
    </section>
  );
};

export default Hero;
