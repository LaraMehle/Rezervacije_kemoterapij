<?php
/**
 * Help Panel.
 *
 */
?>
<!-- Help file panel -->
<div id="help-panel" class="panel-left">
    <div class="panel-aside">
        <h4><?php esc_html_e( 'Theme Customizer', 'medical-clinic-center' ); ?></h4>
        <p><?php esc_html_e( 'To begin customizing your website, start by clicking "Customize"', 'medical-clinic-center' ); ?></p>
        <a class="button button-primary" href="<?php echo esc_url( admin_url('customize.php') ); ?>" title="<?php esc_attr_e( 'Visit the Demo', 'medical-clinic-center' ); ?>" target="_blank">
            <?php esc_html_e( 'Customizing', 'medical-clinic-center' ); ?>
        </a>
    </div><!-- .panel-aside -->

    <div class="panel-aside">
        <h4><?php esc_html_e( 'Documentation', 'medical-clinic-center' ); ?></h4>
        <p><?php esc_html_e( 'Explore the comprehensive guide and instructions for this WordPress Theme. Begin your journey with assurance.', 'medical-clinic-center' ); ?></p>
        <a class="button button-primary" href="<?php echo esc_url( MEDICAL_CLINIC_CENTER_DOCUMENTATION ); ?>" title="<?php esc_attr_e( 'Visit the doc', 'medical-clinic-center' ); ?>" target="_blank">
            <?php esc_html_e( 'Documentation', 'medical-clinic-center' ); ?>
        </a>
    </div><!-- .panel-aside -->

    <div class="panel-aside">
        <h4><?php esc_html_e( 'Support Ticket', 'medical-clinic-center' ); ?></h4>
        <p><?php esc_html_e( 'Our dedicated team is well prepared to help you out in case of queries and doubts regarding our theme', 'medical-clinic-center' ); ?></p>
        <a class="button button-primary" href="<?php echo esc_url( MEDICAL_CLINIC_CENTER_SUPPORT ); ?>" title="<?php esc_attr_e( 'Visit the Support', 'medical-clinic-center' ); ?>" target="_blank">
            <?php esc_html_e( 'Contact Support', 'medical-clinic-center' ); ?>
        </a>
    </div><!-- .panel-aside -->

    <div class="panel-aside">
        <h4><?php esc_html_e( 'Reviews & Testimonials', 'medical-clinic-center' ); ?></h4>
        <p><?php esc_html_e( 'All the features and aspects of this WordPress Theme are phenomenal. I\'d recommend this theme to all.', 'medical-clinic-center' ); ?></p>
        <a class="button button-primary" href="<?php echo esc_url( MEDICAL_CLINIC_CENTER_REVIEW ); ?>" title="<?php esc_attr_e( 'Visit the Demo', 'medical-clinic-center' ); ?>" target="_blank">
            <?php esc_html_e( 'Review', 'medical-clinic-center' ); ?>
        </a>
    </div><!-- .panel-aside -->
</div>
