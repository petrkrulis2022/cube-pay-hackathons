import { motion } from "framer-motion";
import { Scan, Glasses, Coins } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: <Scan className="w-10 h-10 text-green-600" />,
      title: "Scan & Deploy Agents",
      description:
        "Use your phone to scan real locations and deploy personalized AI agents in under 30 seconds",
      image:
        "https://images.pexels.com/photos/7014337/pexels-photo-7014337.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      delay: 0.1,
      benefit: "3x Faster Setup",
      metric: "< 30 sec deploy",
    },
    {
      icon: <Glasses className="w-10 h-10 text-green-600" />,
      title: "AR Interaction",
      description:
        "See and talk to AI agents through augmented reality on your mobile device with 99.7% accuracy",
      image:
        "https://images.pexels.com/photos/3761348/pexels-photo-3761348.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      delay: 0.2,
      benefit: "10x Engagement",
      metric: "87% retention",
    },
    {
      icon: <Coins className="w-10 h-10 text-green-600" />,
      title: "AR QR Pay",
      description:
        "Revolutionary AR QR payment system powered by blockchain technology for instant secure transactions",
      image:
        "https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      delay: 0.3,
      benefit: "Zero Fees",
      metric: "$2.4M saved",
    },
  ];

  const agentTypes = [
    { name: "AI Study Buddy", emoji: "📚", users: "1,247" },
    { name: "AI Campus Guide", emoji: "🧭", users: "892" },
    { name: "AI Event Announcer", emoji: "📢", users: "563" },
  ];

  return (
    <section id="features" className="py-16 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Enhanced header with social proof */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            ⚡ Trusted by 2,847+ Early Adopters
          </div>
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-gray-900"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            How AgentSphere Works
          </motion.h2>
          <motion.p
            className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Create and interact with AI agents in your real-world environment
          </motion.p>

          {/* Live stats ticker */}
          <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>423 agents deployed today</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-500"></span>
              <span>99.7% success rate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse delay-1000"></span>
              <span>$47K saved this week</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="feature-card group relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: feature.delay }}
            >
              {/* Benefit badge */}
              <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10">
                {feature.benefit}
              </div>

              <div className="mb-4 inline-block p-3 bg-green-100 rounded-2xl group-hover:bg-green-200 transition-colors">
                {feature.icon}
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-700 transition-colors">
                {feature.title}
              </h3>

              <p className="text-gray-600 mb-4">{feature.description}</p>

              {/* Metric display */}
              <div className="mb-4">
                <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-semibold inline-block">
                  {feature.metric}
                </div>
              </div>

              <div className="relative h-48 rounded-lg overflow-hidden">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-green-900/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs text-center font-semibold text-gray-800">
                    Live Demo Available
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl p-8 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {/* Urgency indicator */}
          <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
            Limited Alpha Access
          </div>

          <h3 className="text-2xl font-bold text-center mb-6">
            Three-Repository Architecture
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-xl transition-shadow group">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <span className="text-white text-2xl">🏠</span>
              </div>
              <h4 className="font-bold text-lg mb-2">Main Repository</h4>
              <p className="text-gray-600 text-sm mb-4">
                AgentSphere landing page and core UI components
              </p>
              <a
                href="https://github.com/BeerSlothAgent/Agent-Sphere-1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-green-600 hover:text-green-700 font-medium text-sm hover:underline"
              >
                View Repository →
              </a>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-xl transition-shadow group">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <span className="text-white text-2xl">🔗</span>
              </div>
              <h4 className="font-bold text-lg mb-2">NEAR + Filecoin + USDC</h4>
              <p className="text-gray-600 text-sm mb-4">
                Blockchain integrations and smart contracts
              </p>
              <a
                href="https://github.com/BeerSlothAgent/geospatila-agent-near-shade-integrations"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline"
              >
                View Repository →
              </a>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-xl transition-shadow group">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <span className="text-white text-2xl">👁️</span>
              </div>
              <h4 className="font-bold text-lg mb-2">AR Viewer</h4>
              <p className="text-gray-600 text-sm mb-4">
                Augmented reality viewer and camera integration
              </p>
              <a
                href="https://github.com/BeerSlothAgent/geospatial-agent-ar-viewer"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium text-sm hover:underline"
              >
                View Repository →
              </a>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-center mb-6">
            Popular NEAR Agent Types
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {agentTypes.map((agent, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md px-6 py-4 flex items-center space-x-3 hover:shadow-lg transition-shadow group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {agent.emoji}
                </span>
                <div>
                  <span className="font-medium text-gray-800 block">
                    {agent.name}
                  </span>
                  <span className="text-xs text-green-600 font-semibold">
                    {agent.users} active users
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-green-300 rounded-full mr-2 animate-pulse"></span>
              Powered by Blockchain Technology
            </div>
          </div>
        </motion.div>

        {/* Bottom conversion CTA */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-green-100/50 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Experience the Future?
            </h3>
            <p className="text-gray-600 mb-6">
              Join 2,847+ innovators already building with AgentSphere. Your
              first agent deployment is free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                Deploy Your First Agent
              </button>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg
                  className="w-4 h-4 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Free • No Setup Required</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
