import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const MapVisualization = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Create random agent dots
    const createAgentDots = () => {
      const map = mapRef.current;
      if (!map) return;
      
      // Clear existing dots
      const existingDots = map.querySelectorAll('.agent-dot');
      existingDots.forEach(dot => dot.remove());
      
      // Create new dots
      for (let i = 0; i < 20; i++) {
        const dot = document.createElement('div');
        dot.classList.add('agent-dot');
        
        // Random position
        const left = Math.random() * 90 + 5; // 5-95%
        const top = Math.random() * 80 + 10; // 10-90%
        
        dot.style.left = `${left}%`;
        dot.style.top = `${top}%`;
        
        // Random delay for animation
        dot.style.animationDelay = `${Math.random() * 2}s`;
        
        map.appendChild(dot);
      }
    };
    
    createAgentDots();
    
    // Recreate dots periodically to simulate movement
    const interval = setInterval(createAgentDots, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="map" className="py-16 bg-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">AI Agents Around the Globe</h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of students deploying AI agents at schools and communities worldwide with AR QR Pay
          </p>
        </motion.div>

        <motion.div 
          className="relative rounded-2xl overflow-hidden shadow-xl bg-white p-4 md:p-8 aspect-[16/9] max-w-4xl mx-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div ref={mapRef} className="globe-container w-full h-full relative">
            {/* World map */}
            <img 
              src="https://images.pexels.com/photos/3932930/pexels-photo-3932930.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
              alt="Stylized world map" 
              className="w-full h-full object-cover rounded-xl opacity-60"
            />
            
            {/* Agent dots are added dynamically via JS */}
            
            {/* Legend */}
            <div className="absolute bottom-4 right-4 bg-white bg-opacity-80 backdrop-blur-sm rounded-lg p-3 shadow-md">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-gray-700">Active NEAR Agents</span>
              </div>
            </div>
            
            {/* Stats overlay */}
            <div className="absolute top-4 left-4 bg-white bg-opacity-80 backdrop-blur-sm rounded-lg p-3 shadow-md">
              <div className="text-sm font-medium text-gray-700">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>5,723 Active AI Agents</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>312 Schools Connected</span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span>AR QR Pay Active</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">5,723</div>
            <div className="text-gray-600">Active AI Agents</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">312</div>
            <div className="text-gray-600">Schools Connected</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">1.2M</div>
            <div className="text-gray-600">USDFC Earned</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MapVisualization;