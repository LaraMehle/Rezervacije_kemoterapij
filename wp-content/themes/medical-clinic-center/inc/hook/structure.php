<?php
/**
 * Theme functions related to structure.
 *
 * This file contains structural hook functions.
 *
 * @package medical_clinic_center
 */

if ( ! function_exists( 'medical_clinic_center_doctype' ) ) :
	/**
	 * Doctype Declaration.
	 *
	 * @since 1.0.0
	 */
	function medical_clinic_center_doctype() {
	?><!DOCTYPE html> <html <?php language_attributes(); ?>><?php
	}
endif;

add_action( 'medical_clinic_center_action_doctype', 'medical_clinic_center_doctype', 10 );


if ( ! function_exists( 'medical_clinic_center_head' ) ) :
	/**
	 * Header Codes.
	 *
	 * @since 1.0.0
	 */
	function medical_clinic_center_head() {
	?>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="profile" href="http://gmpg.org/xfn/11">
    <link rel="pingback" href="<?php bloginfo( 'pingback_url' ); ?>">
    <?php
	}
endif;
add_action( 'medical_clinic_center_action_head', 'medical_clinic_center_head', 10 );

if ( ! function_exists( 'medical_clinic_center_page_start' ) ) :
	/**
	 * Page Start.
	 *
	 * @since 1.0.0
	 */
	function medical_clinic_center_page_start() {
	?>
    <div id="page" class="hfeed site">
    <?php
	}
endif;
add_action( 'medical_clinic_center_action_before', 'medical_clinic_center_page_start' );

if ( ! function_exists( 'medical_clinic_center_page_end' ) ) :
	/**
	 * Page End.
	 *
	 * @since 1.0.0
	 */
	function medical_clinic_center_page_end() {
	?></div><!-- #page --><?php
	}
endif;

add_action( 'medical_clinic_center_action_after', 'medical_clinic_center_page_end' );

if ( ! function_exists( 'medical_clinic_center_content_start' ) ) :
	/**
	 * Content Start.
	 *
	 * @since 1.0.0
	 */
	function medical_clinic_center_content_start() {
	?><?php if(!is_page_template( 'home-page-template.php' )) { echo '<div id="content" class="site-content">'; } ?><?php if(!is_page_template( 'home-page-template.php' )) { echo '<div class="container">'; } ?><div class="inner-wrapper"><?php
	}
endif;
add_action( 'medical_clinic_center_action_before_content', 'medical_clinic_center_content_start' );


if ( ! function_exists( 'medical_clinic_center_content_end' ) ) :
	/**
	 * Content End.
	 *
	 * @since 1.0.0
	 */
	function medical_clinic_center_content_end() {
	?></div><!-- .inner-wrapper --></div><!-- .container --><?php if(!is_page_template( 'home-page-template.php' )) { echo '</div>'; } ?><!-- #content --><?php
	}
endif;
add_action( 'medical_clinic_center_action_after_content', 'medical_clinic_center_content_end' );


if ( ! function_exists( 'medical_clinic_center_header_start' ) ) :
	/**
	 * Header Start.
	 *
	 * @since 1.0.0
	 */
	function medical_clinic_center_header_start() {
		?><header id="masthead" class="site-header" role="banner"><?php
	}
endif;
add_action( 'medical_clinic_center_action_before_header', 'medical_clinic_center_header_start' );

if ( ! function_exists( 'medical_clinic_center_header_end' ) ) :
	/**
	 * Header End.
	 *
	 * @since 1.0.0
	 */
	function medical_clinic_center_header_end() {
	?></div><!-- .container --></header><!-- #masthead --><?php
	}
endif;
add_action( 'medical_clinic_center_action_after_header', 'medical_clinic_center_header_end' );



if ( ! function_exists( 'medical_clinic_center_footer_start' ) ) :
	/**
	 * Footer Start.
	 *
	 * @since 1.0.0
	 */
	function medical_clinic_center_footer_start() {
		$footer_status = apply_filters( 'medical_clinic_center_filter_footer_status', true );
		if ( true !== $footer_status ) {
			return;
		}
	?><footer id="colophon" class="site-footer" role="contentinfo"><div class="container"><?php
	}
endif;
add_action( 'medical_clinic_center_action_before_footer', 'medical_clinic_center_footer_start' );


if ( ! function_exists( 'medical_clinic_center_footer_end' ) ) :
	/**
	 * Footer End.
	 *
	 * @since 1.0.0
	 */
	function medical_clinic_center_footer_end() {
		$footer_status = apply_filters( 'medical_clinic_center_filter_footer_status', true );
		if ( true !== $footer_status ) {
			return;
		}
		$medical_clinic_center_enable_cursor_dot_outline = medical_clinic_center_get_option('medical_clinic_center_enable_cursor_dot_outline');
		if ($medical_clinic_center_enable_cursor_dot_outline) { ?>
			<!-- Custom cursor -->
			<div class="cursor-point-outline"></div>
			<div class="cursor-point"></div>
			<!-- .Custom cursor -->
		<?php } ?>
		</div><!-- .container --></footer><!-- #colophon --><?php
	}
endif;
add_action( 'medical_clinic_center_action_after_footer', 'medical_clinic_center_footer_end' );
