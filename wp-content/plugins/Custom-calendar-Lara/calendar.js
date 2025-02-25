function preprocessResources(resources) {
    resources.forEach(resource => {
        let parts = resource.title.match(/^(.+?) Soba (\d+) - .+? Postelja (\d+)$/);
        if (parts) {
            resource.deptName = parts[1].trim();
            resource.roomNum = parseInt(parts[2], 10);
            resource.bedNum = parseInt(parts[3], 10);
        }
    });

    return resources.sort((a, b) => {
        const deptOrder = { "AKT": 1, "DHL": 2, "DHD": 3 };
        
        if (deptOrder[a.deptName] !== deptOrder[b.deptName]) {
            return (deptOrder[a.deptName] || 999) - (deptOrder[b.deptName] || 999);
        }
        
        if (a.roomNum !== b.roomNum) {
            return a.roomNum - b.roomNum;
        }
        
        return a.bedNum - b.bedNum;
    });
}

// Helper function to darken a color
function darkenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (
        0x1000000 + 
        (R < 0 ? 0 : R) * 0x10000 + 
        (G < 0 ? 0 : G) * 0x100 + 
        (B < 0 ? 0 : B)
    ).toString(16).slice(1);
}

// This function creates the time header row for the calendar
function createTimeHeaderRow() {
    let hoursRow = document.createElement('tr');
    
    // Add first empty cell for resource name column
    let firstCell = document.createElement('th');
    firstCell.innerText = "Oddelek - Soba - Postelja";
    firstCell.style.textAlign = 'left';
    firstCell.style.width = '200px';
    firstCell.style.padding = '8px';
    firstCell.style.backgroundColor = '#ffffff';
    firstCell.style.borderBottom = '1px solid #ccc';
    firstCell.style.position = 'sticky';
    firstCell.style.top = '32px';
    firstCell.style.zIndex = '100';
    hoursRow.appendChild(firstCell);

    // Add hour cells
    let timeSlots = [];
    for (let i = 7; i <= 19; i++) {
        let hourCell = document.createElement('th');
        hourCell.innerText = i + ":00";
        hourCell.style.textAlign = 'center';
        hourCell.style.border = '1px solid #ddd';
        hourCell.style.width = '40px';
        hourCell.style.fontSize = '13px';
        hourCell.style.padding = '5px';
        hourCell.style.backgroundColor = '#ffffff';
        hourCell.style.position = 'sticky';
        hourCell.style.top = '32px'; 
        hourCell.style.zIndex = '100';
        hourCell.style.fontWeight = 'normal';

        let halfHourCell = document.createElement('th');
        halfHourCell.innerText = i + ":30";
        halfHourCell.style.textAlign = 'center';
        halfHourCell.style.border = '1px solid #ddd';
        halfHourCell.style.width = '40px';
        halfHourCell.style.fontSize = '13px';
        halfHourCell.style.padding = '5px';
        halfHourCell.style.backgroundColor = '#ffffff';
        halfHourCell.style.position = 'sticky';
        halfHourCell.style.top = '32px'; 
        halfHourCell.style.zIndex = '100';
        halfHourCell.style.fontWeight = 'normal';

        hoursRow.appendChild(hourCell);
        hoursRow.appendChild(halfHourCell);
        timeSlots.push(i + ":00", i + ":30");
    }
    
    return { hoursRow, timeSlots };
}

function initStickyHeaders() {
    // Check if WordPress admin bar is present
    const adminBar = document.getElementById('wpadminbar');
    
    // Default offset if no admin bar
    let topOffset = 0;
    
    if (adminBar) {
        topOffset = adminBar.offsetHeight;
        
        window.addEventListener('resize', function() {
            topOffset = adminBar.offsetHeight;
            updateStickyHeaders(topOffset);
        });
    }
    
    // Initial update
    updateStickyHeaders(topOffset);
    
    return topOffset;
}

function updateStickyHeaders(topOffset) {
    const stickyHeaders = document.querySelectorAll('th[style*="position: sticky"]');
    
    stickyHeaders.forEach(header => {
        header.style.top = topOffset + 'px';
    });
}

