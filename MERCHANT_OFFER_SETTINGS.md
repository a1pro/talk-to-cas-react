# Merchant Offer Settings Implementation

This document describes the complete implementation of the Merchant Offer Settings API and database logic for the TalkCas application.

## Overview

The Merchant Offer Settings feature allows merchants to:
- Enable/disable vouchers for their venue
- Set venue type (club, bar, restaurant)
- Configure voucher amount
- Set available days and time ranges
- Define minimum order requirements (restaurants only)
- Choose fulfillment type
- Set low-balance wallet threshold

## Frontend Implementation

### API Service (`src/api/merchant.ts`)

The frontend uses a dedicated API service that provides typed methods for all merchant operations:

```typescript
// Get merchant offer settings
merchantApi.getOfferSettings()

// Update merchant offer settings  
merchantApi.updateOfferSettings(payload)

// Get dashboard data
merchantApi.getDashboard()

// Wallet operations
merchantApi.topUpWallet(amount)
merchantApi.redeemVoucher(voucherId)
```

### Pages

1. **MerchantOfferSettingsPage** (`src/pages/MerchantOfferSettingsPage.tsx`)
   - Form for editing all offer settings
   - Real-time validation and feedback
   - Day picker for weekly availability
   - Conditional fields for restaurant-specific options

2. **MerchantDashboard** (`src/pages/MerchantDashboard.tsx`)
   - Overview of current settings
   - Wallet balance and controls
   - Recent vouchers and transactions
   - Quick actions for common tasks

### Types (`src/types.ts`)

Key interfaces:
- `MerchantOfferSettings` - Complete settings structure
- `Venue` - Venue information with offer fields
- `Voucher` - Voucher details and status
- `WalletTransaction` - Transaction history

## Backend Implementation

### Database Schema

The offer settings are stored across multiple related tables:

#### Venues Table
Contains the core offer settings:
- `offer_enabled` - Boolean flag for voucher availability
- `voucher_amount` - Decimal value for voucher worth
- `offer_days` - JSON array of available days
- `offer_start_time` / `offer_end_time` - Time range for offers
- `minimum_order` - Minimum order for restaurants
- `fulfilment_type` - How vouchers can be redeemed
- `offer_review_status` - Admin review status

#### Merchant Wallets Table
Handles wallet settings:
- `balance` - Current wallet balance
- `low_balance_threshold` - Alert threshold
- `auto_top_up_enabled` - Auto-recharge setting

#### Wallet Transactions Table
Records all wallet movements:
- `type` - Transaction type (top_up, voucher_charge, etc.)
- `amount` - Transaction amount
- `balance_before` / `balance_after` - Balance tracking
- `reference` - Transaction reference

#### Vouchers Table
Manages voucher lifecycle:
- `status` - Current status (issued, redeemed, expired)
- `voucher_value` - Value of the voucher
- `service_fee` - Platform fee
- `total_charge` - Total amount charged

### API Endpoints

#### GET `/merchant/offer-settings`
Returns current merchant offer settings including:
- Merchant information
- Venue details
- Current offer configuration
- Wallet settings

#### PUT `/merchant/offer-settings`
Updates merchant offer settings:
- Updates merchant business type
- Saves venue offer configuration
- Updates wallet threshold
- Sets review status to 'pending'

#### GET `/merchant/dashboard`
Provides comprehensive dashboard data:
- Business statistics
- Current offer snapshot
- Recent vouchers and transactions
- Wallet information

#### POST `/merchant/wallet/top-up`
Adds funds to merchant wallet:
- Validates amount
- Updates balance
- Records transaction

#### POST `/merchant/vouchers/:id/redeem`
Redeems an issued voucher:
- Validates voucher status
- Checks wallet balance
- Charges wallet
- Updates voucher status

### Database Migrations

#### Add Offer Settings to Venues
```sql
ALTER TABLE venues 
ADD COLUMN offer_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN voucher_amount DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN offer_days JSON,
ADD COLUMN offer_start_time TIME,
ADD COLUMN offer_end_time TIME,
ADD COLUMN minimum_order DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN fulfilment_type ENUM('venue', 'collection', 'delivery', 'both') DEFAULT 'venue',
ADD COLUMN offer_review_status ENUM('pending', 'approved', 'rejected', 'live') DEFAULT 'pending';
```

#### Create Wallet Tables
```sql
CREATE TABLE merchant_wallets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  merchant_id INT NOT NULL,
  balance DECIMAL(10, 2) DEFAULT 0.00,
  low_balance_threshold DECIMAL(10, 2) DEFAULT 50.00,
  auto_top_up_enabled BOOLEAN DEFAULT FALSE,
  auto_top_up_amount DECIMAL(10, 2) DEFAULT 100.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
  UNIQUE KEY unique_merchant_wallet (merchant_id)
);
```

## Integration with Public Venue Listing

The offer settings stored in this module are designed to be consumed by the public venue-listing flow:

### Available Fields for Public Use
- `venues.offer_enabled` - Filter for active venues
- `venues.voucher_amount` - Display voucher value
- `venues.offer_days` - Check current day availability
- `venues.offer_start_time/end_time` - Validate time range
- `venues.minimum_order` - Show restaurant requirements
- `venues.fulfilment_type` - Display redemption options
- `venues.offer_review_status` - Filter approved venues

### Example Query for Public Listings
```sql
SELECT v.id, v.name, v.category, v.postcode,
       v.voucher_amount, v.offer_days, v.fulfilment_type
FROM venues v
JOIN merchants m ON v.merchant_id = m.id
JOIN merchant_wallets mw ON m.id = mw.merchant_id
WHERE v.offer_enabled = true
  AND v.offer_review_status = 'approved'
  AND JSON_CONTAINS(v.offer_days, '"friday"')
  AND mw.balance >= v.voucher_amount * 10; -- Ensure sufficient balance
```

## Security Considerations

1. **Authentication**: All endpoints require valid merchant authentication
2. **Authorization**: Merchants can only access their own data
3. **Validation**: Input validation for all numeric and enum fields
4. **Transaction Safety**: Database transactions for balance updates
5. **Rate Limiting**: Consider rate limiting for wallet operations

## Testing

### Frontend Tests
- Form validation and submission
- API integration with mock responses
- UI state management
- Error handling

### Backend Tests
- API endpoint responses
- Database transaction integrity
- Business logic validation
- Security permissions

### Integration Tests
- End-to-end offer setting flow
- Wallet top-up and voucher redemption
- Public venue listing consumption

## Future Enhancements

1. **Bulk Operations**: Allow managing multiple venues
2. **Scheduled Offers**: Time-based offer activation
3. **Analytics**: Offer performance metrics
4. **A/B Testing**: Different offer configurations
5. **Notifications**: Low balance alerts
6. **Audit Trail**: Complete change history

## Files Created/Modified

### New Files
- `src/api/merchant.ts` - Merchant API service
- `src/api/database-schema.ts` - Database schema documentation
- `src/api/backend-controller.ts` - Backend implementation example

### Modified Files
- `src/pages/MerchantOfferSettingsPage.tsx` - Updated to use new API service
- `src/pages/MerchantDashboard.tsx` - Updated to use new API service
- `src/types.ts` - Contains existing type definitions

## Deployment Notes

1. Run database migrations before deploying
2. Ensure proper indexes are created for performance
3. Set up monitoring for wallet balance thresholds
4. Configure backup strategies for financial data
5. Test all API endpoints with authentication
