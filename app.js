// Configuration
const ACCESS_PASSWORD = "eve-contracts-2025"; // Change this to your desired password
const CSV_FILES_URL = "data/"; // Directory where CSV files are stored
const CSV_FILE_INDEX = "./data/file-list.json"; // File containing the list of available CSVs

// Global variables
let contractData = [];
let latestCsvFile = "";
let chart = null;

// DOM Elements
const loginScreen = document.getElementById("loginScreen");
const mainApp = document.getElementById("mainApp");
const passwordInput = document.getElementById("passwordInput");
const loginButton = document.getElementById("loginButton");
const loginError = document.getElementById("loginError");
const contractTableBody = document.getElementById("contractTableBody");
const dataLastUpdated = document.getElementById("dataLastUpdated");
const loadingIndicator = document.getElementById("loadingIndicator");
const noDataMessage = document.getElementById("noDataMessage");
const statusFilter = document.getElementById("statusFilter");
const issuerFilter = document.getElementById("issuerFilter");
const sortBy = document.getElementById("sortBy");
const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");
const refreshData = document.getElementById("refreshData");
const downloadCSV = document.getElementById("downloadCSV");
const contractCount = document.getElementById("contractCount");
const totalContractsElement = document.getElementById("totalContracts");
const avgMarkupElement = document.getElementById("avgMarkup");
const minMarkupElement = document.getElementById("minMarkup");
const maxMarkupElement = document.getElementById("maxMarkup");