// Helper function to calculate opacity based on department and room number
function calculateOpacity(deptName, roomNum) {
    let opacity;
    
    if(deptName === 'DHD') {
        const minRoomNum = 7;
        const maxRoomNum = 11;
        const normalizedPos = Math.min(1, Math.max(0, (roomNum - minRoomNum) / (maxRoomNum - minRoomNum)));

        opacity = 0.95 - (normalizedPos * 0.7);
    } else if(deptName === 'AKT') {
        opacity = Math.max(0.25, 1 - (roomNum * 0.25));
    } else {
        opacity = Math.max(0.25, 1 - (roomNum * 0.15));
    }
    return opacity;
}

// Cache for sorted resources and current data
let cachedSortedResources = null;
let currentData = null;

document.addEventListener('DOMContentLoaded', function () {
    let calendarEl = document.getElementById('amelia-calendar');
    let datePicker, roomFilter, filterContainer;

    if(!calendarEl){
        console.error('Element with ID "amelia-calendar" not found');
        return;
    }

    // Create filter container once
    filterContainer = document.createElement('div');
    filterContainer.className = 'filter-container';
    filterContainer.style.marginBottom = '20px';
    filterContainer.style.display = 'flex';
    filterContainer.style.gap = '10px';

    // Create room filter dropdown
    roomFilter = document.createElement('select');
    roomFilter.id = 'roomFilter';
    roomFilter.className = 'room-filter';
    // Removed the fixed width style
    roomFilter.setAttribute("multiple", "multiple");

    // Create date picker
    datePicker = document.createElement('input');
    datePicker.type = 'date';
    datePicker.style.padding = '5px';
    datePicker.id = 'datePicker';

    // Add elements to container
    filterContainer.appendChild(datePicker);
    filterContainer.appendChild(roomFilter);
    

    // Add container to calendar element
    calendarEl.insertBefore(filterContainer, calendarEl.firstChild);

    // Load saved settings
    let savedDate = localStorage.getItem('selectedDate') || new Date().toISOString().split('T')[0];
    let savedRooms = JSON.parse(localStorage.getItem('selectedRooms')) || ['all'];

    datePicker.value = savedDate;

    jQuery('#roomFilter').select2({
        placeholder: "Izberite sobe in postelje",
        allowClear: true,
        width: '100%' // Changed from 300px to 100%
    });

    jQuery('.select2-container').css('width', '100%');

    setTimeout(() => {
        jQuery('.select2-container').css('width', '100%');
    }, 500);
    
    // MutationObserver za zagotovitev pravilne širine
    const observer = new MutationObserver(() => {
        jQuery('.select2-container').css('width', '100%');
    });
    
    const targetNode = document.querySelector('.select2-container');
    
    if (targetNode) {
        observer.observe(targetNode, {
            attributes: true,
            attributeFilter: ['style']
        });
    }
    

    // Room filter change handler
    jQuery('#roomFilter').on('change', function(e) {
        let selectedValues = jQuery(this).val() || ['all'];
        let finalSelection = [];

        if(selectedValues.includes('all') && selectedValues.length > 1) {
            selectedValues = selectedValues.filter(value => value !== 'all');
        }

        selectedValues.forEach(value => {
            if (value === 'all') {
                finalSelection = ['all'];
            } else if (value.startsWith('department_')) {
                const department = value.replace('department_', '');
                // Add all beds from that department
                const departmentBeds = jQuery(this)
                    .find(`option[data-department="${department}"]`)
                    .not('.room-option')
                    .map(function() { return this.value; })
                    .get();
                finalSelection.push(...departmentBeds);
            } else if (value.startsWith('room_')) {
                const [_, department, roomNum] = value.split('_');
                const roomBeds = jQuery(this)
                    .find(`option[data-department="${department}"][data-room="${roomNum}"]`)
                    .map(function() { return this.value; })
                    .get();
                finalSelection.push(...roomBeds);
            } else {
                finalSelection.push(value);
            }
        });

        // Remove duplicates
        finalSelection = [...new Set(finalSelection)];

        // Only update if selection changed
        const currentVal = jQuery(this).val();
        if (JSON.stringify(currentVal) !== JSON.stringify(finalSelection)) {
            jQuery(this).val(finalSelection).trigger('change.select2');
        }

        localStorage.setItem('selectedRooms', JSON.stringify(finalSelection));
        
        if (currentData) {
            loadCalendar(currentData);
        }
    });

    // Date picker change handler
    datePicker.addEventListener('change', function() {
        localStorage.setItem('selectedDate', this.value);
        fetchData(loadCalendar);
    });

    // Initial data fetch
    fetchData(function(data) {
        if (!data || !data.resources) {
            console.error('Invalid data received');
            return;
        }
        currentData = data;
        populateRoomFilter(data.resources, savedRooms);
        loadCalendar(data);
    });
}); 

