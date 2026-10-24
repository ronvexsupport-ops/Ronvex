# RONVEX Security Specification

## 1. Data Invariants
1. Only verified administrators can create, update, or delete products, platform settings, affiliate application decisions, and payout status approvals.
2. Affiliates can only read and manage their own affiliate profile, custom product pricing, attributed orders, commission records, and payout requests.
3. Affiliates cannot approve their own applications or change their own role or payout approval status.
4. Product pricing limits must be enforced: affiliate selling price must satisfy `adminBasePrice <= sellingPrice <= adminBasePrice + maxAffiliateIncrease`.
5. Order snapshots are immutable: accepted item prices, commission amounts, and attribution metadata cannot be modified once written.
6. Commissions are generated and managed strictly through authorized state transitions; affiliates cannot directly mark commissions as PAID.
7. Orders can be placed by customers without requiring customer login, but order queries for private details must be verified by customer phone/order ID or affiliate/admin authorization.
8. Payout requests must be for the authenticated affiliate, with valid payment details and a positive requested amount (> ৳0) not exceeding their available payable balance (no minimum payout threshold).

## 2. The "Dirty Dozen" Payloads to Reject
1. **Self-Admin Role Elevation**: `{ role: "admin" }` payload sent to `/users/{uid}` by a non-admin.
2. **Self-Approval of Affiliate Application**: `{ applicationStatus: "APPROVED" }` updated directly by applicant.
3. **Price Manipulation Exploit**: An affiliate submits selling price of ৳751 when base price is ৳600 and max increase is ৳150.
4. **Negative Price Exploit**: An affiliate sets selling price of ৳500 when base price is ৳600.
5. **Unauthorized Commission Mutation**: An affiliate writes `{ status: "PAID" }` directly into `/commissions/{id}`.
6. **Payout Balance Over-claim**: An affiliate requests a payout of ৳50,000 when payable balance is ৳1,200.
7. **Order Price Tampering**: A client tries to submit an order with a price lower than the accepted product price.
8. **PII Scraping Attack**: An unauthenticated user attempts to list all users from `/users`.
9. **Cross-Affiliate Order Snooping**: Affiliate B attempts to read order documents attributed to Affiliate A.
10. **ID Poisoning / Massive String Injection**: An attacker submits a document with a 50KB string in a name field.
11. **Direct Settings Tampering**: Non-admin attempts to change `minimumPayout` or `defaultMonthlyBonus`.
12. **Double Payout Processing**: Submitting a duplicate payout claim against the same cleared balance.
