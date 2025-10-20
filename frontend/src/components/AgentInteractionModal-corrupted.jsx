import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,  if (!primaryChainId) {
    console.log(
      "⚠️ AgentInteractionModal: No chain ID found for agent:",
      agent?.name
    );
    return "Contract not available";
  }

  const usdcContract = getUSDCContractForChain(primaryChainId);

  if (usdcContract) {
    // Format: 0x1c7D4B...79C7238
    const display = `${usdcContract.substring(0, 8)}...${usdcContract.substring(
      34
    )}`;
    console.log("✅ AgentInteractionModal: Token contract display:", {
      display,
      chainId: primaryChainId,
      agent: agent?.name,
      fullContract: usdcContract,
    });
    return display;
  }

  console.log("⚠️ AgentInteractionModal: No USDC contract for chain:", primaryChainId);
  return "Contract not available";
};

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  X,
  MessageCircle,
  Mic,
  Video,
  Send,
  User,
  Bot,
  Zap,
  DollarSign,
  QrCode,
  Wallet,
  Phone,
  MicOff,
  VideoOff,
} from "lucide-react";
import {
  getUSDCContractForChain,
  getNetworkInfo,
} from "../services/evmNetworkService";

// Helper functions for dynamic agent payment data
const getServiceFeeDisplay = (agent) => {
  // Use the same priority logic as resolveInteractionFee to ensure consistency
  console.log("🔍 AgentInteractionModal: Full agent data for fee:", {
    name: agent?.name,
    interaction_fee_amount: agent?.interaction_fee_amount,
    fee_usdc: agent?.fee_usdc,
    fee_usdt: agent?.fee_usdt,
    interaction_fee_usdfc: agent?.interaction_fee_usdfc,
    interaction_fee: agent?.interaction_fee,
    allKeys: agent
      ? Object.keys(agent).filter(
          (k) => k.includes("fee") || k.includes("amount")
        )
      : [],
  });

  // 🔧 CRITICAL: Use EXACT same priority as resolveInteractionFee
  let fee = 1; // fallback
  let token = "USDC";
  let source = "fallback";

  // PRIORITY 1: interaction_fee_amount (authoritative field)
  if (
    agent?.interaction_fee_amount !== undefined &&
    agent?.interaction_fee_amount !== null &&
    !isNaN(agent?.interaction_fee_amount) &&
    agent?.interaction_fee_amount > 0
  ) {
    fee = parseFloat(agent.interaction_fee_amount);
    token = agent?.interaction_fee_token || "USDC";
    source = "interaction_fee_amount";
  }
  // PRIORITY 2: fee_usdc
  else if (
    agent?.fee_usdc !== undefined &&
    agent?.fee_usdc !== null &&
    !isNaN(agent?.fee_usdc) &&
    agent?.fee_usdc > 0
  ) {
    fee = parseFloat(agent.fee_usdc);
    token = "USDC";
    source = "fee_usdc";
  }
  // PRIORITY 3: fee_usdt
  else if (
    agent?.fee_usdt !== undefined &&
    agent?.fee_usdt !== null &&
    !isNaN(agent?.fee_usdt) &&
    agent?.fee_usdt > 0
  ) {
    fee = parseFloat(agent.fee_usdt);
    token = "USDT";
    source = "fee_usdt";
  }
  // PRIORITY 4: interaction_fee_usdfc (legacy)
  else if (
    agent?.interaction_fee_usdfc !== undefined &&
    agent?.interaction_fee_usdfc !== null &&
    !isNaN(agent?.interaction_fee_usdfc) &&
    agent?.interaction_fee_usdfc > 0
  ) {
    fee = parseFloat(agent.interaction_fee_usdfc);
    token = "USDC";
    source = "interaction_fee_usdfc";
  }
  // PRIORITY 5: interaction_fee (legacy)
  else if (
    agent?.interaction_fee !== undefined &&
    agent?.interaction_fee !== null &&
    !isNaN(agent?.interaction_fee) &&
    agent?.interaction_fee > 0
  ) {
    fee = parseFloat(agent.interaction_fee);
    token = "USDC";
    source = "interaction_fee";
  }

  console.log("🔍 AgentInteractionModal: Service fee display:", {
    fee,
    token,
    agent: agent?.name,
    source,
    note: "Using resolveInteractionFee priority logic",
  });
  return `${fee} ${token}`;
};