function fetchData(callback) {
    jQuery.ajax({
        url: ameliaAjax.ajaxurl,
        data: {
            action: 'amelia_get_appointments'
        },
        success: function(response) {
            if (response.success === false) {
                console.error('Server error:', response.data?.error);
                return;
            }
            if (response.resources) {
                cachedSortedResources = preprocessResources(response.resources);
                response.resources = cachedSortedResources;
                
                logRoomNumbers(cachedSortedResources);
            }
            currentData = response;
            callback(response);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error('AJAX error:', textStatus, errorThrown);
        }
    });
}

function logRoomNumbers(resources) {
    const deptRooms = {};

    resources.forEach(resource => {
        if(resource.deptName) {
            if(!deptRooms[resource.deptName]) {
                deptRooms[resource.deptName] = new Set();
            }
            if(resource.roomNum) {
                deptRooms[resource.deptName].add(resource.roomNum);
            }
        }
    });

    for(const dept in deptRooms) {
        const rooms = Array.from(deptRooms[dept]).sort((a, b) => a - b);
    }
}

function populateRoomFilter(resources, savedRooms) {
    let roomFilter = document.getElementById('roomFilter');
    if (!roomFilter) return;

    // Clear existing options
    roomFilter.innerHTML = '';

    // Add "All rooms" option
    let allRoomsOption = document.createElement('option');
    allRoomsOption.value = 'all';
    allRoomsOption.innerText = 'Vse sobe';
    roomFilter.appendChild(allRoomsOption);

    // Group resources by department and room
    let groupedResources = {};
    resources.forEach(room => {
        let parts = room.title.match(/^(.+?) Soba (\d+) - .+? Postelja (\d+)$/);
        if (parts) {
            let department = parts[1].trim();
            let roomNum = parseInt(parts[2], 10);
            let bedNum = parseInt(parts[3], 10);
            
            if (!groupedResources[department]) {
                groupedResources[department] = {};
            }
            if (!groupedResources[department][roomNum]) {
                groupedResources[department][roomNum] = [];
            }
            
            groupedResources[department][roomNum].push({
                ...room,
                bedNumber: bedNum
            });
        }
    });

    // Sort and add options
    const departmentOrder = { "AKT": 1, "DHL": 2, "DHD": 3 };
    
    Object.keys(departmentOrder).forEach(department => {
        if (groupedResources[department]) {
            let departmentGroup = document.createElement('optgroup');
            departmentGroup.label = '';

            let departmentOption = document.createElement('option');
            departmentOption.value = `department_${department}`;
            departmentOption.innerText = department;
            departmentOption.className = 'department-option';
            departmentGroup.appendChild(departmentOption);

            // Sort rooms
            let roomNumbers = Object.keys(groupedResources[department])
                .map(Number)
                .sort((a, b) => a - b);

            roomNumbers.forEach(roomNum => {
                let roomOption = document.createElement('option');
                roomOption.value = `room_${department}_${roomNum}`;
                roomOption.innerText = `Soba ${roomNum}`;
                roomOption.className = 'room-option';
                roomOption.setAttribute('data-department', department);
                departmentGroup.appendChild(roomOption);

                let beds = groupedResources[department][roomNum]
                    .sort((a, b) => a.bedNumber - b.bedNumber);

                beds.forEach(bed => {
                    let bedOption = document.createElement('option');
                    bedOption.value = bed.id;
                    bedOption.innerText = `Postelja ${bed.bedNumber}`;
                    bedOption.setAttribute('data-department', department);
                    bedOption.setAttribute('data-room', roomNum);
                    bedOption.className = 'bed-option';
                    departmentGroup.appendChild(bedOption);
                });
            });

            roomFilter.appendChild(departmentGroup);
        }
    });

    jQuery('#roomFilter').select2({
        placeholder: "Izberite sobe in postelje",
        allowClear: true,
        width: '100%', // Changed from 300px to 100%
        templateResult: formatOption
    }).val(savedRooms).trigger('change');
}

