import { motion } from "framer-motion";
import { ArrowRight, Plus, Eye, Camera, TrendingUp } from "lucide-react";

const HeroThreePhones = () => {
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
          <div className="bg-black/60 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Eye className="text-white text-2xl" />
            </div>
            <div className="font-bold text-sm">AR Testing Mode</div>
            <div className="text-xs opacity-80">
              View & interact with AI agents
            </div>
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
    <section className="relative overflow-hidden pt-16 pb-20 md:pt-20 md:pb-28 bg-gradient-to-br from-gray-900 via-black to-blue-900">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 right-20 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 right-40 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              <span className="block">Deploy AI Agents</span>
              <span className="block bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Anywhere, Instantly
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              The future of location-based AI is here. Deploy intelligent agents
              using AR/QR technology, interact through blockchain payments, and
              transform any space into an interactive digital experience.
            </p>

            {/* Status Indicators */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center bg-green-500/20 rounded-full px-4 py-2">
                <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
                <span className="text-green-400 text-sm">
                  Live on Blockchain
                </span>
              </div>
              <div className="flex items-center bg-blue-500/20 rounded-full px-4 py-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 mr-2"></div>
                <span className="text-blue-400 text-sm">AR/QR Ready</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button className="group bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105">
                <span>Join 2,847+ Early Users</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button className="group border-2 border-green-500 text-green-400 hover:bg-green-500/10 px-8 py-4 rounded-lg font-semibold transition-all duration-300">
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">2,847</div>
                <div className="text-sm text-gray-400">Early Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">12.5K</div>
                <div className="text-sm text-gray-400">Agents Deployed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">94%</div>
                <div className="text-sm text-gray-400">Satisfaction</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feature Banner */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full px-6 py-3 border border-purple-500/30">
            <TrendingUp className="w-5 h-5 text-purple-400 mr-2" />
            <span className="text-purple-300 font-medium">
              🚀 Revolutionary AR+QR+Blockchain Integration
            </span>
          </div>
        </div>

        {/* Three Phone Mockups */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {phones.map((phone, index) => (
            <motion.div
              key={phone.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="group relative"
            >
              {/* Phone Container */}
              <div className="relative bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl border border-gray-700 hover:border-green-500/50 transition-all duration-300 transform hover:scale-105">
                {/* Phone Screen */}
                <div className="relative rounded-[2rem] overflow-hidden bg-black aspect-[9/16] h-[400px]">
                  {/* Background Image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${phone.bgImage})` }}
                  />

                  {/* Overlay Content */}
                  {phone.overlayContent}
                </div>

                {/* Phone Details */}
                <div className="absolute -bottom-16 left-0 right-0 text-center">
                  <h3 className="text-lg font-bold text-white mb-2">
                    {phone.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    {phone.description}
                  </p>

                  {/* Action Button */}
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 mx-auto group-hover:shadow-lg transform group-hover:scale-105"
                    onClick={() => {
                      if (phone.external) {
                        window.open(phone.link, "_blank");
                      } else {
                        // Handle internal navigation here
                        console.log(`Navigate to ${phone.link}`);
                      }
                    }}
                  >
                    {phone.buttonIcon}
                    <span>{phone.buttonText}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroThreePhones;
