# Property Approval Workflow - Admin Property Management

## Table of Contents
- [Overview](#overview)
- [Approval Workflow](#approval-workflow)
- [Admin Dashboard](#admin-dashboard)
- [Property Moderation](#property-moderation)
- [API Endpoints](#api-endpoints)
- [Code Examples](#code-examples)
- [Notification System](#notification-system)
- [Quality Control](#quality-control)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Overview

The Property Approval Workflow provides a comprehensive system for admin review and moderation of property listings with:

- **Three-State Workflow** - Pending, Approved, Rejected
- **Admin Review Dashboard** - Centralized property moderation
- **Automated Notifications** - Alert landlords of status changes
- **Rejection Feedback** - Provide reasons for rejection
- **Bulk Actions** - Approve/reject multiple properties
- **Property Quality Checks** - Automated validation
- **Appeal System** - Allow landlords to appeal rejections
- **Audit Trail** - Track all approval decisions

## Approval Workflow

### Workflow States

```
┌─────────────────────────────────────────────────────────┐
│              Property Submission Flow                   │
│                                                         │
│  Landlord Creates Property                              │
│           │                                             │
│           ▼                                             │
│      ┌──────────┐                                       │
│      │ PENDING  │ ← Initial state after submission     │
│      └────┬─────┘                                       │
│           │                                             │
│           │ Admin Reviews                               │
│           │                                             │
│           ▼                                             │
│    ┌─────────────┐                                      │
│    │   REVIEW    │                                      │
│    └──────┬──────┘                                      │
│           │                                             │
│      ┌────┴────┐                                        │
│      │         │                                        │
│      ▼         ▼                                        │
│ ┌─────────┐  ┌──────────┐                              │
│ │APPROVED │  │ REJECTED │                              │
│ └─────────┘  └────┬─────┘                              │
│      │            │                                     │
│      │            ▼                                     │
│      │       ┌─────────┐                               │
│      │       │ APPEAL  │ (Optional)                    │
│      │       └────┬────┘                               │
│      │            │                                     │
│      │            └──> Back to REVIEW                  │
│      │                                                  │
│      ▼                                                  │
│  PUBLISHED                                              │
│  (Visible to tenants)                                   │
└─────────────────────────────────────────────────────────┘
```

### Status Definitions

| Status | Description | Visibility | Actions Available |
|--------|-------------|------------|-------------------|
| **PENDING** | Just submitted, awaiting review | Landlord only | Edit, Delete |
| **REVIEW** | Under admin review | Admin only | Approve, Reject, Request Changes |
| **APPROVED** | Passed admin review | Public | Edit (requires re-approval), Deactivate |
| **REJECTED** | Failed review | Landlord only | Edit & Resubmit, Appeal |
| **APPEAL** | Rejection appealed | Admin only | Re-review |
| **PUBLISHED** | Live and searchable | Public | Edit, Deactivate |
| **DEACTIVATED** | Temporarily hidden | Landlord only | Reactivate |

### Workflow Timeline

```
Day 1: Property Submitted (PENDING)
  ↓
Day 1-3: Admin Review Period (REVIEW)
  ↓
  ├─ APPROVED → Published immediately
  │
  └─ REJECTED → Landlord notified
       ↓
       ├─ Landlord edits and resubmits → Back to PENDING
       │
       └─ Landlord appeals → APPEAL
            ↓
            Admin re-reviews → APPROVED or REJECTED
```

## Admin Dashboard

### Property Moderation Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  Property Moderation Dashboard              [Admin Panel]   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Pending  │  │  Review  │  │ Approved │  │ Rejected │    │
│  │    12    │  │    3     │  │   145    │  │    8     │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
├─────────────────────────────────────────────────────────────┤
│  Filter: [All] [Pending] [Review] [Rejected] [Appeals]      │
│  Sort: [Newest First] [Oldest First] [Priority]             │
├─────────────────────────────────────────────────────────────┤
│  Pending Review (12)                     [Bulk Actions ▼]   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ☐ Modern Apartment - Downtown                       │    │
│  │   Submitted: 2 hours ago                            │    │
│  │   Landlord: John Smith                              │    │
│  │   [Quick View] [Approve] [Reject] [Full Review]    │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ ☐ Luxury Villa - Beachfront                        │    │
│  │   Submitted: 5 hours ago                            │    │
│  │   Landlord: Jane Doe                                │    │
│  │   [Quick View] [Approve] [Reject] [Full Review]    │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ ☐ Studio Apartment - City Center                   │    │
│  │   Submitted: 1 day ago                              │    │
│  │   Landlord: Bob Johnson                             │    │
│  │   [Quick View] [Approve] [Reject] [Full Review]    │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  Recent Appeals (2)                                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Beach House - Rejected on Dec 10                    │    │
│  │   Appeal: "Fixed image quality issues"             │    │
│  │   [Review Appeal] [View History]                    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Property Moderation

### Review Criteria

#### Mandatory Checks

| Criteria | Description | Auto-Check | Manual Review |
|----------|-------------|-----------|---------------|
| **Complete Information** | All required fields filled | ✓ | - |
| **Valid Images** | At least 3 images, proper format | ✓ | ✓ |
| **Accurate Location** | Valid address, coordinates | ✓ | ✓ |
| **Reasonable Price** | Price within market range | ✓ | ✓ |
| **Proper Description** | Min 100 characters, no spam | ✓ | ✓ |
| **Legal Compliance** | No discriminatory language | - | ✓ |
| **Image Quality** | Clear, well-lit photos | - | ✓ |
| **Authenticity** | Not duplicate, real property | - | ✓ |

#### Rejection Reasons

```javascript
const REJECTION_REASONS = {
  INCOMPLETE_INFO: "Missing required information",
  POOR_IMAGES: "Images are unclear or insufficient",
  INVALID_ADDRESS: "Address cannot be verified",
  UNREALISTIC_PRICE: "Price is unrealistic for the market",
  SPAM_CONTENT: "Description contains spam or inappropriate content",
  DUPLICATE: "This property has already been listed",
  DISCRIMINATORY: "Contains discriminatory language",
  FAKE_LISTING: "Property appears to be fake or fraudulent",
  OTHER: "Other (see detailed feedback)"
};
```

### Review Process

```
Step 1: Automated Checks
  ├─ Check required fields
  ├─ Validate images (format, size, count)
  ├─ Verify address (geocoding API)
  ├─ Check price range
  └─ Scan description for spam/prohibited content
      │
      ├─ All Pass → Flag for manual review
      └─ Any Fail → Auto-reject with feedback

Step 2: Manual Review (Admin)
  ├─ Review property details
  ├─ Check image quality
  ├─ Verify authenticity
  ├─ Assess market appropriateness
  └─ Decision:
      ├─ APPROVE → Publish property
      ├─ REJECT → Send feedback to landlord
      └─ REQUEST CHANGES → Ask for modifications

Step 3: Post-Decision
  ├─ APPROVED:
  │   ├─ Send approval notification
  │   ├─ Publish to public listings
  │   └─ Update property status
  │
  └─ REJECTED:
      ├─ Send rejection notification with reasons
      ├─ Allow landlord to edit & resubmit
      └─ Option to appeal decision
```

## API Endpoints

### GET /api/admin/properties

Get properties for moderation.

**Headers:**
```
Authorization: Bearer {admin_jwt_token}
```

**Query Parameters:**
- `status`: pending, review, approved, rejected, appeal
- `sort`: newest, oldest, priority
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "title": "Modern Apartment",
      "landlord": {
        "id": 45,
        "username": "john_smith",
        "email": "john@example.com"
      },
      "status": "pending",
      "submitted_at": "2025-12-16T10:00:00Z",
      "images": [
        "https://example.com/img1.jpg",
        "https://example.com/img2.jpg"
      ],
      "address": "123 Main St, City",
      "price": 1500,
      "description": "Beautiful modern apartment...",
      "auto_checks": {
        "complete_info": true,
        "valid_images": true,
        "valid_address": true,
        "price_check": true,
        "description_check": true
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "totalPages": 1
  }
}
```

---

### PUT /api/admin/properties/:id/approve

Approve a property.

**Request:**
```json
{
  "notes": "Property looks good, approved for publishing"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Property approved successfully",
  "data": {
    "id": 123,
    "status": "approved",
    "approved_at": "2025-12-16T14:30:00Z",
    "approved_by": 1
  }
}
```

---

### PUT /api/admin/properties/:id/reject

Reject a property.

**Request:**
```json
{
  "reasons": ["POOR_IMAGES", "INCOMPLETE_INFO"],
  "feedback": "Please upload clearer images and complete the amenities section."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Property rejected",
  "data": {
    "id": 123,
    "status": "rejected",
    "rejected_at": "2025-12-16T14:30:00Z",
    "rejected_by": 1,
    "rejection_reasons": ["POOR_IMAGES", "INCOMPLETE_INFO"],
    "rejection_feedback": "Please upload clearer images..."
  }
}
```

---

### POST /api/admin/properties/bulk-action

Perform bulk action on properties.

**Request:**
```json
{
  "action": "approve",
  "property_ids": [123, 124, 125],
  "notes": "Batch approval for verified properties"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk action completed",
  "results": {
    "success": 3,
    "failed": 0,
    "details": [
      { "id": 123, "status": "approved" },
      { "id": 124, "status": "approved" },
      { "id": 125, "status": "approved" }
    ]
  }
}
```

---

### POST /api/properties/:id/appeal

Landlord appeals rejection.

**Headers:**
```
Authorization: Bearer {landlord_jwt_token}
```

**Request:**
```json
{
  "message": "I have updated the images with higher quality photos and added missing amenities information."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Appeal submitted successfully",
  "data": {
    "id": 123,
    "status": "appeal",
    "appeal_message": "I have updated the images...",
    "appeal_submitted_at": "2025-12-16T15:00:00Z"
  }
}
```

## Code Examples

### Backend - Property Approval Controller

```javascript
// backend/controllers/adminPropertyController.js
const { Property, User, PropertyApproval } = require('../models');
const notificationService = require('../services/notificationService');

exports.getPropertiesForReview = async (req, res) => {
  try {
    const { status = 'pending', sort = 'newest', page = 1, limit = 20 } = req.query;

    const where = {};
    if (status !== 'all') {
      where.status = status;
    }

    let order = [['created_at', 'DESC']];
    if (sort === 'oldest') {
      order = [['created_at', 'ASC']];
    } else if (sort === 'priority') {
      // Priority: appeals > old pending > new pending
      order = [
        ['status', 'DESC'],  // appeals first
        ['created_at', 'ASC']
      ];
    }

    const { count, rows } = await Property.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'landlord',
          attributes: ['id', 'username', 'email']
        }
      ],
      order,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get properties'
    });
  }
};

exports.approveProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.user.id;

    const property = await Property.findByPk(id, {
      include: [{ model: User, as: 'landlord' }]
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Update property status
    await property.update({
      status: 'approved',
      approved_at: new Date(),
      approved_by: adminId
    });

    // Create approval record
    await PropertyApproval.create({
      property_id: id,
      admin_id: adminId,
      action: 'approved',
      notes
    });

    // Send notification to landlord
    await notificationService.notifyPropertyApproved(property);

    // Log activity
    await logActivity(adminId, 'property.approve', 'property', id);

    res.json({
      success: true,
      message: 'Property approved successfully',
      data: {
        id: property.id,
        status: 'approved',
        approved_at: property.approved_at,
        approved_by: adminId
      }
    });
  } catch (error) {
    console.error('Approve property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve property'
    });
  }
};

exports.rejectProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const { reasons, feedback } = req.body;
    const adminId = req.user.id;

    const property = await Property.findByPk(id, {
      include: [{ model: User, as: 'landlord' }]
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Update property status
    await property.update({
      status: 'rejected',
      rejected_at: new Date(),
      rejected_by: adminId,
      rejection_reasons: JSON.stringify(reasons),
      rejection_feedback: feedback
    });

    // Create approval record
    await PropertyApproval.create({
      property_id: id,
      admin_id: adminId,
      action: 'rejected',
      reasons: JSON.stringify(reasons),
      feedback
    });

    // Send notification to landlord
    await notificationService.notifyPropertyRejected(property, reasons, feedback);

    // Log activity
    await logActivity(adminId, 'property.reject', 'property', id);

    res.json({
      success: true,
      message: 'Property rejected',
      data: {
        id: property.id,
        status: 'rejected',
        rejected_at: property.rejected_at,
        rejected_by: adminId,
        rejection_reasons: reasons,
        rejection_feedback: feedback
      }
    });
  } catch (error) {
    console.error('Reject property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject property'
    });
  }
};

exports.bulkAction = async (req, res) => {
  try {
    const { action, property_ids, notes } = req.body;
    const adminId = req.user.id;

    const results = {
      success: 0,
      failed: 0,
      details: []
    };

    for (const propertyId of property_ids) {
      try {
        const property = await Property.findByPk(propertyId);
        
        if (!property) {
          results.failed++;
          results.details.push({
            id: propertyId,
            status: 'failed',
            reason: 'Property not found'
          });
          continue;
        }

        if (action === 'approve') {
          await property.update({
            status: 'approved',
            approved_at: new Date(),
            approved_by: adminId
          });

          await notificationService.notifyPropertyApproved(property);
        } else if (action === 'reject') {
          await property.update({
            status: 'rejected',
            rejected_at: new Date(),
            rejected_by: adminId
          });

          await notificationService.notifyPropertyRejected(property, [], notes);
        }

        results.success++;
        results.details.push({
          id: propertyId,
          status: action === 'approve' ? 'approved' : 'rejected'
        });
      } catch (error) {
        results.failed++;
        results.details.push({
          id: propertyId,
          status: 'failed',
          reason: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Bulk action completed',
      results
    });
  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk action'
    });
  }
};
```

### Backend - Property Appeal Handler

```javascript
// backend/controllers/propertyController.js
exports.appealRejection = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    const property = await Property.findOne({
      where: {
        id,
        landlord_id: userId,
        status: 'rejected'
      }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or cannot be appealed'
      });
    }

    // Update status to appeal
    await property.update({
      status: 'appeal',
      appeal_message: message,
      appeal_submitted_at: new Date()
    });

    // Notify admins
    await notificationService.notifyAdminsOfAppeal(property);

    res.json({
      success: true,
      message: 'Appeal submitted successfully',
      data: {
        id: property.id,
        status: 'appeal',
        appeal_message: message,
        appeal_submitted_at: property.appeal_submitted_at
      }
    });
  } catch (error) {
    console.error('Appeal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit appeal'
    });
  }
};
```

### Frontend - Admin Property Review Component

```javascript
// frontend/src/components/PropertyReview.js
import React, { useState } from 'react';
import axios from '../api/apiClient';
import './PropertyReview.css';

