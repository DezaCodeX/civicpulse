import React from 'react'
import { motion } from 'framer-motion'

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <motion.div
      className="bg-white p-8 rounded-lg shadow-lg text-center hover-lift"
      whileHover={{ scale: 1.05 }}
    >
      <div className="flex justify-center items-center mb-6">
        <div className="bg-blue-100 p-4 rounded-full">
          <Icon className="w-8 h-8 text-blue-600" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  )
}

export default FeatureCard