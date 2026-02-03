"""
Department constants for complaint classification.
These are the fixed labels used for AI model training and prediction.
"""

DEPARTMENTS = [
    "Water",
    "Electricity",
    "Roads",
    "Sanitation",
    "Health",
    "Public Safety",
    "Education",
    "Other"
]

DEPARTMENT_KEYWORDS = {
    "Water": ["water", "pipe", "leak", "supply", "sewage", "drainage", "tap", "well", "tanker", "purification"],
    "Electricity": ["electricity", "power", "light", "pole", "blackout", "wire", "voltage", "meter", "transformer"],
    "Roads": ["road", "pothole", "pavement", "street", "traffic", "highway", "lane", "asphalt", "damaged", "manhole"],
    "Sanitation": ["garbage", "waste", "cleaning", "dustbin", "hygiene", "litter", "sweeping", "trash"],
    "Health": ["hospital", "clinic", "health", "medical", "doctor", "nurse", "patient", "medicine", "disease"],
    "Public Safety": ["police", "crime", "security", "safety", "accident", "theft", "robbery", "assault"],
    "Education": ["school", "college", "university", "education", "student", "teacher", "exam", "classroom"],
}