// Check if user is already authenticated
document.addEventListener("DOMContentLoaded", function() {
    const authenticated = localStorage.getItem("authenticated");
    if (authenticated === "true") {
        showMainApp();
        loadData();
    } else {
        loginScreen.style.display = "block";
    }

    // Set up event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Login form
    loginButton.addEventListener("click", handleLogin);
    passwordInput.addEventListener("keyup", function(event) {
        if (event.key === "Enter") {
            handleLogin();
        }
    });

    // Filters and search
    statusFilter.addEventListener("change", filterAndDisplayContracts);
    issuerFilter.addEventListener("change", filterAndDisplayContracts);
    sortBy.addEventListener("change", filterAndDisplayContracts);
    searchInput.addEventListener("input", filterAndDisplayContracts);
    clearSearch.addEventListener("click", function() {
        searchInput.value = "";
        filterAndDisplayContracts();
    });

    // Other actions
    refreshData.addEventListener("click", loadData);
    downloadCSV.addEventListener("click", downloadLatestCSV);
}

function handleLogin() {
    const password = passwordInput.value;
    if (password === ACCESS_PASSWORD) {
        localStorage.setItem("authenticated", "true");
        showMainApp();
        loadData();
    } else {
        loginError.textContent = "Incorrect password. Please try again.";
        passwordInput.value = "";
    }
}

function showMainApp() {
    loginScreen.style.display = "none";
    mainApp.style.display = "block";
}

async function loadData() {
    try {
        loadingIndicator.style.display = "block";
        noDataMessage.style.display = "none";
        contractTableBody.innerHTML = "";

        console.log("Attempting to fetch file list from:", CSV_FILE_INDEX);
        
        // Get the list of available CSV files
        const response = await fetch(CSV_FILE_INDEX);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const files = await response.json();
        console.log("File list loaded successfully:", files);

        if (!files || files.length === 0) {
            throw new Error("No CSV files found in the file list");
        }

        // Find the latest CSV file (assumes filenames contain timestamps)
        files.sort((a, b) => b.localeCompare(a));
        latestCsvFile = files[0];
        console.log("Latest CSV file:", latestCsvFile);

        // Load the CSV data
        console.log("Attempting to fetch CSV from:", CSV_FILES_URL + latestCsvFile);
        const csvResponse = await fetch(CSV_FILES_URL + latestCsvFile);
        
        if (!csvResponse.ok) {
            throw new Error(`HTTP error! Status: ${csvResponse.status}`);
        }
        
        const csvText = await csvResponse.text();
        console.log("CSV data loaded, length:", csvText.length);

        // Parse the CSV
        Papa.parse(csvText, {
            header: true,
            dynamicTyping: true,
            complete: function(results) {
                console.log("CSV parsing complete, rows:", results.data.length);
                if (results.data && results.data.length > 0) {
                    contractData = results.data.filter(row => row.contract_id); // Filter out any empty rows
                    console.log("Valid contract data rows:", contractData.length);
                    
                    // Update last updated info
                    const timestamp = latestCsvFile.match(/\d{8}_\d{6}/);
                    if (timestamp) {
                        const formatted = formatTimestamp(timestamp[0]);
                        dataLastUpdated.textContent = `Data last updated: ${formatted}`;
                    } else {
                        dataLastUpdated.textContent = `Data last updated: ${latestCsvFile}`;
                    }

                    // Populate filters
                    populateFilters();
                    
                    // Display data
                    filterAndDisplayContracts();
                    
                    // Update stats
                    updateStats();
                    
                    // Create chart
                    createOrUpdateChart();
                    
                    loadingIndicator.style.display = "none";
                } else {
                    console.error("No valid data rows in CSV");
                    loadingIndicator.style.display = "none";
                    noDataMessage.style.display = "block";
                }
            },
            error: function(error) {
                console.error("Error parsing CSV:", error);
                loadingIndicator.style.display = "none";
                noDataMessage.style.display = "block";
                noDataMessage.textContent = "Error loading data. Please try again.";
            }
        });
    } catch (error) {
        console.error("Error fetching data:", error);
        loadingIndicator.style.display = "none";
        noDataMessage.style.display = "block";
        noDataMessage.textContent = `Error loading data: ${error.message}`;
    }
}

function populateFilters() {
    // Clear existing options except the first one
    statusFilter.innerHTML = '<option value="all">All Statuses</option>';
    issuerFilter.innerHTML = '<option value="all">All Issuers</option>';
    
    // Get unique statuses and issuers
    const statuses = [...new Set(contractData.map(contract => contract.status))].filter(Boolean).sort();
    const issuers = [...new Set(contractData.map(contract => contract.issuer_name))].filter(Boolean).sort();
    
    // Add options for statuses
    statuses.forEach(status => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        statusFilter.appendChild(option);
    });
    
    // Add options for issuers
    issuers.forEach(issuer => {
        const option = document.createElement('option');
        option.value = issuer;
        option.textContent = issuer;
        issuerFilter.appendChild(option);
    });
}

function filterAndDisplayContracts() {
    // Get filter values
    const statusValue = statusFilter.value;
    const issuerValue = issuerFilter.value;
    const sortValue = sortBy.value;
    const searchValue = searchInput.value.toLowerCase();
    
    // Filter contracts
    let filtered = contractData;
    
    if (statusValue !== "all") {
        filtered = filtered.filter(contract => contract.status === statusValue);
    }
    
    if (issuerValue !== "all") {
        filtered = filtered.filter(contract => contract.issuer_name === issuerValue);
    }
    
    if (searchValue) {
        filtered = filtered.filter(contract => {
            return (
                (contract.contract_id && contract.contract_id.toString().includes(searchValue)) ||
                (contract.issuer_name && contract.issuer_name.toLowerCase().includes(searchValue)) ||
                (contract.title && contract.title.toLowerCase().includes(searchValue))
            );
        });
    }
    
    // Sort contracts
    filtered.sort((a, b) => {
        const [field, direction] = sortValue.split("_");
        
        let valueA, valueB;
        if (field === "date") {
            valueA = new Date(a.date_issued || 0);
            valueB = new Date(b.date_issued || 0);
        } else if (field === "title") {
            valueA = (a.title || "").toLowerCase();
            valueB = (b.title || "").toLowerCase();
        } else {
            valueA = a[field] || 0;
            valueB = b[field] || 0;
        }
        
        if (direction === "asc") {
            return valueA > valueB ? 1 : -1;
        } else {
            return valueA < valueB ? 1 : -1;
        }
    });
    
    // Display contracts
    displayContracts(filtered);
}

