<?php
/**
 * Plugin Name: Custom timeline calendar
 * Description: A custom timeline calendar for displaying appointments in a timeline view.
 * Version: 1.0
 * Author: Lara Mehle
 */

if (!defined('ABSPATH')) {
    exit;
}

// API endpoint for getting appointments
function amelia_get_appointments_json() {
    global $wpdb;
    $wpdb->show_errors();

    try {
        // First, get all available rooms and beds
        $rooms_query = "
            SELECT DISTINCT
                e.firstName AS department_name,
                c.name AS room_name,
                s.name AS service_name
            FROM wp_amelia_services s
            LEFT JOIN wp_amelia_categories c ON s.categoryId = c.id
            LEFT JOIN wp_amelia_providers_to_services ps ON s.id = ps.serviceId
            LEFT JOIN wp_amelia_users e ON ps.userId = e.id
            WHERE e.firstName IS NOT NULL 
            AND c.name IS NOT NULL
            ORDER BY 
                CASE e.firstName
                    WHEN 'AKT' THEN 1
                    WHEN 'DHL' THEN 2
                    WHEN 'DHD' THEN 3
                    ELSE 4
                END,
                CAST(SUBSTRING(c.name, 6) AS UNSIGNED),
                s.name";

        $rooms = $wpdb->get_results($rooms_query);

        // Get all appointments with their original times
        $appointments_query = "
            SELECT 
                a.id AS appointment_id,
                a.bookingStart AS original_start,
                a.bookingEnd AS original_end,
                JSON_UNQUOTE(JSON_EXTRACT(cb.info, '$.firstName')) AS patient_first_name,
                JSON_UNQUOTE(JSON_EXTRACT(cb.info, '$.lastName')) AS patient_last_name,
                s.name AS service_name,
                c.name AS room_name,
                e.firstName AS department_name
            FROM wp_amelia_appointments a
            LEFT JOIN wp_amelia_services s ON a.serviceId = s.id
            LEFT JOIN wp_amelia_categories c ON s.categoryId = c.id
            LEFT JOIN wp_amelia_providers_to_services ps ON s.id = ps.serviceId
            LEFT JOIN wp_amelia_users e ON ps.userId = e.id
            LEFT JOIN wp_amelia_customer_bookings cb ON a.id = cb.appointmentId";

        $appointments_raw = $wpdb->get_results($appointments_query);

        if ($wpdb->last_error) {
            wp_send_json_error(array('error' => $wpdb->last_error));
            return;
        }

        // Set the timezone for Slovenia (or your specific timezone)
        $timezone = new DateTimeZone('Europe/Ljubljana');
        
        // Process appointments with proper DST awareness
        $appointments = [];
        foreach ($appointments_raw as $appointment) {
            // Create DateTime objects in UTC (assuming Amelia stores times in UTC)
            $start_date_utc = new DateTime($appointment->original_start, new DateTimeZone('UTC'));
            $end_date_utc = new DateTime($appointment->original_end, new DateTimeZone('UTC'));
            
            // Convert to local timezone (will handle DST automatically)
            $start_date_utc->setTimezone($timezone);
            $end_date_utc->setTimezone($timezone);
            
            // Format dates for display
            $appointment->start_time = $start_date_utc->format('Y-m-d H:i:s');
            $appointment->end_time = $end_date_utc->format('Y-m-d H:i:s');
            
            $appointments[] = $appointment;
        }

        // Prepare resources array with all rooms
        $resources = [];
        foreach ($rooms as $room) {
            if (!empty($room->department_name) && !empty($room->room_name)) {
                $resource_id = "{$room->department_name} - {$room->room_name} - {$room->service_name}";
                $resources[$resource_id] = [
                    "id" => $resource_id,
                    "title" => $resource_id,
                    "department" => $room->department_name,
                    "room" => $room->room_name,
                    "service" => $room->service_name
                ];
            }
        }

        // Prepare events array
        $events = [];
        foreach ($appointments as $appointment) {
            if (!empty($appointment->department_name) && !empty($appointment->room_name)) {
                $resource_id = "{$appointment->department_name} - {$appointment->room_name} - {$appointment->service_name}";
                if ($appointment->start_time && $appointment->end_time) {
                    $events[] = [
                        "id" => $appointment->appointment_id,
                        "title" => trim("{$appointment->patient_first_name} {$appointment->patient_last_name}"),
                        "start" => $appointment->start_time,
                        "end" => $appointment->end_time,
                        "resourceId" => $resource_id
                    ];
                }
            }
        }

        wp_send_json(array(
            "resources" => array_values($resources),
            "events" => $events
        ));

    } catch (Exception $e) {
        wp_send_json_error(array('error' => $e->getMessage()));
    }
}