const PropertyReview = ({ property, onActionComplete }) => {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReasons, setRejectionReasons] = useState([]);
  const [feedback, setFeedback] = useState('');

  const handleApprove = async () => {
    try {
      await axios.put(`/admin/properties/${property.id}/approve`, {
        notes: 'Approved by admin'
      });
      alert('Property approved!');
      onActionComplete();
    } catch (error) {
      alert('Failed to approve property');
    }
  };

  const handleReject = async () => {
    try {
      await axios.put(`/admin/properties/${property.id}/reject`, {
        reasons: rejectionReasons,
        feedback
      });
      alert('Property rejected');
      setShowRejectModal(false);
      onActionComplete();
    } catch (error) {
      alert('Failed to reject property');
    }
  };

  const toggleReason = (reason) => {
    setRejectionReasons(prev =>
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  return (
    <div className="property-review">
      <div className="property-header">
        <h2>{property.title}</h2>
        <span className={`status-badge ${property.status}`}>
          {property.status}
        </span>
      </div>

      <div className="property-details">
        <div className="detail-row">
          <strong>Landlord:</strong> {property.landlord.username}
        </div>
        <div className="detail-row">
          <strong>Email:</strong> {property.landlord.email}
        </div>
        <div className="detail-row">
          <strong>Submitted:</strong> {new Date(property.submitted_at).toLocaleString()}
        </div>
        <div className="detail-row">
          <strong>Price:</strong> ${property.price}/month
        </div>
        <div className="detail-row">
          <strong>Address:</strong> {property.address}
        </div>
      </div>

      <div className="property-images">
        <h3>Images</h3>
        <div className="image-grid">
          {property.images.map((img, index) => (
            <img key={index} src={img} alt={`Property ${index + 1}`} />
          ))}
        </div>
      </div>

      <div className="property-description">
        <h3>Description</h3>
        <p>{property.description}</p>
      </div>

      <div className="auto-checks">
        <h3>Automated Checks</h3>
        {Object.entries(property.auto_checks).map(([check, passed]) => (
          <div key={check} className="check-item">
            <span className={passed ? 'check-pass' : 'check-fail'}>
              {passed ? '✓' : '✗'}
            </span>
            {check.replace(/_/g, ' ')}
          </div>
        ))}
      </div>

      <div className="action-buttons">
        <button onClick={handleApprove} className="btn-approve">
          Approve Property
        </button>
        <button onClick={() => setShowRejectModal(true)} className="btn-reject">
          Reject Property
        </button>
      </div>

      {showRejectModal && (
        <div className="modal-overlay">
          <div className="rejection-modal">
            <h2>Reject Property</h2>
            
            <div className="rejection-reasons">
              <h3>Reasons for Rejection</h3>
              {[
                'INCOMPLETE_INFO',
                'POOR_IMAGES',
                'INVALID_ADDRESS',
                'UNREALISTIC_PRICE',
                'SPAM_CONTENT',
                'DUPLICATE',
                'DISCRIMINATORY',
                'FAKE_LISTING'
              ].map(reason => (
                <label key={reason}>
                  <input
                    type="checkbox"
                    checked={rejectionReasons.includes(reason)}
                    onChange={() => toggleReason(reason)}
                  />
                  {reason.replace(/_/g, ' ')}
                </label>
              ))}
            </div>

            <div className="feedback-section">
              <h3>Detailed Feedback</h3>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide specific feedback to help the landlord improve..."
                rows={5}
              />
            </div>

            <div className="modal-actions">
              <button onClick={handleReject} className="btn-confirm">
                Confirm Rejection
              </button>
              <button onClick={() => setShowRejectModal(false)} className="btn-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyReview;
```

## Notification System

### Email Templates

**Approval Notification:**
```
Subject: Your Property Has Been Approved!

Hi {{landlord.username}},

Great news! Your property "{{property.title}}" has been approved and is now live on our platform.

Property Details:
- Address: {{property.address}}
- Price: ${{property.price}}/month
- Approved: {{approved_at}}

Your property is now visible to potential tenants. You can manage it from your dashboard.

[View Property] [Manage Listing]

Best regards,
Property Management Team
```

**Rejection Notification:**
```
Subject: Action Required: Property Listing Needs Attention

Hi {{landlord.username}},

We've reviewed your property "{{property.title}}" but it doesn't meet our current listing standards.

Reasons for rejection:
{{#each rejection_reasons}}
- {{this}}
{{/each}}

Admin Feedback:
{{rejection_feedback}}

What's Next?
You can edit your listing to address these issues and resubmit for review. If you believe this is a mistake, you can appeal this decision.

[Edit Listing] [Appeal Decision]

Need help? Contact our support team.

Best regards,
Property Management Team
```

## Quality Control

### Automated Checks

```javascript
// backend/services/propertyValidationService.js
class PropertyValidationService {
  async validateProperty(property) {
    const checks = {
      complete_info: this.checkCompleteInfo(property),
      valid_images: this.checkImages(property),
      valid_address: await this.checkAddress(property),
      price_check: this.checkPrice(property),
      description_check: this.checkDescription(property)
    };

    const allPassed = Object.values(checks).every(check => check);

    return {
      passed: allPassed,
      checks
    };
  }

  checkCompleteInfo(property) {
    const required = ['title', 'address', 'price', 'description', 'bedrooms', 'bathrooms'];
    return required.every(field => property[field] !== null && property[field] !== '');
  }

  checkImages(property) {
    if (!property.images || property.images.length < 3) {
      return false;
    }
    // Additional image validation (format, size, etc.)
    return true;
  }

  async checkAddress(property) {
    // Use geocoding API to verify address
    try {
      const geocodeResult = await geocodeAddress(property.address);
      return geocodeResult.success;
    } catch (error) {
      return false;
    }
  }

  checkPrice(property) {
    // Check if price is within reasonable range
    if (property.price < 100 || property.price > 100000) {
      return false;
    }
    return true;
  }

  checkDescription(property) {
    if (!property.description || property.description.length < 100) {
      return false;
    }
    // Check for spam keywords
    const spamKeywords = ['click here', 'buy now', 'limited time'];
    const hasSpam = spamKeywords.some(keyword =>
      property.description.toLowerCase().includes(keyword)
    );
    return !hasSpam;
  }
}

module.exports = new PropertyValidationService();
```

## Configuration

### Environment Variables

```env
# Property Approval
ENABLE_PROPERTY_APPROVAL=true
AUTO_APPROVE_VERIFIED_LANDLORDS=false
APPROVAL_TIMEOUT_DAYS=7

# Quality Control
MIN_PROPERTY_IMAGES=3
MIN_DESCRIPTION_LENGTH=100
PRICE_MIN=100
PRICE_MAX=100000

# Notifications
NOTIFY_LANDLORD_ON_APPROVAL=true
NOTIFY_LANDLORD_ON_REJECTION=true
NOTIFY_ADMIN_ON_APPEAL=true
```

## Troubleshooting

### Issue: Properties Not Appearing After Approval

**Solution:**
1. Check property status in database
2. Verify search index is updated
3. Clear cache if using caching layer

### Issue: Automated Checks Failing

**Solution:**
1. Review validation criteria
2. Check external API dependencies (geocoding)
3. Verify image upload service

### Issue: Bulk Actions Timing Out

**Solution:**
1. Reduce batch size
2. Implement background job processing
3. Add progress indicators

---

**Last Updated**: December 2025  
**Version**: 1.0.0
