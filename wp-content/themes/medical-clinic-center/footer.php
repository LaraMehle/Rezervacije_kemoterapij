<?php
/**
 * The template for displaying the footer.
 *
 * Contains the closing of the #content div and all content after.
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package medical_clinic_center
 */

	/**
	 * Hook - medical_clinic_center_action_after_content.
	 *
	 * @hooked medical_clinic_center_content_end - 10
	 */
	do_action( 'medical_clinic_center_action_after_content' );
?>

	<?php
	/**
	 * Hook - medical_clinic_center_action_before_footer.
	 *
	 * @hooked medical_clinic_center_add_footer_bottom_widget_area - 5
	 * @hooked medical_clinic_center_footer_start - 10
	 */
	do_action( 'medical_clinic_center_action_before_footer' );
	?>
    <?php
	  /**
	   * Hook - medical_clinic_center_action_footer.
	   *
	   * @hooked medical_clinic_center_footer_copyright - 10
	   */
	  do_action( 'medical_clinic_center_action_footer' );
	?>
	<?php
	/**
	 * Hook - medical_clinic_center_action_after_footer.
	 *
	 * @hooked medical_clinic_center_footer_end - 10
	 */
	do_action( 'medical_clinic_center_action_after_footer' );
	?>

<?php
	/**
	 * Hook - medical_clinic_center_action_after.
	 *
	 * @hooked medical_clinic_center_page_end - 10
	 * @hooked medical_clinic_center_footer_goto_top - 20
	 */
	do_action( 'medical_clinic_center_action_after' );
?>

<?php wp_footer(); ?>
</body>
</html>