function displayContracts(contracts) {
    contractTableBody.innerHTML = "";
    
    if (contracts.length === 0) {
        noDataMessage.style.display = "block";
        contractCount.textContent = "0 contracts";
        return;
    }
    
    noDataMessage.style.display = "none";
    contractCount.textContent = `${contracts.length} contracts`;
    
    contracts.forEach(contract => {
        const row = document.createElement("tr");
        
        // Format values
        const price = formatISK(contract.price);
        const jitaValue = formatISK(contract.jita_sell_value);
        const markup = formatISK(contract.markup_amount);
        const markupPercent = contract.markup_percent ? `${contract.markup_percent.toFixed(2)}%` : "N/A";
        
        // Determine markup color class based on percentage
        let markupClass = "";
        if (contract.markup_percent !== null && contract.markup_percent !== undefined) {
            if (contract.markup_percent < 0) {
                markupClass = "markup-negative";  // Light blue for negative
            } else if (contract.markup_percent <= 20) {
                markupClass = "markup-low";       // Green for 0-20%
            } else if (contract.markup_percent <= 30) {
                markupClass = "markup-medium";    // Yellow for 20-30%
            } else {
                markupClass = "markup-high";      // Red for above 30%
            }
        }
        
        const date = contract.date_issued ? new Date(contract.date_issued).toLocaleString() : "N/A";
        const title = contract.title || "Untitled Contract";
        
        // Create appraisal link if available
        let appraisalLink = "N/A";
        if (contract.appraisal_code) {
            appraisalLink = `<a href="https://janice.e-351.com/a/${contract.appraisal_code}" target="_blank">View</a>`;
        }
        
        row.innerHTML = `
            <td>${contract.contract_id}</td>
            <td>${title}</td>
            <td>${contract.status ? contract.status.charAt(0).toUpperCase() + contract.status.slice(1) : "N/A"}</td>
            <td>${contract.issuer_name || "Unknown"}</td>
            <td>${date}</td>
            <td>${price}</td>
            <td>${jitaValue}</td>
            <td>${markup}</td>
            <td class="${markupClass}">${markupPercent}</td>
            <td>${contract.items_count || 0}</td>
            <td>${appraisalLink}</td>
        `;
        
        contractTableBody.appendChild(row);
    });
}

