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
    $selected_date = isset($_POST['selectedDate']) ? sanitize_text_field($_POST['selectedDate']) : null;


    try {
        // Get all available rooms and beds
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

        $where_clause = "";
        if($selected_date){
            $where_clause = $wpdb->prepare(" WHERE DATE(a.bookingStart) = %s", $selected_date);
        }

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
            LEFT JOIN wp_amelia_customer_bookings cb ON a.id = cb.appointmentId
        " . $where_clause;

        $appointments_raw = $wpdb->get_results($appointments_query);

        if ($wpdb->last_error) {
            wp_send_json_error(array('error' => $wpdb->last_error));
            return;
        }

        $timezone = new DateTimeZone('Europe/Ljubljana');
        
        $appointments = [];
        foreach ($appointments_raw as $appointment) {
            $start_date_utc = new DateTime($appointment->original_start, new DateTimeZone('UTC'));
            $end_date_utc = new DateTime($appointment->original_end, new DateTimeZone('UTC'));
            
            $start_date_utc->setTimezone($timezone);
            $end_date_utc->setTimezone($timezone);
            
            $appointment->start_time = $start_date_utc->format('Y-m-d H:i:s');
            $appointment->end_time = $end_date_utc->format('Y-m-d H:i:s');
            
            $appointments[] = $appointment;
        }

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

function amelia_delete_appointment() {
    if (!isset($_POST['security']) || !wp_verify_nonce($_POST['security'], 'amelia_appointment_nonce')) {
        wp_send_json_error(array('message' => 'Varnostno preverjanje ni uspelo.'));
        return;
    }
    
    // Check if user has permission
    if (!current_user_can('edit_posts')) {
        wp_send_json_error(array('message' => 'Nimate dovoljenja za brisanje terminov.'));
        return;
    }
    
    $appointment_id = isset($_POST['appointment_id']) ? intval($_POST['appointment_id']) : 0;
    
    if (empty($appointment_id)) {
        wp_send_json_error(array('message' => 'ID termina ni veljaven.'));
        return;
    }
    
    global $wpdb;
    $wpdb->show_errors();
    
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
        
        $wpdb->query('COMMIT');
        
        wp_send_json_success(array(
            'message' => 'Termin je bil uspešno izbrisan.',
            'appointment_id' => $appointment_id
        ));
        
    } catch (Exception $e) {
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

    if ($exclude_appointment_id) {
        $query .= $wpdb->prepare(" AND id != %d", $exclude_appointment_id);
    }

    $result = $wpdb->get_var($query);
    return $result == 0;
}

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

        $location_parts = explode(' - ', $location);
        if (count($location_parts) !== 3) {
            wp_send_json_error(array('message' => 'Neveljaven format lokacije.'));
            return;
        }

        $department_name = trim($location_parts[0]);
        $room_name = trim($location_parts[1]);
        $bed_name = trim($location_parts[2]);

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

        // Generate available slots with 30-minute intervals
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
        $appointment_id = isset($_POST['appointment_id']) ? intval($_POST['appointment_id']) : 0;
        $patient_info = isset($_POST['patient_info']) ? $_POST['patient_info'] : null;
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
        
        if (empty($appointment_id) || empty($location) || 
            empty($appointment_date) || empty($start_time) || empty($end_time)) {
            wp_send_json_error(array('message' => 'Vsa polja so obvezna.'));
            return;
        }
    
        $location_parts = explode(' - ', $location);
        if (count($location_parts) !== 3) {
            wp_send_json_error(array('message' => 'Neveljaven format lokacije.'));
            return;
        }
        
        $department_name = trim($location_parts[0]);
        $room_name = trim($location_parts[1]);
        $bed_name = trim($location_parts[2]);

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
        
        $timezone = new DateTimeZone('Europe/Ljubljana');
        $utc_timezone = new DateTimeZone('UTC');
        
        $start_datetime = new DateTime("$appointment_date $start_time", $timezone);
        $end_datetime = new DateTime("$appointment_date $end_time", $timezone);
        
        $start_datetime->setTimezone($utc_timezone);
        $end_datetime->setTimezone($utc_timezone);
        
        $booking_start = $start_datetime->format('Y-m-d H:i:s');
        $booking_end = $end_datetime->format('Y-m-d H:i:s');
        
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

        $wpdb->query('START TRANSACTION');
        
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
        
        if ($patient_info !== null) {
            if (is_array($patient_info)) {
                $info_json = json_encode($patient_info);
            } else if (is_string($patient_info)) {

                $decoded = json_decode($patient_info, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $info_json = $patient_info;
                } else {
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

        if (isset($_POST['duration']) && is_numeric($_POST['duration'])) {
            $duration = intval($_POST['duration']);
            $wpdb->update(
                $wpdb->prefix . 'amelia_customer_bookings',
                array('duration' => $duration),
                array('appointmentId' => $appointment_id),
                array('%d'),
                array('%d')
            );
        
            if ($wpdb->last_error) {
                throw new Exception('Napaka pri shranjevanju trajanja: ' . $wpdb->last_error);
            }
        }

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

function amelia_test_connection() {
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
        $timezone = new DateTimeZone('Europe/Ljubljana');
        $utc_timezone = new DateTimeZone('UTC');
        
        $start_datetime = new DateTime("$date $start_time", $timezone);
        $end_datetime = new DateTime("$date $end_time", $timezone);
        
        $start_datetime->setTimezone($utc_timezone);
        $end_datetime->setTimezone($utc_timezone);
        
        $booking_start = $start_datetime->format('Y-m-d H:i:s');
        $booking_end = $end_datetime->format('Y-m-d H:i:s');

        $all_locations = array();
        foreach ($locations as $location) {
            $location_id = "{$location->department_name} - {$location->room_name} - {$location->service_name}";
            
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

        $location_parts = explode(' - ', $location);
        if (count($location_parts) !== 3) {
            wp_send_json_error(array('message' => 'Neveljaven format lokacije.'));
            return;
        }

        $department_name = trim($location_parts[0]);
        $room_name = trim($location_parts[1]);
        $bed_name = trim($location_parts[2]);

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

        $available_slots = array();
        $current_time = new DateTime($date . ' 07:30:00', $timezone);
        $end_time = new DateTime($date . ' 20:00:00', $timezone);

        while ($current_time < $end_time) {
            $slot_start = clone $current_time;
            $slot_end = clone $current_time;
            $slot_end->modify('+' . $duration_minutes . ' minutes');

            if ($slot_end > $end_time) {
                break;
            }

            $slot_start_utc = clone $slot_start;
            $slot_end_utc = clone $slot_end;
            $slot_start_utc->setTimezone($utc_timezone);
            $slot_end_utc->setTimezone($utc_timezone);

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

// Shortcode for daily schedule - za pripravo zdravil v lekarni
function dnevni_razpored() {
    if (!is_user_logged_in()) {
        return '...';
    }

    ob_start(); ?>
    
    <!-- Trigger button -->
    <button id="ameliaShowAppointmentsBtn" style="float: right; margin-left: 10px; padding-bottom: 8px; padding-top: 8px; background: #63a0f1ff;">
        Dnevni razpored
    </button>

    <!-- Modal overlay -->
    <div id="modalOverlay" style="
        display: none;
        position: fixed;
        inset: 0;                 /* top:0; right:0; bottom:0; left:0 */
        background: rgba(0,0,0,0.5);
        z-index: 9998;
    "></div>

    <!-- Modal container -->
    <div id="ameliaAppointmentsModal" style="
        display: none;
        position: fixed;
        top: 10%;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        padding: 10px;
        border: 1px solid #ccc;
        z-index: 9999;            /* nad overlayem */
        max-height: 90vh;
        width: 90%;
        max-width: 1000px;
        box-sizing: border-box;
        border-radius: 8px;
        font-family: Arial, sans-serif;
        color: #222;
        overflow: hidden;         /* zadrži sticky header in vsebino */
    ">

        <!-- Header showing selected date -->
        <div id="ameliaModalHeader" style="
            position: sticky;
            top: 0;
            background: white;
            padding-bottom: 20px;
            margin-bottom: 10px;
            margin-top: 10px;
            font-weight: bold;
            font-size: 18px;
            border-bottom: 1px solid #ccc;
            z-index: 1;
        ">
            Izbran datum: <span id="selectedDateText">...</span>

            <!-- Print Button -->
            <button id="ameliaPrintBtn" aria-label="Print" style="
                position: fixed;
                right: 55px;
                background: #4968ffff;
                border: none;
                color: white;
                font-weight: bold;
                font-size: 14px;
                width: 69px;
                height: 32px;
                border-radius: 4px;
                cursor: pointer;
                z-index: 10000;
                line-height: 32px;
                text-align: center;
                padding: 0;
            ">Natisni</button>

            <!-- Close Button -->
            <button id="ameliaCloseModalBtn" aria-label="Zapri" style="
                position: fixed;
                right: 15px;
                background: #6b6b6bff;
                border: none;
                color: white;
                font-weight: bold;
                font-size: 22px;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                z-index: 10000;
                line-height: 32px;
                text-align: center;
                padding: 0;
            ">&times;</button>
        </div>

        <!-- Appointments content container -->
        <div id="ameliaAppointmentsContent" style="
            max-height: calc(80vh - 70px);
            overflow-y: auto;
            padding: 8px;
        ">
            Nalagam termine...
        </div>
    </div>

    <!-- Table styles -->
    <style>
        .amelia-appointments-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            table-layout: fixed;
        }
        .amelia-appointments-table th,
        .amelia-appointments-table td {
            border: 1px solid #ccc;
            padding: 6px 10px;
            text-align: left;
            vertical-align: middle;
            font-size: 14px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }
        .amelia-appointments-table th {
            background-color: #f0f0f0;
            font-weight: 600;
        }
        .amelia-appointments-table th:nth-child(1),
        .amelia-appointments-table td:nth-child(1) {
            width: 6%; /* Čas */
        }
        .amelia-appointments-table th:nth-child(2),
        .amelia-appointments-table td:nth-child(2) {
            width: 35%; /* Pacient */
        }
        .amelia-appointments-table th:nth-child(3),
        .amelia-appointments-table td:nth-child(3) {
            width: 37%; /* Terapija */
        }
        .amelia-appointments-table th:nth-child(4),
        .amelia-appointments-table td:nth-child(4) {
            width: 12%; /* Soba */
        }
        .amelia-appointments-table th:nth-child(5),
        .amelia-appointments-table td:nth-child(5) {
            width: 10%; /* Postelja */
        }

        body.no-scroll { overflow: hidden; }
    </style>

    <script>
    document.addEventListener('DOMContentLoaded', function () {
        const modal = document.getElementById('ameliaAppointmentsModal');
        const overlay = document.getElementById('modalOverlay');
        const output = document.getElementById('ameliaAppointmentsContent');
        const showBtn = document.getElementById('ameliaShowAppointmentsBtn');
        const closeBtn = document.getElementById('ameliaCloseModalBtn');
        const selectedDateText = document.getElementById('selectedDateText');
        const printBtn = document.getElementById('ameliaPrintBtn');

        let appointmentCache     = null;
        let appointmentCacheDate = null;

        function openModal() {
            overlay.style.display = 'block';
            modal.style.display = 'block';
            document.body.classList.add('no-scroll');
        }

        function closeModal() {
            modal.style.display = 'none';
            overlay.style.display = 'none';
            document.body.classList.remove('no-scroll');
        }

        // zapri s klikom na overlay
        overlay.addEventListener('click', closeModal);

        // zapri z ESC
        document.addEventListener('keydown', function(e){
            if (e.key === 'Escape' && modal.style.display === 'block') {
                closeModal();
            }
        });

        function getPatientAndTherapy(appt) {
            const rawFirst = (appt.firstName ?? appt.first_name ?? (appt.customer && appt.customer.firstName) ?? '').toString().trim();
            const rawLast  = (appt.lastName  ?? appt.last_name  ?? (appt.customer && appt.customer.lastName)  ?? '').toString().trim();
            if (rawFirst || rawLast) {
                return { patient: rawFirst, therapy: rawLast, therapyLower: rawLast.normalize('NFKD').toLowerCase() };
            }
            const title = (appt.title || '').trim();
            const parts = title ? title.split(/\s+/) : [];
            if (!parts.length) return { patient: '', therapy: '', therapyLower: '' };

            const idxNum = parts.findIndex(p => /\d+\/\d+/.test(p));
            if (idxNum !== -1) {
                if (idxNum === 0) {
                    const patient = parts.slice(0, 3).join(' ').trim();
                    const therapy = parts.slice(3).join(' ').trim();
                    return { patient, therapy, therapyLower: therapy.normalize('NFKD').toLowerCase() };
                } else {
                    const patient = parts.slice(0, idxNum + 1).join(' ').trim();
                    const therapy = parts.slice(idxNum + 1).join(' ').trim();
                    return { patient, therapy, therapyLower: therapy.normalize('NFKD').toLowerCase() };
                }
            }
            const patient = parts.slice(0, 2).join(' ').trim();
            const therapy = parts.slice(2).join(' ').trim();
            return { patient, therapy, therapyLower: therapy.normalize('NFKD').toLowerCase() };
        }


        function renderAppointments(data, selectedDate) {
            if (!data.events || data.events.length === 0) {
                output.textContent = 'Ni podatkov.';
                return;
            }

            const sameDay = data.events.filter(ev => ev.start && ev.start.startsWith(selectedDate));

            // odstrani vse termine, kjer je EX samostojno in vse dodamjanic komentarje
            const filtered = sameDay.filter(ev => {
                const title = String(ev.title || '');
                return !(/\bEX\s*\.?\b/i.test(title) || /dodamjanic/i.test(title));
            });

            if (filtered.length === 0) {
                output.textContent = 'Ni terminov za izbrani datum.';
                return;
            }

            // Sort: čas → terapija → soba → postelja
            filtered.sort((a, b) => {
                // 1) čas
                const ta = new Date(a.start).getTime();
                const tb = new Date(b.start).getTime();
                if (ta !== tb) return ta - tb;

                // 2) terapija (iz lastName; fallback na razbito iz title)
                const tA = getPatientAndTherapy(a).therapyLower.normalize('NFKD');
                const tB = getPatientAndTherapy(b).therapyLower.normalize('NFKD');

                if (tA !== tB) return tA.localeCompare(tB);

                // 3) soba
                const pa = a.resourceId ? a.resourceId.split(' - ') : [];
                const pb = b.resourceId ? b.resourceId.split(' - ') : [];
                const roomA = pa[1] || '';
                const roomB = pb[1] || '';
                if (roomA !== roomB) return roomA.localeCompare(roomB);

                // 4) postelja
                const bedA = pa[2] || '';
                const bedB = pb[2] || '';
                return bedA.localeCompare(bedB);
            });


            // Group by start time
            const grouped = {};
            filtered.forEach(appt => {
                const time = new Date(appt.start).toLocaleTimeString('sl-SI', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
                if (!grouped[time]) grouped[time] = [];
                grouped[time].push(appt);
            });

            // Build HTML table
            let html = '';
            let prevTime = null;

            Object.keys(grouped).forEach(time => {
                if (prevTime !== null) html += '<div style="height: 15px;"></div>';
                prevTime = time;

                html += `<table class="amelia-appointments-table">
                            <thead>
                                <tr>
                                    <th>Čas</th>
                                    <th>Pacient</th>
                                    <th>Terapija</th>
                                    <th>Soba</th>
                                    <th>Postelja</th>
                                </tr>
                            </thead>
                            <tbody>`;

                grouped[time].forEach(appt => {
                    const startTime = new Date(appt.start).toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit', hour12: false });
                    const parts = appt.resourceId ? appt.resourceId.split(' - ') : [];
                    const room  = parts[1] || '—';
                    const bed   = parts[2] || '—';

                    // razbij title na pacienta in terapijo
                    const { patient, therapy } = getPatientAndTherapy(appt);

                    html += `<tr>
                                <td>${startTime}</td>
                                <td>${patient}</td>
                                <td>${therapy}</td>
                                <td>${room}</td>
                                <td>${bed}</td>
                            </tr>`;

                });

                html += '</tbody></table>';
            });

            output.innerHTML = html;
        }

        // Preload today's appointments into cache
        const preloadDate = localStorage.getItem('selectedDate') || new Date().toISOString().split('T')[0];

        fetch('<?php echo admin_url('admin-ajax.php'); ?>', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'amelia_get_appointments',
                selectedDate: preloadDate
            })
        })
        .then(res => res.json())
        .then(data => {
            appointmentCache     = data;
            appointmentCacheDate = preloadDate;
        })
        .catch(() => {});

        // Show modal and load appointments
        showBtn.addEventListener('click', function () {
            openModal();

            const selectedDate = localStorage.getItem('selectedDate') || new Date().toISOString().split('T')[0];
            const dateObj = new Date(selectedDate);
            const formattedDate = `${dateObj.getDate()}. ${dateObj.getMonth() + 1}. ${dateObj.getFullYear()}`;
            selectedDateText.textContent = formattedDate;

            if (appointmentCache && appointmentCacheDate === selectedDate) {
                renderAppointments(appointmentCache, selectedDate);
            } else {
                output.textContent = 'Nalagam termine...';

                fetch('<?php echo admin_url('admin-ajax.php'); ?>', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        action: 'amelia_get_appointments',
                        selectedDate: selectedDate
                    })
                })
                .then(res => res.json())
                .then(data => {
                    appointmentCache = data;
                    appointmentCacheDate = selectedDate;
                    renderAppointments(data, selectedDate);
                })
                .catch(() => {
                    output.textContent = 'Napaka pri pridobivanju podatkov.';
                });
            }
        });

        // Close modal
        closeBtn.addEventListener('click', closeModal);

        // Print functionality
        printBtn.addEventListener('click', function () {
            const printContents = document.getElementById('ameliaAppointmentsContent').innerHTML;
            const selectedDate  = document.getElementById('selectedDateText').textContent;

            const printWindow = window.open('', 'print', 'height=600,width=800,menubar=no,toolbar=no,location=no,status=no');
            printWindow.document.write('<html><head><title>Dnevni razpored</title><style>');
            printWindow.document.write(`
                @page { margin: 20mm; }
                body {
                    font-family: Arial, sans-serif;
                    color: #222;
                    margin: 10mm;
                }
                h2 {
                    text-align: center;
                    margin-bottom: 30px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    table-layout: fixed;
                }
                th:nth-child(1), td:nth-child(1) { width: 10%; } /* Čas */
                th:nth-child(2), td:nth-child(2) { width: 20%; } /* Pacient */
                th:nth-child(3), td:nth-child(3) { width: 40%; } /* Terapija */
                th:nth-child(4), td:nth-child(4) { width: 15%; } /* Soba */
                th:nth-child(5), td:nth-child(5) { width: 15%; } /* Postelja */

                th, td {
                    border: 1px solid #ccc;
                    padding: 6px 10px;
                    text-align: left;
                    font-size: 14px;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                }
                th {
                    background-color: #f0f0f0;
                    font-weight: 600;
                }
            `);
            printWindow.document.write('</style></head><body>');
            printWindow.document.write('<h2>Termini za: ' + selectedDate + '</h2>');
            printWindow.document.write(printContents);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        });
    });
    </script>

    <?php
    return ob_get_clean();
}
add_shortcode('dnevni', 'dnevni_razpored');

// Shortcode for weekly schedule - tedenski razpored za pripravo zdravil v lekarni
function tedenski_razpored() {
    if (!is_user_logged_in()) {
        return '...';
    }

    ob_start(); ?>

    <!-- Gumb za tedenski razpored -->
    <button id="ameliaWeeklyShowBtn"
            style="float: right; margin-left: 10px; padding-bottom: 8px; padding-top: 8px; background: #07aa60ff;">
        Tedenski razpored
    </button>

    <!-- Overlay -->
    <div id="modalOverlayWeekly" style="
        display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:9998;
    "></div>

    <!-- Modal -->
    <div id="ameliaWeeklyModal" style="
        display:none; position:fixed; top:10%; left:50%; transform:translateX(-50%);
        background:#fff; padding:10px; border:1px solid #ccc; z-index:9999;
        max-height:90vh; width:90%; max-width:1000px; box-sizing:border-box; border-radius:8px;
        font-family:Arial, sans-serif; color:#222; overflow:hidden;
    ">
        <!-- Header -->
        <div id="ameliaWeeklyHeader" style="
            position:sticky; top:0; background:#fff; padding-bottom:20px; margin:10px 0; font-weight:bold;
            font-size:18px; border-bottom:1px solid #ccc; z-index:1;
        ">
            Teden: <span id="selectedWeekText">...</span>

            <!-- Gumb print -->
            <button id="ameliaWeeklyPrintBtn" aria-label="Print" style="
                position:fixed; right:55px; background:#4968ff; border:none; color:#fff; font-weight:bold;
                font-size:14px; width:69px; height:32px; border-radius:4px; cursor:pointer; z-index:10000; line-height:32px; text-align:center; padding:0;
            ">Natisni</button>

            <!-- Gumb close -->
            <button id="ameliaWeeklyCloseBtn" aria-label="Zapri" style="
                position:fixed; right:15px; background:#6b6b6b; border:none; color:#fff; font-weight:bold;
                font-size:22px; width:32px; height:32px; border-radius:50%; cursor:pointer; z-index:10000; line-height:32px; text-align:center; padding:0;
            ">&times;</button>
        </div>

        <!-- Vsebina -->
        <div id="ameliaWeeklyContent" style="max-height:calc(80vh - 70px); overflow-y:auto; padding:0 8px 8px;">
            Nalagam tedenski razpored...
        </div>
    </div>

    <!-- Izgled tedenskega razporeda -->
    <style>
        .amelia-week-day-block { margin:16px 0 24px 0; }
        .amelia-week-day-header {
            position: sticky; top: 0; background: white;
            padding: 8px 0; font-weight: 700; font-size: 16px; border-bottom: 1px solid #ccc;
        }
        .amelia-weekly-table {
            width: 100%; border-collapse: collapse; margin-bottom: 20px; table-layout: fixed;
        }
        .amelia-weekly-table th, .amelia-weekly-table td {
            border: 1px solid #ccc; padding: 6px 10px; text-align: left; vertical-align: middle;
            font-size: 14px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
        }
        .amelia-weekly-table th { background-color: #f0f0f0; font-weight: 600; }
        .amelia-weekly-table th:nth-child(1), .amelia-weekly-table td:nth-child(1) { width: 6%; }  /* Čas */
        .amelia-weekly-table th:nth-child(2), .amelia-weekly-table td:nth-child(2) { width: 35%; } /* Pacient */
        .amelia-weekly-table th:nth-child(3), .amelia-weekly-table td:nth-child(3) { width: 37%; } /* Terapija */
        .amelia-weekly-table th:nth-child(4), .amelia-weekly-table td:nth-child(4) { width: 12%; } /* Soba */
        .amelia-weekly-table th:nth-child(5), .amelia-weekly-table td:nth-child(5) { width: 10%; } /* Postelja */
        body.no-scroll { overflow: hidden; }
    </style>

    <script>
    document.addEventListener('DOMContentLoaded', function () {
        // --- elementi
        const weeklyBtn   = document.getElementById('ameliaWeeklyShowBtn');
        const modal       = document.getElementById('ameliaWeeklyModal');
        const overlay     = document.getElementById('modalOverlayWeekly');
        const output      = document.getElementById('ameliaWeeklyContent');
        const closeBtn    = document.getElementById('ameliaWeeklyCloseBtn');
        const printBtn    = document.getElementById('ameliaWeeklyPrintBtn');
        const weekTextEl  = document.getElementById('selectedWeekText');

        // --- modal open/close
        function openModal() {
            overlay.style.display = 'block';
            modal.style.display = 'block';
            document.body.classList.add('no-scroll');
        }
        function closeModal() {
            modal.style.display = 'none';
            overlay.style.display = 'none';
            document.body.classList.remove('no-scroll');
        }
        overlay.addEventListener('click', closeModal);
        document.addEventListener('keydown', function(e){
            if (e.key === 'Escape' && modal.style.display === 'block') closeModal();
        });
        closeBtn.addEventListener('click', closeModal);

        // --- helperji datumi
        function toISODateLocal(d) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        }
        // Pridobi obseg tedna (pon-pet) v ISO formatu
        function getWeekRangeISO(dateStr) {
            const d = new Date(dateStr);
            const jsDay = d.getDay();              // 0..6
            const diffToMon = (jsDay + 6) % 7;     // pon=0, tor=1, ..., ned=6
            const mon = new Date(d); mon.setDate(d.getDate() - diffToMon);
            const fri = new Date(mon); fri.setDate(mon.getDate() + 4);
            return { mon: toISODateLocal(mon), fri: toISODateLocal(fri) };
        }
        // Format datuma v slovenščini
        function formatDateSl(dateStr) {
            const d = new Date(dateStr + 'T00:00:00');
            return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
        }
        function slWeekday(dateStr) {
            return new Intl.DateTimeFormat('sl-SI', { weekday: 'short' }).format(new Date(dateStr + 'T00:00:00'));
        }

        // Locevanje info na pacienta in terapijo
        function getPatientAndTherapy(appt) {
            const rawFirst = (appt.firstName ?? appt.first_name ?? (appt.customer && appt.customer.firstName) ?? '').toString().trim();
            const rawLast  = (appt.lastName  ?? appt.last_name  ?? (appt.customer && appt.customer.lastName)  ?? '').toString().trim();
            if (rawFirst || rawLast) {
                return { patient: rawFirst, therapy: rawLast, therapyLower: rawLast.normalize('NFKD').toLowerCase() };
            }
            const title = (appt.title || '').trim();
            const parts = title ? title.split(/\s+/) : [];
            if (!parts.length) return { patient: '', therapy: '', therapyLower: '' };

            const idxNum = parts.findIndex(p => /\d+\/\d+/.test(p));
            if (idxNum !== -1) {
                if (idxNum === 0) {
                    const patient = parts.slice(0, 3).join(' ').trim();
                    const therapy = parts.slice(3).join(' ').trim();
                    return { patient, therapy, therapyLower: therapy.normalize('NFKD').toLowerCase() };
                } else {
                    const patient = parts.slice(0, idxNum + 1).join(' ').trim();
                    const therapy = parts.slice(idxNum + 1).join(' ').trim();
                    return { patient, therapy, therapyLower: therapy.normalize('NFKD').toLowerCase() };
                }
            }
            const patient = parts.slice(0, 2).join(' ').trim();
            const therapy = parts.slice(2).join(' ').trim();
            return { patient, therapy, therapyLower: therapy.normalize('NFKD').toLowerCase() };
        }

        // --- fetch enega dne
        function fetchDay(dateISO) {
            return fetch('<?php echo admin_url('admin-ajax.php'); ?>', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ action: 'amelia_get_appointments', selectedDate: dateISO })
            }).then(r => r.json()).catch(() => ({ events: [] }));
        }

        // --- render tedna (pon–pet)
        function renderWeeklyAppointments(allEvents, daysISO) {
            // razdeli po dnevih
            const byDay = new Map(daysISO.map(d => [d, []]));
            (allEvents.events || []).forEach(ev => {
                if (!ev.start) return;
                const key = ev.start.slice(0,10);
                if (byDay.has(key)) byDay.get(key).push(ev);
            });

            // Sort po dnevu --> najprej po urah nato po terapiji in nato po sobah ter posteljah
            const prepareDay = (list) => {
                const filtered = list.filter(ev => {
                    const title = String(ev.title || '');
                    return !(/\bEX\s*\.?\b/i.test(title) || /dodamjanic/i.test(title)); // dodamjanic komentarje ignoriramo ker za lekarno niso relevantni
                });

                filtered.sort((a, b) => {
                    const ta = new Date(a.start).getTime();
                    const tb = new Date(b.start).getTime();
                    if (ta !== tb) return ta - tb;

                    const tA = (getPatientAndTherapy(a).therapyLower || '');
                    const tB = (getPatientAndTherapy(b).therapyLower || '');
                    if (tA !== tB) return tA.localeCompare(tB);

                    const pa = a.resourceId ? a.resourceId.split(' - ') : [];
                    const pb = b.resourceId ? b.resourceId.split(' - ') : [];
                    const roomA = pa[1] || '';
                    const roomB = pb[1] || '';
                    if (roomA !== roomB) return roomA.localeCompare(roomB);

                    const bedA = pa[2] || '';
                    const bedB = pb[2] || '';
                    return bedA.localeCompare(bedB);
                });

                // grupiranje po urah
                const byTime = {};
                filtered.forEach(appt => {
                    const time = new Date(appt.start).toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit', hour12: false });
                    if (!byTime[time]) byTime[time] = [];
                    byTime[time].push(appt);
                });
                return byTime;
            };
            
            // Generiranje HTML
            let html = '';
            daysISO.forEach(dayISO => {
                const grouped = prepareDay(byDay.get(dayISO) || []);
                html += `<div class="amelia-week-day-block">
                    <div class="amelia-week-day-header">${slWeekday(dayISO)} – ${formatDateSl(dayISO)}</div>`;

                const times = Object.keys(grouped);
                if (times.length === 0) {
                    html += `<div style="padding:8px; color:#666;">Ni terminov.</div></div>`;
                    return;
                }

                let prevTime = null;
                times.forEach(time => {
                    if (prevTime !== null) html += '<div style="height:12px;"></div>';
                    prevTime = time;

                    html += `<table class="amelia-weekly-table">
                        <thead>
                            <tr>
                                <th>Čas</th>
                                <th>Pacient</th>
                                <th>Terapija</th>
                                <th>Soba</th>
                                <th>Postelja</th>
                            </tr>
                        </thead>
                        <tbody>`;

                    grouped[time].forEach(appt => {
                        const startTime = new Date(appt.start).toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit', hour12: false });
                        const parts = appt.resourceId ? appt.resourceId.split(' - ') : [];
                        const room  = parts[1] || '—';
                        const bed   = parts[2] || '—';
                        const { patient, therapy } = getPatientAndTherapy(appt);

                        html += `<tr>
                            <td>${startTime}</td>
                            <td>${patient || ''}</td>
                            <td>${therapy || ''}</td>
                            <td>${room}</td>
                            <td>${bed}</td>
                        </tr>`;
                    });

                    html += `</tbody></table>`;
                });

                html += `</div>`;
            });

            output.innerHTML = html;
        }

        weeklyBtn.addEventListener('click', function () {
            openModal();

            const selectedDate = localStorage.getItem('selectedDate') || new Date().toISOString().split('T')[0];
            const { mon, fri } = getWeekRangeISO(selectedDate);
            weekTextEl.textContent = `${formatDateSl(mon)} – ${formatDateSl(fri)}`;

            // pon–pet
            const days = [];
            let d = new Date(mon + 'T00:00:00');
            for (let i = 0; i < 5; i++) { days.push(toISODateLocal(d)); d.setDate(d.getDate() + 1); }

            output.textContent = 'Nalagam tedenski razpored...';

            Promise.all(days.map(fetchDay))
                .then(responses => {
                    const events = [];
                    responses.forEach(r => { if (r && r.events) events.push(...r.events); });
                    renderWeeklyAppointments({ events }, days);
                })
                .catch(() => { output.textContent = 'Napaka pri pridobivanju podatkov.'; });
        });

        // Print funkcionalnost
        printBtn.addEventListener('click', function () {
            const printContents = document.getElementById('ameliaWeeklyContent').innerHTML;
            const weekText  = document.getElementById('selectedWeekText').textContent;

            const printWindow = window.open('', 'print', 'height=600,width=800,menubar=no,toolbar=no,location=no,status=no');
            printWindow.document.write('<html><head><title>Tedenski razpored</title><style>');
            printWindow.document.write(`
                @page { margin: 20mm; }
                body { font-family: Arial, sans-serif; color:#222; margin:10mm; }
                h2 { text-align:center; margin-bottom: 30px; }
                table { width:100%; border-collapse: collapse; margin-bottom:20px; table-layout: fixed; }
                th:nth-child(1), td:nth-child(1) { width: 10%; } /* Čas */
                th:nth-child(2), td:nth-child(2) { width: 20%; } /* Pacient */
                th:nth-child(3), td:nth-child(3) { width: 40%; } /* Terapija */
                th:nth-child(4), td:nth-child(4) { width: 15%; } /* Soba */
                th:nth-child(5), td:nth-child(5) { width: 15%; } /* Postelja */
                th, td { border:1px solid #ccc; padding:6px 10px; text-align:left; font-size:14px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
                th { background:#f0f0f0; font-weight:600; }
                .amelia-week-day-header { font-weight:700; font-size:16px; margin:12px 0 4px 0; }
            `);
            printWindow.document.write('</style></head><body>');
            printWindow.document.write('<h2>Tedenski razpored: ' + weekText + '</h2>');
            printWindow.document.write(printContents);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        });
    });
    </script>

    <?php
    return ob_get_clean();
}
add_shortcode('tedenski', 'tedenski_razpored');

