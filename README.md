# EVE Online Contract Appraisal Dashboard

A simple web dashboard for viewing and analyzing EVE Online contract appraisal data. This dashboard provides insights into contract pricing, markups, and trends to help with trading decisions.

## Features

- **Real-time contract data**: Updated every 6 hours
- **Interactive filters**: Filter by contract status, issuer, and more
- **Advanced sorting**: Sort contracts by date, price, markup percentage, etc.
- **Search functionality**: Quickly find specific contracts
- **Visual analytics**: Charts showing markup distribution
- **Responsive design**: Works on desktop and mobile devices
- **CSV download**: Download the raw data for your own analysis

## How to Access

Simply visit the GitHub Pages URL for this repository:
[https://yourusername.github.io/eve-contracts-dashboard/](https://yourusername.github.io/eve-contracts-dashboard/)

The default access password is: `eve-contracts-2025`  
*Note: You can change this in the app.js file*

## Using the Dashboard

1. Enter the access password when prompted
2. Browse the contract data in the table
3. Use the filters at the top to narrow down the contracts you're interested in
4. Click column headers to sort
5. Use the search box to find specific contracts
6. View charts and statistics in the overview section
7. Download the raw CSV data using the "Download CSV" button

## Data Updates

The contract data is automatically updated every 6 hours through a GitHub Actions workflow. You'll always see the most recent contract appraisals when you visit the dashboard.

## Technical Details

This dashboard is built with:
- HTML5, CSS3, and JavaScript
- Bootstrap 5 for responsive design
- Chart.js for data visualization
- Papa Parse for CSV parsing
- GitHub Pages for hosting

The data source is a private repository that runs the EVE Online contract appraisal script and pushes the results to this repository.

## Feedback and Contributions

For feedback, issues, or contributions, please contact the repository owner or create an issue in this repository.

---

*This project is not affiliated with CCP Games or EVE Online. EVE Online and all related logos and assets are trademarks of CCP hf.*