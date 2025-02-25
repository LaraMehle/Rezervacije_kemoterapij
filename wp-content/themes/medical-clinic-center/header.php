<?php
/**
 * The header for our theme.
 *
 * This is the template that displays all of the <head> section and everything up until <div id="content">
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package medical_clinic_center
 */

?>
<?php
	/**
	 * Hook - medical_clinic_center_action_doctype.
	 *
	 * @hooked medical_clinic_center_doctype -  10
	 */
	do_action( 'medical_clinic_center_action_doctype' );
?>
<head>
	<?php
	/**
	 * Hook - medical_clinic_center_action_head.
	 *
	 * @hooked medical_clinic_center_head -  10
	 */
	do_action( 'medical_clinic_center_action_head' );
	?>

<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>

	<?php do_action( 'wp_body_open' ); ?>

	<?php 
	$medical_clinic_center_show_preloader = medical_clinic_center_get_option( 'medical_clinic_center_show_preloader_setting' );
        if ( true === $medical_clinic_center_show_preloader ) : ?>
			<div id="preloader" class="loader-head">
				<div class="preloader">
				    <div class="spinner"></div>
				    <div class="spinner-2"></div>
				</div>
			</div>
	<?php endif; ?>

	<?php
	/**
	 * Hook - medical_clinic_center_action_before.
	 *
	 * @hooked medical_clinic_center_page_start - 10
	 * @hooked medical_clinic_center_skip_to_content - 15
	 */
	do_action( 'medical_clinic_center_action_before' );
	?>

    <?php
	  /**
	   * Hook - medical_clinic_center_action_before_header.
	   *
	   * @hooked medical_clinic_center_header_start - 10
	   */
	  do_action( 'medical_clinic_center_action_before_header' );
	?>
		<?php
		/**
		 * Hook - medical_clinic_center_action_header.
		 *
		 * @hooked medical_clinic_center_site_branding - 10
		 */
		do_action( 'medical_clinic_center_action_header' );
		?>
    <?php
	  /**
	   * Hook - medical_clinic_center_action_after_header.
	   *
	   * @hooked medical_clinic_center_header_end - 10
	   */
	  do_action( 'medical_clinic_center_action_after_header' );
	?>

	<?php
	/**
	 * Hook - medical_clinic_center_action_before_content.
	 *
	 * @hooked medical_clinic_center_content_start - 10
	 */
	do_action( 'medical_clinic_center_action_before_content' );
	?>

	<!-- <?php
	  /**
	   * Hook - medical_clinic_center_action_content.
	   */
	  do_action( 'medical_clinic_center_action_content' );
	?> -->