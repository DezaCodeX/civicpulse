import React from 'react'

function StatCard({ value, label, color = 'blue' }) {
  const colorClasses = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
  }

  return (
    <div className="text-center">
      <div className={`text-5xl font-bold ${colorClasses[color]} mb-2`}>
        {value}
      </div>
      <p className="text-gray-400 text-lg">{label}</p>
    </div>
  )
}

export default StatCard
