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

        // Then, get all appointments
        $appointments_query = "
            SELECT 
                a.id AS appointment_id,
                DATE_ADD(a.bookingStart, INTERVAL 1 HOUR) AS start_time,
                DATE_ADD(a.bookingEnd, INTERVAL 1 HOUR) AS end_time,
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

        $appointments = $wpdb->get_results($appointments_query);

        if ($wpdb->last_error) {
            wp_send_json_error(array('error' => $wpdb->last_error));
            return;
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
        'nonce' => wp_create_nonce('amelia_appointment_nonce')
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

add_shortcode('amelia_calendar', 'amelia_calendar_shortcode');

function enqueue_select2_scripts() {
    wp_enqueue_script('jquery');
    wp_enqueue_style('select2-css', 'https://cdn.jsdelivr.net/npm/select2@4.0.13/dist/css/select2.min.css');
    wp_enqueue_script('select2-js', 'https://cdn.jsdelivr.net/npm/select2@4.0.13/dist/js/select2.min.js', array('jquery'), null, true);
    wp_add_inline_script('select2-js', 'jQuery(document).ready(function($) { console.log("jQuery je naložen:", typeof jQuery); });');
}
add_action('wp_enqueue_scripts', 'enqueue_select2_scripts');