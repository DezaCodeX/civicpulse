import React from 'react'

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-white rounded-lg p-8 shadow-lg hover-lift">
      <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg mb-6">
        <Icon className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

export default FeatureCard