add_action('wp_ajax_amelia_get_appointments', 'amelia_get_appointments_json');
add_action('wp_ajax_nopriv_amelia_get_appointments', 'amelia_get_appointments_json');

// Delete appointment
function amelia_delete_appointment() {
    if (!isset($_POST['security']) || !wp_verify_nonce($_POST['security'], 'amelia_appointment_nonce')) {
        wp_send_json_error(array('message' => 'Varnostno preverjanje ni uspelo.'));
        return;
    }
    
    // Check if user has permission (only administrators and editors can delete)
    if (!current_user_can('edit_posts')) {
        wp_send_json_error(array('message' => 'Nimate dovoljenja za brisanje terminov.'));
        return;
    }
    
    // Get the appointment ID
    $appointment_id = isset($_POST['appointment_id']) ? intval($_POST['appointment_id']) : 0;
    
    if (empty($appointment_id)) {
        wp_send_json_error(array('message' => 'ID termina ni veljaven.'));
        return;
    }
    
    global $wpdb;
    $wpdb->show_errors();
    
    // Start transaction
    $wpdb->query('START TRANSACTION');
    
    try {
        // First, delete related customer bookings
        $deleted_bookings = $wpdb->delete(
            'wp_amelia_customer_bookings',
            array('appointmentId' => $appointment_id),
            array('%d')
        );
        
        if ($wpdb->last_error) {
            throw new Exception($wpdb->last_error);
        }
        
        // Then delete the appointment
        $deleted_appointment = $wpdb->delete(
            'wp_amelia_appointments',
            array('id' => $appointment_id),
            array('%d')
        );
        
        if ($wpdb->last_error) {
            throw new Exception($wpdb->last_error);
        }
        
        if ($deleted_appointment === 0) {
            throw new Exception('Termin ni bilo mogoče najti ali pa je že bil izbrisan.');
        }
        
        // Commit the transaction
        $wpdb->query('COMMIT');
        
        wp_send_json_success(array(
            'message' => 'Termin je bil uspešno izbrisan.',
            'appointment_id' => $appointment_id
        ));
        
    } catch (Exception $e) {
        // Rollback the transaction in case of error
        $wpdb->query('ROLLBACK');
        
        wp_send_json_error(array(
            'message' => 'Napaka pri brisanju termina: ' . $e->getMessage()
        ));
    }
}

add_action('wp_ajax_amelia_delete_appointment', 'amelia_delete_appointment');

function amelia_enqueue_scripts() {
    wp_enqueue_script('amelia-calendar', plugin_dir_url(__FILE__) . 'calendar.js', array('jquery'), null, true);
    wp_localize_script('amelia-calendar', 'ameliaAjax', array(
        'ajaxurl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('amelia_appointment_nonce'),
        'canEdit' => current_user_can('edit_posts')
    ));
}

add_action('wp_enqueue_scripts', 'amelia_enqueue_scripts');

