let organizedLocations = null;
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
    } else if(deptName === 'DHL') {
        // Posebna obravnava za DHL oddelek s 6 sobami
        // Predpostavljamo, da so številke sob od 1 do 6
        const minRoomNum = 1;
        const maxRoomNum = 6;
        
        // Izračunajmo normalizirano pozicijo (vrednost med 0 in 1)
        const normalizedPos = Math.min(1, Math.max(0, (roomNum - minRoomNum) / (maxRoomNum - minRoomNum)));
        
        // Prilagodimo opacity vrednosti za bolj raznolike barve
        // Začnemo z 0.95 in se spustimo največ do 0.4, da ostane vse dobro vidno
        opacity = 0.95 - (normalizedPos * 0.55);
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

    organizedLocations = groupedResources;

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

// Posodobljen del funkcije showAppointmentDetails
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

    // Najprej preveri pravice uporabnika
    jQuery.ajax({
        url: ameliaAjax.ajaxurl,
        type: 'POST',
        data: {
            action: 'amelia_check_permissions',
            security: ameliaAjax.nonce
        },
        success: function(permissionResponse) {
            const canEdit = permissionResponse.success && permissionResponse.data.canEdit;
            
            // Nato pridobi podatke o terminu
            jQuery.ajax({
                url: ameliaAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'amelia_get_appointment_details',
                    security: ameliaAjax.nonce,
                    appointment_id: appointment.id
                },
                success: function(response) {
                    let patientName = '';
                    let therapy = '';
                    
                    if (response.success && response.data) {
                        patientName = response.data.firstName || '';
                        therapy = response.data.lastName || '';
                    } else {
                        // Fallback na razdelitev naslova, če AJAX klic ne uspe
                        const fullTitle = appointment.title || '';
                        const titleParts = fullTitle.split(' ');
                        if (titleParts.length > 0) {
                            patientName = titleParts[0]; // Prvi del za pacienta
                            if (titleParts.length > 1) {
                                therapy = titleParts.slice(1).join(' '); // Ostalo za terapijo
                            }
                        }
                    }
                    
                    // Ustvari modal z dejanskimi podatki in informacijo o pravicah
                    createAppointmentModal(appointment, patientName, therapy, formattedDate, formattedStartTime, formattedEndTime, durationMinutes, canEdit);
                },
                error: function() {
                    // Če pride do napake, uporabi razdelitev naslova
                    const fullTitle = appointment.title || '';
                    const titleParts = fullTitle.split(' ');
                    let patientName = '';
                    let therapy = '';
                    
                    if (titleParts.length > 0) {
                        patientName = titleParts[0]; // Prvi del za pacienta
                        if (titleParts.length > 1) {
                            therapy = titleParts.slice(1).join(' '); // Ostalo za terapijo
                        }
                    }
                    
                    // Ustvari modal z razdeljenimi podatki
                    createAppointmentModal(appointment, patientName, therapy, formattedDate, formattedStartTime, formattedEndTime, durationMinutes, false); // Ob napaki privzamemo, da ni dovoljenja
                }
            });
        },
        error: function() {
            // Če pride do napake pri preverjanju pravic, privzamemo, da uporabnik nima pravic
            jQuery.ajax({
                url: ameliaAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'amelia_get_appointment_details',
                    security: ameliaAjax.nonce,
                    appointment_id: appointment.id
                },
                success: function(response) {
                    let patientName = '';
                    let therapy = '';
                    
                    if (response.success && response.data) {
                        patientName = response.data.firstName || '';
                        therapy = response.data.lastName || '';
                    } else {
                        const fullTitle = appointment.title || '';
                        const titleParts = fullTitle.split(' ');
                        if (titleParts.length > 0) {
                            patientName = titleParts[0];
                            if (titleParts.length > 1) {
                                therapy = titleParts.slice(1).join(' ');
                            }
                        }
                    }
                    
                    createAppointmentModal(appointment, patientName, therapy, formattedDate, formattedStartTime, formattedEndTime, durationMinutes, false);
                },
                error: function() {
                    const fullTitle = appointment.title || '';
                    const titleParts = fullTitle.split(' ');
                    let patientName = '';
                    let therapy = '';
                    
                    if (titleParts.length > 0) {
                        patientName = titleParts[0];
                        if (titleParts.length > 1) {
                            therapy = titleParts.slice(1).join(' ');
                        }
                    }
                    
                    createAppointmentModal(appointment, patientName, therapy, formattedDate, formattedStartTime, formattedEndTime, durationMinutes, false);
                }
            });
        }
    });
}