function updateStats() {
    const validContracts = contractData.filter(contract => 
        contract.markup_percent !== undefined && 
        contract.markup_percent !== null &&
        !isNaN(contract.markup_percent));
    
    const total = contractData.length;
    
    let avgMarkup = 0;
    let minMarkup = Infinity;
    let maxMarkup = -Infinity;
    
    if (validContracts.length > 0) {
        avgMarkup = validContracts.reduce((sum, contract) => sum + contract.markup_percent, 0) / validContracts.length;
        minMarkup = Math.min(...validContracts.map(contract => contract.markup_percent));
        maxMarkup = Math.max(...validContracts.map(contract => contract.markup_percent));
    } else {
        minMarkup = 0;
        maxMarkup = 0;
    }
    
    totalContractsElement.textContent = total;
    
    // Update average markup with appropriate styling
    avgMarkupElement.textContent = `${avgMarkup.toFixed(2)}%`;
    
    // Apply color classes to average markup based on the value
    avgMarkupElement.classList.remove('stats-markup-negative', 'stats-markup-low', 'stats-markup-medium', 'stats-markup-high');
    
    if (avgMarkup < 0) {
        avgMarkupElement.classList.add('stats-markup-negative');
    } else if (avgMarkup <= 20) {
        avgMarkupElement.classList.add('stats-markup-low');
    } else if (avgMarkup <= 30) {
        avgMarkupElement.classList.add('stats-markup-medium');
    } else {
        avgMarkupElement.classList.add('stats-markup-high');
    }
    
    // Update min markup (usually negative, so will be blue)
    minMarkupElement.textContent = `${minMarkup.toFixed(2)}%`;
    minMarkupElement.classList.remove('stats-markup-negative', 'stats-markup-low', 'stats-markup-medium', 'stats-markup-high');
    
    if (minMarkup < 0) {
        minMarkupElement.classList.add('stats-markup-negative');
    } else if (minMarkup <= 20) {
        minMarkupElement.classList.add('stats-markup-low');
    } else if (minMarkup <= 30) {
        minMarkupElement.classList.add('stats-markup-medium');
    } else {
        minMarkupElement.classList.add('stats-markup-high');
    }
    
    // Update max markup (usually positive, could be any range)
    maxMarkupElement.textContent = `${maxMarkup.toFixed(2)}%`;
    maxMarkupElement.classList.remove('stats-markup-negative', 'stats-markup-low', 'stats-markup-medium', 'stats-markup-high');
    
    if (maxMarkup < 0) {
        maxMarkupElement.classList.add('stats-markup-negative');
    } else if (maxMarkup <= 20) {
        maxMarkupElement.classList.add('stats-markup-low');
    } else if (maxMarkup <= 30) {
        maxMarkupElement.classList.add('stats-markup-medium');
    } else {
        maxMarkupElement.classList.add('stats-markup-high');
    }
}

function createOrUpdateChart() {
    const chartCanvas = document.getElementById("markupChart");
    
    // Destroy existing chart if it exists
    if (chart) {
        chart.destroy();
    }
    
    // Prepare data
    const validContracts = contractData.filter(contract => 
        contract.markup_percent !== undefined && 
        contract.markup_percent !== null &&
        !isNaN(contract.markup_percent));
    
    // Group by markup percent ranges with new ranges that match the color scheme
    const ranges = [
        { min: -100, max: 0, label: "Negative", color: '#64b5f6' },  // Light blue
        { min: 0, max: 20, label: "0% to 20%", color: '#66bb6a' },   // Green
        { min: 20, max: 30, label: "20% to 30%", color: '#ffee58' }, // Yellow
        { min: 30, max: Infinity, label: "Above 30%", color: '#ff5252' } // Red
    ];
    
    const data = ranges.map(range => {
        const count = validContracts.filter(contract => 
            contract.markup_percent >= range.min && 
            contract.markup_percent < range.max).length;
        return count;
    });
    
    const labels = ranges.map(range => range.label);
    const colors = ranges.map(range => range.color);
    
    // Create the chart
    chart = new Chart(chartCanvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Contracts',
                data: data,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#e0e0e0'
                    },
                    grid: {
                        color: '#333'
                    }
                },
                x: {
                    ticks: {
                        color: '#e0e0e0'
                    },
                    grid: {
                        color: '#333'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Contract Markup Distribution',
                    color: '#e0e0e0'
                }
            }
        }
    });
}

function downloadLatestCSV() {
    if (latestCsvFile) {
        const link = document.createElement('a');
        link.href = CSV_FILES_URL + latestCsvFile;
        link.download = latestCsvFile;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Utility Functions
function formatISK(value) {
    if (value === undefined || value === null) return "N/A";
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value) + " ISK";
}

function formatTimestamp(timestamp) {
    // Format YYYYMMDD_HHMMSS to a human-readable date
    const year = timestamp.substring(0, 4);
    const month = timestamp.substring(4, 6);
    const day = timestamp.substring(6, 8);
    const hour = timestamp.substring(9, 11);
    const minute = timestamp.substring(11, 13);
    const second = timestamp.substring(13, 15);
    
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}