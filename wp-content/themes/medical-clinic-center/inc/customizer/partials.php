<?php
/**
 * Customizer partials.
 *
 * @package medical_clinic_center
 */

/**
 * Render the site title for the selective refresh partial.
 *
 * @since 1.0.0
 *
 * @return void
 */
function medical_clinic_center_customize_partial_blogname() {

	bloginfo( 'name' );

}

/**
 * Render the site title for the selective refresh partial.
 *
 * @since 1.0.0
 *
 * @return void
 */
function medical_clinic_center_customize_partial_blogdescription() {

	bloginfo( 'description' );

}

/**
 * Partial for copyright text.
 *
 * @since 1.0.0
 *
 * @return void
 */
function medical_clinic_center_render_partial_copyright_text() {

	$medical_clinic_center_copyright_text = medical_clinic_center_get_option( 'medical_clinic_center_copyright_text' );
	$medical_clinic_center_copyright_text = apply_filters( 'medical_clinic_center_filter_copyright_text', $medical_clinic_center_copyright_text );
	if ( ! empty( $medical_clinic_center_copyright_text ) ) {
		$medical_clinic_center_copyright_text = wp_kses_data( $medical_clinic_center_copyright_text );
	}
	echo $medical_clinic_center_copyright_text;

}
