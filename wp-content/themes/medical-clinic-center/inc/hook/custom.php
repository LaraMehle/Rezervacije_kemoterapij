<?php
/**
 * Custom theme functions.
 *
 * This file contains hook functions attached to theme hooks.
 *
 * @package medical_clinic_center
 */

if ( ! function_exists( 'medical_clinic_center_skip_to_content' ) ) :
	/**
	 * Add Skip to content.
	 *
	 * @since 1.0.0
	 */
	function medical_clinic_center_skip_to_content() {
	?><a class="skip-link screen-reader-text" href="#content"><?php esc_html_e( 'Skip to content', 'medical-clinic-center' ); ?></a><?php
	}
endif;

add_action( 'medical_clinic_center_action_before', 'medical_clinic_center_skip_to_content', 15 );

// Middle Header

if ( ! function_exists( 'medical_clinic_center_site_branding' ) ) :

	/**
	 * Site branding.
	 *
	 * @since 1.0.0
	 */
	function medical_clinic_center_site_branding() {
		$medical_clinic_center_header_top_phone_text = medical_clinic_center_get_option( 'medical_clinic_center_header_top_phone_text' );
		$medical_clinic_center_header_top_phone_number = medical_clinic_center_get_option( 'medical_clinic_center_header_top_phone_number' );

		$medical_clinic_center_header_top_hiring_head = medical_clinic_center_get_option( 'medical_clinic_center_header_top_hiring_head' );

		$medical_clinic_center_header_top_emergency_call = medical_clinic_center_get_option( 'medical_clinic_center_header_top_emergency_call' );

		$medical_clinic_center_header_top_location_text = medical_clinic_center_get_option( 'medical_clinic_center_header_top_location_text' );
		$medical_clinic_center_header_top_location = medical_clinic_center_get_option( 'medical_clinic_center_header_top_location' );

		$medical_clinic_center_header_top_timing_text = medical_clinic_center_get_option( 'medical_clinic_center_header_top_timing_text' );
		$medical_clinic_center_header_top_timing = medical_clinic_center_get_option( 'medical_clinic_center_header_top_timing' );

		$medical_clinic_center_header_top_contact_text = medical_clinic_center_get_option( 'medical_clinic_center_header_top_contact_text' );
		$medical_clinic_center_header_top_contact = medical_clinic_center_get_option( 'medical_clinic_center_header_top_contact' );

		$medical_clinic_center_header_top_booknow_btn_text = medical_clinic_center_get_option( 'medical_clinic_center_header_top_booknow_btn_text' );
		$medical_clinic_center_header_top_booknow_btn_link = medical_clinic_center_get_option( 'medical_clinic_center_header_top_booknow_btn_link' );

		$medical_clinic_center_social_media_facebook = medical_clinic_center_get_option( 'medical_clinic_center_social_media_facebook' );
		$medical_clinic_center_social_media_twitter = medical_clinic_center_get_option( 'medical_clinic_center_social_media_twitter' );
		$medical_clinic_center_social_media_instagram = medical_clinic_center_get_option( 'medical_clinic_center_social_media_instagram' );
		$medical_clinic_center_social_media_linkdin = medical_clinic_center_get_option( 'medical_clinic_center_social_media_linkdin' );
		$medical_clinic_center_social_media_youtube = medical_clinic_center_get_option( 'medical_clinic_center_social_media_youtube' );
		$medical_clinic_center_data_sticky = medical_clinic_center_get_option( 'medical_clinic_center_show_data_sticky_setting' );

		?>

		<div class="topheader">
			<div class="container">
				<div class="row">
					<div class="col-lg-4 col-md-4 col-sm-4 align-self-center">
						<?php if( !empty($medical_clinic_center_header_top_hiring_head) ):?>
							<p class="mb-0"><?php echo esc_html($medical_clinic_center_header_top_hiring_head);?></p>
						<?php endif; ?>
					</div>
					<div class="col-lg-4 col-md-4 col-sm-4 text-md-right text-center align-self-center">
						<?php if( !empty($medical_clinic_center_header_top_emergency_call) ):?>
							<span><?php esc_html_e('For Emergencies Contact: ','medical-clinic-center'); ?> <?php echo esc_html($medical_clinic_center_header_top_emergency_call);?></span>
						<?php endif; ?>
					</div>
					<div class="col-lg-4 col-md-4 col-sm-4 align-self-center">
						<div class="social-links text-center text-md-end">
							<span><?php esc_html_e('Follow Us: ','medical-clinic-center'); ?></span>
							<?php if( !empty($medical_clinic_center_social_media_facebook) ):?>
								<a href="<?php echo esc_url($medical_clinic_center_social_media_facebook);?>"><span class="dashicons dashicons-facebook-alt"></span></a>
							<?php endif; ?>
							<?php if( !empty($medical_clinic_center_social_media_twitter) ):?>
								<a href="<?php echo esc_url($medical_clinic_center_social_media_twitter);?>"><span class="dashicons dashicons-twitter"></span></a>
							<?php endif; ?>
							<?php if( !empty($medical_clinic_center_social_media_instagram) ):?>
								<a href="<?php echo esc_url($medical_clinic_center_social_media_instagram);?>"><span class="dashicons dashicons-instagram"></span></a>
							<?php endif; ?>
							<?php if( !empty($medical_clinic_center_social_media_linkdin) ):?>
								<a href="<?php echo esc_url($medical_clinic_center_social_media_linkdin);?>"><span class="dashicons dashicons-linkedin"></span></a>
							<?php endif; ?>
							<?php if( !empty($medical_clinic_center_social_media_youtube) ):?>
								<a href="<?php echo esc_url($medical_clinic_center_social_media_youtube);?>"><span class="dashicons dashicons-youtube"></span></a>
							<?php endif; ?>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div id="nav-area" >
			<div class="container">
				<div class="row">
				    <div class="col-xl-3 col-lg-12 col-md-12 align-self-center text-center text-lg-start ">
					    <div class="site-branding mb-3 mb-lg-0">
							<?php medical_clinic_center_the_custom_logo(); ?>
							<?php $medical_clinic_center_show_title = medical_clinic_center_get_option( 'medical_clinic_center_show_title' ); ?>
							<?php $medical_clinic_center_show_tagline = medical_clinic_center_get_option( 'medical_clinic_center_show_tagline' ); ?>
							<?php if ( true === $medical_clinic_center_show_title || true === $medical_clinic_center_show_tagline ) :  ?>
								<div id="site-identity" class="text-center text-md-center text-lg-start">
									<?php if ( true === $medical_clinic_center_show_title ) :  ?>
										<?php if ( is_front_page() ) : ?>
											<h1 class="site-title"><a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><?php bloginfo( 'name' ); ?></a></h1>
										<?php else : ?>
											<p class="site-title"><a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><?php bloginfo( 'name' ); ?></a></p>
										<?php endif; ?>
									<?php endif; ?>
									<?php if ( true === $medical_clinic_center_show_tagline ) :  ?>
										<p class="site-description"><?php bloginfo( 'description' ); ?></p>
									<?php endif; ?>
								</div>
							<?php endif; ?>
					    </div>
					</div>

					<div class="col-xl-3 col-lg-4 col-md-4 align-self-center text-md-start text-center info-wrap">
						<?php if( !empty($medical_clinic_center_header_top_timing_text) || !empty($medical_clinic_center_header_top_timing) ):?>
							<div class="row">
								<div class="col-lg-2 col-md-3 col-3 align-self-center">
									<span class="dashicons dashicons-clock"></span>
								</div>
								<div class="col-lg-10 col-md-9 col-9 align-self-center">
									<p class="mb-0"><?php echo esc_html($medical_clinic_center_header_top_timing_text);?></p>
									<span class="mb-0"><?php echo esc_html($medical_clinic_center_header_top_timing);?></span>
								</div>
							</div>
						<?php endif;?>
					</div>

					<div class="col-xl-3 col-lg-4 col-md-4 align-self-center text-md-start text-center info-wrap">
						<?php if( !empty($medical_clinic_center_header_top_location_text) || !empty($medical_clinic_center_header_top_location) ):?>
							<div class="row">
								<div class="col-lg-2 col-md-3 col-3 align-self-center">
									<span class="dashicons dashicons-location"></span>
								</div>
								<div class="col-lg-10 col-md-9 col-9 align-self-center">
									<p class="mb-0"><?php echo esc_html($medical_clinic_center_header_top_location_text);?></p>
									<span class="mb-0"><?php echo esc_html($medical_clinic_center_header_top_location);?></span>
								</div>
							</div>
						<?php endif;?>
					</div>
					
					<div class="col-xl-3 col-lg-4 col-md-4 align-self-center text-md-start text-center info-wrap">
						<?php if( !empty($medical_clinic_center_header_top_phone_text) || !empty($medical_clinic_center_header_top_phone_number) ):?>
							<div class="row">
								<div class="col-lg-2 col-md-3 col-3 align-self-center">
									<span class="dashicons dashicons-phone"></span>
								</div>
								<div class="col-lg-10 col-md-9 col-9 align-self-center">
									<p class="mb-0"><?php echo esc_html($medical_clinic_center_header_top_phone_text);?></p>
									<span class="mb-0"><?php echo esc_html($medical_clinic_center_header_top_phone_number);?></span>
								</div>
							</div>
						<?php endif;?>
					</div>
				</div>
			</div>
		</div>

		<div id="middle-header" data-sticky= "<?php echo esc_attr($medical_clinic_center_data_sticky); ?>">
			<div class="container">
				<div class="row">
					<div class="col-lg-9 col-md-6 col-3 align-self-center">
						<div class="toggle-menu gb_menu text-md-start">
							<button onclick="medical_clinic_center_gb_Menu_open()" class="gb_toggle"><?php esc_html_e('Menu','medical-clinic-center'); ?></button>
						</div>
						<div id="gb_responsive" class="nav side_gb_nav">
							<nav id="top_gb_menu" class="gb_nav_menu" role="navigation" aria-label="<?php esc_attr_e( 'Menu', 'medical-clinic-center' ); ?>">
								<?php 
								    wp_nav_menu( array( 
										'theme_location' => 'primary-menu',
										'container_class' => 'gb_navigation clearfix' ,
										'menu_class' => 'clearfix',
										'items_wrap' => '<ul id="%1$s" class="%2$s mobile_nav m-0 px-0">%3$s</ul>',
										'fallback_cb' => 'wp_page_menu',
								    ) ); 
								?>
								<a href="javascript:void(0)" class="closebtn gb_menu" onclick="medical_clinic_center_gb_Menu_close()">x<span class="screen-reader-text"><?php esc_html_e('Close Menu','medical-clinic-center'); ?></span></a>
							</nav>
						</div>
					</div>
					<div class="col-lg-3 col-md-6 col-9 align-self-center">
						<div class="nav-btn text-center text-md-end">
							<?php if( !empty($medical_clinic_center_header_top_booknow_btn_text) || !empty($medical_clinic_center_header_top_booknow_btn_link) ):?>
								<a href="<?php echo esc_url($medical_clinic_center_header_top_booknow_btn_link);?>"><?php echo esc_html($medical_clinic_center_header_top_booknow_btn_text);?></a>
							<?php endif; ?>
						</div>
					</div>
				</div>
			</div>
		</div>

	    <?php
	}

