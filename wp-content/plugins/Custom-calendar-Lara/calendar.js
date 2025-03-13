// Odstranimo podvojeno funkcijo preprocessResources in pustimo samo originalno verzijo
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
    for (let i = 7; i <= 20; i++) {
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
                
                const appointmentData = {
                    id: event.id,
                    title: event.title,
                    start: event.start,
                    end: event.end,
                    resourceId: resource.id,
                    resourceName: resource.title
                };
                
                timeSlotsMap[startTime].addEventListener('click', function() {
                    showAppointmentDetails(appointmentData);
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

// Dodajmo inicializacijo dogodkov
jQuery(document).ready(function() {
    // Dodaj click handler na vse appointment elemente
    jQuery('.fc-event').on('click', function(e) {
        e.preventDefault();
        
        // Pridobi podatke iz event objekta
        const appointmentData = {
            id: jQuery(this).data('id'),
            start: jQuery(this).data('start'),
            end: jQuery(this).data('end'),
            resourceId: jQuery(this).data('resource-id'),
            resourceName: jQuery(this).data('resource-name'),
            patientName: jQuery(this).data('patient-name')
        };
        
        console.log('Kliknjen termin:', appointmentData);
        showAppointmentDetails(appointmentData);
    });
});

// Posodobljena funkcija za prikaz modala
function showAppointmentDetails(appointment) {
    console.log('Prikaz termina:', appointment);

    if (!appointment) {
        console.error('Ni podatkov o terminu');
        return;
    }

    // Pretvori datume v pravilen format
    const startDate = new Date(appointment.start);
    const endDate = new Date(appointment.end);
    
    const formattedDate = startDate.toISOString().split('T')[0];
    const formattedStartTime = startDate.toTimeString().slice(0, 5);
    const formattedEndTime = endDate.toTimeString().slice(0, 5);

    // Izračunaj trajanje v minutah
    const durationMinutes = (endDate - startDate) / (1000 * 60);

    // Ustvari modal
    const modalHtml = `
        <div class="appointment-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
            <div class="modal-content" style="background: white; padding: 20px; border-radius: 5px; min-width: 300px;">
                <h3>Uredi termin</h3>
                <form id="appointment-form">
                    <div class="form-group">
                        <label>Pacient in terapija:</label>
                        <input type="text" name="patient_info" value="${appointment.title || ''}" readonly>
                    </div>
        
                    <div class="form-group">
                        <label>Datum:</label>
                        <input type="date" name="appointment_date" value="${formattedDate}" 
                               onchange="updateAvailableTimeSlots(this.value, '${appointment.resourceId}', ${appointment.id}, ${durationMinutes})">
                    </div>
                
                    <div class="form-group">
                        <label>Čas:</label>
                        <select id="time-slot-select" name="time_slot" 
                                onchange="updateLocationOptions(this.value, document.querySelector('input[name=appointment_date]').value, ${appointment.id})">
                            <option value="${formattedStartTime},${formattedEndTime}" selected>${formattedStartTime} - ${formattedEndTime}</option>
                        </select>
                    </div>
                
                    <div class="form-group">
                        <label>Lokacija:</label>
                        <select id="location-select" name="location" 
                                onchange="updateAvailableTimeSlots(document.querySelector('input[name=appointment_date]').value, this.value, ${appointment.id}, ${durationMinutes})">
                            <option value="${appointment.resourceId}" selected>${appointment.resourceName || ''}</option>
                        </select>
                    </div>
        
                    <input type="hidden" name="appointment_id" value="${appointment.id}">

                    <div class="button-group">
                        <button type="button" class="delete-btn" onclick="handleDeleteAppointment(${appointment.id}, () => this.closest('.appointment-modal').remove())">Izbriši termin</button>
                        <button type="button" class="save-btn" onclick="handleUpdateAppointment(this.form)">Shrani</button>
                        <button type="button" class="cancel-btn" onclick="this.closest('.appointment-modal').remove()">Prekliči</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Dodaj modal v DOM
    jQuery('body').append(modalHtml);

    // Load available time slots and locations
    setTimeout(() => {
        // First, load available locations for current time slot
        updateLocationOptions(`${formattedStartTime},${formattedEndTime}`, formattedDate, appointment.id);
        
        // Then, load available time slots for current date and location
        updateAvailableTimeSlots(formattedDate, appointment.resourceId, appointment.id, durationMinutes);
    }, 100);
}

function updateAvailableTimeSlots(date, locationId, appointmentId, durationMinutes) {
    const timeSelect = document.querySelector('#time-slot-select');
    if (!timeSelect) return;
    
    // Keep track of currently selected value
    const currentValue = timeSelect.value;
    
    console.log('Posodabljam razpoložljive časovne termine:', {
        date: date,
        locationId: locationId,
        appointmentId: appointmentId,
        durationMinutes: durationMinutes
    });
    
    // Show loading state
    timeSelect.disabled = true;
    timeSelect.innerHTML = '<option value="">Nalagam razpoložljive termine...</option>';
    
    jQuery.ajax({
        url: ameliaAjax.ajaxurl,
        type: 'POST',
        data: {
            action: 'amelia_get_available_time_slots',
            security: ameliaAjax.nonce,
            date: date,
            location: locationId,
            duration_minutes: durationMinutes,
            appointment_id: appointmentId
        },
        success: function(response) {
            console.log('Odgovor termini:', response);
            
            timeSelect.innerHTML = '';
            
            if (response.success && response.data && response.data.available_slots) {
                let foundSelected = false;
                
                response.data.available_slots.forEach(slot => {
                    const option = document.createElement('option');
                    option.value = `${slot.start},${slot.end}`;
                    option.textContent = `${slot.start} - ${slot.end}`;
                    
                    // If this was the previously selected value, select it again
                    if (option.value === currentValue) {
                        option.selected = true;
                        foundSelected = true;
                    }
                    
                    timeSelect.appendChild(option);
                });
                
                // If we didn't find the previously selected slot, select the first available one
                if (!foundSelected && response.data.available_slots.length > 0) {
                    timeSelect.value = `${response.data.available_slots[0].start},${response.data.available_slots[0].end}`;
                    
                    // We need to trigger location update with the new time slot
                    const newTimeSlot = timeSelect.value;
                    updateLocationOptions(newTimeSlot, date, appointmentId);
                }
            } else if (response.data && response.data.message) {
                // Show error message
                const option = document.createElement('option');
                option.value = "";
                option.textContent = response.data.message;
                timeSelect.appendChild(option);
            } else {
                // Generic error message
                const option = document.createElement('option');
                option.value = "";
                option.textContent = "Ni razpoložljivih terminov";
                timeSelect.appendChild(option);
            }
            
            // Re-enable select
            timeSelect.disabled = false;
        },
        error: function(xhr, status, error) {
            console.error('Ajax napaka:', {
                status: xhr.status,
                statusText: xhr.statusText,
                responseText: xhr.responseText
            });
            
            // Show error message
            timeSelect.innerHTML = '<option value="">Napaka pri nalaganju terminov</option>';
            timeSelect.disabled = false;
        }
    });
}


// Funkcija za generiranje časovnih intervalov
function generateTimeSlots(durationMinutes) {
    const slots = [];
    const startHour = 7;
    const endHour = 20;

    for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const slotStart = new Date(2000, 0, 1, hour, minute);
            const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

            if (slotEnd.getHours() <= endHour || 
                (slotEnd.getHours() === endHour && slotEnd.getMinutes() === 0)) {
                
                const startTimeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const endTimeStr = `${slotEnd.getHours().toString().padStart(2, '0')}:${slotEnd.getMinutes().toString().padStart(2, '0')}`;
                
                slots.push({
                    start: startTimeStr,
                    end: endTimeStr
                });
            }
        }
    }
    return slots;
}

function updateLocationOptions(timeSlot, date, appointmentId) {
    const [startTime, endTime] = timeSlot.split(',');
    const currentLocationId = document.querySelector('#location-select').value;
    
    console.log('Posodabljam lokacije:', {
        date: date,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        appointmentId: appointmentId,
        currentLocationId: currentLocationId
    });
    
    jQuery.ajax({
        url: ameliaAjax.ajaxurl,
        type: 'POST',
        data: {
            action: 'amelia_get_available_locations',
            security: ameliaAjax.nonce,
            date: date,
            start_time: startTime.trim(),
            end_time: endTime.trim(),
            appointment_id: appointmentId
        },
        beforeSend: function() {
            // Onemogoči select med nalaganjem
            const locationSelect = document.querySelector('#location-select');
            if (locationSelect) {
                locationSelect.disabled = true;
            }
        },
        success: function(response) {
            console.log('Odgovor lokacij:', response);
            
            if (response.success && response.data && response.data.available_locations) {
                const locationSelect = document.querySelector('#location-select');
                if (locationSelect) {
                    // Shrani trenutno izbrano vrednost
                    const selectedValue = locationSelect.value;
                    
                    // Počisti select
                    locationSelect.innerHTML = '';
                    
                    // Uredi lokacije po oddelkih in številkah sob
                    const sortedLocations = sortLocations(response.data.available_locations);
                    
                    // Dodaj možnosti
                    let foundSelected = false;
                    sortedLocations.forEach(location => {
                        const option = document.createElement('option');
                        option.value = location.id;
                        option.textContent = location.title;
                        
                        // Če je to trenutno izbrana lokacija, jo izberi
                        if (location.id === selectedValue || location.id === currentLocationId) {
                            option.selected = true;
                            foundSelected = true;
                        }
                        
                        locationSelect.appendChild(option);
                    });
                    
                    // Če nismo našli izbrane lokacije, izberi prvo
                    if (!foundSelected && sortedLocations.length > 0) {
                        locationSelect.value = sortedLocations[0].id;
                    }
                    
                    // Omogoči select
                    locationSelect.disabled = false;
                }
            } else {
                console.error('Napaka pri pridobivanju lokacij:', response);
                
                const locationSelect = document.querySelector('#location-select');
                if (locationSelect) {
                    locationSelect.innerHTML = '<option value="">Ni razpoložljivih lokacij</option>';
                    locationSelect.disabled = false;
                }
            }
        },
        error: function(xhr, status, error) {
            console.error('Ajax napaka:', {
                status: xhr.status,
                statusText: xhr.statusText,
                responseText: xhr.responseText
            });
            
            // Omogoči select
            const locationSelect = document.querySelector('#location-select');
            if (locationSelect) {
                locationSelect.disabled = false;
                locationSelect.innerHTML = '<option value="">Napaka pri nalaganju lokacij</option>';
            }
        }
    });
}

// Funkcija za urejanje lokacij
function sortLocations(locations) {
    const departmentOrder = { "AKT": 1, "DHL": 2, "DHD": 3 };
    
    return locations.sort((a, b) => {
        const aMatch = a.title.match(/^(.+?) Soba (\d+)/);
        const bMatch = b.title.match(/^(.+?) Soba (\d+)/);
        
        if (aMatch && bMatch) {
            const aDept = aMatch[1];
            const bDept = bMatch[1];
            
            // Najprej uredi po oddelkih
            if (departmentOrder[aDept] !== departmentOrder[bDept]) {
                return (departmentOrder[aDept] || 999) - (departmentOrder[bDept] || 999);
            }
            
            // Nato po številki sobe
            const aRoom = parseInt(aMatch[2]);
            const bRoom = parseInt(bMatch[2]);
            return aRoom - bRoom;
        }
        return 0;
    });
}

// Funkcija za posodobitev termina
function handleUpdateAppointment(form) {
    // Pridobi vrednosti iz forme
    const appointmentId = form.querySelector('input[name="appointment_id"]').value;
    const date = form.querySelector('input[name="appointment_date"]').value;
    const timeSlot = form.querySelector('select[name="time_slot"]').value;
    const locationId = form.querySelector('select[name="location"]').value;
    
    // Pridobi ime pacienta iz readonly polja
    const patientInfo = form.querySelector('input[type="text"][readonly]').value;

    // Preveri če imamo vse potrebne podatke
    if (!appointmentId || !date || !timeSlot || !locationId) {
        console.error('Manjkajoči podatki:', { appointmentId, date, timeSlot, locationId });
        alert('Prosim izpolnite vsa polja');
        return;
    }

    const [startTime, endTime] = timeSlot.split(',').map(time => time.trim());

    // Izpiši podatke v konzolo za debugging
    console.log('Podatki za pošiljanje:', {
        appointmentId,
        patientInfo,
        date,
        startTime,
        endTime,
        locationId
    });

    // Pošlji zahtevek - uporabimo točno takšna imena parametrov, kot jih pričakuje strežnik
    jQuery.ajax({
        url: ameliaAjax.ajaxurl,
        type: 'POST',
        data: {
            action: 'amelia_update_appointment',
            security: ameliaAjax.nonce,
            appointment_id: appointmentId,
            patient_info: patientInfo,
            location: locationId,
            appointment_date: date,
            start_time: startTime,
            end_time: endTime
        },        
        beforeSend: function() {
            console.log('Pošiljam zahtevek z naslednjimi podatki:', {
                action: 'amelia_update_appointment',
                security: ameliaAjax.nonce,
                appointment_id: appointmentId,
                patient_info: patientInfo,
                location: locationId,
                appointment_date: date,
                start_time: startTime,
                end_time: endTime
            });
        },
        success: function(response) {
            console.log('Odgovor strežnika:', response);
            if (response.success) {
                alert('Termin je bil uspešno posodobljen.');
                form.closest('.appointment-modal').remove();
                location.reload();
            } else {
                console.error('Napaka:', response);
                alert(response.data?.message || 'Napaka pri shranjevanju termina.');
            }
        },
        error: function(xhr, status, error) {
            console.error('Ajax napaka:', {
                status: xhr.status,
                statusText: xhr.statusText,
                responseText: xhr.responseText
            });
            try {
                const errorResponse = JSON.parse(xhr.responseText);
                alert('Napaka: ' + (errorResponse.data?.message || 'Neznana napaka'));
            } catch (e) {
                alert('Prišlo je do napake pri posodabljanju termina.');
            }
        }
    });
}

// Funkcija za brisanje termina
function handleDeleteAppointment(appointmentId, closeModal) {
    if (confirm('Ali ste prepričani, da želite izbrisati ta termin?')) {
    jQuery.ajax({
        url: ameliaAjax.ajaxurl,
        type: 'POST',
        data: {
                    action: 'amelia_delete_appointment',
                    security: ameliaAjax.nonce,
                    appointment_id: appointmentId
        },
        success: function(response) {
                    if (response.success) {
                        closeModal();
                        location.reload();
                    } else {
                        alert('Napaka pri brisanju termina.');
                    }
                },
                error: function(error) {
                    console.error('Napaka:', error);
                    alert('Prišlo je do napake pri brisanju termina.');
        }
    });
}
}

// Dodajmo inicializacijo event listenerjev
document.addEventListener('DOMContentLoaded', function() {
    // Poišči vse appointment elemente in dodaj click handler
    const appointments = document.querySelectorAll('.appointment');
    appointments.forEach(appointment => {
        appointment.addEventListener('click', function() {
            console.log('Appointment clicked:', this.dataset);
            const appointmentData = {
                id: this.dataset.id,
                start: this.dataset.start,
                end: this.dataset.end,
                resourceId: this.dataset.resourceId,
                resourceName: this.dataset.resourceName
            };
            showAppointmentDetails(appointmentData);
        });
    });
});