function amelia_calendar_shortcode() {
    if (!is_user_logged_in()) {
        ob_start();
        ?>
        <div id="login" class="amelia-login-container">
            <div class="amelia-login-wrapper">
                <div class="login-message" style="text-align: center; margin-bottom: 20px;">
                    <h2>Prijava v sistem</h2>
                    <p>Za ogled in upravljanje urnika kemoterapij morate biti prijavljeni.</p>
                </div>

                <form name="loginform" id="loginform" action="<?php echo esc_url(wp_login_url(get_permalink())); ?>" method="post" style="display: flex; flex-direction: column; align-items: center; font-size: 14px;">
                    <p style="margin-bottom: 8px; width: 250px;">
                        <label for="user_login" style="display: block; font-size: 15px; margin-bottom: 4px;">Uporabniško ime ali e-pošta</label>
                        <input type="text" name="log" id="user_login" class="input" value="" size="20" required 
                            style="width: 100%; padding: 6px 10px; font-size: 14px; border-radius: 6px; height: 35px;">
                    </p>
                    <p style="margin-bottom: 8px; width: 250px;">
                        <label for="user_pass" style="display: block; font-size: 15px; margin-bottom: 4px;">Geslo</label>
                        <input type="password" name="pwd" id="user_pass" class="input" value="" size="20" required
                            style="width: 100%; padding: 6px 10px; font-size: 14px; border-radius: 6px; height: 35px;">
                    </p>
                    <p class="forgetmenot" style="margin-bottom: 8px; width: 250px; text-align: left;">
                        <input name="rememberme" type="checkbox" id="rememberme" value="forever">
                        <label for="rememberme" style="display: inline; font-size: 12px;">Zapomni si me</label>
                    </p>
                    <p class="submit" style="margin-top: 10px; width: 250px;">
                    <input type="submit" name="wp-submit" id="wp-submit" class="button button-primary" value="Prijava"
                        style="width: 100%; padding: 8px; font-size: 14px; border-radius: 6px; height: 35px; 
                            background-color: transparent; 
                            border: none; 
                            color: black; 
                            box-shadow: none;">
                    <input type="hidden" name="redirect_to" value="<?php echo esc_url(get_permalink()); ?>">
                    </p>
                </form>

                <p id="nav" style="text-align: center; margin-top: 15px;">
                    <a href="<?php echo esc_url(wp_lostpassword_url()); ?>" style="font-size: 12px;">Pozabljeno geslo?</a>
                </p>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    ob_start(); ?>
    <div id="amelia-calendar"></div>
    <?php return ob_get_clean();
}

// Dodajte to novo funkcijo za preverjanje razpoložljivosti
function check_appointment_availability($serviceId, $providerId, $start_time, $end_time, $exclude_appointment_id = null) {
    global $wpdb;
    
    $query = $wpdb->prepare(
        "SELECT COUNT(*) as count
        FROM wp_amelia_appointments
        WHERE (
            (bookingStart < %s AND bookingEnd > %s) OR
            (bookingStart >= %s AND bookingStart < %s) OR
            (bookingEnd > %s AND bookingEnd <= %s)
        )
        AND serviceId = %d
        AND providerId = %d",
        $end_time,
        $start_time,
        $start_time,
        $end_time,
        $start_time,
        $end_time,
        $serviceId,
        $providerId
    );

    // Če preverjamo za obstoječ termin, izključimo tega iz preverjanja
    if ($exclude_appointment_id) {
        $query .= $wpdb->prepare(" AND id != %d", $exclude_appointment_id);
    }

    $result = $wpdb->get_var($query);
    return $result == 0;
}

// Nova funkcija za pridobivanje razpoložljivih terminov
function amelia_get_available_slots() {
    if (!isset($_POST['security']) || !wp_verify_nonce($_POST['security'], 'amelia_appointment_nonce')) {
        wp_send_json_error(array('message' => 'Varnostno preverjanje ni uspelo.'));
        return;
    }

    global $wpdb;
    
    try {
        $date = isset($_POST['date']) ? sanitize_text_field($_POST['date']) : '';
        $location = isset($_POST['location']) ? sanitize_text_field($_POST['location']) : '';
        $current_appointment_id = isset($_POST['appointment_id']) ? intval($_POST['appointment_id']) : 0;

        if (empty($date) || empty($location)) {
            wp_send_json_error(array('message' => 'Manjkajo potrebni podatki.'));
            return;
        }

        // Razdeli lokacijo na dele
        $location_parts = explode(' - ', $location);
        if (count($location_parts) !== 3) {
            wp_send_json_error(array('message' => 'Neveljaven format lokacije.'));
            return;
        }

        $department_name = trim($location_parts[0]);
        $room_name = trim($location_parts[1]);
        $bed_name = trim($location_parts[2]);

        // Pridobi serviceId in providerId
        $location_query = $wpdb->prepare(
            "SELECT 
                s.id AS serviceId,
                e.id AS providerId
            FROM wp_amelia_services s
            LEFT JOIN wp_amelia_categories c ON s.categoryId = c.id
            LEFT JOIN wp_amelia_providers_to_services ps ON s.id = ps.serviceId
            LEFT JOIN wp_amelia_users e ON ps.userId = e.id
            WHERE e.firstName = %s 
            AND c.name = %s
            AND s.name = %s
            LIMIT 1",
            $department_name,
            $room_name,
            $bed_name
        );

        $location_info = $wpdb->get_row($location_query);
        
        if (!$location_info) {
            wp_send_json_error(array('message' => 'Lokacija ni bila najdena.'));
            return;
        }

        // Pridobi vse termine za ta dan
        $timezone = new DateTimeZone('Europe/Ljubljana');
        $utc_timezone = new DateTimeZone('UTC');
        
        $start_of_day = new DateTime($date . ' 00:00:00', $timezone);
        $end_of_day = new DateTime($date . ' 23:59:59', $timezone);
        
        $start_of_day->setTimezone($utc_timezone);
        $end_of_day->setTimezone($utc_timezone);

        $appointments = $wpdb->get_results($wpdb->prepare(
            "SELECT bookingStart, bookingEnd
            FROM wp_amelia_appointments
            WHERE serviceId = %d
            AND providerId = %d
            AND bookingStart >= %s
            AND bookingStart < %s
            AND id != %d
            ORDER BY bookingStart",
            $location_info->serviceId,
            $location_info->providerId,
            $start_of_day->format('Y-m-d H:i:s'),
            $end_of_day->format('Y-m-d H:i:s'),
            $current_appointment_id
        ));

        // Generiraj razpoložljive termine (30-minutni intervali med 7:00 in 20:00)
        $available_slots = array();
        $current_time = new DateTime($date . ' 07:00:00', $timezone);
        $end_time = new DateTime($date . ' 20:00:00', $timezone);

        while ($current_time < $end_time) {
            $slot_start = clone $current_time;
            $slot_end = clone $current_time;
            $slot_end->modify('+30 minutes');

            $slot_start_utc = clone $slot_start;
            $slot_end_utc = clone $slot_end;
            $slot_start_utc->setTimezone($utc_timezone);
            $slot_end_utc->setTimezone($utc_timezone);

            $is_available = true;
            foreach ($appointments as $appointment) {
                $appt_start = new DateTime($appointment->bookingStart);
                $appt_end = new DateTime($appointment->bookingEnd);
                
                if (
                    ($slot_start_utc <= $appt_end) && 
                    ($slot_end_utc >= $appt_start)
                ) {
                    $is_available = false;
                    break;
                }
            }

            if ($is_available) {
                $available_slots[] = array(
                    'start' => $slot_start->format('H:i'),
                    'end' => $slot_end->format('H:i')
                );
            }

            $current_time->modify('+30 minutes');
        }

        wp_send_json_success(array(
            'available_slots' => $available_slots
        ));

    } catch (Exception $e) {
        wp_send_json_error(array(
            'message' => 'Napaka pri pridobivanju razpoložljivih terminov: ' . $e->getMessage()
        ));
    }
}

add_action('wp_ajax_amelia_get_available_slots', 'amelia_get_available_slots');

function amelia_update_appointment() {
    error_log('Update appointment function triggered');
    
    // Check nonce
    if (!isset($_POST['security']) || !wp_verify_nonce($_POST['security'], 'amelia_appointment_nonce')) {
        wp_send_json_error(array('message' => 'Varnostno preverjanje ni uspelo.'));
        return;
    }
    
    // Check permissions
    if (!current_user_can('edit_posts')) {
        wp_send_json_error(array('message' => 'Nimate dovoljenja za urejanje terminov.'));
        return;
    }
    
    global $wpdb;
    $wpdb->show_errors();
    
    try {
        // Get and validate input data
        $appointment_id = isset($_POST['appointment_id']) ? intval($_POST['appointment_id']) : 0;
        $patient_info = isset($_POST['patient_info']) ? $_POST['patient_info'] : null; // Ne uporabimo sanitize_text_field
        $location = isset($_POST['location']) ? sanitize_text_field($_POST['location']) : '';
        $appointment_date = isset($_POST['appointment_date']) ? sanitize_text_field($_POST['appointment_date']) : '';
        $start_time = isset($_POST['start_time']) ? sanitize_text_field($_POST['start_time']) : '';
        $end_time = isset($_POST['end_time']) ? sanitize_text_field($_POST['end_time']) : '';
        
        error_log('Prejeti podatki: ' . json_encode([
            'appointment_id' => $appointment_id,
            'patient_info' => $patient_info,
            'location' => $location,
            'appointment_date' => $appointment_date,
            'start_time' => $start_time,
            'end_time' => $end_time
        ]));
        
        // Validate required fields
        if (empty($appointment_id) || empty($location) || 
            empty($appointment_date) || empty($start_time) || empty($end_time)) {
            wp_send_json_error(array('message' => 'Vsa polja so obvezna.'));
            return;
        }
    
        // Parse location to get department, room, and bed
        $location_parts = explode(' - ', $location);
        if (count($location_parts) !== 3) {
            wp_send_json_error(array('message' => 'Neveljaven format lokacije.'));
            return;
        }
        
        $department_name = trim($location_parts[0]);
        $room_name = trim($location_parts[1]);
        $bed_name = trim($location_parts[2]);

        // Get new serviceId and providerId
        $location_query = $wpdb->prepare(
            "SELECT 
                s.id AS serviceId,
                e.id AS providerId
            FROM wp_amelia_services s
            LEFT JOIN wp_amelia_categories c ON s.categoryId = c.id
            LEFT JOIN wp_amelia_providers_to_services ps ON s.id = ps.serviceId
            LEFT JOIN wp_amelia_users e ON ps.userId = e.id
            WHERE e.firstName = %s 
            AND c.name = %s
            AND s.name = %s
            LIMIT 1",
            $department_name,
            $room_name,
            $bed_name
        );

        $new_location = $wpdb->get_row($location_query);
        
        if (!$new_location) {
            wp_send_json_error(array('message' => 'Izbrana lokacija ni bila najdena.'));
            return;
        }
        
        // Convert times to UTC
        $timezone = new DateTimeZone('Europe/Ljubljana');
        $utc_timezone = new DateTimeZone('UTC');
        
        $start_datetime = new DateTime("$appointment_date $start_time", $timezone);
        $end_datetime = new DateTime("$appointment_date $end_time", $timezone);
        
        $start_datetime->setTimezone($utc_timezone);
        $end_datetime->setTimezone($utc_timezone);
        
        $booking_start = $start_datetime->format('Y-m-d H:i:s');
        $booking_end = $end_datetime->format('Y-m-d H:i:s');
        
        // Dodajte preverjanje razpoložljivosti pred posodobitvijo
        if (!check_appointment_availability(
            $new_location->serviceId,
            $new_location->providerId,
            $booking_start,
            $booking_end,
            $appointment_id
        )) {
            wp_send_json_error(array('message' => 'Izbrani termin je že zaseden. Prosimo, izberite drug termin.'));
            return;
        }

        // Start transaction
        $wpdb->query('START TRANSACTION');
        
        // Update appointment
        $updated = $wpdb->update(
            'wp_amelia_appointments',
            array(
                'serviceId' => $new_location->serviceId,
                'providerId' => $new_location->providerId,
                'bookingStart' => $booking_start,
                'bookingEnd' => $booking_end
            ),
            array('id' => $appointment_id),
            array('%d', '%d', '%s', '%s'),
            array('%d')
        );
        
        if ($wpdb->last_error) {
            throw new Exception($wpdb->last_error);
        }
        
        // Samo če so bili podatki o pacientu eksplicitno posodobljeni
        if ($patient_info !== null) {
            // Če gre za asociativni array, ga spremenimo v JSON
            if (is_array($patient_info)) {
                $info_json = json_encode($patient_info);
            } 
            // Če gre za JSON niz, ga uporabimo direktno
            else if (is_string($patient_info)) {
                // Preveri, če je veljavni JSON
                $decoded = json_decode($patient_info, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $info_json = $patient_info; // Že je v JSON formatu
                } else {
                    // Ni valid JSON, zato ustvarimo novega
                    $info_array = array(
                        'firstName' => $patient_info,
                        'lastName' => '',
                        'fullName' => $patient_info
                    );
                    $info_json = json_encode($info_array);
                }
            } else {
                throw new Exception('Neveljavni podatki o pacientu');
            }
            
            // Shranjujemo neposredno poslani JSON (brez dodatnega kodiranja)
            $updated_booking = $wpdb->update(
                'wp_amelia_customer_bookings',
                array('info' => $info_json),
                array('appointmentId' => $appointment_id),
                array('%s'),
                array('%d')
            );
            
            if ($wpdb->last_error) {
                throw new Exception($wpdb->last_error);
            }
        }

        // Commit transaction
        $wpdb->query('COMMIT');
        
        wp_send_json_success(array(
            'message' => 'Termin je bil uspešno posodobljen.',
            'appointment_id' => $appointment_id
        ));
        
    } catch (Exception $e) {
        $wpdb->query('ROLLBACK');
        error_log('Error in amelia_update_appointment: ' . $e->getMessage());
        wp_send_json_error(array(
            'message' => 'Napaka pri posodabljanju termina: ' . $e->getMessage()
        ));
    }
}
add_action('wp_ajax_amelia_update_appointment', 'amelia_update_appointment');

// Test connection function
function amelia_test_connection() {
    // Log the request
    error_log('Amelia test connection triggered');
    
    wp_send_json_success(array('message' => 'Connection successful'));
}
add_action('wp_ajax_amelia_test_connection', 'amelia_test_connection');

add_shortcode('amelia_calendar', 'amelia_calendar_shortcode');

function enqueue_select2_scripts() {
    wp_enqueue_script('jquery');
    wp_enqueue_style('select2-css', 'https://cdn.jsdelivr.net/npm/select2@4.0.13/dist/css/select2.min.css');
    wp_enqueue_script('select2-js', 'https://cdn.jsdelivr.net/npm/select2@4.0.13/dist/js/select2.min.js', array('jquery'), null, true);
    wp_add_inline_script('select2-js', 'jQuery(document).ready(function($) { console.log("jQuery je naložen:", typeof jQuery); });');
}
add_action('wp_enqueue_scripts', 'enqueue_select2_scripts');

function amelia_get_available_locations() {
    if (!isset($_POST['security']) || !wp_verify_nonce($_POST['security'], 'amelia_appointment_nonce')) {
        wp_send_json_error(array('message' => 'Varnostno preverjanje ni uspelo.'));
        return;
    }

    global $wpdb;
    
    try {
        $date = isset($_POST['date']) ? sanitize_text_field($_POST['date']) : '';
        $start_time = isset($_POST['start_time']) ? sanitize_text_field($_POST['start_time']) : '';
        $end_time = isset($_POST['end_time']) ? sanitize_text_field($_POST['end_time']) : '';
        $current_appointment_id = isset($_POST['appointment_id']) ? intval($_POST['appointment_id']) : 0;

        if (empty($date) || empty($start_time) || empty($end_time)) {
            wp_send_json_error(array('message' => 'Manjkajo potrebni podatki.'));
            return;
        }

        // Pridobi vse lokacije
        $locations_query = "
            SELECT DISTINCT
                e.firstName AS department_name,
                c.name AS room_name,
                s.name AS service_name,
                s.id AS serviceId,
                e.id AS providerId
            FROM wp_amelia_services s
            LEFT JOIN wp_amelia_categories c ON s.categoryId = c.id
            LEFT JOIN wp_amelia_providers_to_services ps ON s.id = ps.serviceId
            LEFT JOIN wp_amelia_users e ON ps.userId = e.id
            WHERE e.firstName IS NOT NULL 
            AND c.name IS NOT NULL
            ORDER BY 
                CASE e.firstName
                    WHEN 'AKT' THEN 1
                    WHEN 'DHL' THEN 2
                    WHEN 'DHD' THEN 3
                    ELSE 4
                END,
                CAST(SUBSTRING(c.name, 6) AS UNSIGNED),
                s.name";

        $locations = $wpdb->get_results($locations_query);

        // Pretvori čase v UTC
        $timezone = new DateTimeZone('Europe/Ljubljana');
        $utc_timezone = new DateTimeZone('UTC');
        
        $start_datetime = new DateTime("$date $start_time", $timezone);
        $end_datetime = new DateTime("$date $end_time", $timezone);
        
        $start_datetime->setTimezone($utc_timezone);
        $end_datetime->setTimezone($utc_timezone);
        
        $booking_start = $start_datetime->format('Y-m-d H:i:s');
        $booking_end = $end_datetime->format('Y-m-d H:i:s');

        // Pripravi vse lokacije z označeno razpoložljivostjo
        $all_locations = array();
        foreach ($locations as $location) {
            $location_id = "{$location->department_name} - {$location->room_name} - {$location->service_name}";
            
            // Preveri razpoložljivost za vsako lokacijo
            $is_available = check_appointment_availability(
                $location->serviceId,
                $location->providerId,
                $booking_start,
                $booking_end,
                $current_appointment_id
            );
            
            $all_locations[] = array(
                'id' => $location_id,
                'title' => $location_id,
                'available' => $is_available,
                'department' => $location->department_name,
                'room' => $location->room_name,
                'service' => $location->service_name
            );
        }
        
        wp_send_json_success(array(
            'locations' => $all_locations
        ));

    } catch (Exception $e) {
        error_log('Error in amelia_get_available_locations: ' . $e->getMessage());
        wp_send_json_error(array(
            'message' => 'Napaka pri pridobivanju lokacij: ' . $e->getMessage()
        ));
    }
}

add_action('wp_ajax_amelia_get_available_locations', 'amelia_get_available_locations');

// Nova funkcija za pridobivanje razpoložljivih terminov glede na lokacijo in datum
function amelia_get_available_time_slots() {
    if (!isset($_POST['security']) || !wp_verify_nonce($_POST['security'], 'amelia_appointment_nonce')) {
        wp_send_json_error(array('message' => 'Varnostno preverjanje ni uspelo.'));
        return;
    }

    global $wpdb;
    
    try {
        $date = isset($_POST['date']) ? sanitize_text_field($_POST['date']) : '';
        $location = isset($_POST['location']) ? sanitize_text_field($_POST['location']) : '';
        $duration_minutes = isset($_POST['duration_minutes']) ? intval($_POST['duration_minutes']) : 30;
        $current_appointment_id = isset($_POST['appointment_id']) ? intval($_POST['appointment_id']) : 0;

        error_log('get_available_time_slots prejeti podatki: ' . json_encode([
            'date' => $date,
            'location' => $location,
            'duration_minutes' => $duration_minutes,
            'appointment_id' => $current_appointment_id
        ]));

        if (empty($date) || empty($location)) {
            wp_send_json_error(array('message' => 'Manjkajo potrebni podatki.'));
            return;
        }

        // Razdeli lokacijo na dele
        $location_parts = explode(' - ', $location);
        if (count($location_parts) !== 3) {
            wp_send_json_error(array('message' => 'Neveljaven format lokacije.'));
            return;
        }

        $department_name = trim($location_parts[0]);
        $room_name = trim($location_parts[1]);
        $bed_name = trim($location_parts[2]);

        // Pridobi serviceId in providerId
        $location_query = $wpdb->prepare(
            "SELECT 
                s.id AS serviceId,
                e.id AS providerId
            FROM wp_amelia_services s
            LEFT JOIN wp_amelia_categories c ON s.categoryId = c.id
            LEFT JOIN wp_amelia_providers_to_services ps ON s.id = ps.serviceId
            LEFT JOIN wp_amelia_users e ON ps.userId = e.id
            WHERE e.firstName = %s 
            AND c.name = %s
            AND s.name = %s
            LIMIT 1",
            $department_name,
            $room_name,
            $bed_name
        );

        $location_info = $wpdb->get_row($location_query);
        
        if (!$location_info) {
            wp_send_json_error(array('message' => 'Lokacija ni bila najdena.'));
            return;
        }

        // Pridobi vse termine za ta dan na tej lokaciji
        $timezone = new DateTimeZone('Europe/Ljubljana');
        $utc_timezone = new DateTimeZone('UTC');
        
        $start_of_day = new DateTime($date . ' 00:00:00', $timezone);
        $end_of_day = new DateTime($date . ' 23:59:59', $timezone);
        
        $start_of_day->setTimezone($utc_timezone);
        $end_of_day->setTimezone($utc_timezone);

        // Pridobi vse obstoječe termine za to lokacijo na ta dan
        $appointments = $wpdb->get_results($wpdb->prepare(
            "SELECT bookingStart, bookingEnd
            FROM wp_amelia_appointments
            WHERE serviceId = %d
            AND providerId = %d
            AND bookingStart >= %s
            AND bookingStart < %s
            AND id != %d
            ORDER BY bookingStart",
            $location_info->serviceId,
            $location_info->providerId,
            $start_of_day->format('Y-m-d H:i:s'),
            $end_of_day->format('Y-m-d H:i:s'),
            $current_appointment_id
        ));

        // Generiraj razpoložljive termine (30-minutni intervali med 7:30 in 20:00)
        $available_slots = array();
        $current_time = new DateTime($date . ' 07:30:00', $timezone);
        $end_time = new DateTime($date . ' 20:00:00', $timezone);

        while ($current_time < $end_time) {
            $slot_start = clone $current_time;
            $slot_end = clone $current_time;
            $slot_end->modify('+' . $duration_minutes . ' minutes');

            // Če slot konča po koncu delovnega časa, ga preskoči
            if ($slot_end > $end_time) {
                break;
            }

            $slot_start_utc = clone $slot_start;
            $slot_end_utc = clone $slot_end;
            $slot_start_utc->setTimezone($utc_timezone);
            $slot_end_utc->setTimezone($utc_timezone);

            // Preveri, ali se ta termin prekriva z obstoječimi termini
            $is_available = true;
            foreach ($appointments as $appointment) {
                $appt_start = new DateTime($appointment->bookingStart);
                $appt_end = new DateTime($appointment->bookingEnd);
                
                if (
                    ($slot_start_utc < $appt_end) && 
                    ($slot_end_utc > $appt_start)
                ) {
                    $is_available = false;
                    break;
                }
            }

            if ($is_available) {
                $available_slots[] = array(
                    'start' => $slot_start->format('H:i'),
                    'end' => $slot_end->format('H:i')
                );
            }

            // Premakni se naprej za 30 minut
            $current_time->modify('+30 minutes');
        }

        wp_send_json_success(array(
            'available_slots' => $available_slots
        ));

    } catch (Exception $e) {
        error_log('Error in amelia_get_available_time_slots: ' . $e->getMessage());
        wp_send_json_error(array(
            'message' => 'Napaka pri pridobivanju razpoložljivih terminov: ' . $e->getMessage()
        ));
    }
}

add_action('wp_ajax_amelia_get_available_time_slots', 'amelia_get_available_time_slots');

// Dodajte to funkcijo v amelia-koledar.php
function amelia_get_appointment_details() {
    if (!isset($_POST['security']) || !wp_verify_nonce($_POST['security'], 'amelia_appointment_nonce')) {
        wp_send_json_error(array('message' => 'Varnostno preverjanje ni uspelo.'));
        return;
    }
    
    global $wpdb;
    
    try {
        $appointment_id = isset($_POST['appointment_id']) ? intval($_POST['appointment_id']) : 0;
        
        if (empty($appointment_id)) {
            wp_send_json_error(array('message' => 'ID termina ni veljaven.'));
            return;
        }
        
        // Pridobi podatke o pacientu iz baze
        $info_query = $wpdb->prepare(
            "SELECT info FROM wp_amelia_customer_bookings WHERE appointmentId = %d LIMIT 1",
            $appointment_id
        );
        
        $info_json = $wpdb->get_var($info_query);
        
        if ($info_json) {
            $info = json_decode($info_json, true);
            wp_send_json_success($info);
        } else {
            wp_send_json_error(array('message' => 'Ni bilo mogoče najti podatkov o pacientu.'));
        }
        
    } catch (Exception $e) {
        wp_send_json_error(array('message' => 'Napaka pri pridobivanju podatkov: ' . $e->getMessage()));
    }
}

add_action('wp_ajax_amelia_get_appointment_details', 'amelia_get_appointment_details');
add_action('wp_ajax_nopriv_amelia_get_appointment_details', 'amelia_get_appointment_details');

function amelia_check_permissions() {
    $response = array(
        'canEdit' => current_user_can('edit_posts'),
        'message' => current_user_can('edit_posts') ? 'Lahko urejate.' : 'Nimate dovoljenja za urejanje terminov.'
    );
    
    wp_send_json_success($response);
}

add_action('wp_ajax_amelia_check_permissions', 'amelia_check_permissions');
add_action('wp_ajax_nopriv_amelia_check_permissions', 'amelia_check_permissions');