const getNetworkDisplay = (agent) => {
  // Log the full agent object for debugging network info
  console.log("🔍 AgentInteractionModal: Full agent data for network:", {
    name: agent?.name,
    deployment_network_name: agent?.deployment_network_name,
    network: agent?.network,
    chain_id: agent?.chain_id,
    deployment_chain_id: agent?.deployment_chain_id,
    allKeys: agent
      ? Object.keys(agent).filter(
          (k) => k.includes("network") || k.includes("chain")
        )
      : [],
  });

  // 🔧 CRITICAL: Use chain_id as primary source (deployment_chain_id has wrong values)
  const chainId = agent?.chain_id || agent?.deployment_chain_id;
  console.log("🎯 AgentInteractionModal: Chain ID for network:", {
    agentName: agent?.name,
    deployment_chain_id: agent?.deployment_chain_id,
    chain_id: agent?.chain_id,
    finalChainId: chainId,
    note: "Using chain_id as primary source",
  });

  // 🔧 CRITICAL: Database network names are WRONG - always use chain_id
  // Don't trust: agent?.deployment_network_name || agent?.network
  let network = "Unknown Network";

  // Use the chainId already declared above
  if (chainId) {
    const networkInfo = getNetworkInfo(chainId);
    network = networkInfo?.name || "Unknown Network";
    console.log(
      "🔍 AgentInteractionModal: Using chain_id for network (bypassing DB):",
      {
        chainId,
        networkInfo: networkInfo?.name,
        agent: agent?.name,
        skipped_db_network: agent?.deployment_network_name,
        note: "Database network names are incorrect",
      }
    );
  }

  console.log("🔍 AgentInteractionModal: Final network display:", {
    network,
    agent: agent?.name,
    source: agent?.deployment_network_name
      ? "deployment_network_name"
      : agent?.network
      ? "network"
      : "evm_service",
  });
  return network;
};

const getTokenContractDisplay = (agent) => {
  // Log the full agent object for debugging chain info
  console.log("🔍 AgentInteractionModal: Full agent data for contract:", {
    name: agent?.name,
    deployment_chain_id: agent?.deployment_chain_id,
    deployment_network_name: agent?.deployment_network_name,
    chain_id: agent?.chain_id,
    network: agent?.network,
    allKeys: agent
      ? Object.keys(agent).filter(
          (k) =>
            k.includes("chain") ||
            k.includes("contract") ||
            k.includes("network")
        )
      : [],
  });

  // 🔧 CRITICAL: Use the chainId from getNetworkDisplay function (already declared above)
  // Using same logic as getNetworkDisplay to ensure consistency
  const primaryChainId = agent?.chain_id || agent?.deployment_chain_id;

  console.log("🎯 AgentInteractionModal: Chain ID determination:", {
    agentName: agent?.name,
    deployment_chain_id: agent?.deployment_chain_id,
    chain_id: agent?.chain_id,
    finalChainId: primaryChainId,
    note: "Using chain_id as primary (deployment_chain_id has wrong values)",
  });

  if (!primaryChainId) {
    console.log(
      "⚠️ AgentInteractionModal: No chain ID found for agent:",
      agent?.name
    );
    return "Contract not available";
  }

  const usdcContract = getUSDCContractForChain(primaryChainId);

  if (usdcContract) {
    // Format: 0x1c7D4B...79C7238
    const display = `${usdcContract.substring(0, 8)}...${usdcContract.substring(
      34
    )}`;
    console.log("✅ AgentInteractionModal: Token contract display:", {
      display,
      chainId: primaryChainId,
      agent: agent?.name,
      fullContract: usdcContract,
    });
    return display;
  }

  console.log("⚠️ AgentInteractionModal: No USDC contract for chain:", primaryChainId);
  return "Contract not available";
};

