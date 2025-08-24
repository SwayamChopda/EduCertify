module 0x2c0339b13c805b62a62fe6b2fccbc0d5d11b902d2245148351515659d5e7ffaa::educertify {

    use std::signer;
    use std::string::{String};
    use std::vector;
    use std::error;
    use std::timestamp;

    // --- Structs ---
    struct Certificate has store, copy, drop {
        id: u64,
        student_address: address,
        course_name: String,
        issuer_name: String,
        issuance_date: u64,
        certificate_url: String,
        issuer_address: address,
        is_revoked: bool,
    }

    struct IssuerCapability has key {}
    struct CertificateStore has key {
        certificates: vector<Certificate>,
    }

    struct RequestStatus has copy, drop, store {
        is_pending: bool,
        is_approved: bool,
        is_rejected: bool,
    }

    struct CertificateRequest has copy, drop, store {
        request_id: u64,
        student_address: address,
        course_name: String,
        student_details: String,
        status: RequestStatus,
    }

    struct RequestLedger has key {
        requests: vector<CertificateRequest>,
        next_request_id: u64,
    }

    // --- Error Codes ---
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_CERTIFICATE_NOT_FOUND: u64 = 2;
    const E_REQUEST_NOT_FOUND: u64 = 3;
    const E_REQUEST_NOT_PENDING: u64 = 4;

    // --- Functions ---
    public entry fun initialize_issuer(deployer: &signer) {
        move_to(deployer, IssuerCapability {});
        move_to(deployer, RequestLedger {
            requests: vector::empty<CertificateRequest>(),
            next_request_id: 0,
        });
    }

    public entry fun initialize_certificate_store(student: &signer) {
        move_to(student, CertificateStore {
            certificates: vector::empty<Certificate>(),
        });
    }

    public entry fun request_certificate(
        student: &signer,
        course_name: String,
        student_details: String
    ) acquires RequestLedger {
        let student_addr = signer::address_of(student);
        let issuer_addr = @0x2c0339b13c805b62a62fe6b2fccbc0d5d11b902d2245148351515659d5e7ffaa;
        
        let ledger = borrow_global_mut<RequestLedger>(issuer_addr);

        let new_request = CertificateRequest {
            request_id: ledger.next_request_id,
            student_address: student_addr,
            course_name,
            student_details,
            status: RequestStatus { is_pending: true, is_approved: false, is_rejected: false },
        };
        
        vector::push_back(&mut ledger.requests, new_request);
        ledger.next_request_id = ledger.next_request_id + 1;
    }

    public entry fun approve_request_and_issue(
        issuer: &signer,
        request_id: u64,
        issuer_name: String,
        certificate_url: String
    ) acquires RequestLedger, CertificateStore {
        let issuer_addr = signer::address_of(issuer);
        assert!(exists<IssuerCapability>(issuer_addr), error::permission_denied(E_NOT_AUTHORIZED));

        let ledger = borrow_global_mut<RequestLedger>(issuer_addr);
        
        let req = find_request_mut(ledger, request_id);
        assert!(req.status.is_pending, error::invalid_state(E_REQUEST_NOT_PENDING));
        
        req.status.is_pending = false;
        req.status.is_approved = true;

        issue_certificate(
            issuer,
            req.student_address,
            req.course_name,
            issuer_name,
            timestamp::now_seconds(),
            certificate_url
        );
    }
    
    public entry fun reject_request(issuer: &signer, request_id: u64) acquires RequestLedger {
        let issuer_addr = signer::address_of(issuer);
        assert!(exists<IssuerCapability>(issuer_addr), error::permission_denied(E_NOT_AUTHORIZED));
        let ledger = borrow_global_mut<RequestLedger>(issuer_addr);

        let req = find_request_mut(ledger, request_id);
        assert!(req.status.is_pending, error::invalid_state(E_REQUEST_NOT_PENDING));
        
        req.status.is_pending = false;
        req.status.is_rejected = true;
    }
    
    // This function is no longer an `entry` function, it's called by other functions
    public fun issue_certificate(
        issuer: &signer, student_address: address, course_name: String, issuer_name: String, issuance_date: u64, certificate_url: String,
    ) acquires CertificateStore {
        let issuer_addr = signer::address_of(issuer);
        assert!(exists<CertificateStore>(student_address), error::not_found(E_CERTIFICATE_NOT_FOUND));

        let student_store = borrow_global_mut<CertificateStore>(student_address);
        let new_id = vector::length(&student_store.certificates);

        let new_cert = Certificate {
            id: new_id,
            student_address,
            course_name,
            issuer_name,
            issuance_date,
            certificate_url,
            issuer_address: issuer_addr,
            is_revoked: false,
        };
        vector::push_back(&mut student_store.certificates, new_cert);
    }

    public entry fun revoke_certificate(issuer: &signer, student_address: address, certificate_id: u64) acquires CertificateStore {
        let issuer_addr = signer::address_of(issuer);
        assert!(exists<IssuerCapability>(issuer_addr), error::permission_denied(E_NOT_AUTHORIZED));
        assert!(exists<CertificateStore>(student_address), error::not_found(E_CERTIFICATE_NOT_FOUND));
        
        let student_store = borrow_global_mut<CertificateStore>(student_address);
        
        let i = 0;
        let found = false;
        let len = vector::length(&student_store.certificates);
        while (i < len) {
            let cert = vector::borrow_mut(&mut student_store.certificates, i);
            if (cert.id == certificate_id) {
                assert!(cert.issuer_address == issuer_addr, error::permission_denied(E_NOT_AUTHORIZED));
                cert.is_revoked = true;
                found = true;
                break
            };
            i = i + 1;
        };
        assert!(found, error::not_found(E_CERTIFICATE_NOT_FOUND));
    }
    
    fun find_request_mut(ledger: &mut RequestLedger, request_id: u64): &mut CertificateRequest {
        let i = 0;
        let len = vector::length(&ledger.requests);
        while (i < len) {
            let req = vector::borrow(&ledger.requests, i);
            if (req.request_id == request_id) {
                return vector::borrow_mut(&mut ledger.requests, i)
            };
            i = i + 1;
        };
        abort error::not_found(E_REQUEST_NOT_FOUND)
    }

    // --- View Functions ---
    #[view]
    public fun get_certificates(owner: address): vector<Certificate> acquires CertificateStore {
        if (exists<CertificateStore>(owner)) {
            *&borrow_global<CertificateStore>(owner).certificates
        } else {
            vector::empty<Certificate>()
        }
    }

    #[view]
    public fun get_all_requests(issuer_addr: address): vector<CertificateRequest> acquires RequestLedger {
        assert!(exists<RequestLedger>(issuer_addr), error::not_found(E_REQUEST_NOT_FOUND));
        let ledger = borrow_global<RequestLedger>(issuer_addr);
        *&ledger.requests
    }
}