function formatOption(option) {
    if (!option.element) return option.text;

    let $option = jQuery('<span></span>');
    $option.text(option.text);

    if (option.element.className === 'department-option') {
        $option.css({
            'font-weight': 'bold',
            'color': '#333',
            'padding-left': '0'
        });
    } else if (option.element.className === 'room-option') {
        $option.css({
            'font-weight': 'bold',
            'padding-left': '20px',
            'color': '#444'
        });
    } else if (option.element.className === 'bed-option') {
        $option.css({
            'padding-left': '40px',
            'color': '#666'
        });
    }

    return $option;
}

function loadCalendar(data) {
    const calendarEl = document.getElementById('amelia-calendar');
    const selectedDate = document.getElementById('datePicker').value;
    const selectedRooms = jQuery('#roomFilter').val() || ['all'];

    // Create main container for table
    let calendarContainer = document.querySelector('.calendar-container');
    if (!calendarContainer) {
        calendarContainer = document.createElement('div');
        calendarContainer.className = 'calendar-container';
        calendarEl.appendChild(calendarContainer);
    } else {
        calendarContainer.innerHTML = '';
    }

    let table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.tableLayout = 'fixed';
    
    const { hoursRow, timeSlots } = createTimeHeaderRow();
    table.appendChild(hoursRow);

    let resources = cachedSortedResources;
    if (selectedRooms.length > 0 && !selectedRooms.includes('all')) {
        resources = resources.filter(resource => 
            selectedRooms.some(room => room.trim() === resource.id.trim())
        );
    }

    let filteredEvents = data.events.filter(event => event.start.startsWith(selectedDate));
    
    const departmentColors = {
        "AKT": "#4FA5D8", 
        "DHL": "#66D9A3", 
        "DHD": "#FF9999"  
    };

    let lastDepartment = null;

    resources.forEach(resource => {
        if (resource.deptName && resource.deptName !== lastDepartment) {
            lastDepartment = resource.deptName;
            
            // Add department separator
            let separatorRow = document.createElement('tr');
            let separatorCell = document.createElement('td');
            separatorCell.colSpan = timeSlots.length + 1;
            separatorCell.style.backgroundColor = '#f9f9f9';
            separatorCell.style.padding = '5px 10px';
            separatorCell.style.fontWeight = 'bold';
            separatorCell.style.color = '#333';
            separatorCell.style.borderBottom = '1px solid #ccc';
            separatorCell.innerText = resource.deptName;
            separatorRow.appendChild(separatorCell);
            table.appendChild(separatorRow);
            

        }
        
        let row = document.createElement('tr');
        
        let resourceCell = document.createElement('td');
        let simplifiedTitle = resource.title;
        if (resource.deptName && resource.roomNum && resource.bedNum) {
            simplifiedTitle = `${resource.deptName} Soba ${resource.roomNum} - Postelja ${resource.bedNum}`;
        }
        resourceCell.innerText = simplifiedTitle;
        resourceCell.style.border = '1px solid #ddd';
        resourceCell.style.borderRight = '1px solid #ccc';
        resourceCell.style.fontWeight = 'bold';
        resourceCell.style.padding = '8px 10px';
        resourceCell.style.position = 'sticky';
        resourceCell.style.left = '0';
        resourceCell.style.backgroundColor = '#ffffff';
        resourceCell.style.zIndex = '5';
        resourceCell.style.fontSize = '12px';
        
        let baseColor = departmentColors[resource.deptName] || '#cccccc';
        
        if (resource.deptName) {
            resourceCell.style.borderLeft = `3px solid ${baseColor}`;
        }
        
        row.appendChild(resourceCell);

        let timeSlotsMap = {};
        timeSlots.forEach(time => {
            timeSlotsMap[time] = document.createElement('td');
            timeSlotsMap[time].style.border = '1px solid #ddd';
            timeSlotsMap[time].style.padding = '5px';
            timeSlotsMap[time].style.backgroundColor = '#ffffff';
            row.appendChild(timeSlotsMap[time]);
        });

        const resourceEvents = filteredEvents.filter(event => 
            event.resourceId === resource.id
        );

        resourceEvents.forEach(event => {
            let startDate = new Date(event.start);
            let endDate = new Date(event.end);
            
            let startHour = startDate.getHours();
            let startMinutes = startDate.getMinutes();
            let endHour = endDate.getHours();
            let endMinutes = endDate.getMinutes();

            let startTime = startHour + ":" + (startMinutes === 0 ? "00" : "30");
            let endTime = endHour + ":" + (endMinutes === 0 ? "00" : "30");

            let startIndex = timeSlots.indexOf(startTime);
            let endIndex = timeSlots.indexOf(endTime);
            
            if (startIndex === -1 || endIndex === -1) {
                console.warn('Invalid time range:', startTime, endTime);
                return;
            }
            
            let colSpan = endIndex - startIndex;
            
            if (colSpan <= 0) {
                console.warn('Invalid span for event:', event.title, startTime, endTime);
                return;
            }

            if (timeSlotsMap[startTime]) {
                timeSlotsMap[startTime].colSpan = colSpan;
                
                const roomNum = resource.roomNum || 0;
                
                let opacity = calculateOpacity(resource.deptName, roomNum);
                
                let r = parseInt(baseColor.slice(1, 3), 16);
                let g = parseInt(baseColor.slice(3, 5), 16);
                let b = parseInt(baseColor.slice(5, 7), 16);

                timeSlotsMap[startTime].style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                timeSlotsMap[startTime].style.color = '#333333';
                timeSlotsMap[startTime].style.border = 'none';
                timeSlotsMap[startTime].style.outline = '1px solid #bbbbbb'; // Light grey outline
                timeSlotsMap[startTime].style.borderRadius = '4px';
                timeSlotsMap[startTime].style.margin = '0';
                timeSlotsMap[startTime].style.padding = '5px';
                timeSlotsMap[startTime].style.textAlign = 'center';
                timeSlotsMap[startTime].style.whiteSpace = 'nowrap';
                timeSlotsMap[startTime].style.overflow = 'hidden';
                timeSlotsMap[startTime].style.textOverflow = 'ellipsis';
                timeSlotsMap[startTime].style.fontWeight = 'normal';
                timeSlotsMap[startTime].style.position = 'relative';
                timeSlotsMap[startTime].style.zIndex = '1';
                timeSlotsMap[startTime].innerText = event.title;
                timeSlotsMap[startTime].style.cursor = 'pointer';
                
                const eventForModal = {...event};
                
                timeSlotsMap[startTime].addEventListener('click', function() {
                    showAppointmentDetails(eventForModal);
                });

                for (let i = startIndex + 1; i < endIndex; i++) {
                    if (timeSlotsMap[timeSlots[i]]) {
                        timeSlotsMap[timeSlots[i]].style.display = 'none';
                    }
                }
            }
        });

        table.appendChild(row);
    });

    calendarContainer.appendChild(table);
    initStickyHeaders();
}

