import React from 'react'

function StepCard({ number, title, description }) {
  const colorClasses = ['bg-blue-500', 'bg-green-600', 'bg-orange-500']

  return (
    <div className="text-center">
      <div className={`w-20 h-20 ${colorClasses[number - 1]} rounded-full flex items-center justify-center mx-auto mb-6`}>
        <span className="text-white text-4xl font-bold">{number}</span>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

export default StepCard
