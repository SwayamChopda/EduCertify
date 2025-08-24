

---

# 🌱 EduCertify – Blockchain Academic Certificates & Skills Passport

## 📌 Overview

EduCertify is a blockchain-based platform designed to **issue, verify, and store academic certificates and skills credentials** on the **Aptos blockchain**. It eliminates the risk of **forgery, loss, and lengthy verification processes** by providing a **transparent, tamper-proof, and verifiable credentialing system**.

---

## 🛠️ Features

* ✅ **On-chain Certificates** – Academic certificates are minted as digital assets on Aptos.
* ✅ **Fraud Prevention** – Tamper-proof verification with blockchain immutability.
* ✅ **Easy Verification** – Employers/Institutions can scan & verify instantly.
* ✅ **User Roles** – Teacher (Issuer) & Student (Receiver).
* ✅ **Web Interface** – Simple UI for issuing & validating certificates.
* ✅ **Scalable Design** – Future expansion to multiple institutions, badges, skills passports.

---

## 🚀 Tech Stack

* **Blockchain:** Aptos (Move language smart contracts)
* **Frontend:** React + TailwindCSS + QR Code integration
* **Backend:** Node.js / Express (optional APIs for metadata handling)
* **Wallet:** Aptos Wallet / Petra for transactions

---

## 📂 Project Structure

```
EduCertify/
│── backend/          # Backend services (if any, e.g., metadata, APIs)
│── frontend/         # React UI for issuing & verifying certificates
│── move/             # Smart contracts in Move language
│── docs/             # Screenshots, demo images, documentation
│── README.md         # Project documentation
```

---

## 📸 Screenshots

(Add images in `/docs/screenshots/` folder and update links)

* 🎓 **Certificate Issuance**
  ![Issuance Screen](docs/screenshots/issue-cert.png)

* 🔍 **Verification**
  ![Verification Screen](docs/screenshots/verify-cert.png)

---

## 📜 Smart Contract

* **Contract Address:** `0x2c0339b13c805b62a62fe6b2fccbc0d5d11b902d2245148351515659d5e7ffaa`
* **Deployed on:** Aptos Testnet

---

## 🏗️ Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/SwayamChopda/EduCertify.git
cd EduCertify
```

### 2️⃣ Install Dependencies

* **Frontend**

```bash
cd frontend
npm install
npm start
```

* **Backend (if required)**

```bash
cd backend
npm install
npm start
```

### 3️⃣ Deploy Smart Contract

```bash
cd move
aptos move compile --named-addresses teacher=0xYourTeacherAddress
aptos move publish --named-addresses teacher=0xYourTeacherAddress
```

---

## 🎯 Problem Statement

Traditional academic certificates are vulnerable to **fraud, loss, and inefficiency in verification**. Employers and institutions face delays in validating credentials, while students often lack a secure and universally accepted system to showcase achievements.

---

## 💡 Our Solution

EduCertify provides a **tamper-proof, blockchain-powered certificate system** where:

* Institutions **issue certificates** directly on-chain.
* Students **store and share certificates** as digital assets.
* Employers can **instantly verify authenticity** without intermediaries.

---

## 🔮 Future Scope

* 🌍 Multi-institution & government adoption.
* 🎖️ Skill badges and micro-certifications.
* 📱 Mobile app integration.
* 🔗 Cross-chain verification across education systems.
* 🤖 AI-based fraud detection & advanced analytics.

---

## 📜 License

This project is licensed under the **MIT License**.

---

✨ *EduCertify redefines trust in education credentials with blockchain transparency.*

---