endif;

add_action( 'medical_clinic_center_action_header', 'medical_clinic_center_site_branding' );


/////////////////////////////////// copyright start /////////////////////////////

if ( ! function_exists( 'medical_clinic_center_footer_copyright' ) ) :

	/**
	 * Footer copyright
	 *
	 * @since 1.0.0
	 */
	function medical_clinic_center_footer_copyright() {

		// Check if footer is disabled.
		$footer_status = apply_filters( 'medical_clinic_center_filter_footer_status', true );
		if ( true !== $footer_status ) {
			return;
		}

		// Copyright content.
		$medical_clinic_center_copyright_text = medical_clinic_center_get_option( 'medical_clinic_center_copyright_text' );
		$medical_clinic_center_copyright_text = apply_filters( 'medical_clinic_center_filter_copyright_text', $medical_clinic_center_copyright_text );
		if ( ! empty( $medical_clinic_center_copyright_text ) ) {
			$medical_clinic_center_copyright_text = wp_kses_data( $medical_clinic_center_copyright_text );
		}

		// Powered by content.
		$medical_clinic_center_powered_by_text = sprintf( __( 'Medical Clinic Center by %s', 'medical-clinic-center' ), '<span>' . __( 'Mizan Themes', 'medical-clinic-center' ) . '</span>' );
		?>

		



<div class="colophon-inner">
		    <?php if ( ! empty( $medical_clinic_center_copyright_text ) ) : ?>
			    <div class="colophon-column">
			    	<div class="copyright">
			    		<?php echo $medical_clinic_center_copyright_text; ?>
			    	</div><!-- .copyright -->
			    </div><!-- .colophon-column -->
		    <?php endif; ?>

		    <?php if ( ! empty( $medical_clinic_center_powered_by_text ) ) : ?>
			    <div class="colophon-column">
			    	<div class="site-info">
			    		<a href="<?php echo esc_url('https://www.mizanthemes.com/products/free-medical-wordpress-theme/','medical-clinic-center'); ?>"><?php echo $medical_clinic_center_powered_by_text; ?></a>
			    	</div><!-- .site-info -->
			    </div><!-- .colophon-column -->
		    <?php endif; ?>

		</div><!-- .colophon-inner -->

	    <?php
	}

