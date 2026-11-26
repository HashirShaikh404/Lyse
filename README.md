# Lyse

Lyse is a React and Vite sales reporting workspace for the historical Northwind sample dataset.

Use Node.js 20.19+ on the 20.x release line or Node.js 22.12+.

```sh
npm ci
npm run dev
npm run build
```

Open the local URL printed by Vite. `npm run build` creates the production site in `dist/`.

## Data sources

Lyse’s default source is [Northwind OData V4](https://services.odata.org/V4/Northwind/Northwind.svc/). It reads dated orders with their customer and employee relationships, discounted line items from `Order_Details`, and products with their categories. The service follows `@odata.nextLink` and keeps successful collections in memory for the current session. Applying date filters uses the records already retrieved.

If OData is unavailable, the dashboard shows the error and offers **Retry API** or **Use sample archive**. The optional archive contains reporting fields extracted from [Microsoft’s Northwind SQL sample](https://github.com/microsoft/sql-server-samples/blob/master/samples/databases/northwind-pubs/instnwnd.sql). It has 830 orders, 2,155 line items, and 77 products. The archive dates run from July 4, 1996 through May 6, 1998. The archive and OData source can differ in individual fields.

## Reporting logic

- `src/services/analyticsService.js` fetches and validates the data.
- `src/utils/analyticsCalculations.js` joins line items to orders and calculates each line as `UnitPrice × Quantity × (1 − Discount)`. Revenue excludes freight and uses neutral number formatting because the source provides no currency code.
- `src/hooks/useSavedFilters.js` restores the applied date range on refresh. **Reset Filters** clears it and restores the full available range.
- **Export CSV** includes every order in the applied dates. The Orders search, sort order, and current page control the table view.

Lyse uses Recharts 2.15.4 to keep Redux out of the dependency tree. This Recharts release supports React 19 and belongs to the inactive 2.x series.