// Function to show appointment details
function showAppointmentDetails(appointment) {
    const backdrop = document.createElement('div');
    backdrop.className = 'appointment-modal-backdrop';
    backdrop.style.position = 'fixed';
    backdrop.style.top = '0';
    backdrop.style.left = '0';
    backdrop.style.width = '100%';
    backdrop.style.height = '100%';
    backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    backdrop.style.zIndex = '1000';
    backdrop.style.display = 'flex';
    backdrop.style.justifyContent = 'center';
    backdrop.style.alignItems = 'center';
    
    const startDate = new Date(appointment.start);
    const endDate = new Date(appointment.end);

    const day = startDate.getDate().toString().padStart(2, '0');
    const month = (startDate.getMonth() + 1).toString().padStart(2, '0');
    const year = startDate.getFullYear();
    const formattedDate = `${day}.${month}.${year}`;
    
    const formattedStartTime = startDate.getHours().toString().padStart(2, '0') + ':' + startDate.getMinutes().toString().padStart(2, '0');
    const formattedEndTime = endDate.getHours().toString().padStart(2, '0') + ':' + endDate.getMinutes().toString().padStart(2, '0');
    
    const departmentMatch = appointment.resourceId.match(/^([^-]+)/);
    const department = departmentMatch ? departmentMatch[1].trim() : '';

    let deptColor = '#cccccc';
    if (department === 'AKT') deptColor = '#4FA5D8';
    else if (department === 'DHL') deptColor = '#66D9A3';
    else if (department === 'DHD') deptColor = '#FF9999';
    
    const appointmentId = appointment.id || '';
    
    const modal = document.createElement('div');
    modal.className = 'appointment-modal';
    modal.style.backgroundColor = '#fff';
    modal.style.borderRadius = '5px';
    modal.style.padding = '20px';
    modal.style.width = '400px';
    modal.style.maxWidth = '90%';
    modal.style.maxHeight = '80%';
    modal.style.overflowY = 'auto';
    modal.style.position = 'relative';
    modal.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    
    modal.innerHTML = `
        <div style="border-left: 4px solid ${deptColor}; padding-left: 15px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; margin-bottom: 5px;">${appointment.title}</h3>
        </div>
        
        <button class="close-button" style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
        
        <div style="margin-bottom: 20px;">
            <h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 5px;">Podrobnosti</h4>
            <p><strong>Datum:</strong> ${formattedDate}</p>
            <p><strong>Čas:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
            <p><strong>Številka pacienta in terapija:</strong> ${appointment.title}</p>
            <p><strong>Lokacija:</strong> ${appointment.resourceId}</p>
            <p><strong>ID Termina:</strong> <span class="appointment-id">${appointmentId}</span></p>
        </div>
        
        <div style="text-align: right; border-top: 1px solid #eee; padding-top: 15px; margin-top: 10px; display: flex; justify-content: space-between;">
            <button class="delete-btn" style="background-color: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Izbriši termin</button>
            <button class="close-btn" style="background-color: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Close</button>
        </div>
    `;
    
    backdrop.appendChild(modal);
    
    document.body.appendChild(backdrop);

    backdrop.addEventListener('click', function(e) {
        if (e.target === backdrop) {
            document.body.removeChild(backdrop);
        }
    });
    
    modal.querySelector('.close-button').addEventListener('click', function() {
        document.body.removeChild(backdrop);
    });
    
    modal.querySelector('.close-btn').addEventListener('click', function() {
        document.body.removeChild(backdrop);
    });
    
    // Add delete button event listener
    modal.querySelector('.delete-btn').addEventListener('click', function() {
        if (confirm('Ali ste prepričani, da želite izbrisati ta termin?')) {
            deleteAppointment(appointmentId, backdrop);
        }
    });
}

