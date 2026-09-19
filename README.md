# Mortgage Strategy Calculator

A GitHub Pages-ready buyer affordability and mortgage strategy calculator for real estate agents, buyers, investors, and lending conversations.

## What It Calculates

### Loan programs
- Conventional
- FHA
- VA
- USDA
- Custom / other

### Monthly payment
- Principal and interest
- Property taxes
- Homeowners insurance
- Conventional PMI estimate
- FHA annual MIP estimate
- USDA annual guarantee fee estimate
- HOA
- Flood insurance
- Other monthly housing costs

### Temporary rate buydowns
- 1/0
- 2/1
- 3/2/1
- Year-by-year estimated borrower payment
- Estimated subsidy required to fund the temporary buydown
- Seller/lender-funded versus buyer-funded subsidy modeling

### Permanent rate buydown
Enter an actual lender-quoted permanent rate and discount-point cost. The calculator compares that scenario against the standard loan.

### Side-by-side strategies
The comparison table shows:
- Standard financing
- Temporary buydown Year 1
- Permanent rate buydown
- Larger down-payment scenario

Each scenario shows estimated monthly housing payment, cash to close, and monthly payment difference versus the standard scenario.

### Cash to close
- Down payment
- Closing-cost estimate
- Program upfront fee paid in cash, when applicable
- Prepaids / initial escrow
- Other upfront costs
- Seller / lender credits
- Discount points in the permanent-bydown scenario

### Affordability
- Housing ratio
- Estimated total DTI
- Income remaining after housing
- Income remaining after housing plus entered monthly debts

### Amortization and early payoff
- First 12 months of amortization
- Total scheduled interest
- Monthly extra-principal option
- One-time extra-principal option
- Revised payoff time
- Interest saved
- Time saved
- Loan-balance chart

### Sharing and printing
- Calculator values are stored in the page URL query string, so copying the browser URL creates a shareable scenario.
- **Print / Save PDF** generates a clean results-only print view.

## Current Program Assumptions Included

Program rules change. These defaults are included as planning assumptions and remain editable.

### FHA
- Upfront MIP default: 1.75% of base loan amount.
- Annual MIP is estimated from loan term, LTV, and the entered base-loan threshold.
- The default threshold is set to the 2026 national baseline conforming loan limit of $832,750 for planning purposes.
- The tool estimates an 11-year annual-MIP duration at 90% LTV or less and loan-term duration above 90% LTV.

HUD references:
- https://www.hud.gov/hud-partners/single-family-handbook-4000-1
- https://answers.hud.gov/FHA/s/article/What-is-the-FHA-Mortgage-Insurance-Premium-structure-for-forward-mortgage-loans

FHFA 2026 conforming-loan limit:
- https://www.fhfa.gov/news/news-release/fhfa-announces-conforming-loan-limit-values-for-2026

### VA
For VA purchase loans, the calculator uses the VA published purchase funding-fee schedule:
- First use, less than 5% down: 2.15%
- Subsequent use, less than 5% down: 3.30%
- 5% or more down: 1.50%
- 10% or more down: 1.25%
- Funding-fee exemption can be selected
- No monthly mortgage insurance is modeled

VA reference:
- https://www.va.gov/housing-assistance/home-loans/funding-fee-and-closing-costs/

### USDA
Planning defaults:
- Upfront guarantee fee: 1.00%
- Annual guarantee fee: 0.35%
- Upfront guarantee fee may be modeled as financed

USDA reference:
- https://www.rd.usda.gov/media/file/download/usda-rd-sfh-guarantee-loan-program-101-jan-2026.pdf

### Conventional PMI
The calculator uses an editable PMI rate and applies it when the modeled conventional loan is above 80% LTV. It estimates scheduled PMI removal from the entered LTV threshold; actual PMI pricing and cancellation rules depend on the loan, servicer, property value, and applicable law/guidelines.

## Files

```text
mortgage-buydown-calculator/
├── index.html
├── styles.css
├── script.js
├── README.md
└── .gitignore
```

## Run Locally

No build process or dependencies are required.

Open `index.html`, or run:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## Publish on GitHub Pages

1. Create a GitHub repository.
2. Upload all project files to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Choose `main` and `/ (root)`.
6. Save.

GitHub Pages will provide a public URL for the calculator.

## Important Disclaimer

This is a planning and educational calculator, not a Loan Estimate, lending commitment, underwriting decision, tax opinion, or legal opinion. Program eligibility, loan limits, seller-concession limits, MI/MIP/guarantee fees, interest-rate pricing, points, credits, taxes, insurance, qualifying income, appraisal results, and closing figures can differ. Verify final transaction numbers with the buyer's lender and settlement provider.
