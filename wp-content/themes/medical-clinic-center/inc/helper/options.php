<?php
/**
 * Helper functions related to customizer and options.
 *
 * @package medical_clinic_center
 */

if ( ! function_exists( 'medical_clinic_center_get_global_layout_options' ) ) :

	/**
	 * Returns global layout options.
	 *
	 * @since 1.0.0 
	 *
	 * @return array Options array.
	 */
	function medical_clinic_center_get_global_layout_options() {

		$choices = array(
			'left-sidebar'  => esc_html__( 'Primary Sidebar - Content', 'medical-clinic-center' ),
			'right-sidebar' => esc_html__( 'Content - Primary Sidebar', 'medical-clinic-center' ),
			'three-columns' => esc_html__( 'Three Columns', 'medical-clinic-center' ),
			'four-columns' => esc_html__( 'Four Columns', 'medical-clinic-center' ),
			'no-sidebar'    => esc_html__( 'No Sidebar', 'medical-clinic-center' ),
		);
		$output = apply_filters( 'medical_clinic_center_filter_layout_options', $choices );
		return $output;

	}

endif;

if ( ! function_exists( 'medical_clinic_center_get_archive_layout_options' ) ) :

	/**
	 * Returns archive layout options.
	 *
	 * @since 1.0.0
	 *
	 * @return array Options array.
	 */
	function medical_clinic_center_get_archive_layout_options() {

		$choices = array(
			'full'    => esc_html__( 'Full Post', 'medical-clinic-center' ),
			'excerpt' => esc_html__( 'Post Excerpt', 'medical-clinic-center' ),
		);
		$output = apply_filters( 'medical_clinic_center_filter_archive_layout_options', $choices );
		if ( ! empty( $output ) ) {
			ksort( $output );
		}
		return $output;

	}

endif;

if ( ! function_exists( 'medical_clinic_center_get_image_sizes_options' ) ) :

	/**
	 * Returns image sizes options.
	 *
	 * @since 1.0.0
	 *
	 * @param bool  $add_disable True for adding No Image option.
	 * @param array $allowed Allowed image size options.
	 * @return array Image size options.
	 */
	function medical_clinic_center_get_image_sizes_options( $add_disable = true, $allowed = array(), $show_dimension = true ) {

		global $_wp_additional_image_sizes;
		$get_intermediate_image_sizes = get_intermediate_image_sizes();
		$choices = array();
		if ( true === $add_disable ) {
			$choices['disable'] = esc_html__( 'No Image', 'medical-clinic-center' );
		}
		$choices['thumbnail'] = esc_html__( 'Thumbnail', 'medical-clinic-center' );
		$choices['medium']    = esc_html__( 'Medium', 'medical-clinic-center' );
		$choices['large']     = esc_html__( 'Large', 'medical-clinic-center' );
		$choices['full']      = esc_html__( 'Full (original)', 'medical-clinic-center' );

		if ( true === $show_dimension ) {
			foreach ( array( 'thumbnail', 'medium', 'large' ) as $key => $_size ) {
				$choices[ $_size ] = $choices[ $_size ] . ' (' . get_option( $_size . '_size_w' ) . 'x' . get_option( $_size . '_size_h' ) . ')';
			}
		}

		if ( ! empty( $_wp_additional_image_sizes ) && is_array( $_wp_additional_image_sizes ) ) {
			foreach ( $_wp_additional_image_sizes as $key => $size ) {
				$choices[ $key ] = $key;
				if ( true === $show_dimension ){
					$choices[ $key ] .= ' ('. $size['width'] . 'x' . $size['height'] . ')';
				}
			}
		}

		if ( ! empty( $allowed ) ) {
			foreach ( $choices as $key => $value ) {
				if ( ! in_array( $key, $allowed ) ) {
					unset( $choices[ $key ] );
				}
			}
		}

		return $choices;

	}

endif;


if ( ! function_exists( 'medical_clinic_center_get_image_alignment_options' ) ) :

	/**
	 * Returns image options.
	 *
	 * @since 1.0.0
	 *
	 * @return array Options array.
	 */
	function medical_clinic_center_get_image_alignment_options() {

		$choices = array(
			'none'   => _x( 'None', 'alignment', 'medical-clinic-center' ),
			'left'   => _x( 'Left', 'alignment', 'medical-clinic-center' ),
			'center' => _x( 'Center', 'alignment', 'medical-clinic-center' ),
			'right'  => _x( 'Right', 'alignment', 'medical-clinic-center' ),
		);
		return $choices;

	}

endif;

if ( ! function_exists( 'medical_clinic_center_get_featured_slider_transition_effects' ) ) :

	/**
	 * Returns the featured slider transition effects.
	 *
	 * @since 1.0.0
	 *
	 * @return array Options array.
	 */
	function medical_clinic_center_get_featured_slider_transition_effects() {

		$choices = array(
			'fade'       => _x( 'fade', 'transition effect', 'medical-clinic-center' ),
			'fadeout'    => _x( 'fadeout', 'transition effect', 'medical-clinic-center' ),
			'none'       => _x( 'none', 'transition effect', 'medical-clinic-center' ),
			'scrollHorz' => _x( 'scrollHorz', 'transition effect', 'medical-clinic-center' ),
		);
		$output = apply_filters( 'medical_clinic_center_filter_featured_slider_transition_effects', $choices );

		if ( ! empty( $output ) ) {
			ksort( $output );
		}

		return $output;

	}

endif;

if ( ! function_exists( 'medical_clinic_center_get_featured_slider_content_options' ) ) :

	/**
	 * Returns the featured slider content options.
	 *
	 * @since 1.0.0
	 *
	 * @return array Options array.
	 */
	function medical_clinic_center_get_featured_slider_content_options() {

		$choices = array(
			'home-page' => esc_html__( 'Static Front Page Only', 'medical-clinic-center' ),
			'disabled'  => esc_html__( 'Disabled', 'medical-clinic-center' ),
		);
		$output = apply_filters( 'medical_clinic_center_filter_featured_slider_content_options', $choices );
		if ( ! empty( $output ) ) {
			ksort( $output );
		}
		return $output;

	}

endif;

if ( ! function_exists( 'medical_clinic_center_get_featured_slider_type' ) ) :

	/**
	 * Returns the featured slider type.
	 *
	 * @since 1.0.0
	 *
	 * @return array Options array.
	 */
	function medical_clinic_center_get_featured_slider_type() {

		$choices = array(
			'featured-page' => __( 'Featured Pages', 'medical-clinic-center' ),
		);

		$output = apply_filters( 'medical_clinic_center_filter_featured_slider_type', $choices );

		if ( ! empty( $output ) ) {
			ksort( $output );
		}

		return $output;

	}

endif;

if ( ! function_exists( 'medical_clinic_center_get_numbers_dropdown_options' ) ) :

	/**
	 * Returns numbers dropdown options.
	 *
	 * @since 1.0.0
	 *
	 * @param int $min Min.
	 * @param int $max Max.
	 * @param string $prefix Prefix.
	 * @param string $suffix Suffix.
	 *
	 * @return array Options array.
	 */
	function medical_clinic_center_get_numbers_dropdown_options( $min = 1, $max = 4, $prefix = '', $suffix = '' ) {

		$output = array();

		if ( $min <= $max ) {
			for ( $i = $min; $i <= $max; $i++ ) {
				$string = $prefix . $i . $suffix;
				$output[ $i ] = $string;
			}
		}

		return $output;

	}

endif;