// Add a new function to handle appointment deletion
function deleteAppointment(appointmentId, modalBackdrop) {
    // Check if we have a valid appointment ID
    if (!appointmentId) {
        alert('ID termina ni na voljo. Brisanje ni mogoče.');
        return;
    }
    
    // Show loading state
    const deleteBtn = modalBackdrop.querySelector('.delete-btn');
    const originalText = deleteBtn.textContent;
    deleteBtn.textContent = 'Brisanje...';
    deleteBtn.disabled = true;
    
    // Make AJAX request to delete the appointment
    jQuery.ajax({
        url: ameliaAjax.ajaxurl,
        type: 'POST',
        data: {
            action: 'amelia_delete_appointment',
            appointment_id: appointmentId,
            security: ameliaAjax.nonce
        },
        success: function(response) {
            if (response.success) {
                // Close the modal
                document.body.removeChild(modalBackdrop);
                
                // Show success message
                alert(response.data.message || 'Termin je bil uspešno izbrisan.');
                
                // Refresh the calendar data
                fetchData(loadCalendar);
            } else {
                // Show error message
                alert(response.data.message || 'Napaka pri brisanju termina.');
                
                // Reset button
                deleteBtn.textContent = originalText;
                deleteBtn.disabled = false;
            }
        },
        error: function() {
            // Show error message
            alert('Napaka pri povezavi s strežnikom. Poskusite znova.');
            
            // Reset button
            deleteBtn.textContent = originalText;
            deleteBtn.disabled = false;
        }
    });
}