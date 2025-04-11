let organizedLocations = null;
let userSelectedLocationId = null;
// Globalna spremenljivka za shranjevanje originalnih vrednosti
let originalAppointmentValues = null;
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
    let datePicker, roomFilter, filterContainer, dateDisplay;

    if(!calendarEl){
        console.error('Element with ID "amelia-calendar" not found');
        return;
    }
    

    console.log("Informacije o brskalniku in lokalizaciji:", {
        userAgent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages,
        dateTimeFormat: new Intl.DateTimeFormat().format(new Date()),
        dateTimeLocale: new Intl.DateTimeFormat().resolvedOptions().locale,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

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
    roomFilter.setAttribute("multiple", "multiple");

    // Create date picker - vrnitev na osnovno različico
    datePicker = document.createElement('input');
    datePicker.type = 'date'; // Uporabimo native date picker
    datePicker.style.padding = '5px';
    datePicker.id = 'datePicker';
    datePicker.setAttribute('lang', 'sl-SI');
    datePicker.classList.add('date-picker-slovenian')
    datePicker.setAttribute('data-date-format', 'dd/mm/yyyy');

    // Nastavimo privzeti datum
    let savedDate = localStorage.getItem('selectedDate') || new Date().toISOString().split('T')[0];
    datePicker.value = savedDate;

    console.log("DatePicker inicializiran:", {
        element: datePicker,
        value: datePicker.value,
        lang: datePicker.getAttribute('lang'),
        dateFormat: datePicker.getAttribute('data-date-format')
    });

    datePicker.addEventListener('change', function() {
        const newDate = this.value;
        const dateParts = newDate.split('-');
        
        console.log("DatePicker sprememba:", {
            newISODate: newDate,
            parts: dateParts,
            formattedDate: dateParts.length === 3 ? `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}` : newDate,
            dateElement: this
        });
        
        localStorage.setItem('selectedDate', this.value);
        fetchData(loadCalendar);
    });

    // Dodamo elementi v container
    filterContainer.appendChild(datePicker);
    filterContainer.appendChild(roomFilter);

    // Add container to calendar element
    calendarEl.insertBefore(filterContainer, calendarEl.firstChild);

    // Load saved settings for room filter
    let savedRooms = JSON.parse(localStorage.getItem('selectedRooms')) || ['all'];

    jQuery('#roomFilter').select2({
        placeholder: "Izberite sobe in postelje",
        allowClear: true,
        width: '100%'
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

    // Dodamo CSS za lepši prikaz datepicker-ja
    const datePickerStyle = document.createElement('style');
    datePickerStyle.textContent = `
        #datePicker {
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            width: 140px;
        }
        
        #datePicker::-webkit-calendar-picker-indicator {
            cursor: pointer;
        }
    `;
    document.head.appendChild(datePickerStyle);
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
    
    // Pridobimo izbrani datum v ISO formatu (YYYY-MM-DD)
    const isoDate = document.getElementById('datePicker').value;

    console.log("LoadCalendar datum:", {
        isoDate: isoDate,
        datePickerElement: document.getElementById('datePicker'),
        browserLocale: navigator.language,
        dateTimeFormat: new Intl.DateTimeFormat().format(new Date(isoDate))
    });

    const dateParts = isoDate.split('-');
    const displayDate = dateParts.length === 3 
        ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` // format DD/MM/YYYY
        : isoDate;
        
    // Za filtriranje dogodkov vedno uporabite original ISO format
    const selectedDate = isoDate; 
    
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

    let filteredEvents = data.events.filter(event => {
        const eventStartsOnDate = event.start.startsWith(selectedDate);

        return eventStartsOnDate;
    });
    
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

function showAppointmentDetails(appointment) {
    console.log('Prikaz termina:', appointment);
    console.log('Začetni appointment objekt:', JSON.stringify(appointment));

    if (!appointment) {
        console.error('Ni podatkov o terminu');
        return;
    }
    
    // Najprej zapremo vsa obstoječa modalna okna
    closeAllModals();

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

function createAppointmentModal(appointment, patientName, therapy, formattedDate, formattedStartTime, formattedEndTime, durationMinutes, canEdit) {
    // Pridobi ime oddelka za barvno kodiranje
    console.log('Vhodni appointment za modal:', JSON.stringify(appointment));
    const originalResourceId = appointment.resourceId;
    const originalResourceName = appointment.resourceName || '';
    console.log('Ustvarjam modal z lokacijo:', originalResourceName);

    window.currentAppointmentLocation={
        id: originalResourceId,
        name: originalResourceName
    }

    
    const departmentMatch = appointment.resourceId.match(/^([^-]+)/);
    const department = departmentMatch ? departmentMatch[1].trim() : '';

    let deptColor = '#cccccc';
    if (department === 'AKT') deptColor = '#4FA5D8';
    else if (department === 'DHL') deptColor = '#66D9A3';
    else if (department === 'DHD') deptColor = '#FF9999';
    
    // Najprej zapremo vsa obstoječa modalna okna
    closeAllModals();
    
    // Pripravi gumbe glede na pravice
    const editButtonHtml = canEdit ? 
        `<button type="button" class="edit-btn" 
            style="padding: 12px 24px; border: none; border-radius: 6px; background-color: #007bff; color: white; font-size: 16px; cursor: pointer; transition: background-color 0.3s;"
            onclick="toggleEditMode(true)">
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
    const modalElement = document.createElement('div');
    modalElement.className = 'appointment-modal';
    modalElement.style.position = 'fixed';
    modalElement.style.top = '0';
    modalElement.style.left = '0';
    modalElement.style.width = '100%';
    modalElement.style.height = '100%';
    modalElement.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modalElement.style.display = 'flex';
    modalElement.style.justifyContent = 'center';
    modalElement.style.alignItems = 'center';
    modalElement.style.zIndex = '1000';
    
    const modalContentHtml = `
        <div class="modal-content" style="background: white; padding: 30px; border-radius: 8px; min-width: 500px; width: 60%; max-width: 700px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
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
                    <dd style="margin: 0 0 15px 0;">${originalResourceName}</dd>
                    
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
            <div id="edit-view" style="display: none;">
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
                               onchange="updateAvailableTimeSlots(this.value, '${appointment.resourceId}', ${appointment.id}, getCurrentDuration())">
                </div>
                
                    <div class="form-group" style="margin-bottom: 25px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 16px;">Trajanje:</label>
                        <input type="text" readonly value="${formatDuration(Math.round(durationMinutes))}" 
                            style="width: 100%; padding: 12px; border: 1px solid #ddd; background-color: #f0f0f0; border-radius: 6px; font-size: 16px; box-sizing: border-box;">
                        <small style="display: block; color: #6c757d; margin-top: 5px;">Spreminjanje trajanja je začasno onemogočeno.</small>
                        
                        <!-- Skriti original select, ki je še vedno funkcionalen -->
                        <select id="duration-select" name="duration_minutes" 
                                style="display: none;" 
                                onchange="updateTimeSlotsWithFixedStart()">
                            ${generateDurationOptions(durationMinutes)}
                        </select>
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
                        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 16px;">Lokacija:</label>
                        <select id="location-select" name="location" 
                                style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px; box-sizing: border-box; background-color: white;"
                                onchange="updateAvailableTimeSlots(document.querySelector('input[name=appointment_date]').value, this.value, ${appointment.id}, getCurrentDuration())">
                            <option value="${originalResourceId}" selected>${originalResourceName}</option>
                    </select>
        </div>
        
                    <input type="hidden" name="appointment_id" value="${appointment.id}">
                    
                    <div id="conflict-warning" style="display: none; background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 4px; margin-bottom: 20px; border: 1px solid #ffeeba;">
                        <strong>Opozorilo:</strong> Izbrani termin se prekriva z drugim terminom na tej lokaciji.
                    </div>

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
    `;
    
    // Dodaj HTML v modalni element
    modalElement.innerHTML = modalContentHtml;
    
    // Dodaj modal v DOM
    document.body.appendChild(modalElement);
    
    // Funkcija za prikaz opozorila o pomanjkanju pravic
    window.showPermissionAlert = function() {
        alert('Nimate dovoljenja za urejanje ali brisanje terminov.');
    };
    
    // Funkcija za preklop med pogledi, ki upošteva pravice
    window.toggleEditMode = function(showEditMode) {
        console.log('Vrednost lokacije pred preklopom:', 
            document.querySelector('#location-select')?.value);
    
        if (showEditMode && !canEdit) {
            showPermissionAlert();
            return;
        }
        
        const detailsView = document.getElementById('details-view');
        const editView = document.getElementById('edit-view');
        
        if (showEditMode) {
            // Shrani originalne vrednosti
            originalAppointmentValues = {
                patientName: document.querySelector('input[name="patient_name"]').value,
                therapy: document.querySelector('input[name="therapy"]').value,
                date: document.querySelector('input[name="appointment_date"]').value,
                duration: document.querySelector('select[name="duration_minutes"]').value,
                timeSlot: document.querySelector('select[name="time_slot"]').value,
                location: document.querySelector('select[name="location"]').value
            };
            
            console.log('Shranjene originalne vrednosti:', originalAppointmentValues);

            // Uporabite pravilni selektor in dodajte preverjanje, da se ne zlomi, če element ne obstaja
            const locationElement = document.querySelector('#details-view dd:nth-of-type(6)');
            const locationText = locationElement ? locationElement.textContent : '';
            console.log('Shranjena lokacija iz podrobnosti:', locationText);
    
            detailsView.style.display = 'none';
            editView.style.display = 'block';
            
            // Počisti morebitna opozorila
            const conflictWarning = document.getElementById('conflict-warning');
            if (conflictWarning) {
                conflictWarning.style.display = 'none';
            }
            
            // Naloži razpoložljive časovne termine in lokacije
            setTimeout(() => {
                updateAvailableTimeSlots(formattedDate, window.currentAppointmentLocation.id, appointment.id, getCurrentDuration());
                updateLocationOptions(`${formattedStartTime},${formattedEndTime}`, formattedDate, appointment.id);
                
                // Dodajte setTimeout za dodajanje event listenerja
                setTimeout(() => {
                    addLocationChangeListener();
                }, 500);
            }, 100);
        } else {
            // Obnovi originalne vrednosti
            if (originalAppointmentValues) {
                console.log('Obnavljam originalne vrednosti:', originalAppointmentValues);
                
                document.querySelector('input[name="patient_name"]').value = originalAppointmentValues.patientName;
                document.querySelector('input[name="therapy"]').value = originalAppointmentValues.therapy;
                document.querySelector('input[name="appointment_date"]').value = originalAppointmentValues.date;
                //document.querySelector('select[name="duration_minutes"]').value = originalAppointmentValues.duration;
                
                // Preverimo, če obstaja hidden input ali select za trajanje
                const durationInput = document.querySelector('input[id="duration-select"]');
                if (durationInput) {
                    durationInput.value = originalAppointmentValues.duration;
                }

                // Obnovi časovni termin
                const timeSlotSelect = document.querySelector('select[name="time_slot"]');
                timeSlotSelect.innerHTML = `<option value="${originalAppointmentValues.timeSlot}" selected>${originalAppointmentValues.timeSlot.replace(',', ' - ')}</option>`;
                
                // Obnovi lokacijo
                const locationSelect = document.querySelector('select[name="location"]');
                if (locationSelect && window.currentAppointmentLocation) {
                    locationSelect.innerHTML = `<option value="${window.currentAppointmentLocation.id}" selected>${window.currentAppointmentLocation.name}</option>`;
                }
            }
            
            // Ponastavi userSelectedLocationId ob izhodu iz načina urejanja
            userSelectedLocationId = null;
            detailsView.style.display = 'block';
            editView.style.display = 'none';
        }
    };

    // Nova funkcija za pridobivanje trenutno izbranega trajanja
    window.getCurrentDuration = function() {
        const durationInput = document.getElementById('duration-select');
        return durationInput ? parseInt(durationInput.value) : 30;
    };
    
    // Nova funkcija za posodobitev časovnih terminov ob spremembi trajanja (z ohranjanjem začetnega časa)
    window.updateTimeSlotsWithFixedStart = function() {
        const timeSlotSelect = document.getElementById('time-slot-select');
        const durationSelect = document.getElementById('duration-select');
        const dateInput = document.querySelector('input[name="appointment_date"]');
        const locationSelect = document.getElementById('location-select');
        
        if (!timeSlotSelect || !durationSelect || !dateInput || !locationSelect) return;
        
        // Shrani trenutni začetni čas
        const currentTimeSlot = timeSlotSelect.value;
        const [currentStart] = currentTimeSlot.split(',').map(t => t.trim());
        
        // Pridobi novo trajanje
        const newDuration = parseInt(durationSelect.value);
        const date = dateInput.value;
        const locationId = locationSelect.value;
        const appointmentId = document.querySelector('input[name="appointment_id"]').value;
        
        // Pokaži stanje nalaganja
        timeSlotSelect.disabled = true;
        timeSlotSelect.innerHTML = '<option value="">Nalagam razpoložljive termine...</option>';
        
        // Pridobi vse možne časovne termine za trenutno trajanje
        jQuery.ajax({
            url: ameliaAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'amelia_get_available_time_slots',
                security: ameliaAjax.nonce,
                date: date,
                location: locationId,
                duration_minutes: newDuration,
                appointment_id: appointmentId
            },
            success: function(response) {
                timeSlotSelect.innerHTML = '';
                
                if (response.success && response.data && response.data.available_slots) {
                    // Najprej poskusi najti termin z istim začetnim časom
                    let currentStartSlot = response.data.available_slots.find(slot => slot.start === currentStart);
                    
                    // Preveri, če je trenutni začetni čas še vedno veljaven (ne gre čez 20:00)
                    if (currentStartSlot) {
                        const [endHour, endMinutes] = currentStartSlot.end.split(':').map(Number);
                        if (endHour > 20 || (endHour === 20 && endMinutes > 0)) {
                            currentStartSlot = null; // Razveljavi trenutni začetni čas, če gre čez 20:00
                        }
                    }

                    // Filtriraj vse veljavne termine (do 20:00)
                    const validSlots = response.data.available_slots.filter(slot => {
                        const [endHour, endMinutes] = slot.end.split(':').map(Number);
                        return endHour <= 20 && (endHour < 20 || endMinutes === 0);
                    });

                    if (validSlots.length > 0) {
                        // Če imamo veljaven trenutni začetni čas, ga dodaj prvega in izberi
                        if (currentStartSlot && validSlots.some(slot => slot.start === currentStart)) {
                            const option = document.createElement('option');
                            option.value = `${currentStartSlot.start},${currentStartSlot.end}`;
                            option.textContent = `${currentStartSlot.start} - ${currentStartSlot.end}`;
                            option.selected = true;
                            timeSlotSelect.appendChild(option);
                        }

                        // Dodaj vse ostale veljavne termine
                        validSlots.forEach(slot => {
                            if (slot.start !== currentStart) {
                                const option = document.createElement('option');
                                option.value = `${slot.start},${slot.end}`;
                                option.textContent = `${slot.start} - ${slot.end}`;
                                timeSlotSelect.appendChild(option);
                            }
                        });

                        // Če nismo mogli ohraniti trenutnega začetnega časa, izberi prvi razpoložljiv termin
                        if (!currentStartSlot && timeSlotSelect.options.length > 0) {
                            timeSlotSelect.options[0].selected = true;
                        }

                        // Preveri za prekrivanja z izbranim terminom
                        const selectedOption = timeSlotSelect.options[timeSlotSelect.selectedIndex];
                        const [start, end] = selectedOption.value.split(',');
                        checkForOverlaps(date, locationId, start, end, appointmentId);

                        // Skrij opozorilo
                        const conflictWarning = document.getElementById('conflict-warning');
                        if (conflictWarning) {
                            conflictWarning.style.display = 'none';
                        }

                        // Omogoči gumb za shranjevanje
                        const saveButton = document.querySelector('.save-btn');
                        if (saveButton) {
                            saveButton.disabled = false;
                            saveButton.style.opacity = '1';
                            saveButton.style.cursor = 'pointer';
                        }
                    } else {
                        // Ni veljavnih terminov
                        const option = document.createElement('option');
                        option.value = "";
                        option.textContent = "Ni razpoložljivih terminov za izbrano trajanje";
                        timeSlotSelect.appendChild(option);
                        
                        const conflictWarning = document.getElementById('conflict-warning');
                        if (conflictWarning) {
                            conflictWarning.style.display = 'block';
                            conflictWarning.innerHTML = '<strong>Opozorilo:</strong> Za izbrano trajanje ni razpoložljivih terminov.';
                        }
                        
                        // Onemogoči gumb za shranjevanje
                        const saveButton = document.querySelector('.save-btn');
                        if (saveButton) {
                            saveButton.disabled = true;
                            saveButton.style.opacity = '0.65';
                            saveButton.style.cursor = 'not-allowed';
                        }
                    }
                }
                
                timeSlotSelect.disabled = false;
            },
            error: function(xhr, status, error) {
                console.error('Napaka pri pridobivanju terminov:', error);
                timeSlotSelect.innerHTML = '<option value="">Napaka pri nalaganju terminov</option>';
                timeSlotSelect.disabled = false;
            }
        });
    };
    
    // Funkcija za preverjanje prekrivanja
    window.checkForOverlaps = function(date, locationId, startTime, endTime, appointmentId) {
    const conflictWarning = document.getElementById('conflict-warning');
        const saveButton = document.querySelector('.save-btn');
    
        if (!conflictWarning || !saveButton) return;
    
    jQuery.ajax({
        url: ameliaAjax.ajaxurl,
        type: 'POST',
        data: {
            action: 'amelia_check_time_conflicts',
            security: ameliaAjax.nonce,
            date: date,
            location: locationId,
            start_time: startTime,
            end_time: endTime,
            appointment_id: appointmentId
        },
        success: function(response) {
                if (response.success && response.data) {
                    if (response.data.has_conflict) {
                        conflictWarning.style.display = 'block';
                        saveButton.disabled = true;
                        saveButton.style.opacity = '0.65';
                        saveButton.style.cursor = 'not-allowed';
                    } else {
                        conflictWarning.style.display = 'none';
                        saveButton.disabled = false;
                        saveButton.style.opacity = '1';
                        saveButton.style.cursor = 'pointer';
                    }
                }
            },
            error: function() {
                console.error('Napaka pri preverjanju prekrivanja.');
            }
        });
    };
    
    // Dodaj handler za zapiranje modala
    const closeButtons = modalElement.querySelectorAll('.close-button, .close-btn');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            modalElement.remove();
        });
    });
    
    // Dodaj handler za zapiranje modala ob kliku izven vsebine
    modalElement.addEventListener('click', function(e) {
        if (e.target === modalElement) {
            modalElement.remove();
        }
    });
}

