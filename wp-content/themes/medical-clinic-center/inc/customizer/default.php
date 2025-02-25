<?php
/**
 * Default theme options.
 *
 * @package medical_clinic_center
 */

if ( ! function_exists( 'medical_clinic_center_get_default_theme_options' ) ) :

	/**
	 * Get default theme options.
	 *
	 * @since 1.0.0
	 *
	 * @return array Default theme options.
	 */
	function medical_clinic_center_get_default_theme_options() {

		$defaults = array();

		//General Option
        $defaults['medical_clinic_center_show_scroll_to_top']          = true;
        $defaults['medical_clinic_center_show_preloader_setting']      = false;
        $defaults['medical_clinic_center_show_data_sticky_setting']    = false;
		$defaults['medical_clinic_center_enable_cursor_dot_outline'] = false;
		
		// Typography
		$defaults['medical_clinic_center_body_font_family']         = '';
		$defaults['medical_clinic_center_h1_font_family']          	= '';
		$defaults['medical_clinic_center_h1_font_size']         	= '';
		$defaults['medical_clinic_center_h2_font_family']          	= '';
		$defaults['medical_clinic_center_h2_font_size']         	= '';
		$defaults['medical_clinic_center_h3_font_family']          	= '';
		$defaults['medical_clinic_center_h3_font_size']         	= '';
		$defaults['medical_clinic_center_h4_font_family']          	= '';
		$defaults['medical_clinic_center_h4_font_size']         	= '';
		$defaults['medical_clinic_center_h5_font_family']          	= '';
		$defaults['medical_clinic_center_h5_font_size']         	= '';
		$defaults['medical_clinic_center_h6_font_family']          	= '';
		$defaults['medical_clinic_center_h6_font_size']         	= '';

		// Global Color
		$defaults['medical_clinic_center_first_color']          = '#42c2c9';

        //Post Option
        $defaults['medical_clinic_center_show_post_date_setting']          		 = true;
        $defaults['medical_clinic_center_show_post_heading_setting']       		 = true;
        $defaults['medical_clinic_center_show_post_content_setting']       		 = true;
        $defaults['medical_clinic_center_show_post_admin_setting']         		 = true;
        $defaults['medical_clinic_center_show_post_categories_setting']    		 = true;
        $defaults['medical_clinic_center_show_post_comments_setting']    	 	 = true;
        $defaults['medical_clinic_center_show_post_featured_image_setting']   	 = true;
        $defaults['medical_clinic_center_show_post_tags_setting']    			 = true;

		// Header.
		$defaults['medical_clinic_center_show_title']            = true;
		$defaults['medical_clinic_center_show_tagline']          = false;
		$defaults['medical_clinic_center_show_social_in_header'] = false;
		$defaults['medical_clinic_center_search_in_header']      = true;

		// Layout.
		$defaults['medical_clinic_center_global_layout']           = 'right-sidebar';
		$defaults['medical_clinic_center_archive_layout']          = 'excerpt';
		$defaults['medical_clinic_center_archive_image']           = 'large';
		$defaults['medical_clinic_center_archive_image_alignment'] = 'center';
		$defaults['medical_clinic_center_single_image']            = 'large';

		// Home Page.
		$defaults['medical_clinic_center_home_content_status'] = true;
		
		// 404 page
		$defaults['medical_clinic_center_404_page_title']  = esc_html__( 'Oops! That page can&rsquo;t be found.', 'medical-clinic-center' );
		$defaults['medical_clinic_center_404_page_text']  = esc_html__( 'It looks like nothing was found at this location. Maybe try one of the links below or a search?', 'medical-clinic-center' );

		// Footer.
		$defaults['medical_clinic_center_copyright_text']        = esc_html__( 'Copyright &copy; All rights reserved.', 'medical-clinic-center' );
		$defaults['medical_clinic_center_copyright_text_font_size'] = '18';
		$defaults['medical_clinic_center_copyright_text_align'] = 'center';

		// Pass through filter.
		$defaults = apply_filters( 'medical_clinic_center_filter_default_theme_options', $defaults );
		return $defaults;
	}

endif;
