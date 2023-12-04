document.addEventListener('DOMContentLoaded', () => {
  fetch('../sidebar.html')
    .then(response => response.text())
    .then(data => {
      // Set the inner HTML of the sidebar
      document.getElementById('sidebar').innerHTML = data;

      attachFormSubmitListener();
      // setupSidebarToggle();
    })
    .catch(error => console.error('Error loading the sidebar:', error));
});

function goBack() {
  window.history.back(); // Go back to the previous page
}

// function setupSidebarToggle() {
//   const toggleButton = document.getElementById('toggleSidebar');
//   toggleButton.addEventListener('click', toggleSidebar);

//   const sidebarState = localStorage.getItem('sidebarState') || 'shown';
//   setSidebarState(sidebarState);
// }

// function toggleSidebar() {
//   const sidebar = document.getElementById('sidebar');
//   const dashboard = document.getElementById('analytics-dashboard');
//   sidebar.classList.toggle('collapsed');
//   dashboard.classList.toggle('collapsed'); 


//   document.getElementById('toggleSidebar').textContent = sidebar.classList.contains('collapsed') ? '❯' : '❮';
// }


// function setSidebarState(state) {
//   const sidebar = document.getElementById('sidebar');
//   const toggleButton = document.getElementById('toggleSidebar');
//   if (state === 'collapsed') {
//     sidebar.classList.add('collapsed');
//     toggleButton.textContent = '❯';
//   } else {
//     sidebar.classList.remove('collapsed');
//     toggleButton.textContent = '❮';
//   }
// }

  
  function attachFormSubmitListener() {
    const form = document.getElementById('analyticsForm');
    form.addEventListener('submit', function(event) {
      event.preventDefault();
      const authToken = document.getElementById('authToken').value;
      const startDate = document.getElementById('startDate').value;
      const endDate = document.getElementById('endDate').value;
      showLoadingMessage();
      fetchAnalyticsData(authToken, startDate, endDate);
    });
  }

    let currentPage = 1;
    const pageSize = 10; // Adjust based on your API's pagination
    let loadingMoreData = false;
  
    function fetchAnalyticsData(authToken, startDate, endDate) {
      showLoadingMessage();
      fetch('/.netlify/functions/getAnalytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authToken, startDate, endDate })
      })
      .then(response => response.json())
      .then(data => {
        hideLoadingMessage();
        displayReportResults(data);
      })
      .catch(error => {
        console.error('Error:', error);
        hideLoadingMessage();
      });
    }
    

  //window.onscroll = function() {
  //  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight && !loadingMoreData) {
  //    loadingMoreData = true;
  //    currentPage += 1;
  //    fetchAnalyticsData(authToken, startDate, endDate, currentPage);
// }
  // };

  function showLoadingMessage() {
    const loadingElement = document.getElementById('loadingMessage');
    loadingElement.textContent = 'Loading... Please wait.';
    loadingElement.style.display = 'block';
  }
  
  function hideLoadingMessage() {
    document.getElementById('loadingMessage').style.display = 'none';
  }
  
  let csvData = ''; // Global variable to store CSV data

  function displayReportResults(data) {
      const reportResultsElement = document.getElementById('reportResults');
      const downloadCsvButton = document.getElementById('downloadCsv');
      reportResultsElement.innerHTML = '';
  
      // Check if data is empty or undefined
      if (!data || !Array.isArray(data.incidents) || data.incidents.length === 0) {
          reportResultsElement.textContent = 'No data to display.';
          downloadCsvButton.style.display = 'none'; // Hide the CSV download button
          return;
      }
  
      // Data is present, show the CSV download button
      downloadCsvButton.style.display = 'block';
  
      // Store the CSV data for download
      if (data && data.csv) {
          csvData = data.csv;
      }
  
      // Create and display the table with incident data
      const table = createTable(data.incidents);
      reportResultsElement.appendChild(table);
  }
  
function createTable(incidents) {
    const table = document.createElement('table');
    table.setAttribute('border', '1');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const headers = ['id', 'name', 'created_at', 'started_at', 'severity', 'priority', 'tags', 'custom_fields', 'opened_by', 'milestones', 'impacts', 'lessons_learned'];
    const headerRow = document.createElement('tr');
    headers.forEach(headerText => {
      const header = document.createElement('th');
      header.textContent = headerText;
      headerRow.appendChild(header);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    incidents.forEach(incident => {
        const row = document.createElement('tr');
        headers.forEach(header => {
            const cell = document.createElement('td');

            if (header === 'milestones') {
                const text = incident[header] || 'N/A';
                cell.textContent = text.length > 30 ? text.substring(0, 27) + '...' : text;
                cell.style.cursor = 'pointer';
                cell.onclick = function() {
                    if (cell.textContent.endsWith('...')) {
                        cell.textContent = incident[header];
                    } else {
                        cell.textContent = text.substring(0, 27) + '...';
                    }
                };
            } else {
                cell.textContent = incident[header] || 'N/A';
            }

            row.appendChild(cell);
        });
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    return table;
}

function addMilestone() {
    const select = document.getElementById('milestoneDropdown');
    const selectedValue = select.value;
    const selectedDiv = document.getElementById('selectedMilestones');
  
    // Check if the milestone is already selected
    if (Array.from(selectedDiv.children).some(child => child.textContent.includes(selectedValue))) {
      alert('This milestone is already selected.');
      return;
    }
  
    // Create a new span element to display the selected milestone
    const newMilestone = document.createElement('span');
    newMilestone.textContent = selectedValue;
    newMilestone.classList.add('selectedMilestone');
    selectedDiv.appendChild(newMilestone);
  
    // Optionally, add a remove button to each milestone
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.onclick = function() { newMilestone.remove(); };
    newMilestone.appendChild(removeBtn);
  }
  
  document.getElementById('downloadCsv').addEventListener('click', function() {
    if (!csvData) {
        alert('No CSV data available to download.');
        return;
    }

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'analytics-report.csv';
    link.click();
});
