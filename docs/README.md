# 🚑 LyfeLens – AI + AR Powered Emergency Response System

## 📌 Overview

**LyfeLens** is an intelligent emergency response system that uses **Machine Learning (MoveNet)** and **Augmented Reality (AR)** to assist users during critical situations such as injuries, burns, bleeding, and cardiac arrest.

The app acts as a **real-time life-saving assistant**, guiding users step-by-step with **AI-based detection** and **AR-powered instructions**.

---

## 🧠 Core Idea

In emergencies, people often panic and don’t know what to do.

👉 **LyfeLens solves this by:**

* Detecting injury types using AI
* Providing **instant AR-based first aid guidance**
* Helping users quickly connect to nearby medical support

---

## ✨ Features

### 🔍 Smart Injury Scanner (AI)

Detects different types of injuries using camera input:

* 🩸 Bleeding
* 🔥 Burns (1st, 2nd, 3rd degree)
* ✂️ Cuts / wounds
* ❤️ CPR situations

⚙️ Powered by **MoveNet (pose detection + ML inference)**

---

### 🧑‍⚕️ AR-Based CPR Guidance

* Real-time CPR instructions using **Augmented Reality**
* Visual guidance for:

  * Hand placement
  * Compression rhythm
  * Body posture

🧩 Integrated using **Grok API**

---

### 📍 Emergency Dashboard

* 🏥 **Nearby Hospitals**

  * Click → redirects to **Google Maps**
* 🚑 Emergency Contacts:

  * Ambulance
  * Rescue services
  * NHAI Helpline

---

### 🦸 Heroes Section (Community)

* Users can:

  * 💬 Leave feedback
  * 🌟 View others’ feedback
* Builds a **community-driven safety platform**

---

## 🏗️ System Architecture

```
          ┌──────────────────────┐
          │   Mobile App (UI)    │
          │ React Native (Expo)  │
          └─────────┬────────────┘
                    │
        ┌───────────▼────────────┐
        │  Backend API Server    │
        │   (Node.js / Express)  │
        └───────────┬────────────┘
                    │
     ┌──────────────▼──────────────┐
     │   ML Inference Engine       │
     │  (MoveNet + CV Models)      │
     └──────────────┬──────────────┘
                    │
        ┌───────────▼────────────┐
        │   AR Engine (Grok API) │
        │ Real-time guidance     │
        └────────────────────────┘
```

---

## 📁 Project Structure

```
LyfeLens/
│
├── backend/
│   ├── lyfelens-mobile/           # 📱 Mobile App (Frontend)
│   │   ├── .vscode/
│   │   ├── app/                   # Screens & navigation
│   │   ├── assets/images/         # Images
│   │   ├── components/            # Reusable UI components
│   │   ├── constants/             # Config & constants
│   │   ├── hooks/                 # Custom hooks
│   │   ├── scripts/               # Utility scripts
│   │   ├── src/                   # Core logic
│   │   ├── app.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── lyfeLens-backend/          # ⚙️ Backend Server
│   │   ├── routes/                # API routes
│   │   ├── controllers/           # Business logic
│   │   ├── services/              # ML & API services
│   │   └── server.js              # Entry point
│
├── docs/                          # Documentation
├── .gitignore
├── README.md
```

---

## ⚙️ Tech Stack

### 📱 Frontend

* React Native (Expo)
* TypeScript / JavaScript

### ⚙️ Backend

* Node.js
* Express.js

### 🤖 Machine Learning

* MoveNet (Pose Detection)
* Computer Vision Models

### 🧩 Augmented Reality

* Grok API

### 🌐 APIs & Services

* Google Maps API

---

## 🔄 Workflow

1. 📷 User scans injury using camera
2. 🤖 ML model detects condition
3. 🧠 System classifies injury type
4. 🕶️ AR provides real-time guidance
5. 📍 Dashboard shows nearby hospitals
6. 📞 Emergency contacts available instantly

---

## 🚀 Getting Started

### 1️⃣ Clone Repository

```bash
git clone https://github.com/Pranav-player/LyfeLens.git
cd LyfeLens
```

---

### 2️⃣ Run Frontend

```bash
cd backend/lyfelens-mobile
npm install
npx expo start
```

---

### 3️⃣ Run Backend

```bash
cd ../lyfeLens-backend
npm install
node server.js
```

---

## 📊 Use Cases

* 🚑 Road accident assistance
* 🏠 Home emergency response
* 🛣️ Highway safety (NHAI integration)
* 🏥 First aid guidance

---

## 🔮 Future Scope

* 🎥 Real-time video analysis
* ☁️ Cloud deployment (AWS/GCP)
* 🗣️ Voice-guided assistance
* 📊 Admin dashboard
* 🤝 Integration with hospitals & emergency systems

---

## 👨‍💻 Contributors

* Pranav Bhatia
* Soumadip Patra
* Sahil Mishra
* Rohanish Raman

---

## ⚠️ Disclaimer

This application provides AI-based guidance and should not replace professional medical assistance. Always contact emergency services immediately in critical situations.

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!

---