endif;

add_action( 'medical_clinic_center_action_footer', 'medical_clinic_center_footer_copyright', 10 );

// /////////////////////////////////sidebar//////////////////


if ( ! function_exists( 'medical_clinic_center_add_sidebar' ) ) :

	/**
	 * Add sidebar.
	 *
	 * @since 1.0.0
	 */
	function medical_clinic_center_add_sidebar() {

		global $post;

		$medical_clinic_center_global_layout = medical_clinic_center_get_option( 'medical_clinic_center_global_layout' );
		$medical_clinic_center_global_layout = apply_filters( 'medical_clinic_center_filter_theme_global_layout', $medical_clinic_center_global_layout );

		// Check if single.
		if ( $post && is_singular() ) {
			$medical_clinic_center_post_options = get_post_meta( $post->ID, 'medical_clinic_center_theme_settings', true );
			if ( isset( $medical_clinic_center_post_options['post_layout'] ) && ! empty( $medical_clinic_center_post_options['medical_clinic_center_post_layout'] ) ) {
				$medical_clinic_center_global_layout = $medical_clinic_center_post_options['medical_clinic_center_post_layout'];
			}
		}

		// Include primary sidebar.
		if ( 'no-sidebar' !== $medical_clinic_center_global_layout ) {
			get_sidebar();
		}
		// Include Secondary sidebar.
		switch ( $medical_clinic_center_global_layout ) {
			case 'three-columns':
			get_sidebar( 'secondary' );
			break;

			default:
			break;
		}

		// Include Secondary sidebar 1.
		switch ( $medical_clinic_center_global_layout ) {
			case 'four-columns':
			get_sidebar( 'secondary' );
			break;

			default:
			break;
		}

	}

