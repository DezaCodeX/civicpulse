import React from 'react'

function StatCard({ value, label, color }) {
  const colorClasses = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
  }

  return (
    <div className="bg-gray-800 p-8 rounded-lg text-center">
      <h3 className={`text-5xl font-bold ${colorClasses[color]}`}>{value}</h3>
      <p className="text-gray-400 mt-2">{label}</p>
    </div>
  )
}

export default StatCard