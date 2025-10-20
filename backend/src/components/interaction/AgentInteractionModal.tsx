import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MessageCircle, 
  Mic, 
  Video, 
  MapPin,
  Send,
  DollarSign,
  Wallet,
  Loader2,
  QrCode,
  CheckCircle
} from 'lucide-react';
import { PaymentData, generateTransactionId } from './ARQRCodeGenerator';
import { BlockchainPaymentSimulator } from './BlockchainPaymentSimulator';
import { DeployedObject } from '../../types/common';
import { useAddress } from '@thirdweb-dev/react';
import './ARPaymentStyles.css';

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

interface AgentInteractionModalProps {
  agent: DeployedObject | null;
  visible: boolean;
  onClose: () => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

const AgentInteractionModal: React.FC<AgentInteractionModalProps> = ({
  agent,
  visible,
  onClose,
  userLocation
}) => {
  const connectedAddress = useAddress();

  // Calculate distance function - moved before first usage
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const [currentView, setCurrentView] = useState<'overview' | 'chat' | 'voice' | 'video'>('overview');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [selectedInteractionType, setSelectedInteractionType] = useState<'chat' | 'voice' | 'video'>('chat');
  const [paymentStep, setPaymentStep] = useState<'selection' | 'qr-generated' | 'processing' | 'success'>('selection');
  const [qrCodeData, setQrCodeData] = useState<PaymentData | null>(null);
  const [paymentTimer, setPaymentTimer] = useState(300); // 5 minutes
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Calculate distance
  const distance = userLocation && agent ? 
    Math.round(calculateDistance(
      userLocation.latitude, 
      userLocation.longitude, 
      agent.preciselatitude || agent.latitude, 
      agent.preciselongitude || agent.longitude
    )) : 25;

  // Agent personalities and smart responses
  const agentPersonalities = {
    'AI Agent': {
      greeting: "Hello! I'm an AI agent ready to assist you with any questions or tasks. How can I help you today?",
      color: '#4F46E5',
      responses: {
        hello: "Hi there! Great to meet you. I'm here to help with anything you need.",
        help: "I can assist with general questions, provide information, help with problem-solving, and much more. What would you like to explore?",
        capabilities: "I have access to various tools including web search, calculations, and general knowledge. I can also help with analysis and creative tasks.",
        default: "That's an interesting question! Let me think about that and provide you with a helpful response."
      }
    },
    'Study Buddy': {
      greeting: "Hey there! Ready to learn something new? I'm your study companion and I'm here to make learning fun and effective!",
      color: '#10B981',
      responses: {
        hello: "Hello, fellow learner! What subject are we tackling today?",
        help: "I can help you with homework, explain difficult concepts, create study plans, and provide practice questions. What do you need help with?",
        study: "Let's create a personalized study plan! What subject are you working on and what's your timeline?",
        homework: "I'd love to help with your homework! Share the problem or topic and I'll guide you through it step by step.",
        default: "Great question! Let me break this down in a way that's easy to understand and remember."
      }
    },
    'Local Services': {
      greeting: "Looking for something in the area? I know all the best local spots and can help you find exactly what you need!",
      color: '#F59E0B',
      responses: {
        hello: "Welcome to the neighborhood! I'm your local guide. What can I help you find?",
        help: "I can provide directions, recommend local businesses, share information about facilities, and help you navigate the area.",
        directions: "I'd be happy to give you directions! Where are you trying to go?",
        food: "There are some great dining options nearby! Are you looking for a specific type of cuisine or price range?",
        default: "I know this area well! Let me share some helpful local information about that."
      }
    },
    'Content Creator': {
      greeting: "Let's create something amazing together! I help with writing, brainstorming, and bringing creative ideas to life.",
      color: '#EC4899',
      responses: {
        hello: "Hello, creative soul! Ready to make something awesome?",
        help: "I can assist with writing, brainstorming, content planning, creative projects, and artistic inspiration. What's your vision?",
        write: "I love helping with writing! What type of content are you working on? Blog post, story, script, or something else?",
        ideas: "Brainstorming time! Tell me about your project and I'll help generate some creative ideas.",
        default: "That sparks my creativity! Let me help you explore that idea and develop it further."
      }
    },
    'Game Agent': {
      greeting: "Ready to play? I create fun games, puzzles, and interactive experiences for entertainment!",
      color: '#8B5CF6',
      responses: {
        hello: "Hey player! Ready for some fun? What kind of game are you in the mood for?",
        help: "I can create games, puzzles, trivia, word games, and interactive challenges. I can also help with game strategies!",
        game: "Let's play! I can create a quick game for us right now. Do you prefer puzzles, trivia, word games, or something else?",
        puzzle: "I love puzzles! Here's a quick one: I'm thinking of a number between 1 and 100. Can you guess it in 7 tries or less?",
        default: "That sounds like it could be turned into a fun game or challenge! Let me think of how we can make it interactive."
      }
    }
  };

  const getAgentPersonality = () => {
    return agentPersonalities[agent?.object_type as keyof typeof agentPersonalities] || agentPersonalities['AI Agent'];
  };

  const getInteractionFee = (type: string) => {
    switch (type) {
      case 'chat': return agent?.interaction_fee || 10;
      case 'voice': return (agent?.interaction_fee || 10) * 6;
      case 'video': return (agent?.interaction_fee || 10) * 11;
      default: return agent?.interaction_fee || 10;
    }
  };

  const generateAgentResponse = (userMessage: string): string => {
    const personality = getAgentPersonality();
    const message = userMessage.toLowerCase();
    
    // Check for specific keywords
    for (const [keyword, response] of Object.entries(personality.responses)) {
      if (message.includes(keyword)) {
        return response;
      }
    }
    
    // Default response
    return personality.responses.default;
  };

  const handleStartInteraction = (type: 'chat' | 'voice' | 'video') => {
    setSelectedInteractionType(type);
    setPaymentStep('selection');
    setShowPaymentConfirm(true);
  };

  const handleGenerateQRPayment = async () => {
    if (!agent) return;
    
    // Validate connected wallet address
    if (!connectedAddress) {
      alert('Please connect your MetaMask wallet first to generate QR payment');
      return;
    }
    
    // Validate wallet address format
    if (!connectedAddress.startsWith('0x') || connectedAddress.length !== 42) {
      alert('Invalid wallet address format. Please ensure MetaMask is properly connected.');
      return;
    }
    
    console.log('🔗 Using connected wallet as recipient:', connectedAddress);
    console.log('💰 Interaction fee:', getInteractionFee(selectedInteractionType), 'BDAG');

    const paymentData: PaymentData = {
      agentId: agent.name,
      interactionType: selectedInteractionType,
      amount: getInteractionFee(selectedInteractionType),
      transactionId: generateTransactionId(),
      timestamp: Date.now(),
      walletAddress: connectedAddress,
      merchantAddress: connectedAddress, // Using connected wallet for testing
      currency: 'BDAG',
      network: 'BlockDAG-Primordial-Testnet',
      chainId: 1043 // Corrected Chain ID for BlockDAG Primordial Testnet
    };

    console.log('🎯 Generating MetaMask-compatible QR payment with data:', paymentData);
    setQrCodeData(paymentData);
    setPaymentStep('qr-generated');
    
    // Generate MetaMask-compatible AR QR code
    if (window.generateARQRCode) {
      window.generateARQRCode(paymentData);
    }
    
    // Start payment timer
    startPaymentTimer();
  };

  const handleQRScanSimulation = async () => {
    // Simulate scanning delay
    setTimeout(() => {
      triggerBlockchainWallet();
    }, 2000);
  };

  const triggerBlockchainWallet = () => {
    if (!qrCodeData) return;
    
    // Initialize blockchain payment simulator
    const paymentSimulator = new BlockchainPaymentSimulator();
    paymentSimulator.simulatePayment(qrCodeData).then(() => {
      setPaymentStep('success');
      setTimeout(() => {
        setShowPaymentConfirm(false);
        setCurrentView(selectedInteractionType);
        initializeConversation();
      }, 2000);
    }).catch(() => {
      // Payment cancelled or failed
      setPaymentStep('selection');
      setQrCodeData(null);
    });
  };

  const handleTraditionalPayment = async () => {
    setPaymentStep('processing');
    
    // Simulate traditional payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setPaymentStep('success');
    
    setTimeout(() => {
      setShowPaymentConfirm(false);
      setCurrentView(selectedInteractionType);
      initializeConversation();
    }, 2000);
  };

  const initializeConversation = () => {
    // Initialize conversation with greeting
    const greeting = getAgentPersonality().greeting;
    setMessages([{
      id: Date.now().toString(),
      type: 'agent',
      content: greeting,
      timestamp: new Date()
    }]);
  };

  const startPaymentTimer = () => {
    setPaymentTimer(300); // Reset to 5 minutes
    
    const timer = setInterval(() => {
      setPaymentTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Timer expired
          if (window.removeARQRCode) {
            window.removeARQRCode();
          }
          setPaymentStep('selection');
          setQrCodeData(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancelPayment = () => {
    if (window.removeARQRCode) {
      window.removeARQRCode();
    }
    setShowPaymentConfirm(false);
    setPaymentStep('selection');
    setQrCodeData(null);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate agent typing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const agentResponse: Message = {
      id: (Date.now() + 1).toString(),
      type: 'agent',
      content: generateAgentResponse(userMessage.content),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, agentResponse]);
    setIsTyping(false);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (visible && agent) {
      setCurrentView('overview');
      setMessages([]);
      setInputMessage('');
      setIsTyping(false);
      setShowPaymentConfirm(false);
      setPaymentStep('selection');
      setQrCodeData(null);
    }
  }, [visible, agent]);

  if (!visible || !agent) return null;

  const personality = getAgentPersonality();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div 
            className="p-6 text-white relative"
            style={{ backgroundColor: personality.color }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="pr-12">
              <h2 className="text-2xl font-bold mb-1">{agent.name}</h2>
              <p className="text-white text-opacity-90 mb-2">{agent.object_type}</p>
              <div className="flex items-center text-white text-opacity-80 text-sm">
                <MapPin size={14} className="mr-1" />
                <span>{distance}m away</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {currentView === 'overview' && (
              <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">About this agent</h3>
                  <p className="text-gray-600 text-sm">{agent.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Interaction Options</h3>
                  <div className="space-y-3">
                    {/* Chat Option */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleStartInteraction('chat')}
                      className="w-full flex items-center p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all"
                    >
                      <div className="p-3 bg-blue-100 rounded-full">
                        <MessageCircle size={20} className="text-blue-600" />
                      </div>
                      <div className="flex-1 ml-4 text-left">
                        <h4 className="font-semibold text-gray-900">Text Chat</h4>
                        <p className="text-sm text-gray-600">Start a conversation</p>
                      </div>
                      <div className="flex items-center text-green-600 font-semibold">
                        <DollarSign size={16} />
                        <span>{getInteractionFee('chat')} USDFC</span>
                      </div>
                    </motion.button>

                    {/* Voice Option */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleStartInteraction('voice')}
                      className="w-full flex items-center p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all"
                    >
                      <div className="p-3 bg-green-100 rounded-full">
                        <Mic size={20} className="text-green-600" />
                      </div>
                      <div className="flex-1 ml-4 text-left">
                        <h4 className="font-semibold text-gray-900">Voice Chat</h4>
                        <p className="text-sm text-gray-600">Talk with the agent</p>
                      </div>
                      <div className="flex items-center text-green-600 font-semibold">
                        <DollarSign size={16} />
                        <span>{getInteractionFee('voice')} USDFC</span>
                      </div>
                    </motion.button>

                    {/* Video Option */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleStartInteraction('video')}
                      className="w-full flex items-center p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all"
                    >
                      <div className="p-3 bg-purple-100 rounded-full">
                        <Video size={20} className="text-purple-600" />
                      </div>
                      <div className="flex-1 ml-4 text-left">
                        <h4 className="font-semibold text-gray-900">Video Call</h4>
                        <p className="text-sm text-gray-600">Face-to-face interaction</p>
                      </div>
                      <div className="flex items-center text-green-600 font-semibold">
                        <DollarSign size={16} />
                        <span>{getInteractionFee('video')} USDFC</span>
                      </div>
                    </motion.button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Capabilities</h3>
                  <div className="flex flex-wrap gap-2">
                    {(agent.mcp_integrations || []).map((capability: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Agent Wallet:</span>
                    <span className="font-mono">{agent.agent_wallet_address || 'Not configured'}</span>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'chat' && (
              <div className="flex flex-col h-96">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <button
                        onClick={() => setCurrentView('overview')}
                        className="mr-3 p-1 hover:bg-gray-200 rounded"
                      >
                        <X size={16} />
                      </button>
                      <h3 className="font-semibold">Chat with {agent.name}</h3>
                    </div>
                    <div className="flex items-center text-green-600 text-sm font-semibold">
                      <DollarSign size={14} />
                      <span>{getInteractionFee('chat')} USDFC</span>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim()}
                      className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(currentView === 'voice' || currentView === 'video') && (
              <div className="p-6 text-center">
                <div className="mb-4">
                  {currentView === 'voice' ? (
                    <Mic size={48} className="mx-auto text-green-500" />
                  ) : (
                    <Video size={48} className="mx-auto text-purple-500" />
                  )}
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {currentView === 'voice' ? 'Voice Chat' : 'Video Call'} Coming Soon!
                </h3>
                <p className="text-gray-600 mb-4">
                  {currentView === 'voice' 
                    ? 'Voice interactions will be available in the next update.'
                    : 'Video calls will be available in the next update.'
                  }
                </p>
                <button
                  onClick={() => setCurrentView('overview')}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Back to Options
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Payment Confirmation Modal */}
        <AnimatePresence>
          {showPaymentConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
              >
                {paymentStep === 'selection' && (
                  <div className="text-center">
                    <div className="mb-4">
                      <div className="flex items-center justify-center space-x-2">
                        <Wallet size={48} className="text-blue-500" />
                        <span className="text-2xl">🦊</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">MetaMask Compatible Payment</h3>
                    <p className="text-gray-600 mb-4">
                      Start {selectedInteractionType} with {agent.name}
                    </p>
                    <div className="bg-gray-50 rounded-lg p-3 mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Cost:</span>
                        <div className="flex items-center text-green-600 font-semibold">
                          <DollarSign size={16} />
                          <span>{getInteractionFee(selectedInteractionType)} BDAG</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">To Address:</span>
                        <span className="text-gray-700 font-mono text-xs">
                          {connectedAddress ? 
                            `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}` : 
                            'Connect Wallet'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-gray-500">Network:</span>
                        <span className="text-gray-700 text-xs">BlockDAG Primordial Testnet (1043)</span>
                      </div>
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-gray-500">RPC:</span>
                        <span className="text-gray-700 text-xs">https://test-rpc.primordial.bdagscan.com/</span>
                      </div>
                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                        💡 <strong>Note:</strong> MetaMask will use your currently active account as sender. Make sure your active account has BDAG tokens.
                      </div>
                    </div>
                    
                    {/* EIP-681 Compliant AR QR Payment Option */}
                    <div className="space-y-3 mb-6">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGenerateQRPayment}
                        disabled={!connectedAddress}
                        className="w-full p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all"
                      >
                        <div className="flex items-center justify-center space-x-3">
                          <QrCode size={24} />
                          <div className="text-left">
                            <div className="font-semibold">🦊 Scan with MetaMask Mobile</div>
                            <div className="text-sm opacity-90">Uses your active MetaMask account</div>
                          </div>
                        </div>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleTraditionalPayment}
                        className="w-full p-4 bg-blue-500 text-white rounded-xl hover:shadow-lg transition-all"
                      >
                        <div className="flex items-center justify-center space-x-3">
                          <Wallet size={24} />
                          <div className="text-left">
                            <div className="font-semibold">Traditional Payment</div>
                            <div className="text-sm opacity-90">Standard USDC payment</div>
                          </div>
                        </div>
                      </motion.button>
                    </div>
                    
                    <button
                      onClick={handleCancelPayment}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                
                {paymentStep === 'qr-generated' && qrCodeData && (
                  <ARQRModal 
                    paymentData={qrCodeData}
                    paymentTimer={paymentTimer}
                    onClose={handleCancelPayment}
                    onScanSimulation={handleQRScanSimulation}
                    connectedAddress={connectedAddress}
                  />
                )}
                
                {paymentStep === 'processing' && (
                  <div className="text-center">
                    <div className="mb-4">
                      <Loader2 size={48} className="mx-auto text-blue-500 animate-spin" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Processing Payment...</h3>
                    <p className="text-gray-600 mb-4">
                      Please wait while we process your payment
                    </p>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        🔒 Secured by Base Network
                      </p>
                    </div>
                  </div>
                )}
                
                {paymentStep === 'success' && (
                  <div className="text-center">
                    <div className="mb-4">
                      <CheckCircle size={48} className="mx-auto text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">🎉 Payment Successful!</h3>
                    <p className="text-gray-600 mb-4">
                      You can now interact with {agent.name}
                    </p>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-sm text-green-800">
                        ✅ Payment confirmed - Chat interface opening
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default AgentInteractionModal;

// AR QR Modal Component with Large QR Display
interface ARQRModalProps {
  paymentData: PaymentData;
  paymentTimer: number;
  onClose: () => void;
  onScanSimulation: () => void;
  connectedAddress?: string;
}

const ARQRModal: React.FC<ARQRModalProps> = ({ 
  paymentData, 
  paymentTimer, 
  onClose, 
  onScanSimulation,
  connectedAddress
}) => {
  const [qrCodeDataURL, setQrCodeDataURL] = useState('');
  const [scanningState, setScanningState] = useState<'waiting' | 'scanning' | 'success'>('waiting');
  const [qrGenerating, setQrGenerating] = useState(true);

  useEffect(() => {
    generateLargeQRCode();
  }, []);

  const generateLargeQRCode = async () => {
    setQrGenerating(true);
    try {
      // Construct the EIP-681 compliant URL for BDAG ERC-20 token transfer
      // Format: ethereum:<token_contract_address>@<chain_id>/transfer?address=<recipient_address>&uint256=<amount_in_wei>
      const tokenContractAddress = '0x6533fe2Ebb66CcE28FDdBA9663Fe433A308137e9'; // BDAG Token Contract Address
      const amountInWei = (paymentData.amount * Math.pow(10, 18)).toString(); // BDAG uses 18 decimals
      const eip681Url = `ethereum:${tokenContractAddress}@1043/transfer?address=${paymentData.merchantAddress}&uint256=${amountInWei}`;

      console.log('🎯 Generating EIP-681 compliant BDAG ERC-20 QR code:', eip681Url);
      console.log('📋 BDAG ERC-20 Transfer Details:', {
        tokenContract: tokenContractAddress,
        recipient: paymentData.merchantAddress,
        amountBDAG: paymentData.amount,
        amountWei: amountInWei,
        chainId: 1043,
        format: 'BDAG ERC-20 Transfer',
        decimals: 18,
        network: 'BlockDAG Primordial Testnet'
      });
      
      // Import and use QRCode library dynamically
      const QRCode = await import('qrcode');
      const qrDataURL = await QRCode.default.toDataURL(eip681Url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M',
        type: 'image/png'
      });
      
      setQrCodeDataURL(qrDataURL);
      console.log('✅ EIP-681 compliant ERC-20 QR code generated successfully');
    } catch (error) {
      console.error('QR generation failed:', error);
      // Fallback: create a simple text-based QR code
      try {
        const QRCode = await import('qrcode');
        const tokenContract = '0x6533fe2Ebb66CcE28FDdBA9663Fe433A308137e9';
        const fallbackData = `ethereum:${tokenContract}@1043/transfer?address=${paymentData.merchantAddress}&uint256=${(paymentData.amount * Math.pow(10, 18)).toString()}`;
        const fallbackQR = await QRCode.default.toDataURL(fallbackData, {
          width: 300,
          margin: 2,
          errorCorrectionLevel: 'L'
        });
        setQrCodeDataURL(fallbackQR);
        console.log('⚠️ Using fallback QR code generation');
      } catch (fallbackError) {
        console.error('Fallback QR generation also failed:', fallbackError);
      }
    } finally {
      setQrGenerating(false);
    }
  };

  const handleSimulateQRScan = () => {
    setScanningState('scanning');
    onScanSimulation();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="ar-qr-modal-content">
      <div className="qr-header">
        <h3>🎯 AR QR Code Generated!</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      {/* Large QR Code Display */}
      <div className="qr-display-section">
        <div className="qr-code-container">
          {qrGenerating ? (
            <div className="qr-loading">
              <div className="spinner"></div>
              <p>Generating Real QR Code...</p>
            </div>
          ) : qrCodeDataURL ? (
            <img 
              src={qrCodeDataURL} 
              alt="Real BDAG Payment QR Code" 
              className="large-qr-code"
            />
          ) : (
            <div className="qr-loading">
              <p>❌ QR Code Generation Failed</p>
            </div>
          )}
          
          {/* QR Code Overlay Effects */}
          <div className="qr-overlay">
            <div className="scanning-line"></div>
            <div className="corner-markers">
              <div className="corner top-left"></div>
              <div className="corner top-right"></div>
              <div className="corner bottom-left"></div>
              <div className="corner bottom-right"></div>
            </div>
          </div>
        </div>

        {/* Scanning Animation */}
        {scanningState === 'scanning' && (
          <div className="scanning-animation">
            <div className="scan-beam"></div>
            <p>📱 Scanning QR Code...</p>
          </div>
        )}
      </div>

      {/* Payment Details */}
      <div className="payment-details">
        <div className="detail-row">
          <span>Amount:</span>
          <span className="amount">{paymentData.amount} BDAG</span>
        </div>
        <div className="detail-row">
          <span>Agent:</span>
          <span>{paymentData.agentId}</span>
        </div>
        <div className="detail-row">
          <span>Service:</span>
          <span>{paymentData.interactionType.toUpperCase()} CHAT</span>
        </div>
        <div className="detail-row">
          <span>Network:</span>
          <span>BlockDAG Primordial (1043)</span>
        </div>
        <div className="detail-row">
          <span>To Address:</span>
          <span className="wallet-address">
            {connectedAddress ? 
              `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}` : 
              `${paymentData.merchantAddress.slice(0, 6)}...${paymentData.merchantAddress.slice(-4)}`
            }
          </span>
        </div>
        <div className="detail-row">
          <span>Expires in:</span>
          <span className="timer">{formatTime(paymentTimer)}</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="instructions">
        <p>🦊 <strong>MetaMask Instructions:</strong> Open MetaMask mobile app → Tap "Send" → Tap camera icon → Scan this QR code. The BDAG token transfer will auto-populate for {paymentData.amount} BDAG tokens on BlockDAG Primordial Testnet (Chain ID: 1043).</p>
        <p><strong>⚠️ Important:</strong> Make sure MetaMask is connected to BlockDAG Primordial Testnet and the BDAG token (0x6533fe2Ebb66CcE28FDdBA9663Fe433A308137e9) is added to your wallet.</p>
      </div>

      {/* Action Buttons */}
      <div className="qr-actions">
        <button 
          className="btn-simulate-scan"
          onClick={handleSimulateQRScan}
          disabled={scanningState !== 'waiting'}
        >
          {scanningState === 'waiting' && '📱 Simulate QR Scan'}
          {scanningState === 'scanning' && '⏳ Scanning...'}
          {scanningState === 'success' && '✅ Scanned!'}
        </button>
        <button className="btn-cancel" onClick={onClose}>
          Cancel Payment
        </button>
      </div>

      {/* AR Simulation Note */}
      <div className="ar-note">
        <small>💡 <strong>Strict EIP-681 BDAG Transfer:</strong> ethereum:0x6533fe2Ebb66CcE28FDdBA9663Fe433A308137e9@1043/transfer?address={connectedAddress || paymentData.merchantAddress}&uint256={(paymentData.amount * Math.pow(10, 18)).toString()}</small>
      </div>
    </div>
  );
};