const AgentInteractionModal = ({
  agent,
  isOpen,
  onClose,
  onPayment,
  onQRScan = null,
}) => {
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize conversation when agent changes
  useEffect(() => {
    if (agent && isOpen) {
      const welcomeMessage = {
        id: Date.now(),
        type: "agent",
        content: `Hello! I'm ${agent.name}. ${agent.description} How can I help you today?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [agent, isOpen]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate agent response
    setTimeout(() => {
      const agentResponse = {
        id: Date.now() + 1,
        type: "agent",
        content: generateAgentResponse(inputMessage, agent),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  // Generate contextual agent response
  const generateAgentResponse = (userInput, agent) => {
    const responses = {
      "Intelligent Assistant": [
        "I can help you with analysis, research, and problem-solving. What would you like to explore?",
        "Based on your question, I'd recommend looking into the latest developments in that area.",
        "That's an interesting point. Let me provide some insights on that topic.",
        "I can assist you with data analysis and strategic planning for that challenge.",
      ],
      "Content Creator": [
        "I can help you create engaging content for your project. What type of content are you looking for?",
        "That sounds like a great content opportunity! I can help you develop that idea.",
        "For content creation, I'd suggest focusing on storytelling and audience engagement.",
        "I can help you craft compelling narratives and visual content for your needs.",
      ],
      "Local Services": [
        "I can connect you with local service providers in your area. What services do you need?",
        "Based on your location, I can recommend the best local options for that service.",
        "I have access to a network of trusted local professionals who can help with that.",
        "Let me find the most suitable local services for your specific requirements.",
      ],
      "Tutor/Teacher": [
        "I'm here to help you learn! What subject or skill would you like to explore?",
        "That's a great question for learning. Let me break that down for you step by step.",
        "I can provide personalized tutoring on that topic. Would you like to start with the basics?",
        "Learning is a journey, and I'm here to guide you through each step of the process.",
      ],
      "Game Agent": [
        "Ready for some fun? I can create interactive games and challenges for you!",
        "That sounds like it could be turned into an exciting game! Want to try?",
        "I love gamifying experiences. Let me design something engaging for you.",
        "Games are a great way to learn and have fun. What type of game interests you?",
      ],
    };

    const agentResponses =
      responses[agent.agent_type || agent.object_type] ||
      responses["Intelligent Assistant"];
    return agentResponses[Math.floor(Math.random() * agentResponses.length)];
  };

  // Handle payment request
  const handlePayment = () => {
    if (onPayment) {
      onPayment(agent);
    }
  };

  // Handle QR scan request
  const handleQRScan = () => {
    if (onQRScan) {
      onQRScan(agent);
    }
  };

  // Toggle voice recording
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In a real implementation, this would start/stop voice recording
  };

  // Toggle video call
  const toggleVideoCall = () => {
    setIsVideoCall(!isVideoCall);
    // In a real implementation, this would start/stop video call
  };

  if (!isOpen || !agent) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] bg-slate-900 border-purple-500/30 text-white overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">
                  {agent.name}
                </CardTitle>
                <CardDescription className="text-purple-100">
                  {agent.agent_type || agent.object_type} •{" "}
                  {agent.distance_meters?.toFixed(0)}m away
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-green-500 text-white">
                <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                Online
              </Badge>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <div className="flex border-b border-slate-700">
          {[
            { id: "chat", label: "Chat", icon: MessageCircle },
            { id: "voice", label: "Voice", icon: Mic },
            { id: "video", label: "Video", icon: Video },
            { id: "payment", label: "Payment", icon: Wallet },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 p-3 transition-colors ${
                activeTab === tab.id
                  ? "bg-purple-500/30 text-white border-b-2 border-purple-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        <CardContent className="p-0 h-96 overflow-hidden">

          {activeTab === "chat" && (
            <div className="h-full flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.type === "user"
                          ? "bg-purple-500 text-white"
                          : "bg-slate-700 text-white"
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        {message.type === "user" ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                        <span className="text-xs opacity-70">
                          {message.type === "user" ? "You" : agent.name}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-700 text-white px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4" />
                        <span className="text-xs opacity-70">
                          {agent.name} is typing...
                        </span>
                      </div>
                      <div className="flex space-x-1 mt-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-slate-700 p-4">
                <div className="flex space-x-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder={`Message ${agent.name}...`}
                    className="flex-1 bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim()}
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "voice" && (
            <div className="h-full flex flex-col items-center justify-center p-8">
              <div className="text-center space-y-6">
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center ${
                    isRecording ? "bg-red-500 animate-pulse" : "bg-slate-700"
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="w-12 h-12 text-white" />
                  ) : (
                    <Mic className="w-12 h-12 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Voice Chat
                  </h3>
                  <p className="text-slate-400">
                    {isRecording
                      ? "Recording... Tap to stop"
                      : "Tap to start voice conversation"}
                  </p>
                </div>
                <Button
                  onClick={toggleRecording}
                  className={`${
                    isRecording
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-purple-500 hover:bg-purple-600"
                  }`}
                >
                  {isRecording ? "Stop Recording" : "Start Recording"}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "video" && (
            <div className="h-full flex flex-col items-center justify-center p-8">
              <div className="text-center space-y-6">
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center ${
                    isVideoCall ? "bg-green-500 animate-pulse" : "bg-slate-700"
                  }`}
                >
                  {isVideoCall ? (
                    <VideoOff className="w-12 h-12 text-white" />
                  ) : (
                    <Video className="w-12 h-12 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Video Call
                  </h3>
                  <p className="text-slate-400">
                    {isVideoCall
                      ? "Video call active... Tap to end"
                      : "Start video conversation with agent"}
                  </p>
                </div>
                <Button
                  onClick={toggleVideoCall}
                  className={`${
                    isVideoCall
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-green-500 hover:bg-green-600"
                  }`}
                >
                  {isVideoCall ? "End Call" : "Start Video Call"}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "payment" && (
            <div className="h-full flex flex-col items-center justify-center p-8">
              <div className="text-center space-y-6 max-w-sm">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Wallet className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Agent Payment
                  </h3>
                  <p className="text-slate-400 mb-4">
                    Pay for premium interactions with {agent.name}
                  </p>
                  <div className="bg-slate-800 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400">Service Fee:</span>
                      <span className="text-white font-semibold">
                        {getServiceFeeDisplay(agent)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400">Network:</span>
                      <span className="text-purple-400">
                        {getNetworkDisplay(agent)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Token Contract:</span>
                      <span className="text-green-400 font-mono text-sm">
                        {getTokenContractDisplay(agent)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <Button
                    onClick={handlePayment}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Generate Payment QR
                  </Button>
                  {onQRScan && (
                    <Button
                      onClick={handleQRScan}
                      variant="outline"
                      className="w-full border-green-600 text-green-400 hover:bg-green-500/20 hover:border-green-500"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Scan QR to Pay
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentInteractionModal;