// Nova funkcija za generiranje opcij trajanja (od 30 minut do 9.5 ur na 30 minut)
function generateDurationOptions(currentDuration) {
    let options = '';
    // Od 30 minut do 9.5 ur (570 minut) v korakih po 30 minut
    for (let minutes = 30; minutes <= 570; minutes += 30) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        let displayText = '';
        
        if (hours > 0) {
            displayText = hours + (hours === 1 ? ' ura' : (hours === 2 ? ' uri' : (hours <= 4 ? ' ure' : ' ur')));
            if (remainingMinutes > 0) {
                displayText += ' ' + remainingMinutes + ' min';
            }
        } else {
            displayText = minutes + ' min';
        }
        
        const isSelected = (Math.round(currentDuration) === minutes) ? 'selected' : '';
        options += `<option value="${minutes}" ${isSelected}>${displayText}</option>`;
    }
    return options;
}

function updateAvailableTimeSlots(date, locationId, appointmentId, durationMinutes) {
    const timeSelect = document.querySelector('#time-slot-select');
    if (!timeSelect) return;
    
    // Shrani trenutno izbrani časovni interval, če obstaja
    let currentStart = null;
    let currentEnd = null;
    
    if (timeSelect.value) {
        const parts = timeSelect.value.split(',');
        if (parts.length === 2) {
            currentStart = parts[0].trim();
            currentEnd = parts[1].trim();
        }
    }
    
    console.log('Posodabljam razpoložljive časovne termine:', {
        date: date,
        locationId: locationId,
        appointmentId: appointmentId,
        durationMinutes: durationMinutes,
        currentStart: currentStart,
        currentEnd: currentEnd
    });
    
    // Pokaži stanje nalaganja
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
            appointment_id: appointmentId,
            current_start: currentStart // Pošljemo trenutni začetni čas, če obstaja
        },
        success: function(response) {
            console.log('Odgovor termini:', response);
            
            timeSelect.innerHTML = '';
            
            if (response.success && response.data && response.data.available_slots) {
                let foundCurrentStart = false;
                let selectedSlot = null;
                
                response.data.available_slots.forEach(slot => {
                    const option = document.createElement('option');
                    option.value = `${slot.start},${slot.end}`;
                    option.textContent = `${slot.start} - ${slot.end}`;
                    
                    // Če je to slot z istim začetnim časom kot trenutni, ga izberemo
                    if (slot.start === currentStart) {
                        option.selected = true;
                        foundCurrentStart = true;
                        selectedSlot = slot;
                    }
                    
                    timeSelect.appendChild(option);
                });
                
                // Če nismo našli slota z istim začetnim časom ali ga ni več na voljo
                if (!foundCurrentStart && response.data.available_slots.length > 0) {
                    // Izberemo prvi razpoložljivi slot
                    timeSelect.value = `${response.data.available_slots[0].start},${response.data.available_slots[0].end}`;
                    selectedSlot = response.data.available_slots[0];
                }
                
                // Če je bil izbran slot, preveri za prekrivanja
                if (selectedSlot) {
                    checkForOverlaps(date, locationId, selectedSlot.start, selectedSlot.end, appointmentId);
                }
                
                // Če smo spremenili izbiro, posodobi lokacije
                if (selectedSlot) {
                    const newTimeSlot = `${selectedSlot.start},${selectedSlot.end}`;
                    updateLocationOptions(newTimeSlot, date, appointmentId);
                }
            } else if (response.data && response.data.message) {
                // Pokaži sporočilo o napaki
                const option = document.createElement('option');
                option.value = "";
                option.textContent = response.data.message;
                timeSelect.appendChild(option);
            } else {
                // Generično sporočilo o napaki
                const option = document.createElement('option');
                option.value = "";
                option.textContent = "Ni razpoložljivih terminov";
                timeSelect.appendChild(option);
            }
            
            // Ponovno omogoči select
            timeSelect.disabled = false;
        },
        error: function(xhr, status, error) {
            console.error('Ajax napaka:', {
                status: xhr.status,
                statusText: xhr.statusText,
                responseText: xhr.responseText
            });
            
            // Pokaži sporočilo o napaki
            timeSelect.innerHTML = '<option value="">Napaka pri nalaganju terminov</option>';
            timeSelect.disabled = false;
        }
    });
}

