# Digital Agreement System - E-Signatures & PDF Generation

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Digital Signature Implementation](#digital-signature-implementation)
- [PDF Generation](#pdf-generation)
- [Agreement Workflow](#agreement-workflow)
- [API Endpoints](#api-endpoints)
- [Code Examples](#code-examples)
- [Security & Compliance](#security--compliance)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Overview

The Digital Agreement System provides a comprehensive solution for creating, signing, and managing legally-binding rental agreements with:

- **PDF Generation** for professional rental contracts
- **Digital Signatures** using cryptographic hashing
- **Agreement Templates** with dynamic data injection
- **E-signature Workflow** for both landlords and tenants
- **Document Storage** with secure file management
- **Audit Trail** for all agreement actions
- **Version Control** for agreement modifications
- **Email Notifications** for signature requests

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Agreement    │  │ PDF Preview  │  │ Signature    │      │
│  │ Form         │  │ Component    │  │ Canvas       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Agreement Service (Backend)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Agreement Controller                                │   │
│  │  - Create, Update, Sign, Download                    │   │
│  └────────────┬─────────────────────────────────────────┘   │
│               ▼                                             │
│  ┌──────────────────┐  ┌──────────────┐  ┌─────────────┐   │
│  │ PDF Generator    │  │ Signature    │  │ Email       │   │
│  │ (PDFKit)         │  │ Handler      │  │ Service     │   │
│  │ - Template       │  │ - Hash       │  │ - Notify    │   │
│  │ - Dynamic data   │  │ - Verify     │  │ - Remind    │   │
│  └──────────────────┘  └──────────────┘  └─────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Database & File Storage                     │
│  ┌──────────────────┐  ┌──────────────────────────────┐    │
│  │ PostgreSQL       │  │ File System / S3             │    │
│  │ - agreements     │  │ - PDF files                  │    │
│  │ - signatures     │  │ - Signature images           │    │
│  │ - audit_logs     │  │ - Supporting documents       │    │
│  └──────────────────┘  └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Agreement Lifecycle

```
┌─────────────┐
│   DRAFT     │ → Landlord creates agreement
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  PENDING    │ → Sent to tenant for signature
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   SIGNED    │ → Tenant signs, sent to landlord
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  EXECUTED   │ → Both parties signed
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   ACTIVE    │ → Agreement is in effect
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  EXPIRED    │ → End date reached
└─────────────┘
```

## Digital Signature Implementation

### Signature Methods

The system supports multiple signature methods:

1. **Cryptographic Hash Signature** (Primary)
   - Uses SHA-256 hashing
   - Combines user ID + timestamp + document hash
   - Verifiable and tamper-proof

2. **Canvas Signature** (Optional)
   - Hand-drawn signature on HTML5 canvas
   - Stored as base64-encoded PNG
   - Displayed on PDF document

3. **Click-to-Accept** (Simplified)
   - User confirms acceptance
   - IP address and timestamp logged
   - Suitable for simple agreements

### Digital Signature Process

```
┌──────────────────────────────────────────────────────────┐
│ Step 1: Generate Document Hash                          │
│   SHA-256(Agreement Content)                             │
│   → e.g., "a3f2bc1d..."                                  │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Step 2: Capture Signature Data                          │
│   - User ID: 123                                         │
│   - Timestamp: 2025-12-16T10:30:00Z                      │
│   - IP Address: 192.168.1.100                            │
│   - User Agent: Mozilla/5.0...                           │
│   - Canvas Signature (optional): base64 PNG              │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Step 3: Create Signature Hash                           │
│   SHA-256(user_id + timestamp + doc_hash)                │
│   → "b7e4cd2a..."                                        │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Step 4: Store in Database                               │
│   - agreement_id: 456                                    │
│   - user_id: 123                                         │
│   - signature_hash: "b7e4cd2a..."                        │
│   - signature_image: "data:image/png;base64,..."         │
│   - signed_at: 2025-12-16T10:30:00Z                      │
│   - ip_address: 192.168.1.100                            │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Step 5: Update Agreement Status                         │
│   - tenant_signed: true                                  │
│   - status: "signed" or "executed"                       │
└──────────────────────────────────────────────────────────┘
```

### Signature Verification

```javascript
// Verify signature integrity
const verifySignature = (agreement, signature) => {
  // Regenerate document hash
  const docHash = generateDocumentHash(agreement);
  
  // Regenerate signature hash
  const expectedHash = crypto
    .createHash('sha256')
    .update(`${signature.user_id}${signature.signed_at}${docHash}`)
    .digest('hex');
  
  // Compare hashes
  return signature.signature_hash === expectedHash;
};
```

## PDF Generation

### PDF Template Structure

```javascript
// Agreement PDF Layout
┌────────────────────────────────────────┐
│          RENTAL AGREEMENT              │ ← Header with logo
├────────────────────────────────────────┤
│ Agreement ID: #12345                   │
│ Date: December 16, 2025                │
├────────────────────────────────────────┤
│ PARTIES:                               │
│ Landlord: John Smith                   │
│ Tenant: Jane Doe                       │
├────────────────────────────────────────┤
│ PROPERTY:                              │
│ Address: 123 Main St, Apt 4B           │
│ Type: Apartment                        │
├────────────────────────────────────────┤
│ TERMS:                                 │
│ Start Date: Jan 1, 2026                │
│ End Date: Dec 31, 2026                 │
│ Monthly Rent: $1,500.00                │
│ Security Deposit: $1,500.00            │
├────────────────────────────────────────┤
│ TERMS & CONDITIONS:                    │
│ 1. Rent is due on the 1st...           │
│ 2. Tenant shall maintain...            │
│ ...                                    │
├────────────────────────────────────────┤
│ SIGNATURES:                            │
│                                        │
│ Landlord: [Signature]                  │
│ Date: Dec 15, 2025                     │
│                                        │
│ Tenant: [Signature]                    │
│ Date: Dec 16, 2025                     │
└────────────────────────────────────────┘
```

### PDF Generation Libraries

**Primary: PDFKit**
```javascript
const PDFDocument = require('pdfkit');
const fs = require('fs');

// Advantages:
// - Pure JavaScript
// - Server-side generation
// - Full control over layout
// - Supports images and custom fonts
```

**Alternative: Puppeteer (HTML to PDF)**
```javascript
const puppeteer = require('puppeteer');

// Advantages:
// - HTML/CSS based templates
// - Easy styling
// - Web-to-PDF conversion
```

## Agreement Workflow

### Complete Workflow Diagram

```
┌─────────┐                                    ┌─────────┐
│Landlord │                                    │ Tenant  │
└────┬────┘                                    └────┬────┘
     │                                              │
     │ 1. Create Agreement                         │
     ├────────────────────────────────────────────>│
     │    (Property, Terms, Dates)                 │
     │                                              │
     │ 2. Generate PDF Draft                       │
     │<────────────────────────────────────────────┤
     │                                              │
     │ 3. Review & Sign                            │
     │    (Landlord Signature)                     │
     ├─────────────────────────┐                   │
     │                         │                   │
     │<────────────────────────┘                   │
     │                                              │
     │ 4. Send to Tenant                           │
     │    (Email Notification)                     │
     ├─────────────────────────────────────────────>│
     │                                              │
     │                                              │ 5. Review Agreement
     │                                              ├──────────┐
     │                                              │          │
     │                                              │<─────────┘
     │                                              │
     │ 6. Tenant Signs                             │
     │<─────────────────────────────────────────────┤
     │    (Digital Signature)                      │
     │                                              │
     │ 7. Agreement Executed                       │
     │    (Email Confirmation to Both)             │
     │<────────────────────────────────────────────>│
     │                                              │
     │ 8. Download Final PDF                       │
     │<────────────────────────────────────────────>│
     │                                              │
```

## API Endpoints

### POST /api/agreements

Create a new rental agreement.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request:**
```json
{
  "property_id": 123,
  "tenant_id": 456,
  "start_date": "2026-01-01",
  "end_date": "2026-12-31",
  "rent_amount": 1500.00,
  "security_deposit": 1500.00,
  "terms": [
    "Rent is due on the 1st of each month",
    "Tenant is responsible for utilities",
    "No pets allowed"
  ],
  "additional_notes": "Parking space #12 included"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 789,
    "property_id": 123,
    "landlord_id": 101,
    "tenant_id": 456,
    "start_date": "2026-01-01",
    "end_date": "2026-12-31",
    "rent_amount": 1500.00,
    "status": "draft",
    "created_at": "2025-12-16T10:30:00Z"
  },
  "message": "Agreement created successfully"
}
```

---

### GET /api/agreements/:id

Get agreement details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 789,
    "property": {
      "id": 123,
      "title": "Modern Apartment",
      "address": "123 Main St, Apt 4B"
    },
    "landlord": {
      "id": 101,
      "name": "John Smith",
      "email": "john@example.com"
    },
    "tenant": {
      "id": 456,
      "name": "Jane Doe",
      "email": "jane@example.com"
    },
    "start_date": "2026-01-01",
    "end_date": "2026-12-31",
    "rent_amount": 1500.00,
    "status": "pending",
    "landlord_signed": true,
    "tenant_signed": false,
    "pdf_url": "/uploads/agreements/789.pdf"
  }
}
```

---

### POST /api/agreements/:id/sign

Sign an agreement.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request:**
```json
{
  "signature_image": "data:image/png;base64,iVBORw0KGgo...",
  "ip_address": "192.168.1.100"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "agreement_id": 789,
    "signature_hash": "b7e4cd2a5f...",
    "signed_at": "2025-12-16T10:30:00Z",
    "status": "executed"
  },
  "message": "Agreement signed successfully"
}
```

---

### GET /api/agreements/:id/pdf

Download agreement PDF.

**Response:**
- Content-Type: application/pdf
- Content-Disposition: attachment; filename="agreement_789.pdf"
- Binary PDF data

---

### POST /api/agreements/:id/send

Send agreement to tenant for signature.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Agreement sent to tenant"
}
```

---

### GET /api/agreements

List agreements (with filters).

**Query Parameters:**
- `status`: draft, pending, signed, executed, active, expired
- `property_id`: Filter by property
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

## Code Examples

### Backend - Agreement Controller

```javascript
// backend/controllers/agreementController.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Agreement, Property, User } = require('../models');
const sendEmail = require('../utils/emailService');

// Create agreement
exports.createAgreement = async (req, res) => {
  try {
    const {
      property_id,
      tenant_id,
      start_date,
      end_date,
      rent_amount,
      security_deposit,
      terms,
      additional_notes
    } = req.body;

    const landlord_id = req.user.id;

    // Verify property belongs to landlord
    const property = await Property.findOne({
      where: { id: property_id, landlord_id }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or unauthorized'
      });
    }

    // Create agreement
    const agreement = await Agreement.create({
      property_id,
      landlord_id,
      tenant_id,
      start_date,
      end_date,
      rent_amount,
      security_deposit,
      terms: JSON.stringify(terms),
      additional_notes,
      status: 'draft'
    });

    res.status(201).json({
      success: true,
      data: agreement,
      message: 'Agreement created successfully'
    });
  } catch (error) {
    console.error('Create agreement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create agreement'
    });
  }
};

// Sign agreement
exports.signAgreement = async (req, res) => {
  try {
    const { id } = req.params;
    const { signature_image } = req.body;
    const user_id = req.user.id;

    // Get agreement with related data
    const agreement = await Agreement.findByPk(id, {
      include: [
        { model: Property },
        { model: User, as: 'landlord' },
        { model: User, as: 'tenant' }
      ]
    });

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: 'Agreement not found'
      });
    }

    // Check if user is authorized to sign
    const isLandlord = agreement.landlord_id === user_id;
    const isTenant = agreement.tenant_id === user_id;

    if (!isLandlord && !isTenant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to sign this agreement'
      });
    }

    // Generate document hash
    const docHash = generateDocumentHash(agreement);

    // Generate signature hash
    const timestamp = new Date().toISOString();
    const signatureHash = crypto
      .createHash('sha256')
      .update(`${user_id}${timestamp}${docHash}`)
      .digest('hex');

    // Save signature
    const signatureData = {
      agreement_id: id,
      user_id,
      signature_hash: signatureHash,
      signature_image,
      signed_at: timestamp,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    };

    await Signature.create(signatureData);

    // Update agreement status
    if (isLandlord) {
      agreement.landlord_signed = true;
      agreement.landlord_signed_at = timestamp;
    } else if (isTenant) {
      agreement.tenant_signed = true;
      agreement.tenant_signed_at = timestamp;
    }

    // Check if both parties signed
    if (agreement.landlord_signed && agreement.tenant_signed) {
      agreement.status = 'executed';
      
      // Send confirmation emails
      await sendEmail({
        to: agreement.landlord.email,
        subject: 'Agreement Executed',
        template: 'agreement-executed',
        data: { agreement }
      });

      await sendEmail({
        to: agreement.tenant.email,
        subject: 'Agreement Executed',
        template: 'agreement-executed',
        data: { agreement }
      });
    } else {
      agreement.status = 'signed';
    }

    await agreement.save();

    res.json({
      success: true,
      data: {
        agreement_id: id,
        signature_hash: signatureHash,
        signed_at: timestamp,
        status: agreement.status
      },
      message: 'Agreement signed successfully'
    });
  } catch (error) {
    console.error('Sign agreement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sign agreement'
    });
  }
};

// Generate document hash
const generateDocumentHash = (agreement) => {
  const content = JSON.stringify({
    property_id: agreement.property_id,
    landlord_id: agreement.landlord_id,
    tenant_id: agreement.tenant_id,
    start_date: agreement.start_date,
    end_date: agreement.end_date,
    rent_amount: agreement.rent_amount,
    terms: agreement.terms
  });

  return crypto.createHash('sha256').update(content).digest('hex');
};
```

### Backend - PDF Generation

```javascript
// backend/utils/pdfGenerator.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateAgreementPDF = async (agreement, landlord, tenant, property) => {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF directory if not exists
      const pdfDir = path.join(__dirname, '../uploads/agreements');
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const pdfPath = path.join(pdfDir, `${agreement.id}.pdf`);
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(pdfPath);

      doc.pipe(stream);

      // Header
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('RENTAL AGREEMENT', { align: 'center' })
        .moveDown();

      // Agreement info
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Agreement ID: #${agreement.id}`)
        .text(`Date: ${new Date().toLocaleDateString()}`)
        .moveDown();

      // Parties section
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('PARTIES')
        .moveDown(0.5);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Landlord: ${landlord.username}`)
        .text(`Email: ${landlord.email}`)
        .moveDown(0.5);

      doc
        .text(`Tenant: ${tenant.username}`)
        .text(`Email: ${tenant.email}`)
        .moveDown();

      // Property section
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('PROPERTY')
        .moveDown(0.5);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Address: ${property.address}`)
        .text(`Type: ${property.type || 'N/A'}`)
        .moveDown();

      // Terms section
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('TERMS')
        .moveDown(0.5);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Start Date: ${new Date(agreement.start_date).toLocaleDateString()}`)
        .text(`End Date: ${new Date(agreement.end_date).toLocaleDateString()}`)
        .text(`Monthly Rent: $${parseFloat(agreement.rent_amount).toFixed(2)}`)
        .text(`Security Deposit: $${parseFloat(agreement.security_deposit).toFixed(2)}`)
        .moveDown();

      // Terms & Conditions
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('TERMS & CONDITIONS')
        .moveDown(0.5);

      const terms = JSON.parse(agreement.terms);
      terms.forEach((term, index) => {
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`${index + 1}. ${term}`)
          .moveDown(0.3);
      });

      if (agreement.additional_notes) {
        doc.moveDown();
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('ADDITIONAL NOTES')
          .moveDown(0.5);
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(agreement.additional_notes)
          .moveDown();
      }

      // Signatures section
      doc.moveDown(2);
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('SIGNATURES')
        .moveDown();

      // Landlord signature
      doc
        .fontSize(10)
        .font('Helvetica')
        .text('Landlord:', { continued: false })
        .moveDown(0.5);

      if (agreement.landlord_signature_image) {
        const signatureBuffer = Buffer.from(
          agreement.landlord_signature_image.split(',')[1],
          'base64'
        );
        doc.image(signatureBuffer, { width: 150, height: 50 });
      } else {
        doc.text('_____________________');
      }

      doc
        .text(`Date: ${agreement.landlord_signed_at 
          ? new Date(agreement.landlord_signed_at).toLocaleDateString() 
          : '___________'}`)
        .moveDown(2);

      // Tenant signature
      doc
        .text('Tenant:', { continued: false })
        .moveDown(0.5);

      if (agreement.tenant_signature_image) {
        const signatureBuffer = Buffer.from(
          agreement.tenant_signature_image.split(',')[1],
          'base64'
        );
        doc.image(signatureBuffer, { width: 150, height: 50 });
      } else {
        doc.text('_____________________');
      }

      doc
        .text(`Date: ${agreement.tenant_signed_at 
          ? new Date(agreement.tenant_signed_at).toLocaleDateString() 
          : '___________'}`);

      // Footer
      doc
        .fontSize(8)
        .text(
          'This is a legally binding agreement. Both parties should retain a copy.',
          50,
          doc.page.height - 50,
          { align: 'center' }
        );

      doc.end();

      stream.on('finish', () => {
        resolve(pdfPath);
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateAgreementPDF };
```

### Frontend - Signature Canvas Component

```javascript
// frontend/src/components/SignatureCanvas.js
import React, { useRef, useState, useEffect } from 'react';
import './SignatureCanvas.css';

const SignatureCanvas = ({ onSave, onClear }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    setContext(ctx);
  }, []);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const { offsetX, offsetY } = e.nativeEvent;
    context.beginPath();
    context.moveTo(offsetX, offsetY);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (onClear) onClear();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL('image/png');
    if (onSave) onSave(dataURL);
  };

  return (
    <div className="signature-canvas-container">
      <canvas
        ref={canvasRef}
        width={400}
        height={200}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="signature-canvas"
      />
      <div className="signature-buttons">
        <button onClick={handleClear} className="btn-clear">
          Clear
        </button>
        <button onClick={handleSave} className="btn-save">
          Save Signature
        </button>
      </div>
    </div>
  );
};

export default SignatureCanvas;
```

### Frontend - Agreement Signing Component

```javascript
// frontend/src/components/SignAgreement.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/apiClient';
import SignatureCanvas from './SignatureCanvas';

const SignAgreement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agreement, setAgreement] = useState(null);
  const [signature, setSignature] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAgreement();
  }, [id]);

  const fetchAgreement = async () => {
    try {
      const response = await axios.get(`/agreements/${id}`);
      setAgreement(response.data.data);
    } catch (err) {
      setError('Failed to load agreement');
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureSave = (dataURL) => {
    setSignature(dataURL);
  };

  const handleSign = async () => {
    if (!signature) {
      setError('Please provide your signature');
      return;
    }

    setSigning(true);
    setError('');

    try {
      await axios.post(`/agreements/${id}/sign`, {
        signature_image: signature
      });

      alert('Agreement signed successfully!');
      navigate('/dashboard/agreements');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sign agreement');
    } finally {
      setSigning(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!agreement) return <div>Agreement not found</div>;

  return (
    <div className="sign-agreement-container">
      <h2>Sign Rental Agreement</h2>
      
      <div className="agreement-details">
        <h3>Agreement Details</h3>
        <p><strong>Property:</strong> {agreement.property.address}</p>
        <p><strong>Landlord:</strong> {agreement.landlord.name}</p>
        <p><strong>Tenant:</strong> {agreement.tenant.name}</p>
        <p><strong>Start Date:</strong> {new Date(agreement.start_date).toLocaleDateString()}</p>
        <p><strong>End Date:</strong> {new Date(agreement.end_date).toLocaleDateString()}</p>
        <p><strong>Monthly Rent:</strong> ${agreement.rent_amount}</p>
      </div>

      <div className="pdf-preview">
        <a href={`/api/agreements/${id}/pdf`} target="_blank" rel="noopener noreferrer">
          View Full Agreement (PDF)
        </a>
      </div>

      <div className="signature-section">
        <h3>Your Signature</h3>
        <p>Please sign below to accept the terms of this agreement:</p>
        <SignatureCanvas onSave={handleSignatureSave} />
      </div>

      {error && <div className="error">{error}</div>}

      <div className="action-buttons">
        <button 
          onClick={handleSign} 
          disabled={!signature || signing}
          className="btn-sign"
        >
          {signing ? 'Signing...' : 'Sign Agreement'}
        </button>
        <button onClick={() => navigate(-1)} className="btn-cancel">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default SignAgreement;
```

## Security & Compliance

### Security Measures

1. **Document Integrity**
   - SHA-256 hashing of agreement content
   - Signature hash verification
   - Tamper detection

2. **Audit Trail**
   - All actions logged (create, view, sign)
   - IP address and timestamp tracking
   - User agent logging

3. **Access Control**
   - Only parties can view/sign agreement
   - Role-based permissions
   - JWT authentication required

4. **Data Protection**
   - Secure file storage
   - Encrypted signatures
   - HTTPS transmission

### Legal Compliance

**E-SIGN Act (US)**
- Electronic signatures are legally binding
- Intent to sign must be clear
- Records must be retained
- Parties must consent to electronic process

**UETA (Uniform Electronic Transactions Act)**
- Electronic records are valid
- Signature attribution to person
- Record retention requirements

**GDPR (EU) - if applicable**
- Data minimization
- Right to access
- Right to erasure (after legal retention period)

### Best Practices

1. **Clear Intent**: User must explicitly click "Sign" button
2. **Record Keeping**: Store all agreement versions
3. **Authentication**: Verify signer identity (JWT + MFA)
4. **Timestamp**: Use trusted timestamp service
5. **Notification**: Email confirmation to all parties
6. **Retention**: Keep agreements for required legal period

## Configuration

### Environment Variables

```env
# Agreement Configuration
AGREEMENT_UPLOAD_DIR=uploads/agreements
AGREEMENT_RETENTION_YEARS=7
MAX_AGREEMENT_SIZE=50MB

# PDF Configuration
PDF_FONT=Helvetica
PDF_MARGIN=50
INCLUDE_WATERMARK=false

# Email Notifications
SEND_AGREEMENT_NOTIFICATIONS=true
AGREEMENT_REMINDER_DAYS=3

# Signature
SIGNATURE_HASH_ALGORITHM=sha256
SIGNATURE_IMAGE_MAX_SIZE=1MB
```

## Troubleshooting

### Issue: PDF Generation Fails

**Solution:**
1. Check PDFKit installation: `npm install pdfkit`
2. Verify upload directory exists and is writable
3. Check file permissions
4. Review error logs for specific issues

### Issue: Signature Hash Mismatch

**Solution:**
1. Ensure agreement data hasn't changed after signing
2. Verify hash algorithm consistency
3. Check timestamp format
4. Review signature verification logic

### Issue: Canvas Signature Not Saving

**Solution:**
1. Verify canvas element is properly initialized
2. Check if `toDataURL()` is supported
3. Ensure base64 encoding is correct
4. Review browser console for errors

---

**Last Updated**: December 2025  
**Version**: 1.0.0
