<?php
	
require get_template_directory() . '/inc/recommendations/class-tgm-plugin-activation.php';

/**
 * Recommended plugins.
 */
function medical_clinic_center_register_recommended_plugins() {
	$plugins = array(
		array(
			'name'             => __( 'Mizan Demo Importor', 'medical-clinic-center' ),
			'slug'             => 'mizan-demo-importer',
			'required'         => false,
			'force_activation' => false,
		),
		array(
			'name'             => __( 'Happy Addons for Elementor', 'medical-clinic-center' ),
			'slug'             => 'happy-elementor-addons',
			'required'         => false,
			'force_activation' => false,
		),
		array(
			'name'             => __( 'Prime Slider – Addons For Elementor (Revolution of a slider, Hero Slider, Media Slider, Drag Drop Slider, Video Slider, Product Slider, Ecommerce Slider)', 'medical-clinic-center' ),
			'slug'             => 'bdthemes-prime-slider-lite',
			'required'         => false,
			'force_activation' => false,
		),
		array(
			'name'             => __( 'Contact Form 7', 'medical-clinic-center' ),
			'slug'             => 'contact-form-7',
			'required'         => false,
			'force_activation' => false,
		),
	);
	$config = array();
	medical_clinic_center_tgmpa( $plugins, $config );
}
add_action( 'tgmpa_register', 'medical_clinic_center_register_recommended_plugins' );