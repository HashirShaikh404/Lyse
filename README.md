
# Lyse

Lyse is a corporate sales analytics and reporting workspace built with React, Vite, and Recharts. It lets a sales manager review performance, drill into invoices, and export the selected period.

## Run locally

Use Node.js 20.19+ on the 20.x release line or Node.js 22.12+.

```sh
npm ci
npm run dev
npm run build
```

Open the URL printed by Vite. The production build is written to `dist/`.

## Data source

Lyse uses real historical invoices from a UK online retailer, dated 1 December 2009 through 9 December 2011. Data is credited to Daqing Chen, *Online Retail II* (2012), [UCI Machine Learning Repository](https://doi.org/10.24432/C5CG6D), under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The [public Hugging Face dataset](https://huggingface.co/datasets/attik/Online-Retail-II-UCI) serves a Parquet copy. Lyse reads its metadata and selected byte ranges at runtime using Fetch. The date range displayed in the app comes from that metadata.

## Reporting logic

- **Net sales** sum price × quantity from each invoice line, including signed credits and adjustments. Values are reported in GBP.
- **Sales invoices** count distinct positive invoices outside the credit series. **Average invoice value** uses the sales invoice total before separate credit notes. **Active customers** count identified customers with at least one sales invoice.
- Credit notes and cancellations include invoices prefixed with `C` and other negative-value invoices. Zero-value invoices stay visible in the invoice mix and details.
- Customer and sales charts use the applied date and market filters. Comparisons use the immediately preceding period of the same length when it is covered by the dataset and the prior metric is positive.
- The product report ranks catalogue stock codes by net sales. The invoice CSV includes every matching invoice for the applied date range and market. Table search and pagination change the screen view.

## Code structure

- `src/services/analyticsService.js` discovers the dataset and reuses downloaded byte ranges. Parquet row-group date ranges keep each query focused on the selected dates and the comparison period.
- `src/hooks/useSalesAnalytics.js` handles loading, errors, retries, and prepared invoices. `useSavedFilters.js` stores the applied dates and market in localStorage.
- `src/utils/analyticsCalculations.js` groups line items by invoice and calculates KPIs, chart series, and rankings. The dashboard memoizes those results by reporting period and market.
- `src/components/` contains the reusable layout, filter, chart, report, and invoice table components.

Lyse uses Recharts 2.15.4 to keep Redux out of the dependency tree. This Recharts release supports React 19 and belongs to the inactive 2.x series.
