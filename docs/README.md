# 🚑 LyfeLens – AI + AR Powered Emergency Response System

## 📌 Overview
LyfeLens is an intelligent emergency-response platform that combines Machine Learning and Augmented Reality to support users during high-stress medical situations such as burns, bleeding, fractures, seizures, and CPR scenarios.

It works like a real-time first-aid assistant:
- Detects possible emergency context from live camera input
- Guides users with clear, step-by-step visual instructions
- Helps users quickly access nearby hospitals and emergency contacts

## 🧠 Core Idea
In emergencies, panic often delays the right action.  
LyfeLens is designed to reduce that delay by turning a smartphone into a guided response tool.

LyfeLens helps by:
- Identifying likely injury situations with AI
- Showing immediate AR-style first-aid guidance
- Connecting users to local medical help faster

## ✨ Features

### 🔍 Smart Injury Scanner (AI)
Camera-assisted detection and classification for emergency contexts, including:
- Bleeding
- Burns
- Wounds and trauma-related scenarios
- CPR support situations

Powered by pose and inference pipelines (including MoveNet-based processing).

### 🧑‍⚕️ AR-Guided First Aid and CPR
Real-time visual guidance to help users perform actions correctly, such as:
- Hand positioning
- Compression rhythm
- Body posture and safety checks

Includes AI-assisted guidance services for contextual instructions.

### 📍 Emergency Dashboard
- Nearby hospitals with map redirection
- One-tap access to emergency numbers and rescue contacts
- Fast navigation support during critical situations

### 🦸 Heroes Section (Community)
- User feedback sharing
- Community responses and experiences
- Encourages a collaborative safety-first ecosystem

## 🏗️ System Architecture
Mobile App (Expo React Native)  
↓  
Backend API Layer (Node.js / Express)  
↓  
ML Inference Pipeline (MoveNet + classification/processing modules)  
↓  
Real-time Guidance Layer (AR-style overlays + AI assistance services)

## 📁 Project Structure

LyfeLens/
│
├── LyfeLensMobile/                         # Root mobile workspace (high-level)
├── docs/                                   # Project documentation
│
├── backend/
│   └── lyfelens-mobile/                    # 📱 Mobile App (Frontend - React Native)
│       │
│       ├── app/                            # Screens & navigation (Expo Router)
│       ├── components/                     # Reusable UI components
│       ├── src/
│       │   ├── overlays/                   # AR overlays & emergency UI guides
│       │   └── services/                   # API calls & frontend integrations
│       │
│       ├── assets/
│       │   └── images/                     # Static image assets
│       │
│       └── lyfeLens-backend/               # ⚙️ Backend Server (Node.js)
│           │
│           ├── routes/                     # API route definitions
│           ├── services/                   # External integrations & business logic
│           ├── utils/                      # Helper functions & utilities
│           ├── data/                       # Static data & emergency scenarios
│           └── ml/                         # ML models, inference & training scripts
│
├── .gitignore
├── README.md
## ⚙️ Tech Stack

### 📱 Frontend
- React Native (Expo)
- TypeScript / JavaScript

### ⚙️ Backend
- Node.js
- Express.js

### 🤖 Machine Learning
- MoveNet (pose detection)
- Classification and smoothing pipeline
- ONNX-based inference components

### 🧩 Guidance Layer
- AR-style visual overlays
- AI service integrations for contextual assistance

### 🌐 APIs and Integrations
- Maps and location-based hospital lookup
- Emergency support integrations

## 🔄 Workflow
1. User scans the scene through the app camera.
2. ML pipeline processes posture/context signals.
3. System classifies the likely emergency scenario.
4. Overlay guidance appears with step-by-step actions.
5. Dashboard provides nearby hospital routing.
6. Emergency contact access is available instantly.

## 🚀 Getting Started

### 1. Clone Repository
git clone https://github.com/Pranav-player/LyfeLens.git  
cd LyfeLens

### 2. Run Frontend
cd backend/lyfelens-mobile  
npm install  
npx expo start

### 3. Run Backend
cd backend/lyfelens-mobile/lyfeLens-backend  
npm install  
node server.js

## 📊 Use Cases
- Roadside accident support
- Home emergency first response
- Highway and travel safety assistance
- First-aid training and rapid guidance

## 👨‍💻 Contributors
- Pranav Bhatia
- Soumadip Patra
- Sahil Mishra
- Rohanish Raman

## ⭐ Support
If this project helps you, consider starring the repository and sharing feedback.
