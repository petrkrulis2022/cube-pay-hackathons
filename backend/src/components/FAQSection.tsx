import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FAQItem {
  question: string;
  answer: string;
  category: "general" | "technical" | "pricing" | "security";
}

const FAQSection = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState<string>("general");

  const faqs: FAQItem[] = [
    {
      question: "What is AgentSphere and how does it work?",
      answer:
        "AgentSphere is a revolutionary platform that allows you to deploy AI agents in augmented reality. Simply scan any location with your phone, deploy an AI agent, and users can interact with it through AR. The agents are powered by advanced NLP and computer vision, secured by blockchain technology.",
      category: "general",
    },
    {
      question: "How quickly can I deploy my first agent?",
      answer:
        "You can deploy your first AI agent in under 30 seconds! Our streamlined process includes: scan location → customize agent → deploy. No coding required. Most users have their first agent running within minutes of signing up.",
      category: "general",
    },
    {
      question: "What devices are supported?",
      answer:
        "AgentSphere works on iOS 12+ and Android 8+ devices with ARCore/ARKit support. We also provide web-based management dashboards that work on any modern browser. No special hardware required - just a smartphone with a camera.",
      category: "technical",
    },
    {
      question: "Is my data secure?",
      answer:
        "Absolutely. We use bank-grade encryption, are SOC 2 compliant, and store data on decentralized blockchain networks. Your agent configurations and user interactions are encrypted end-to-end. We never sell or share your data.",
      category: "security",
    },
    {
      question: "How much does AgentSphere cost?",
      answer:
        "We offer a free tier with 3 agents and 100 interactions per month. Pro plans start at $29/month for unlimited agents and 10,000 interactions. Enterprise pricing available for large deployments. Early access users get 50% off for the first year.",
      category: "pricing",
    },
    {
      question: "Can I integrate with my existing systems?",
      answer:
        "Yes! AgentSphere provides REST APIs, webhooks, and SDKs for popular platforms. We integrate with CRM systems, databases, payment processors, and more. Our technical team provides white-glove onboarding for enterprise customers.",
      category: "technical",
    },
    {
      question: "What types of agents can I create?",
      answer:
        "The possibilities are endless! Popular use cases include customer service agents, educational assistants, tour guides, product demos, event announcers, and healthcare companions. Each agent can be customized with unique personalities, knowledge bases, and capabilities.",
      category: "general",
    },
    {
      question: "Do I need coding skills?",
      answer:
        "Not at all! Our visual agent builder allows anyone to create sophisticated AI agents using drag-and-drop interfaces. For advanced users, we provide APIs and SDKs for custom integrations and behaviors.",
      category: "technical",
    },
    {
      question: "What's included in the early access program?",
      answer:
        "Early access includes: unlimited agents for 6 months, priority support, exclusive workshops, direct feedback channel to our product team, and 50% lifetime discount. Plus, you help shape the future of AR AI technology!",
      category: "pricing",
    },
    {
      question: "How do you ensure agent accuracy and safety?",
      answer:
        "Our agents use advanced content filtering, fact-checking mechanisms, and behavior monitoring. All interactions are logged and can be reviewed. We provide extensive customization options for response guidelines and safety boundaries.",
      category: "security",
    },
  ];

  const categories = [
    { id: "general", label: "General", icon: "❓" },
    { id: "technical", label: "Technical", icon: "⚙️" },
    { id: "pricing", label: "Pricing", icon: "💰" },
    { id: "security", label: "Security", icon: "🔒" },
  ];

  const filteredFaqs = faqs.filter((faq) => faq.category === activeCategory);

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            💡 Everything You Need to Know
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Frequently Asked{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
              Questions
            </span>
          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Get instant answers to common questions about AgentSphere. Can't
            find what you're looking for?
            <span className="text-green-600 font-semibold">
              {" "}
              Contact our support team
            </span>
            .
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setActiveCategory(category.id);
                setActiveIndex(0);
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                activeCategory === category.id
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
              <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
                {faqs.filter((faq) => faq.category === category.id).length}
              </span>
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {filteredFaqs.map((faq, index) => (
            <motion.div
              key={`${activeCategory}-${index}`}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors group"
              >
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-700 transition-colors pr-4">
                  {faq.question}
                </h3>

                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center transition-all duration-300 ${
                    activeIndex === index
                      ? "bg-green-500 rotate-180"
                      : "group-hover:bg-green-200"
                  }`}
                >
                  <svg
                    className={`w-4 h-4 transition-colors duration-300 ${
                      activeIndex === index ? "text-white" : "text-green-600"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-8 pb-6 border-t border-gray-100">
                      <p className="text-gray-700 leading-relaxed pt-6">
                        {faq.answer}
                      </p>

                      {/* Helpful actions */}
                      <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-100">
                        <span className="text-sm text-gray-500">
                          Was this helpful?
                        </span>
                        <div className="flex gap-2">
                          <button className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 transition-colors">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                              />
                            </svg>
                            <span>Yes</span>
                          </button>
                          <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
                              />
                            </svg>
                            <span>No</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        {/* Contact Support CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 text-center"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Still have questions?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Our team of AR and AI experts is here to help. Get personalized
            answers to your specific use case and technical requirements.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 hover:-translate-y-1 shadow-lg">
              Contact Support Team
            </button>

            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Avg. response: 2 hours</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>97% satisfaction rate</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
