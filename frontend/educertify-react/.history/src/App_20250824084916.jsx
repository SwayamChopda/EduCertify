import { useState, useCallback } from 'react';
import QRCode from 'react-qr-code';
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import particlesConfig from './particles-config';
import './style.css'; 
import toast, { Toaster } from 'react-hot-toast';
import CertificateModal from './components/CertificateModal';
import Confetti from 'react-confetti';

const MODULE_ADDRESS = "0x929f4f9a78a2c787fb206567c9dcb01dad770f0f4cdc2f599b71a85547427c52"; 
const NODE_URL = "https://fullnode.testnet.aptoslabs.com/v1";

function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [issueFormData, setIssueFormData] = useState({ studentAddress: '', courseName: '', issuerName: '', certUrl: '' });
  const [revokeFormData, setRevokeFormData] = useState({ studentAddress: '', certId: '' });

  const particlesInit = useCallback(async (engine) => { await loadSlim(engine); }, []);

  const handleConnect = async () => {
    const client = window.aptos;
    if (!client) return toast.error("Petra Wallet not found.");
    try {
      const response = await client.connect();
      setWalletAddress(response.address);
      toast.success("Wallet connected!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to connect wallet.");
    }
  };
  
  const runTransaction = async (payload) => {
    setIsLoading(true);
    const client = window.aptos;
    if (!client || !walletAddress) {
      toast.error("Please connect wallet first.");
      setIsLoading(false);
      throw new Error("Wallet not connected");
    }
    try {
      const tx = await client.signAndSubmitTransaction({ payload });
      return tx.hash;
    } finally {
      setIsLoading(false);
    }
  };

  const executeAction = async (actionPromise, messages) => {
    let txHash = null;
    try {
        txHash = await toast.promise(actionPromise, {
            loading: messages.loading,
            success: (result) => messages.success,
            error: (err) => messages.error || `Error: ${err.message}`,
        });

        if (txHash) {
            toast.success(
                <span>
                    {messages.success}
                    <a href={`https://explorer.aptoslabs.com/txn/${txHash}?network=testnet`} target="_blank" rel="noopener noreferrer" style={{color: '#3498db', fontWeight: 'bold', marginLeft: '10px'}}>
                        View Tx
                    </a>
                </span>, { duration: 6000 }
            );
        }
        return txHash; // Return the hash for further actions
    } catch (error) {
        console.error("Action executed with an error", error);
        return null; // Ensure null is returned on error
    }
  };
  
  const handleInitializeIssuer = async () => {
    const promise = runTransaction({ function: `${MODULE_ADDRESS}::educertify::initialize_issuer`, type_arguments: [], arguments: [] });
    executeAction(promise, { loading: "Initializing issuer...", success: "Issuer account initialized!", error: "Failed to initialize." });
  };
  
  const handleInitializeStudentStore = async () => {
    const promise = runTransaction({ function: `${MODULE_ADDRESS}::educertify::initialize_certificate_store`, type_arguments: [], arguments: [] });
    executeAction(promise, { loading: "Initializing store...", success: "Certificate store initialized!", error: "Failed to initialize store." });
  };
  
  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    const { studentAddress, courseName, issuerName, certUrl } = issueFormData;
    if (!studentAddress || !courseName || !issuerName || !certUrl) return toast.error("Please fill in all fields.");
    const promise = runTransaction({
      function: `${MODULE_ADDRESS}::educertify::issue_certificate`,
      type_arguments: [],
      arguments: [studentAddress, courseName, issuerName, Math.floor(Date.now() / 1000).toString(), certUrl],
    });
    
    const txHash = await executeAction(promise, { loading: "Issuing certificate...", success: "Certificate issued!", error: "Failed to issue certificate." });
    
    if (txHash) {
      setShowConfetti(true);
    }
    
    setIssueFormData({ studentAddress: '', courseName: '', issuerName: '', certUrl: '' });
  };

  const handleRevokeCertificate = async (e) => {
    e.preventDefault();
    const { studentAddress, certId } = revokeFormData;
    if (!studentAddress || !certId) return toast.error("Please fill in all fields.");
    const promise = runTransaction({
      function: `${MODULE_ADDRESS}::educertify::revoke_certificate`,
      type_arguments: [], arguments: [studentAddress, certId],
    });
    await executeAction(promise, { loading: "Revoking certificate...", success: "Certificate revoked!", error: "Failed to revoke certificate." });
    setRevokeFormData({ studentAddress: '', certId: '' });
  };

  const handleViewCertificates = async () => {
    if (!walletAddress) return toast.error("Please connect your wallet first.");
    const toastId = toast.loading("Fetching certificates...");
    try {
      const response = await fetch(`${NODE_URL}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ function: `${MODULE_ADDRESS}::educertify::get_certificates`, type_arguments: [], arguments: [walletAddress] }),
      });
      if (!response.ok) throw new Error("Could not fetch certificates. Account may not be initialized.");
      const data = await response.json();
      setCertificates(data[0] || []);
      toast.success("Certificates loaded.", { id: toastId });
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: toastId });
      console.error(error);
    }
  };
  
  const handleShareToTwitter = () => { const certCount = certificates.length; const text = `I just updated my Skills Passport on EduCertify with ${certCount} verifiable credential${certCount > 1 ? 's' : ''} on @Aptos!`; const url = `https://explorer.aptoslabs.com/account/${walletAddress}?network=testnet`; const hashtags = 'EduCertify,Aptos'; const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${hashtags}`; window.open(twitterUrl, '_blank'); };
  const handleShareToLinkedIn = () => { const url = `https://explorer.aptoslabs.com/account/${walletAddress}?network=testnet`; const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`; window.open(linkedInUrl, '_blank'); };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} toastOptions={{duration: 6000}} />
      {showConfetti && <Confetti recycle={false} onConfettiComplete={() => setShowConfetti(false)} />}
      <Particles id="tsparticles" init={particlesInit} options={particlesConfig} />
      <div className="container">
        <header>
          <h1>🌱 EduCertify</h1>
          <p>Verifiable Academic Certificates on the Aptos Blockchain</p>
          <button id="connectBtn" onClick={handleConnect}>{walletAddress ? `Connected: ${walletAddress.slice(0, 6)}...` : 'Connect Wallet'}</button>
          {walletAddress && <p id="walletAddress">{walletAddress}</p>}
        </header>
        <main>
          <section className="card" id="issuer-section">
            <h2>For Issuers (Teachers)</h2>
            <button onClick={handleInitializeIssuer} disabled={isLoading}>{isLoading ? 'Processing...' : 'Initialize Issuer Account'}</button>
            <hr />
            <h3>Issue a New Certificate</h3>
            <form onSubmit={handleIssueCertificate}>
              <label htmlFor="studentAddress">Student's Wallet Address</label>
              <input id="studentAddress" name="studentAddress" type="text" value={issueFormData.studentAddress} onChange={(e) => setIssueFormData({...issueFormData, studentAddress: e.target.value})} placeholder="0x..."/>
              <label htmlFor="courseName">Course Name</label>
              <input id="courseName" name="courseName" type="text" value={issueFormData.courseName} onChange={(e) => setIssueFormData({...issueFormData, courseName: e.target.value})} placeholder="e.g., Intro to Move"/>
              <label htmlFor="issuerName">Issuer Name</label>
              <input id="issuerName" name="issuerName" type="text" value={issueFormData.issuerName} onChange={(e) => setIssueFormData({...issueFormData, issuerName: e.target.value})} placeholder="e.g., Prof. Smith"/>
              <label htmlFor="certUrl">Certificate Image URL</label>
              <input id="certUrl" name="certUrl" type="text" value={issueFormData.certUrl} onChange={(e) => setIssueFormData({...issueFormData, certUrl: e.target.value})} placeholder="https://..."/>
              <button type="submit" disabled={isLoading}>{isLoading ? 'Issuing...' : 'Issue Certificate'}</button>
            </form>
            <hr />
            <h3>Revoke a Certificate</h3>
            <form onSubmit={handleRevokeCertificate}>
              <label htmlFor="revokeStudentAddress">Student's Wallet Address</label>
              <input id="revokeStudentAddress" name="revokeStudentAddress" type="text" value={revokeFormData.studentAddress} onChange={(e) => setRevokeFormData({...revokeFormData, studentAddress: e.target.value})} placeholder="0x..."/>
              <label htmlFor="revokeCertId">Certificate ID</label>
              <input id="revokeCertId" name="revokeCertId" type="text" value={revokeFormData.certId} onChange={(e) => setRevokeFormData({...revokeFormData, certId: e.target.value})} placeholder="e.g., 0, 1, 2..."/>
              <button type="submit" className="danger" disabled={isLoading}>{isLoading ? 'Revoking...' : 'Revoke Certificate'}</button>
            </form>
          </section>
          <section className="card" id="student-section">
            <h2>For Students - My Skills Passport</h2>
            <button onClick={handleInitializeStudentStore} disabled={isLoading}>{isLoading ? 'Processing...' : 'Initialize Certificate Store'}</button>
            <hr />
            <button onClick={handleViewCertificates}>View My Certificates</button>
            {certificates.length > 0 && (
              <>
                <button onClick={handleShareToTwitter} className="twitter-btn">Share on Twitter</button>
                <button onClick={handleShareToLinkedIn} className="linkedin-btn">Share on LinkedIn</button>
              </>
            )}
            <div id="certificate-list">
              {certificates.map((cert) => (
                <div key={cert.id} className={`certificate ${cert.is_revoked ? 'revoked' : ''}`} onClick={() => setSelectedCert(cert)}>
                  <div className="qrcode"><QRCode value={`https://explorer.aptoslabs.com/account/${cert.student_address}?network=testnet`} size={128} /></div>
                  <p><strong>ID:</strong> {cert.id}</p>
                  <p><strong>Course:</strong> {cert.course_name}</p>
                  <p><strong>Issuer:</strong> {cert.issuer_name}</p>
                  <p><strong>Date:</strong> {new Date(parseInt(cert.issuance_date) * 1000).toLocaleDateString()}</p>
                  <p><a href={cert.certificate_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>View Image</a></p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
      {selectedCert && <CertificateModal cert={selectedCert} onClose={() => setSelectedCert(null)} />}
    </>
  );
}

export default App;