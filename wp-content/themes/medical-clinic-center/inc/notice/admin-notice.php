<?php
$theme = wp_get_theme();

$screen = get_current_screen();
if ( ! empty( $screen->base ) && 'appearance_page_medical-clinic-center-getting-started' === $screen->base ) {
	return false;
}

?>
<div class="notice notice-success is-dismissible medical-clinic-center-admin-notice">
	<div class="medical-clinic-center-admin-notice-wrapper">
		<h2><?php esc_html_e( 'Thank you for selecting ', 'medical-clinic-center' ); ?> <?php echo $theme->get( 'Name' ); ?> <?php esc_html_e( 'Theme!', 'medical-clinic-center' ); ?></h2>
		<p><?php esc_html_e( 'Explore the benefits of our simple Demo Importer and automatic Plugin Installation. Click the button below to begin.', 'medical-clinic-center' ); ?></p>
		<span class="admin-2-btn" >
			<a class="button-primary" style="margin-bottom: 15px; margin-right: 10px; " href="<?php echo esc_url( admin_url( 'themes.php?page=medical-clinic-center-getting-started' ) ); ?>"><?php esc_html_e( 'Import Theme Demo', 'medical-clinic-center' ); ?></a>
	        <a class="button-primary" style="margin-bottom: 15px; " href="<?php echo esc_url('https://www.mizanthemes.com/products/clininc-wordpress-theme/'); ?>" target="_blank"><?php esc_html_e('Get Medical Clinic Center Pro', 'medical-clinic-center'); ?></a>
        </span>
	</div>
</div>