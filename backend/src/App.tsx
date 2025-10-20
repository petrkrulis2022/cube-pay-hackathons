import { useState, useEffect } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import MapVisualization from "./components/MapVisualization";
import AuthSection from "./components/AuthSection";
import FAQSection from "./components/FAQSection";
import Footer from "./components/Footer";
import DeployObject from "./components/DeployObject";
import { MultiChainAgentDashboard } from "./components/MultiChainAgentDashboard";
import ARViewer from "./components/ARViewer";

// Initialize Supabase client only if credentials are available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

// Only create Supabase client if both URL and key are provided and not placeholder values
if (
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== "your_supabase_url_here" &&
  supabaseAnonKey !== "your_supabase_anon_key_here"
) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

function App() {
  const [waitlistCount, setWaitlistCount] = useState<number>(2847);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900">
        <div className="text-center">
          <motion.div
            className="text-6xl mb-4"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "loop",
            }}
          >
            🌐
          </motion.div>
          <h1 className="text-3xl font-bold text-white">
            Loading AgentSphere...
          </h1>
          <div className="mt-4 w-48 h-2 bg-purple-900 rounded-full mx-auto overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5 }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Hero />
                <Features />
                <MapVisualization />
                <FAQSection />
                <AuthSection
                  waitlistCount={waitlistCount}
                  setWaitlistCount={setWaitlistCount}
                  supabase={supabase}
                />
              </>
            }
          />
          <Route
            path="/deploy"
            element={<DeployObject supabase={supabase} />}
          />
          <Route path="/dashboard" element={<MultiChainAgentDashboard />} />
          <Route path="/ar" element={<ARViewer supabase={supabase} />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
