<?php
/**
 * The Secondary Sidebar.
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package medical_clinic_center
 */

?>
<?php $medical_clinic_center_default_sidebar = apply_filters( 'medical_clinic_center_filter_default_sidebar_id', 'sidebar-2', 'secondary' ); ?>
<div id="sidebar-secondary" class="widget-area sidebar" role="complementary">
	<?php if ( is_active_sidebar( $medical_clinic_center_default_sidebar ) ) : ?>
		<?php dynamic_sidebar( $medical_clinic_center_default_sidebar ); ?>
	<?php else : ?>
		<?php
			do_action( 'medical_clinic_center_action_default_sidebar', $medical_clinic_center_default_sidebar, 'secondary' );
		?>
	<?php endif ?>
</div>

<?php $medical_clinic_center_default_sidebar1 = apply_filters( 'medical_clinic_center_filter_default_sidebar_id1', 'sidebar-3', 'secondary' ); ?>
<div id="sidebar-secondary1" class="widget-area sidebar" role="complementary">
	<?php if ( is_active_sidebar( $medical_clinic_center_default_sidebar1 ) ) : ?>
		<?php dynamic_sidebar( $medical_clinic_center_default_sidebar1 ); ?>
	<?php else : ?>
		<?php
			do_action( 'medical_clinic_center_action_default_sidebar1', $medical_clinic_center_default_sidebar1, 'secondary' );
		?>
	<?php endif ?>
</div>