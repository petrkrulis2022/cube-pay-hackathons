import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Crosshair, AlertCircle, Loader2, Eye, RotateCcw, Info } from 'lucide-react';
import 'aframe';
import AgentInteractionModal from './interaction/AgentInteractionModal';
import { ARQRCodeGenerator, PaymentData } from './interaction/ARQRCodeGenerator';
import { DeployedObject } from '../types/common';
import './interaction/ARPaymentStyles.css';

interface ARViewerProps {
  supabase: any;
}

const ARViewer = ({ supabase }: ARViewerProps) => {
  const [objects, setObjects] = useState<DeployedObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedObject, setSelectedObject] = useState<DeployedObject | null>(null);
  const [showInteractionModal, setShowInteractionModal] = useState<boolean>(false);
  const sceneRef = useRef<any>(null);
  const qrGeneratorRef = useRef<ARQRCodeGenerator | null>(null);

  useEffect(() => {
    loadObjects();
    getCurrentLocation();
    initializeARQRGenerator();
  }, []);
  const initializeARQRGenerator = () => {
    // Initialize AR QR Code Generator
    const initQRGenerator = () => {
      const aScene = document.querySelector('a-scene');
      if (aScene && !qrGeneratorRef.current) {
        qrGeneratorRef.current = new ARQRCodeGenerator(aScene);
        
        // Set up global functions for QR code management
        window.generateARQRCode = (paymentData: PaymentData) => {
          if (qrGeneratorRef.current) {
            qrGeneratorRef.current.generateQRCode(paymentData);
          }
        };
        
        window.removeARQRCode = () => {
          if (qrGeneratorRef.current) {
            qrGeneratorRef.current.removeQRCode();
          }
        };
        
        console.log('🎯 AR QR Code Generator initialized');
      }
    };
    
    // Try to initialize immediately, or wait for scene to be ready
    if (document.querySelector('a-scene')) {
      initQRGenerator();
    } else {
      // Wait for A-Frame scene to be ready
      const checkScene = setInterval(() => {
        if (document.querySelector('a-scene')) {
          initQRGenerator();
          clearInterval(checkScene);
        }
      }, 100);
      
      // Clear interval after 10 seconds to prevent infinite checking
      setTimeout(() => clearInterval(checkScene), 10000);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported, using demo location');
      setUserLocation({ latitude: 34.0522, longitude: -118.2437 }); // LA coordinates for demo
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.log('Location error, using demo location:', error);
        setUserLocation({ latitude: 34.0522, longitude: -118.2437 }); // Fallback to demo location
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const loadObjects = async () => {
    if (!supabase) {
      setError('Database connection not available. Please connect to Supabase first.');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔍 Loading GeoAgents from database...');
      
      const { data, error: fetchError } = await supabase
        .from('deployed_objects')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ Error fetching objects:', fetchError);
        throw fetchError;
      }

      console.log('✅ Loaded GeoAgents:', data);
      setObjects(data || []);
      
      if (data && data.length > 0) {
        console.log('🎯 AR Viewer ready with', data.length, 'active GeoAgents');
        data.forEach((obj: DeployedObject) => {
          const coords = obj.preciselatitude && obj.preciselongitude 
            ? { latitude: obj.preciselatitude, longitude: obj.preciselongitude }
            : { latitude: obj.latitude, longitude: obj.longitude };
          
          console.log(`📍 ${obj.name}: ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)} ${obj.correctionapplied ? '(RTK)' : '(GPS)'}`);
        });
      }
    } catch (err) {
      console.error('❌ Error loading objects:', err);
      setError('Failed to load objects. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getObjectColor = (objectType: string) => {
    switch (objectType) {
      // Enhanced 9-Agent Type Color System
      case 'intelligent_assistant': return '#4f46e5'; // Indigo - AI Intelligence
      case 'local_services': return '#10b981'; // Green - Local Services
      case 'payment_terminal': return '#f59e0b'; // Amber - Financial/Payment
      case 'game_agent': return '#8b5cf6'; // Purple - Gaming/Entertainment  
      case '3d_world_builder': return '#06b6d4'; // Cyan - 3D/Creative
      case 'home_security': return '#ef4444'; // Red - Security/Alert
      case 'content_creator': return '#ec4899'; // Pink - Creative/Media
      case 'real_estate_broker': return '#84cc16'; // Lime - Real Estate/Property
      case 'bus_stop_agent': return '#6366f1'; // Indigo-Blue - Transportation
      // Legacy support
      case 'ai_agent': return '#4f46e5'; // Indigo (same as intelligent_assistant)
      case 'tutor': return '#7c3aed'; // Purple  
      case 'landmark': return '#ec4899'; // Pink
      case 'building': return '#10b981'; // Green
      default: return '#6b7280'; // Gray - Unknown types
    }
  };

  const getObjectEmoji = (objectType: string) => {
    switch (objectType) {
      // Enhanced 9-Agent Type Emoji System
      case 'intelligent_assistant': return '🧠'; // Brain - AI Intelligence
      case 'local_services': return '🏪'; // Store - Local Services
      case 'payment_terminal': return '💳'; // Credit Card - Payment
      case 'game_agent': return '🎮'; // Game Controller - Gaming
      case '3d_world_builder': return '🏗️'; // Construction - 3D Building
      case 'home_security': return '�'; // Lock - Security
      case 'content_creator': return '🎨'; // Art Palette - Creative
      case 'real_estate_broker': return '🏘️'; // Houses - Real Estate
      case 'bus_stop_agent': return '🚌'; // Bus - Transportation
      // Legacy support
      case 'ai_agent': return '🤖'; // Robot - AI Agent
      case 'tutor': return '�'; // Books - Education
      case 'landmark': return '�'; // Statue - Landmark
      case 'building': return '🏢'; // Office Building
      default: return '📦'; // Package - Unknown
    }
  };

  const getShapeMixin = (objectType: string) => {
    switch (objectType) {
      // Enhanced 9-Agent Type Shape System
      case 'intelligent_assistant': return 'intelligent-assistant-mixin'; // Icosahedron
      case 'local_services': return 'local-services-mixin'; // Cylinder
      case 'payment_terminal': return 'payment-terminal-mixin'; // Box
      case 'game_agent': return 'game-agent-mixin'; // Dodecahedron
      case '3d_world_builder': return '3d-world-builder-mixin'; // Cube
      case 'home_security': return 'home-security-mixin'; // Octahedron
      case 'content_creator': return 'content-creator-mixin'; // Torus
      case 'real_estate_broker': return 'real-estate-broker-mixin'; // Tetrahedron
      case 'bus_stop_agent': return 'bus-stop-agent-mixin'; // Rounded Cylinder
      // Legacy support
      case 'ai_agent': return 'ai-agent-mixin'; // Sphere
      case 'tutor': return 'ai-agent-mixin'; // Sphere (legacy)
      case 'landmark': return 'default-mixin'; // Cone (legacy)
      case 'building': return 'default-mixin'; // Cone (legacy)
      default: return 'default-mixin'; // Cone - Unknown types
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000; // Distance in meters
  };

  const handleAgentInteraction = (agent: DeployedObject) => {
    setSelectedObject(agent);
    setShowInteractionModal(true);
    
    // Store agent reference for QR code positioning
    if (qrGeneratorRef.current && agent) {
      (qrGeneratorRef.current as any).currentAgent = agent;
    }
  };

  const getRelativePosition = (objLat: number, objLon: number, index: number) => {
    if (!userLocation) {
      // Demo mode: arrange objects in a circle around the viewer
      const angle = (index * 60) * Math.PI / 180; // 60 degrees apart
      const radius = 8 + (index * 1.5); // Increased distance for better zoom level
      return {
        x: Math.sin(angle) * radius * 0.8, // Scale down for better view
        y: 1.6 + (index * 0.2), // Reduced height variation
        z: -Math.cos(angle) * radius * 0.8 // Scale down for better view
      };
    }

    // Real mode: calculate actual relative position
    const distance = calculateDistance(userLocation.latitude, userLocation.longitude, objLat, objLon);
    const bearing = Math.atan2(
      Math.sin((objLon - userLocation.longitude) * Math.PI / 180),
      Math.cos(userLocation.latitude * Math.PI / 180) * Math.tan(objLat * Math.PI / 180) -
      Math.sin(userLocation.latitude * Math.PI / 180) * Math.cos((objLon - userLocation.longitude) * Math.PI / 180)
    );

    // Scale down distance for AR view (1 meter = 1 unit, but cap at reasonable distance)
    const scaledDistance = Math.min(distance / 5, 15); // Adjusted scaling for better visibility
    
    return {
      x: Math.sin(bearing) * scaledDistance,
      y: 1.6, // Eye level
      z: -Math.cos(bearing) * scaledDistance
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Loading AR Viewer</h2>
          <p className="text-indigo-200">Fetching GeoAgents from database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">AR Viewer Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadObjects}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* AR Scene */}
      <div className="absolute inset-0">
        <a-scene
          ref={sceneRef}
          embedded
          style={{ height: '100vh', width: '100vw' }}
          background="color: #000"
          vr-mode-ui="enabled: false"
          device-orientation-permission-ui="enabled: false"
        >
          {/* Assets */}
          <a-assets>
            {/* Unique Shape Mixins for 9 Agent Types */}
            <a-mixin
              id="intelligent-assistant-mixin"
              geometry="primitive: icosahedron; radius: 0.35"
              animation="property: rotation; to: 360 360 360; loop: true; dur: 12000; easing: linear"
            />
            <a-mixin
              id="local-services-mixin"
              geometry="primitive: cylinder; radius: 0.3; height: 0.6"
              animation="property: rotation; to: 0 360 0; loop: true; dur: 8000; easing: linear"
            />
            <a-mixin
              id="payment-terminal-mixin"
              geometry="primitive: box; width: 0.5; height: 0.5; depth: 0.5"
              animation="property: rotation; to: 360 0 360; loop: true; dur: 10000; easing: linear"
            />
            <a-mixin
              id="game-agent-mixin"
              geometry="primitive: dodecahedron; radius: 0.35"
              animation="property: rotation; to: 0 360 360; loop: true; dur: 15000; easing: linear"
            />
            <a-mixin
              id="3d-world-builder-mixin"
              geometry="primitive: box; width: 0.4; height: 0.4; depth: 0.4"
              animation="property: rotation; to: 360 360 0; loop: true; dur: 9000; easing: linear"
            />
            <a-mixin
              id="home-security-mixin"
              geometry="primitive: octahedron; radius: 0.4"
              animation="property: rotation; to: 360 0 360; loop: true; dur: 11000; easing: linear"
            />
            <a-mixin
              id="content-creator-mixin"
              geometry="primitive: torus; radius: 0.3; radiusTubular: 0.1"
              animation="property: rotation; to: 360 360 360; loop: true; dur: 13000; easing: linear"
            />
            <a-mixin
              id="real-estate-broker-mixin"
              geometry="primitive: tetrahedron; radius: 0.4"
              animation="property: rotation; to: 0 360 0; loop: true; dur: 7000; easing: linear"
            />
            <a-mixin
              id="bus-stop-agent-mixin"
              geometry="primitive: cylinder; radius: 0.25; height: 0.8"
              animation="property: rotation; to: 360 0 0; loop: true; dur: 14000; easing: linear"
            />
            {/* Fallback shapes for legacy/unknown types */}
            <a-mixin
              id="ai-agent-mixin"
              geometry="primitive: sphere; radius: 0.35"
              animation="property: rotation; to: 0 360 0; loop: true; dur: 6000; easing: linear"
            />
            <a-mixin
              id="default-mixin"
              geometry="primitive: cone; radiusBottom: 0.3; radiusTop: 0; height: 0.6"
              animation="property: rotation; to: 0 360 0; loop: true; dur: 8000; easing: linear"
            />
          </a-assets>

          {/* Camera */}
          <a-camera
            position="0 1.6 0"
            fov="80"
            look-controls="enabled: true"
            wasd-controls="enabled: true"
            cursor="rayOrigin: mouse"
          />

          {/* Lighting */}
          <a-light type="ambient" color="#404040" intensity="0.4" />
          <a-light type="directional" position="1 4 1" color="#ffffff" intensity="0.8" />

          {/* Objects */}
          {objects.map((obj, index) => {
            const position = getRelativePosition(
              obj.preciselatitude || obj.latitude,
              obj.preciselongitude || obj.longitude,
              index
            );
            const color = getObjectColor(obj.object_type);

            return (
              <a-entity key={obj.id} position={`${position.x} ${position.y} ${position.z}`}>
                {/* 3D Object */}
                <a-entity
                  mixin={getShapeMixin(obj.object_type)}
                  material={`color: ${color}; metalness: 0.2; roughness: 0.8; transparent: true; opacity: 0.9`}
                  scale="1.2 1.2 1.2"
                  class="clickable-object"
                  data-object-id={obj.id}
                  data-agent-id={obj.id}
                  onClick={() => handleAgentInteraction(obj)}
                />
                
                {/* Object Name Label */}
                <a-text
                  value={obj.name}
                  position="0 1.0 0"
                  align="center"
                  color="#ffffff"
                  font="kelsonsans"
                  width="6"
                />
                
                {/* Distance/Accuracy Info */}
                <a-text
                  value={obj.correctionapplied ? `RTK ±${obj.accuracy?.toFixed(2)}m` : `GPS ±${obj.accuracy?.toFixed(0) || '10'}m`}
                  position="0 -1.0 0"
                  align="center"
                  color={obj.correctionapplied ? "#10b981" : "#f59e0b"}
                  font="kelsonsans"
                  width="4"
                />
                
                {/* Interaction Indicators */}
                {obj.chat_enabled && (
                  <a-text
                    value="💬"
                    position="-0.7 0.6 0"
                    align="center"
                    width="3"
                  />
                )}
                {obj.voice_enabled && (
                  <a-text
                    value="🎤"
                    position="0.7 0.6 0"
                    align="center"
                    width="3"
                  />
                )}
              </a-entity>
            );
          })}

          {/* Ground Grid */}
          <a-plane
            position="0 0 0"
            rotation="-90 0 0"
            geometry="primitive: plane; width: 50; height: 50"
            color="#1a1a1a"
            material="transparent: true; opacity: 0.3"
          />
        </a-scene>
      </div>

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-70 backdrop-blur-sm rounded-xl p-4 text-white max-w-sm">
        <div className="flex items-center mb-3">
          <Eye className="h-5 w-5 mr-2 text-green-400" />
          <h2 className="text-lg font-bold">NeAR Viewer</h2>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Active NEAR Agents:</span>
            <span className="font-bold text-green-400">{objects.length}</span>
          </div>
          
          {userLocation && (
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Your Location:</span>
              <span className="font-mono text-xs text-green-400">
                {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Range:</span>
            <span className="font-bold text-green-400">{objects[0]?.range_meters?.toFixed(1) || '25.0'}m</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Capabilities:</span>
            <div className="flex space-x-1">
              {objects.some(obj => obj.chat_enabled) && <span className="text-blue-400">💬</span>}
              {objects.some(obj => obj.voice_enabled) && <span className="text-green-400">🎤</span>}
              {objects.some(obj => obj.mcp_integrations) && <span className="text-green-400">🔗</span>}
            </div>
          </div>
          
          <div className="pt-2 border-t border-gray-600">
            <p className="text-xs text-gray-400">
              Use mouse to look around, WASD keys to move. NEAR agents are spinning and labeled with their names.
            </p>
          </div>
        </div>
      </div>

      {/* Object List */}
      <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-70 backdrop-blur-sm rounded-xl p-4 text-white max-w-xs max-h-96 overflow-y-auto">
        <h3 className="text-lg font-bold mb-3 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-green-400" />
          Nearby AI Agents
        </h3>
        
        {objects.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-400 text-sm">No active AI Agents found</p>
            <p className="text-gray-500 text-xs mt-1">Deploy some AI agents first!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {objects.map((obj) => {
              const distance = userLocation 
                ? calculateDistance(
                    userLocation.latitude, 
                    userLocation.longitude,
                    obj.preciselatitude || obj.latitude,
                    obj.preciselongitude || obj.longitude
                  )
                : null;

              return (
                <div
                  key={obj.id}
                  className="bg-white bg-opacity-10 rounded-lg p-3 hover:bg-opacity-20 transition-colors cursor-pointer"
                  onClick={() => setSelectedObject(obj)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{getObjectEmoji(obj.object_type)}</span>
                      <span className="font-medium">{obj.name}</span>
                    </div>
                    {obj.correctionapplied && (
                      <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        RTK
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-300 space-y-1">
                    <div>Type: {obj.object_type}</div>
                    {distance && (
                      <div>Distance: {distance < 1000 ? `${distance.toFixed(0)}m` : `${(distance/1000).toFixed(1)}km`}</div>
                    )}
                    <div>Accuracy: ±{obj.accuracy?.toFixed(obj.correctionapplied ? 2 : 0) || '10'}m</div>
                    <div className="flex items-center space-x-2">
                      <span>Capabilities:</span>
                      {obj.chat_enabled && <span className="text-blue-400">💬</span>}
                      {obj.voice_enabled && <span className="text-green-400">🎤</span>}
                      {obj.mcp_integrations && <span className="text-green-400">🔗</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-4 z-10 flex space-x-2">
        <button
          onClick={loadObjects}
          className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full transition-colors"
          title="Refresh Objects"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
        
        <button
          onClick={getCurrentLocation}
          className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full transition-colors"
          title="Update Location"
        >
          <Crosshair className="h-5 w-5" />
        </button>
      </div>

      {/* Object Details Modal */}
      {selectedObject && !showInteractionModal && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{getObjectEmoji(selectedObject.object_type)}</span>
                <h3 className="text-xl font-bold text-gray-900">{selectedObject.name}</h3>
              </div>
              <button
                onClick={() => setSelectedObject(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Description:</span>
                <p className="text-gray-600 mt-1">{selectedObject.description}</p>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Type:</span>
                <span className="ml-2 text-gray-600">{selectedObject.object_type}</span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Location Type:</span>
                <span className="ml-2 text-gray-600">{selectedObject.location_type}</span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Range:</span>
                <span className="ml-2 text-gray-600">{selectedObject.range_meters?.toFixed(1)}m</span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Coordinates:</span>
                <div className="mt-1 font-mono text-xs text-gray-600">
                  <div>Lat: {(selectedObject.preciselatitude || selectedObject.latitude).toFixed(8)}</div>
                  <div>Lon: {(selectedObject.preciselongitude || selectedObject.longitude).toFixed(8)}</div>
                  {selectedObject.precisealtitude && (
                    <div>Alt: {selectedObject.precisealtitude.toFixed(2)}m</div>
                  )}
                </div>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Accuracy:</span>
                <span className="ml-2 text-gray-600">
                  ±{selectedObject.accuracy?.toFixed(selectedObject.correctionapplied ? 2 : 0) || '10'}m
                  {selectedObject.correctionapplied && (
                    <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      RTK Enhanced
                    </span>
                  )}
                </span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Deployed:</span>
                <span className="ml-2 text-gray-600">
                  {new Date(selectedObject.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Owner:</span>
                <span className="ml-2 text-gray-600 font-mono text-xs">
                  {selectedObject.owner_wallet ? 
                    `${selectedObject.owner_wallet.slice(0, 6)}...${selectedObject.owner_wallet.slice(-4)}` : 
                    'Unknown'}
                </span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Capabilities:</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {selectedObject.chat_enabled && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      💬 Chat
                    </span>
                  )}
                  {selectedObject.voice_enabled && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      🎤 Voice
                    </span>
                  )}
                  {selectedObject.mcp_integrations && (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                      🔗 MCP
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-6 space-y-2">
              {selectedObject.chat_enabled && (
                <button
                  onClick={() => setShowInteractionModal(true)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  💬 Start Chat
                </button>
              )}
              
              {selectedObject.voice_enabled && (
                <button
                  onClick={() => alert('Voice interaction coming soon!')}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  🎤 Voice Chat
                </button>
              )}
              
              <button
                onClick={() => setSelectedObject(null)}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Enhanced Interaction Modal */}
      <AgentInteractionModal
        agent={selectedObject}
        visible={showInteractionModal}
        onClose={() => {
          setShowInteractionModal(false);
          setSelectedObject(null);
        }}
        userLocation={userLocation}
      />

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 z-10 bg-black bg-opacity-70 backdrop-blur-sm rounded-xl p-4 text-white max-w-xs">
        <div className="flex items-center mb-2">
          <Info className="h-4 w-4 mr-2 text-green-400" />
          <span className="font-medium text-sm">Controls</span>
        </div>
        <div className="text-xs text-gray-300 space-y-1">
          <div>• Mouse: Look around</div>
          <div>• WASD: Move around</div>
          <div>• Click AI agents: View details</div>
          <div>• AI agents spin automatically</div>
          <div>• AR QR Pay: Instant payments</div>
        </div>
      </div>
    </div>
  );
};

export default ARViewer;