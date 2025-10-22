"use client";
import React from "react";
import { motion } from "motion/react";
import { Music, Users, Sparkles, Zap, Heart, TrendingUp, Radio, Shuffle } from "lucide-react";

export default function HomePageV5() {
  return (
    <div className="min-h-screen" style={{ background: "var(--neo-bg)" }}>
      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-64 h-64 rounded-full opacity-20"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-10"
            style={{ background: "linear-gradient(135deg, var(--color-fifth), var(--color-secondary))" }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo/Brand */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-center gap-3 mb-8"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                  boxShadow: "0 8px 24px rgba(124, 58, 237, 0.3)",
                }}
              >
                <Music className="w-7 h-7 text-white" />
              </div>
              <span
                className="text-5xl tracking-tight"
                style={{
                  background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                AuraVibes
              </span>
            </motion.div>

            {/* Hero Text */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-6xl md:text-7xl mb-6"
              style={{ color: "var(--neo-text)" }}
            >
              Curate Music
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Like a Pro
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl mb-12 max-w-2xl mx-auto"
              style={{ color: "var(--neo-muted)" }}
            >
              Create, collaborate, and share perfect song sets on Spotify. From study sessions to festival vibes, SetFlow makes music curation effortless.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-wrap items-center justify-center gap-4 mb-16">
              <button onClick={() => (window.location.href = "/dashboard")} className="group relative px-8 py-4 rounded-2xl text-white overflow-hidden" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", boxShadow: "0 8px 24px rgba(124, 58, 237, 0.3)" }}>
                <span className="relative z-10 flex items-center gap-2">
                  Start Creating
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </span>
              </button>

              <button className="px-8 py-4 rounded-2xl backdrop-blur-md border border-white/20 transition-all hover:border-white/40" style={{ background: "rgba(255, 255, 255, 0.6)", color: "var(--neo-text)", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)" }}>
                Watch Demo
              </button>
            </motion.div>

            {/* Glassmorphic Feature Cards */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto"
            >
              {[
                { icon: Users, text: "Collaborative Sets", color: "var(--color-primary)" },
                { icon: Sparkles, text: "AI Suggestions", color: "var(--color-secondary)" },
                { icon: Radio, text: "Live Sessions", color: "var(--color-fifth)" },
              ].map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={idx}
                    className="px-6 py-5 rounded-2xl backdrop-blur-md border border-white/20 hover:border-white/40 transition-all cursor-pointer"
                    style={{
                      background: "rgba(255, 255, 255, 0.5)",
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: feature.color, opacity: 0.12 }}
                      >
                        <Icon className="w-6 h-6" style={{ color: feature.color }} />
                      </div>
                      <div>
                        <div className="text-lg font-semibold" style={{ color: "var(--neo-text)" }}>
                          <Icon className="inline w-4 h-4 mr-2 align-middle" style={{ color: feature.color }} />
                          {feature.text}
                        </div>
                        <p className="text-sm text-[var(--neo-muted)] mt-1">Brief description to explain the feature and benefit to users.</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl mb-4" style={{ color: "var(--neo-text)" }}>
              Everything You Need
            </h2>
            <p className="text-xl" style={{ color: "var(--neo-muted)" }}>
              Powerful features designed for music lovers
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Heart, title: "Favorites", description: "Save and organize your most-loved sets", color: "var(--color-primary)" },
              { icon: TrendingUp, title: "Popular Sets", description: "Discover trending playlists from the community", color: "var(--color-secondary)" },
              { icon: Zap, title: "Real-Time Sync", description: "Instant updates across all your devices", color: "var(--color-fifth)" },
              { icon: Shuffle, title: "Smart Tags", description: "Advanced organization with custom tags", color: "var(--color-primary)" },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="group p-6 rounded-3xl backdrop-blur-md border border-white/20 hover:border-white/40 transition-all cursor-pointer"
                  style={{ background: "rgba(255, 255, 255, 0.5)", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)" }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: feature.color, opacity: 0.12 }}>
                      <Icon className="w-6 h-6" style={{ color: feature.color }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold" style={{ color: "var(--neo-text)" }}>
                        <Icon className="inline w-4 h-4 mr-2 align-middle" style={{ color: feature.color }} />
                        {feature.title}
                      </h3>
                      <p className="text-sm mt-1" style={{ color: "var(--neo-muted)" }}>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="p-12 rounded-3xl backdrop-blur-md border border-white/20" style={{ background: "linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(34, 211, 238, 0.1))", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)" }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              {[{ value: "50K+", label: "Active Users" }, { value: "2M+", label: "Sets Created" }, { value: "15M+", label: "Songs Curated" }].map((stat, idx) => (
                <div key={idx}>
                  <div className="text-5xl mb-2" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    {stat.value}
                  </div>
                  <div className="text-lg" style={{ color: "var(--neo-muted)" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center p-16 rounded-3xl relative overflow-hidden" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", boxShadow: "0 16px 48px rgba(124, 58, 237, 0.3)" }}>
            {/* Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl mb-6 text-white">Ready to Transform Your Music Experience?</h2>
              <p className="text-xl mb-8 text-white/90">Join thousands of music lovers creating the perfect sets</p>
              <button className="px-10 py-5 rounded-2xl text-lg transition-all hover:scale-105" style={{ background: "white", color: "var(--color-primary)", boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)" }}>
                Get Started for Free
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