endif;

add_action( 'medical_clinic_center_action_sidebar', 'medical_clinic_center_add_sidebar' );

//////////////////////////////////////// single page


if ( ! function_exists( 'medical_clinic_center_add_image_in_single_display' ) ) :

	/**
	 * Add image in single post.
	 *
	 * @since 1.0.0
	 */
	function medical_clinic_center_add_image_in_single_display() {

		global $post;

		if ( has_post_thumbnail() ) {

			$values = get_post_meta( $post->ID, 'medical_clinic_center_theme_settings', true );
			$medical_clinic_center_theme_settings_single_image = isset( $values['medical_clinic_center_single_image'] ) ? esc_attr( $values['medical_clinic_center_single_image'] ) : '';

			if ( ! $medical_clinic_center_theme_settings_single_image ) {
				$medical_clinic_center_theme_settings_single_image = medical_clinic_center_get_option( 'medical_clinic_center_single_image' );
			}

			if ( 'disable' !== $medical_clinic_center_theme_settings_single_image ) {
				$args = array(
					'class' => 'aligncenter',
				);
				the_post_thumbnail( esc_attr( $medical_clinic_center_theme_settings_single_image ), $args );
			}
		}

	}

endif;

add_action( 'medical_clinic_center_single_image', 'medical_clinic_center_add_image_in_single_display' );

if ( ! function_exists( 'medical_clinic_center_footer_goto_top' ) ) :

	/**
	 * Go to top.
	 *
	 * @since 1.0.0
	 */
	function medical_clinic_center_footer_goto_top() {
        
        $medical_clinic_center_show_scroll_to_top = medical_clinic_center_get_option( 'medical_clinic_center_show_scroll_to_top' );
        if ( true === $medical_clinic_center_show_scroll_to_top ) :
		echo '<a href="#page" class="scrollup" id="btn-scrollup"><i class="fa fa-angle-up"><span class="screen-reader-text">' . esc_html__( 'Scroll Up', 'medical-clinic-center' ) . '</span></i></a>';
		endif;

	}

endif;

add_action( 'medical_clinic_center_action_after', 'medical_clinic_center_footer_goto_top', 20 );