function updateLocationOptions(timeSlot, date, appointmentId) {
    const [startTime, endTime] = timeSlot.split(',');
    const locationSelect = document.querySelector('#location-select');

    // Uporabi userSelectedLocationId, če obstaja, sicer uporabi trenutno lokacijo
    const currentLocationId = userSelectedLocationId || window.currentAppointmentLocation?.id || (locationSelect ? locationSelect.value : '');
    console.log('Trenutna lokacija:', currentLocationId, 'Uporabniško izbrana:', userSelectedLocationId);
    
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
                // Shrani lokacijo, ki jo želimo izbrati
                const locationToSelect = userSelectedLocationId || currentLocationId;
                
                // Uporabite funkcijo za prikaz lokacij s podatki o razpoložljivosti
                populateLocationSelect(response.data.locations, locationToSelect);
                
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

function addLocationChangeListener() {
    const locationSelect = document.getElementById('location-select');
    if (locationSelect) {
        locationSelect.addEventListener('change', function() {
            // Ob spremembi lokacije, shrani vrednost v globalno spremenljivko
            userSelectedLocationId = this.value;
            console.log('Uporabnik je izbral novo lokacijo:', userSelectedLocationId);
            
            // Odstranimo vrstico, ki povzroča napako, ker ni potrebna
            // const timeSlotSelect = document.getElementById('time-slot-select');
            // if (timeSlotSelect) {
            //     timeSlotSelect.removeEventListener('change', updateLocationOptionsHandler);
            // }
        });
    }
}

// Funkcija za posodobitev opcij začetnega časa
function updateStartTimeOptions(date, locationId, appointmentId) {
    const startTimeSelect = document.getElementById('start-time-select');
    if (!startTimeSelect) return;
    
    // Shrani trenutno izbrano vrednost
    const currentValue = startTimeSelect.value;
    
    // Pokaži stanje nalaganja
    startTimeSelect.disabled = true;
    startTimeSelect.innerHTML = '<option value="">Nalagam razpoložljive začetne čase...</option>';
    
    jQuery.ajax({
        url: ameliaAjax.ajaxurl,
        type: 'POST',
        data: {
            action: 'amelia_get_available_start_times',
            security: ameliaAjax.nonce,
            date: date,
            location: locationId,
            appointment_id: appointmentId
        },
        success: function(response) {
            console.log('Odgovor začetni časi:', response);
            
            startTimeSelect.innerHTML = '';
            
            if (response.success && response.data && response.data.available_times) {
                let foundSelected = false;
                
                response.data.available_times.forEach(time => {
                    const option = document.createElement('option');
                    option.value = time;
                    option.textContent = time;
                    
                    // Če je to prejšnja izbrana vrednost, jo ponovno izberemo
                    if (time === currentValue) {
                        option.selected = true;
                        foundSelected = true;
                    }
                    
                    startTimeSelect.appendChild(option);
                });
                
                // Če nismo našli prej izbrane vrednosti, izberemo prvo opcijo
                if (!foundSelected && response.data.available_times.length > 0) {
                    startTimeSelect.value = response.data.available_times[0];
                }
                
                // Posodobi končni čas in preveri konflikte
                updateEndTimeAndCheckConflicts();
            } else {
                // Prikaži sporočilo o napaki
                const option = document.createElement('option');
                option.value = "";
                option.textContent = response.data?.message || "Ni razpoložljivih začetnih časov";
                startTimeSelect.appendChild(option);
            }
            
            // Ponovno omogoči select
            startTimeSelect.disabled = false;
        },
        error: function(xhr, status, error) {
            console.error('Ajax napaka:', {
                status: xhr.status,
                statusText: xhr.statusText,
                responseText: xhr.responseText
            });
            
            startTimeSelect.innerHTML = '<option value="">Napaka pri nalaganju začetnih časov</option>';
            startTimeSelect.disabled = false;
        }
    });
}

// Funkcija za posodobitev končnega časa in preverjanje konfliktov
function updateEndTimeAndCheckConflicts() {
    const startTimeSelect = document.getElementById('start-time-select');
    const durationSelect = document.getElementById('duration-select');
    const endTimeDisplay = document.getElementById('end-time-display');
    const locationSelect = document.getElementById('location-select');
    const dateInput = document.querySelector('input[name="appointment_date"]');
    const appointmentId = document.querySelector('input[name="appointment_id"]').value;
    
    if (!startTimeSelect || !durationSelect || !endTimeDisplay || !dateInput) return;
    
    const startTime = startTimeSelect.value;
    const duration = parseInt(durationSelect.value);
    const date = dateInput.value;
    const locationId = locationSelect ? locationSelect.value : '';
    
    // Izračunaj nov končni čas
    const endTime = calculateEndTime(startTime, duration);
    endTimeDisplay.value = endTime;
    
    // Preveri konflikte s to kombinacijo začetnega časa, trajanja in lokacije
    checkTimeConflicts(date, locationId, startTime, endTime, appointmentId);
    
    // Posodobi razpoložljive lokacije
    updateLocationOptions(startTime + ',' + endTime, date, appointmentId);
}

// Funkcija za posodobitev tako končnega časa kot lokacijskih opcij
function updateEndTimeAndLocationOptions() {
    updateEndTimeAndCheckConflicts();
}

// Funkcija za preverjanje konfliktov
function checkTimeConflicts(date, locationId, startTime, endTime, appointmentId) {
    if (!date || !locationId || !startTime || !endTime || !appointmentId) return;
    
    // Pokaži indikator preverjanja
    const saveBtn = document.querySelector('.save-btn');
    const conflictWarning = document.getElementById('conflict-warning');
    
    // Odstrani obstoječe opozorilo
    if (conflictWarning) {
        conflictWarning.remove();
    }
    
    jQuery.ajax({
        url: ameliaAjax.ajaxurl,
        type: 'POST',
        data: {
            action: 'amelia_check_time_conflicts',
            security: ameliaAjax.nonce,
            date: date,
            location: locationId,
            start_time: startTime,
            end_time: endTime,
            appointment_id: appointmentId
        },
        success: function(response) {
            console.log('Preverjanje konfliktov:', response);
            
            if (response.success) {
                if (response.data && response.data.has_conflict) {
                    // Prikaži opozorilo o konfliktu
                    const warningDiv = document.createElement('div');
                    warningDiv.id = 'conflict-warning';
                    warningDiv.style.backgroundColor = '#fff3cd';
                    warningDiv.style.color = '#856404';
                    warningDiv.style.padding = '10px';
                    warningDiv.style.borderRadius = '4px';
                    warningDiv.style.marginBottom = '20px';
                    warningDiv.style.border = '1px solid #ffeeba';
                    warningDiv.innerHTML = '<strong>Opozorilo:</strong> Izbrani termin se prekriva z drugim terminom na tej lokaciji.';
                    
                    // Vstavi opozorilo pred gumbi
                    const buttonGroup = document.querySelector('.button-group');
                    if (buttonGroup) {
                        buttonGroup.parentNode.insertBefore(warningDiv, buttonGroup);
                    }
                    
                    // Onemogoči gumb za shranjevanje
                    if (saveBtn) {
                        saveBtn.disabled = true;
                        saveBtn.style.backgroundColor = '#6c757d';
                        saveBtn.style.cursor = 'not-allowed';
                    }
                } else {
                    // Omogoči gumb za shranjevanje
                    if (saveBtn) {
                saveBtn.disabled = false;
                        saveBtn.style.backgroundColor = '#28a745';
                        saveBtn.style.cursor = 'pointer';
                    }
                }
            }
        },
        error: function(xhr, status, error) {
            console.error('Napaka pri preverjanju konfliktov:', error);
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
    const durationMinutes = parseInt(form.querySelector('select[name="duration_minutes"]').value);
    
    // Pridobi vrednosti za pacienta in terapijo
    const patientName = form.querySelector('input[name="patient_name"]').value.trim();
    const therapy = form.querySelector('input[name="therapy"]').value.trim();
    
    // Preveri če imamo vse potrebne podatke
    if (!appointmentId || !date || !timeSlot || !locationId || isNaN(durationMinutes)) {
        console.error('Manjkajoči podatki:', { appointmentId, date, timeSlot, locationId, durationMinutes });
        alert('Prosim izpolnite vsa obvezna polja (Datum, Čas, Trajanje in Lokacija)');
        return;
    }
    
    // Preveri za morebitna opozorila o konfliktu
    const conflictWarning = document.getElementById('conflict-warning');
    if (conflictWarning && conflictWarning.style.display !== 'none') {
        if (!confirm('POZOR: Izbrani termin se prekriva z obstoječim terminom. Ali ste prepričani, da želite nadaljevati?')) {
            return;
        }
    }
    
    // Razdeli časovni termin na začetek in konec
    let [startTime, endTime] = timeSlot.split(',').map(time => time.trim());
    
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
            patient_info: patientInfo,
            location: locationId,
            appointment_date: date,
            start_time: startTime,
            end_time: endTime,
            duration_minutes: durationMinutes
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
                endTime,
                durationMinutes
            });
        },
        success: function(response) {
            console.log('Odgovor strežnika:', response);
            userSelectedLocationId = null;
            if (response.success) {
                // Zapri modalno okno
                form.closest('.appointment-modal').remove();
                
                // Posodobi podatke v časovnici brez osveževanja celotne strani
                refreshCalendarData();
                
                // Prikaži sporočilo o uspehu
                showNotification('Termin je bil uspešno posodobljen');
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

// Nova funkcija za izračun končnega časa glede na začetni čas in trajanje
function calculateEndTime(startTime, durationMinutes) {
    // Razdeli startTime na ure in minute
    let [hours, minutes] = startTime.split(':').map(num => parseInt(num, 10));
    
    // Dodaj trajanje v minutah
    minutes += durationMinutes;
    
    // Pretvori presežek minut v ure
    hours += Math.floor(minutes / 60);
    minutes = minutes % 60;
    
    // Formatiraj končni čas v obliki "HH:MM"
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function refreshCalendarData() {
    // Prikaži indikator nalaganja
    const calendarContainer = document.querySelector('.calendar-container');
    if (calendarContainer) {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
        loadingOverlay.style.position = 'absolute';
        loadingOverlay.style.top = '0';
        loadingOverlay.style.left = '0';
        loadingOverlay.style.width = '100%';
        loadingOverlay.style.height = '100%';
        loadingOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        loadingOverlay.style.display = 'flex';
        loadingOverlay.style.justifyContent = 'center';
        loadingOverlay.style.alignItems = 'center';
        loadingOverlay.style.zIndex = '10';
        
        calendarContainer.style.position = 'relative';
        calendarContainer.appendChild(loadingOverlay);
    }
    
    // Pridobi sveže podatke s strežnika
    fetchData(function(data) {
        // Odstrani indikator nalaganja
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
        
        // Posodobi prikaz v časovnici
        if (data && data.resources) {
            loadCalendar(data);
        }
    });
}

function showNotification(message) {
    // Ustvari element za obvestilo
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = '#28a745';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    notification.style.zIndex = '9999';
    notification.style.transition = 'opacity 0.5s ease-in-out';
    
    // Dodaj animacijo prihoda
    notification.style.opacity = '0';
    document.body.appendChild(notification);
    
    // Animiraj prikaz
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // Samodejno zapri po 3 sekundah
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}

function closeAllModals() {
    // Odstrani vse obstoječe modalne elemente
    const existingModals = document.querySelectorAll('.appointment-modal');
    existingModals.forEach(modal => {
        modal.remove();
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
            beforeSend: function() {
                // Dodajte vizualno povratno informacijo, da je zahteva v teku
                const deleteBtn = document.querySelector('.delete-btn');
                if (deleteBtn) {
                    deleteBtn.disabled = true;
                    deleteBtn.textContent = 'Brisanje...';
                    deleteBtn.style.backgroundColor = '#dc354580'; // Prosojni rdeč
                }
        },
        success: function(response) {
                if (response.success) {
                    // Zapri modalno okno
                    closeModal();
                    
                    // Namesto osveževanja celotne strani, samo posodobi podatke
                    refreshCalendarData();
                    
                    // Prikažite obvestilo o uspešnem brisanju
                    showNotification('Termin je bil uspešno izbrisan');
                } else {
                    // Omogoči gumb nazaj, če pride do napake
                    const deleteBtn = document.querySelector('.delete-btn');
                    if (deleteBtn) {
                        deleteBtn.disabled = false;
                        deleteBtn.textContent = 'Izbriši termin';
                        deleteBtn.style.backgroundColor = '#dc3545';
                    }
                    
                    alert('Napaka pri brisanju termina: ' + (response.data?.message || 'Neznana napaka'));
                }
        },
        error: function(xhr, status, error) {
                console.error('Napaka:', error);
                
                // Omogoči gumb nazaj, če pride do napake
                const deleteBtn = document.querySelector('.delete-btn');
                if (deleteBtn) {
                    deleteBtn.disabled = false;
                    deleteBtn.textContent = 'Izbriši termin';
                    deleteBtn.style.backgroundColor = '#dc3545';
                }
                
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
    
    console.log('Napolni lokacije z:', currentLocationId);
    
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
    
    // Po končanem napolnjevanju seznama eksplicitno nastavimo izbrano vrednost
    if (currentLocationId) {
        // Poskusi najti in izbrati opcijo po ID
        let found = false;
        for (let i = 0; i < locationSelect.options.length; i++) {
            if (locationSelect.options[i].value === currentLocationId) {
                locationSelect.options[i].selected = true;
                found = true;
                console.log('Izbrana lokacija:', locationSelect.options[i].textContent);
                break;
            }
        }
        
        // Če lokacija ni bila najdena in je bila onemogočena, dodaj novo opcijo
        if (!found) {
            // Poišči original lokacijo v podatkih
            const originalLocation = window.currentAppointmentLocation;
            if (originalLocation && originalLocation.id && originalLocation.name) {
                // Dodaj opcijo za original lokacijo
                const option = document.createElement('option');
                option.value = originalLocation.id;
                option.textContent = originalLocation.name;
                option.selected = true;
                
                // Dodaj na začetek seznama
                if (locationSelect.options.length > 0) {
                    locationSelect.insertBefore(option, locationSelect.options[0]);
                } else {
                    locationSelect.appendChild(option);
                }
                
                console.log('Dodana originalna lokacija:', originalLocation.name);
            }
        }
    }
    
    // Nastavi vrednost onemogočenim opcijam, tudi če niso izbrane
    for (let i = 0; i < locationSelect.options.length; i++) {
        if (locationSelect.options[i].disabled) {
            // Če je disabled, ampak je treba izbrati to lokacijo, omogoči izbor
            if (locationSelect.options[i].value === currentLocationId) {
                locationSelect.options[i].disabled = false;
                locationSelect.options[i].selected = true;
                console.log('Omogočil in izbral sicer nedostopno lokacijo:', locationSelect.options[i].textContent);
            }
        }
    }
    
    // Še enkrat preveri, če je lokacija izbrana, in če ne, poskusi izbrati prvo razpoložljivo
    let hasSelected = false;
    for (let i = 0; i < locationSelect.options.length; i++) {
        if (locationSelect.options[i].selected) {
            hasSelected = true;
            break;
        }
    }
    
    // Če ni izbrano nič, izberi prvo opcijo, ki ni onemogočena
    if (!hasSelected && locationSelect.options.length > 0) {
        for (let i = 0; i < locationSelect.options.length; i++) {
            if (!locationSelect.options[i].disabled) {
                locationSelect.options[i].selected = true;
                console.log('Nobena lokacija ni bila izbrana, izbiram prvo razpoložljivo:', locationSelect.options[i].textContent);
                break;
            }
        }
    }
}

function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    let displayText = '';
    
    if (hours > 0) {
        displayText = hours + (hours === 1 ? ' ura' : (hours === 2 ? ' uri' : (hours <= 4 ? ' ure' : ' ur')));
        if (remainingMinutes > 0) {
            displayText += ' ' + remainingMinutes + ' min';
        }
    } else {
        displayText = minutes + ' min';
    }
    
    return displayText;
}
