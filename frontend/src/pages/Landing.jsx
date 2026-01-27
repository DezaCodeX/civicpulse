import React from 'react'
import { Link } from 'react-router-dom'
import { Zap, BarChart3, TrendingUp } from 'lucide-react'
import FeatureCard from '../components/FeatureCard'
import StatCard from '../components/StatCard'
import StepCard from '../components/StepCard'

function Landing({ isLoggedIn }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="hero-section h-screen flex items-center justify-center text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 opacity-75"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 fade-in">
          <div className="mb-8 flex items-center justify-center space-x-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-gray-900 font-bold">
              CP
            </div>
            <span className="text-2xl font-bold">CivicPulse</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            Transform Public <span className="text-blue-400">Complaints into Action</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto">
            Intelligent analytics platform that detects patterns, predicts trends, and accelerates resolution
            of citizen complaints through advanced NLP and machine learning.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login" className="btn-primary text-lg">
              Get Started →
            </Link>
            <Link to="/login" className="btn-secondary text-lg">
              Login as Admin
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powered by Intelligence</h2>
            <p className="text-xl text-gray-600">Advanced NLP and machine learning for actionable insights</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Zap}
              title="NLP Pattern Detection"
              description="Automatically identify recurring issues through keyword frequency analysis and intelligent text clustering using TF-IDF and K-Means algorithms."
            />
            <FeatureCard
              icon={BarChart3}
              title="Real-Time Analytics"
              description="Comprehensive dashboards with category distribution, location heatmaps, and temporal trend analysis for data-driven decision making."
            />
            <FeatureCard
              icon={TrendingUp}
              title="Trend Prediction"
              description="Detect emerging issues before they escalate with predictive analytics and early warning systems based on historical complaint data."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">How It Works</h2>
          <p className="text-center text-gray-600 text-lg mb-16">Simple process, powerful results</p>
          <div className="grid md:grid-cols-3 gap-12">
            <StepCard
              number={1}
              title="Submit Complaints"
              description="Citizens submit complaints with category, description, and location through an intuitive interface."
            />
            <StepCard
              number={2}
              title="AI Analysis"
              description="NLP algorithms process text, extract keywords, cluster similar issues, and identify patterns automatically."
            />
            <StepCard
              number={3}
              title="Take Action"
              description="Authorities view insights on dashboards, prioritize issues, and track resolution progress in real-time."
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            <StatCard value="95%" label="Pattern Detection Accuracy" color="blue" />
            <StatCard value="3x" label="Faster Resolution Time" color="green" />
            <StatCard value="10k+" label="Complaints Analyzed" color="orange" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Public Feedback?</h2>
          <p className="text-xl text-blue-100 mb-10">
            Join thousands of citizens and administrators using CivicPulse to make their communities better.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/submit-complaint"
              className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Submit a Complaint
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-4 flex items-center justify-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              CP
            </div>
            <span className="font-bold text-lg text-white">CivicPulse</span>
          </div>
          <p>© 2025 CivicPulse. Empowering governments with intelligent analytics.</p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
