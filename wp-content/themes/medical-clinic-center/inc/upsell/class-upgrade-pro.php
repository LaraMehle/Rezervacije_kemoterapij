<?php
/**
 * Singleton class for handling the theme's customizer integration.
 *
 * @since  1.0.0
 * @access public
 */
final class Medical_Clinic_Center_Customize {

	/**
	 * Returns the instance.
	 *
	 * @since  1.0.0
	 * @access public
	 * @return object
	 */
	public static function get_instance() {

		static $instance = null;

		if ( is_null( $instance ) ) {
			$instance = new self;
			$instance->setup_actions();
		}

		return $instance;
	}

	/**
	 * Constructor method.
	 *
	 * @since  1.0.0
	 * @access private
	 * @return void
	 */
	private function __construct() {}

	/**
	 * Sets up initial actions.
	 *
	 * @since  1.0.0
	 * @access private
	 * @return void
	 */
	private function setup_actions() {

		// Register panels, sections, settings, controls, and partials.
		add_action( 'customize_register', array( $this, 'sections' ) );

		// Register scripts and styles for the controls.
		add_action( 'customize_controls_enqueue_scripts', array( $this, 'enqueue_control_scripts' ), 0 );
	}

	/**
	 * Sets up the customizer sections.
	 *
	 * @since  1.0.0
	 * @access public
	 * @param  object  $manager
	 * @return void
	*/
	public function sections( $manager ) {

		// Load custom sections.
		load_template( trailingslashit( get_template_directory() ) . 'inc/upsell/upgrade-pro.php' );

		// Register custom section types.
		$manager->register_section_type( 'Medical_Clinic_Center_Customize_Section_Pro' );

		$manager->add_section(
			new Medical_Clinic_Center_Customize_Section_Pro(
				$manager,
				'medical_clinic_center_upgrade_pro',
				array(
					'title'       => esc_html__( 'Medical Clinic Pro', 'medical-clinic-center' ),
					'pro_text'    => esc_html__( 'Get Pro Theme', 'medical-clinic-center' ),
					'pro_url'     => 'https://www.mizanthemes.com/products/clininc-wordpress-theme/',
					'priority'    => 5,
				)
			)
		);

		$manager->add_section(
			new Medical_Clinic_Center_Customize_Section_Pro(
				$manager,
				'medical_clinic_center_documentation',
				array(
					'pro_text'    => esc_html__( 'Documentation', 'medical-clinic-center' ),
					'pro_url'     => 'https://preview.mizanthemes.com/setup-guide/medical-clinic-center-free/',
					'priority'    => 200,
				)
			)
		);
	}

	/**
	 * Loads theme customizer CSS.
	 *
	 * @since  1.0.0
	 * @access public
	 * @return void
	 */
	public function enqueue_control_scripts() {

		wp_enqueue_script( 'medical-clinic-center-customize-controls', trailingslashit( get_template_directory_uri() ) . '/inc/upsell/js/customize-controls.js', array( 'customize-controls' ) );

		wp_enqueue_style( 'medical-clinic-center-customize-controls', trailingslashit( get_template_directory_uri() ) . '/inc/upsell/css/customize-controls.css' );
	}
}

// Doing this customizer thang!
Medical_Clinic_Center_Customize::get_instance();