// Nova pomožna funkcija za ustvarjanje modalnega okna
function createAppointmentModal(appointment, patientName, therapy, formattedDate, formattedStartTime, formattedEndTime, durationMinutes, canEdit) {
    // Pridobi ime oddelka za barvno kodiranje
    const departmentMatch = appointment.resourceId.match(/^([^-]+)/);
    const department = departmentMatch ? departmentMatch[1].trim() : '';
    
    let deptColor = '#cccccc';
    if (department === 'AKT') deptColor = '#4FA5D8';
    else if (department === 'DHL') deptColor = '#66D9A3';
    else if (department === 'DHD') deptColor = '#FF9999';
    
    // Pripravi gumbe glede na pravice
    const editButtonHtml = canEdit ? 
        `<button type="button" class="edit-btn" 
            style="padding: 12px 24px; border: none; border-radius: 6px; background-color: #007bff; color: white; font-size: 16px; cursor: pointer; transition: background-color 0.3s;"
            onclick="toggleEditMode(true, window.currentAppointment)">
            Uredi
        </button>` : 
        `<button type="button" class="edit-btn-disabled" 
            style="padding: 12px 24px; border: none; border-radius: 6px; background-color: #ccc; color: white; font-size: 16px; cursor: not-allowed;"
            onclick="showPermissionAlert()">
            Uredi
        </button>`;
        
    const deleteButtonHtml = canEdit ? 
        `<button type="button" class="delete-btn" 
            style="padding: 12px 24px; border: none; border-radius: 6px; background-color: #dc3545; color: white; font-size: 16px; cursor: pointer; transition: background-color 0.3s;"
            onclick="handleDeleteAppointment(${appointment.id}, () => document.querySelector('.appointment-modal').remove())">
            Izbriši termin
        </button>` : 
        `<button type="button" class="delete-btn-disabled" 
            style="padding: 12px 24px; border: none; border-radius: 6px; background-color: #ccc; color: white; font-size: 16px; cursor: not-allowed;"
            onclick="showPermissionAlert()">
            Izbriši termin
        </button>`;
    
    // Ustvari modal s pogledom podrobnosti (privzeto)
    const modalHtml = `
        <div class="appointment-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
            <div class="modal-content" style="background: white; padding: 30px; border-radius: 8px; min-width: 400px; width: 90%; max-width: 600px; max-height: 95vh; overflow-y: auto; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
                <!-- Pogled za podrobnosti -->
                <div id="details-view">
                    <div style="border-left: 4px solid ${deptColor}; padding-left: 15px; margin-bottom: 20px;">
                        <h2 style="margin-top: 0; color: #333;">Podrobnosti termina</h2>
                    </div>
                    
                    <button class="close-button" style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
                    
                    <dl style="margin-bottom: 25px;">
                        <dt style="font-weight: bold; margin-bottom: 8px;">Pacient:</dt>
                        <dd style="margin: 0 0 15px 0;">${patientName}</dd>
                        
                        <dt style="font-weight: bold; margin-bottom: 8px;">Terapija:</dt>
                        <dd style="margin: 0 0 15px 0;">${therapy}</dd>
                        
                        <dt style="font-weight: bold; margin-bottom: 8px;">Datum:</dt>
                        <dd style="margin: 0 0 15px 0;">${formattedDate}</dd>
                        
                        <dt style="font-weight: bold; margin-bottom: 8px;">Čas:</dt>
                        <dd style="margin: 0 0 15px 0;">${formattedStartTime} - ${formattedEndTime}</dd>

                        <dt style="font-weight: bold; margin-bottom: 8px;">Trajanje:</dt>
                        <dd style="margin: 0 0 15px 0;">${formatDuration(Math.round(durationMinutes))}</dd>
                        
                        <dt style="font-weight: bold; margin-bottom: 8px;">Lokacija:</dt>
                        <dd style="margin: 0 0 15px 0;">${appointment.resourceName || ''}</dd>
                        
                        <dt style="font-weight: bold; margin-bottom: 8px;">ID Termina:</dt>
                        <dd style="margin: 0 0 15px 0;"><span class="appointment-id">${appointment.id}</span></dd>
                    </dl>
                    
                    <div class="button-group" style="display: flex; justify-content: space-between; margin-top: 30px;">
                        ${deleteButtonHtml}
                        <div>
                            <button type="button" class="close-btn" 
                                    style="padding: 12px 24px; margin-right: 10px; border: none; border-radius: 6px; background-color: #6c757d; color: white; font-size: 16px; cursor: pointer; transition: background-color 0.3s;"
                                    onclick="document.querySelector('.appointment-modal').remove()">
                                Zapri
                            </button>
                            ${editButtonHtml}
                        </div>
                    </div>
                </div>
                
                <!-- Pogled za urejanje (skrit na začetku) -->
                <div id="edit-view" style="display: none; position: relative; z-index: 10">
                    <h2 style="margin-top: 0; color: #333; border-bottom: 2px solid #f0f0f0; padding-bottom: 15px;">Uredi termin</h2>
                    <form id="appointment-form" style="margin-top: 20px;">
                        <div class="form-group" style="margin-bottom: 25px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 16px;">Pacient:</label>
                            <input type="text" name="patient_name" value="${patientName}" 
                                   style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px; box-sizing: border-box;">
                        </div>
            
                        <div class="form-group" style="margin-bottom: 25px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 16px;">Terapija:</label>
                            <input type="text" name="therapy" value="${therapy}" 
                                   style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px; box-sizing: border-box;">
                        </div>
            
                        <div class="form-group" style="margin-bottom: 25px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 16px;">Datum:</label>
                            <input type="date" name="appointment_date" value="${formattedDate}" 
                                   style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px; box-sizing: border-box;"
                                   onchange="updateAvailableTimeSlots(this.value, '${appointment.resourceId}', ${appointment.id}, ${durationMinutes})">
                        </div>
                    
                        <div class="form-group" style="margin-bottom: 25px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 16px;">Čas:</label>
                            <select id="time-slot-select" name="time_slot" 
                                    style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px; box-sizing: border-box; background-color: white;"
                                    onchange="updateLocationOptions(this.value, document.querySelector('input[name=appointment_date]').value, ${appointment.id})">
                                <option value="${formattedStartTime},${formattedEndTime}" selected>${formattedStartTime} - ${formattedEndTime}</option>
                            </select>
                        </div>

                        <div class="form-group" style="margin-bottom: 25px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 16px;">Trajanje:</label>
                            <select id="duration-select" name="duration" 
                                    style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px; box-sizing: border-box; background-color: white;">
                            </select>
                        </div> 
                    
                        <div class="form-group" style="margin-bottom: 25px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 16px;">Lokacija:</label>
                            <select id="location-select" name="location" 
                                    style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px; box-sizing: border-box; background-color: white;"
                                    onchange="updateAvailableTimeSlots(document.querySelector('input[name=appointment_date]').value, this.value, ${appointment.id}, ${durationMinutes})">
                                <option value="${appointment.resourceId}" selected>${appointment.resourceName || ''}</option>
                            </select>
                        </div>
            
                        <input type="hidden" name="appointment_id" value="${appointment.id}">

                        <div class="button-group" style="display: flex; justify-content: space-between; margin-top: 30px;">
                            <button type="button" class="delete-btn" 
                                    style="padding: 12px 24px; border: none; border-radius: 6px; background-color: #dc3545; color: white; font-size: 16px; cursor: pointer; transition: background-color 0.3s;"
                                    onclick="handleDeleteAppointment(${appointment.id}, () => document.querySelector('.appointment-modal').remove())">
                                Izbriši termin
                            </button>
                            <div style="display: flex; gap: 15px;">
                                <button type="button" class="cancel-btn" 
                                        style="padding: 12px 24px; border: none; border-radius: 6px; background-color: #6c757d; color: white; font-size: 16px; cursor: pointer; transition: background-color 0.3s;"
                                        onclick="toggleEditMode(false)">
                                    Prekliči
                                </button>
                                <button type="button" class="save-btn" 
                                        style="padding: 12px 24px; border: none; border-radius: 6px; background-color: #28a745; color: white; font-size: 16px; cursor: pointer; transition: background-color 0.3s;"
                                        onclick="handleUpdateAppointment(this.form)">
                                    Shrani
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Dodaj modal v DOM
    jQuery('body').append(modalHtml);
    
    // Funkcija za prikaz opozorila o pomanjkanju pravic
    window.showPermissionAlert = function() {
        alert('Nimate dovoljenja za urejanje ali brisanje terminov.');
    };
    
    // Funkcija za preklop med pogledi, ki upošteva pravice
    window.toggleEditMode = function(showEditMode, appointment) {
        if (showEditMode && !canEdit) {
            showPermissionAlert();
            return;
        }
        
        const detailsView = document.getElementById('details-view');
        const editView = document.getElementById('edit-view');
        
        if (showEditMode) {
            detailsView.style.display = 'none';
            editView.style.display = 'block';
            editView.style.zIndex = '10';

            const durationSelect = document.getElementById('duration-select');
            if (durationSelect) {
                durationSelect.innerHTML = '';
                const start = new Date(appointment.start);
                const end = new Date(appointment.end);
                const durationMinutes = (end - start) / (1000 * 60); // Trajanje v minutah
                for (let i = 30; i <= 570; i += 30) {
                    const option = document.createElement('option');
                    option.value = i;
                    let hours = Math.floor(i / 60);
                    let minutes = i % 60;
                    let text = '';

                    if (hours > 0) {
                        if (hours === 1) text += '1 ura';
                        else if (hours === 2) text += '2 uri';
                        else if (hours === 3) text += '3 ure';
                        else if (hours === 4) text += '4 ure';
                        else text += `${hours} ur`;
                    }

                    if (minutes > 0) {
                        if (text !== '') text += ' ';
                        text += `${minutes} min`;
                    }

                    option.textContent = text || `${i} min`;
                    if (i === durationMinutes) {
                        option.selected = true;
                    }
                    durationSelect.appendChild(option);
                }

                // Ob spremembi dolžine ponovno naloži proste termine
                durationSelect.addEventListener('change', () => {
                    const newDuration = parseInt(durationSelect.value, 10);
                    const date = document.querySelector('input[name="appointment_date"]').value;
                    const locationId = document.querySelector('#location-select')?.value || '';
                    updateAvailableTimeSlots(date, locationId, appointment.id, newDuration);
                });
            }
            
            // Load available time slots and locations
            setTimeout(() => {
                updateLocationOptions(`${formattedStartTime},${formattedEndTime}`, formattedDate, appointment.id);
                updateAvailableTimeSlots(formattedDate, appointment.resourceId, appointment.id, durationMinutes);
            }, 100);
        } else {
            detailsView.style.display = 'block';
            editView.style.display = 'none';
        }
    };
    
    // Dodaj handler za zapiranje modala
    document.querySelector('.close-button').addEventListener('click', function() {
        document.querySelector('.appointment-modal').remove();
    });
    window.currentAppointment = appointment; // Shranimo trenutni termin za dostop v funkcijah
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

function updateLocationOptions(timeSlot, date, appointmentId) {
    const [startTime, endTime] = timeSlot.split(',');
    const locationSelect = document.querySelector('#location-select');
    const currentLocationId = locationSelect ? locationSelect.value : '';
    
    // Onemogoči select med nalaganjem
    if (locationSelect) {
        locationSelect.disabled = true;
        locationSelect.innerHTML = '<option value="">Nalagam lokacije...</option>';
    }
    
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
        success: function(response) {
            console.log('Odgovor lokacij:', response);
            
            if (response.success && response.data && response.data.locations) {
                // Uporabite novo funkcijo za prikaz lokacij s podatki o razpoložljivosti
                populateLocationSelect(response.data.locations, currentLocationId);
                
                // Omogoči select
                if (locationSelect) {
                    locationSelect.disabled = false;
                }
            } else {
                console.error('Napaka pri pridobivanju lokacij:', response);
                
                if (locationSelect) {
                    locationSelect.innerHTML = '<option value="">Ni razpoložljivih lokacij</option>';
                    locationSelect.disabled = false;
                }
            }
        },
        error: function(xhr, status, error) {
            console.error('Ajax napaka:', error);
            
            if (locationSelect) {
                locationSelect.innerHTML = '<option value="">Napaka pri nalaganju lokacij</option>';
                locationSelect.disabled = false;
            }
        }
    });
}

function sortLocations(locations) {
    // Definirajmo redosled oddelkov
    const departmentOrder = { "AKT": 1, "DHL": 2, "DHD": 3 };
    
    // Najprej parsirajmo lokacije, da dobimo strukturirane podatke
    const structuredLocations = locations.map(loc => {
        // Za id in title vzamemo tisto, kar je na voljo
        const locString = loc.id || loc.title || '';
        const parts = locString.split(' - ');
        
        // Ekstrahirajmo informacije iz delov lokacije
        const dept = parts[0]?.trim() || '';
        
        // Poiščemo številko sobe
        let roomNum = 999;
        if (parts[1]) {
            const roomMatch = parts[1].match(/Soba\s+(\d+)/i);
            if (roomMatch) {
                roomNum = parseInt(roomMatch[1], 10);
            }
        }
        
        // Poiščemo številko postelje
        let bedNum = 999;
        if (parts[2]) {
            const bedMatch = parts[2].match(/Postelja\s+(\d+)/i);
            if (bedMatch) {
                bedNum = parseInt(bedMatch[1], 10);
            }
        }
        
        // Vrnemo originalni objekt z dodanimi sortirnimi polji
        return {
            ...loc,
            _dept: dept,
            _roomNum: roomNum,
            _bedNum: bedNum,
            _deptOrder: departmentOrder[dept] || 999
        };
    });

    // Nato sortiramo po treh nivojih
    structuredLocations.sort((a, b) => {
        // 1. Najprej po oddelku
        if (a._deptOrder !== b._deptOrder) {
            return a._deptOrder - b._deptOrder;
        }
        
        // 2. Nato po številki sobe
        if (a._roomNum !== b._roomNum) {
            return a._roomNum - b._roomNum;
        }
        
        // 3. Nazadnje po številki postelje
        return a._bedNum - b._bedNum;
    });
    
    // Za debugging
    console.log('Strukturirane lokacije (po sortiranju):', structuredLocations);
    
    // Vrnemo sortirane objekte brez pomožnih polj
    return structuredLocations;
}

function handleUpdateAppointment(form) {
    // Pridobi vrednosti iz forme
    const appointmentId = form.querySelector('input[name="appointment_id"]').value;
    const date = form.querySelector('input[name="appointment_date"]').value;
    const timeSlot = form.querySelector('select[name="time_slot"]').value;
    const locationId = form.querySelector('select[name="location"]').value;

    const durationSelect = document.getElementById('duration-select');
    const durationMinutes = durationSelect ? parseInt(durationSelect.value, 10) : null;
    const durationSeconds = durationMinutes ? durationMinutes * 60 : null;
    
    // Pridobi vrednosti za pacienta in terapijo
    const patientName = form.querySelector('input[name="patient_name"]').value.trim();
    const therapy = form.querySelector('input[name="therapy"]').value.trim();
    
    // Preveri če imamo vse potrebne podatke
    if (!appointmentId || !date || !timeSlot || !locationId) {
        console.error('Manjkajoči podatki:', { appointmentId, date, timeSlot, locationId });
        alert('Prosim izpolnite vsa obvezna polja (Datum, Čas in Lokacija)');
        return;
    }

    const [startTime, endTime] = timeSlot.split(',').map(time => time.trim());

    // Pripravi objekt s podatki o pacientu
    const patientInfo = {
        firstName: patientName,
        lastName: therapy,
        fullName: (patientName + ' ' + therapy).trim()
    };

    // Pošlji zahtevek
    jQuery.ajax({
        url: ameliaAjax.ajaxurl,
        type: 'POST',
        data: {
            action: 'amelia_update_appointment',
            security: ameliaAjax.nonce,
            appointment_id: appointmentId,
            patient_info: patientInfo,  // Pravilno pošiljanje podatkov o pacientu
            location: locationId,
            appointment_date: date,
            start_time: startTime,
            end_time: endTime,
            duration: durationSeconds
        },        
        beforeSend: function() {
            // Onemogoči gumbe med pošiljanjem zahtevka
            const saveBtn = form.querySelector('.save-btn');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = 'Shranjevanje...';
                saveBtn.style.backgroundColor = '#94d3a2'; // Svetlejša zelena
            }
            
            console.log('Pošiljam zahtevek z naslednjimi podatki:', {
                appointmentId,
                patientInfo,
                locationId,
                date,
                startTime,
                endTime
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
                
                // Ponovno omogoči gumb za shranjevanje
                const saveBtn = form.querySelector('.save-btn');
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = 'Shrani';
                    saveBtn.style.backgroundColor = '#28a745';
                }
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
            
            // Ponovno omogoči gumb za shranjevanje
            const saveBtn = form.querySelector('.save-btn');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = 'Shrani';
                saveBtn.style.backgroundColor = '#28a745';
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

function populateLocationSelect(availableLocations, currentLocationId) {
    const locationSelect = document.querySelector('#location-select');
    if (!locationSelect || !organizedLocations) return;
    
    // Očisti obstoječe opcije
    locationSelect.innerHTML = '';
    
    // Ustvarimo mapo razpoložljivosti za hitro iskanje
    const availabilityMap = {};
    availableLocations.forEach(loc => {
        availabilityMap[loc.id] = loc.available;
    });
    
    // Definirajmo redosled oddelkov
    const departmentOrder = { "AKT": 1, "DHL": 2, "DHD": 3 };
    
    // Dodajmo oddelke po vrsti
    Object.keys(departmentOrder)
        .filter(dept => organizedLocations[dept])
        .forEach(department => {
            // Ustvarimo optgroup za vsak oddelek
            const departmentGroup = document.createElement('optgroup');
            departmentGroup.label = department;
            locationSelect.appendChild(departmentGroup);
            
            // Sortiramo sobe po številkah
            const roomNumbers = Object.keys(organizedLocations[department])
                .map(Number)
                .sort((a, b) => a - b);
            
            // Za vsako sobo, dodamo vse postelje, sortirane po številki postelje
            roomNumbers.forEach(roomNum => {
                const beds = organizedLocations[department][roomNum]
                    .sort((a, b) => a.bedNumber - b.bedNumber);
                
                beds.forEach(bed => {
                    const option = document.createElement('option');
                    option.value = bed.id;
                    option.textContent = bed.title || bed.id;
                    
                    // Preveri razpoložljivost v mapi razpoložljivosti
                    const isAvailable = availabilityMap[bed.id] !== false; // Če ni v mapi, predpostavljamo da je razpoložljiv
                    
                    // Če lokacija ni na voljo, jo označimo in onemogočimo
                    if (!isAvailable) {
                        option.disabled = true;
                        option.classList.add('unavailable-location');
                        option.textContent += ' (zasedeno)';
                    }
                    
                    // Če je to trenutno izbrana lokacija, jo označimo
                    if (bed.id === currentLocationId) {
                        option.selected = true;
                    }
                    
                    // Dodamo lokacijo v ustrezno skupino oddelka
                    departmentGroup.appendChild(option);
                });
            });
        });
}

function formatDuration(minutes){
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    let displayText = '';
    
    if (hours > 0) {
        displayText = hours + (hours === 1 ? ' ura' : (hours === 2 ? ' uri' : (hours <= 4 ? ' ure' : ' ur')));
        if(mins > 0) {
            displayText += ' ' + mins + ' min';
        }
    } else{
        displayText = minutes + ' min';
    }
    
    return displayText;
}
