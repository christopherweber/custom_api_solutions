document.addEventListener('DOMContentLoaded', () => {
  attachFormSubmitListener();
  const addFilterBtn = document.getElementById('addFilter');
  if (addFilterBtn) {
      addFilterBtn.addEventListener('click', addFilter);
  }
});

function goBack() {
  window.history.back();
}

function addFilter() {
  // Assuming you want to add a milestone filter
  const filtersContainer = document.getElementById('additionalFilters'); // Make sure this container exists in your HTML
  const newFilter = document.createElement('div');
  newFilter.className = 'form-field';
  newFilter.innerHTML = `
      <label for="milestoneDropdown">Milestone:</label>
      <select id="milestoneDropdown">
          <option value="started">Started</option>
          <option value="detected">Detected</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="investigating">Investigating</option>
          <option value="identified">Identified</option>
          <option value="mitigated">Mitigated</option>
          <option value="resolved">Resolved</option>
          <option value="postmortem_started">Postmortem Started</option>
          <option value="postmortem_completed">Postmortem Completed</option>
      </select>
  `;
  filtersContainer.appendChild(newFilter);
}



// function toggleMilestoneField() {
//   const milestoneField = document.getElementById('milestoneField');
//   const toggleButton = document.getElementById('toggleMilestone');
//   if (milestoneField.style.display === 'none') {
//       milestoneField.style.display = 'block';
//       toggleButton.textContent = '-';
//   } else {
//       milestoneField.style.display = 'none';
//       toggleButton.textContent = '+';
//   }
// }

// function addMilestone() {
//   const select = document.getElementById('milestoneDropdown');
//   const selectedValue = select.value;
//   const selectedDiv = document.getElementById('selectedMilestones');
//   if (Array.from(selectedDiv.children).some(child => child.textContent.includes(selectedValue))) {
//       alert('This milestone is already selected.');
//       return;
//   }
//   const newMilestone = document.createElement('span');
//   newMilestone.textContent = selectedValue;
//   newMilestone.classList.add('selectedMilestone');
//   selectedDiv.appendChild(newMilestone);
//   const removeBtn = document.createElement('button');
//   removeBtn.textContent = 'Remove';
//   removeBtn.onclick = function() { newMilestone.remove(); };
//   newMilestone.appendChild(removeBtn);
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
      const exportButton = document.getElementById('exportCsv');
      if (data && data.length > 0) {
          // Show the export button if data is present
          exportButton.style.display = 'block';
      } else {
          // Hide the export button if no data is present
          exportButton.style.display = 'none';
      }
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
