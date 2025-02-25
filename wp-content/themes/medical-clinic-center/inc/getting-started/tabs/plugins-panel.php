<?php
/**
 * Plugin Panel.
 *
 */
?>
<!-- Updates panel -->
<div id="plugins-panel" class="panel-left">
    <div id="Mizan_Demo_Importor_editor" class="tabcontent">
        <?php if(!class_exists('Mizan_Importer_ThemeWhizzie')){
            $plugin_ins = Medical_Clinic_Center_Plugin_Activation_Mizan_Demo_Importor::get_instance();
            $medical_clinic_center_actions = $plugin_ins->recommended_actions;
            ?>
            <div class="medical-clinic-center-recommended-plugins ">
                    <div class="medical-clinic-center-action-list">
                        <?php if ($medical_clinic_center_actions): foreach ($medical_clinic_center_actions as $key => $medical_clinic_center_actionValue): ?>
                                <div class="medical-clinic-center-action" id="<?php echo esc_attr($medical_clinic_center_actionValue['id']);?>">
                                    <div class="action-inner plugin-activation-redirect">
                                        <h4 class="action-title"><?php echo esc_html($medical_clinic_center_actionValue['title']); ?></h4>
                                        <div class="action-desc"><?php echo esc_html($medical_clinic_center_actionValue['desc']); ?></div>
                                        <?php echo wp_kses_post($medical_clinic_center_actionValue['link']); ?>
                                    </div>
                                </div>
                            <?php endforeach;
                        endif; ?>
                    </div>
            </div>
        <?php }else{ ?>
            <div class="tab-outer-box">
                <h2><?php esc_html_e( 'Welcome to Mizan Theme!', 'medical-clinic-center' ); ?></h2>
                <p><?php esc_html_e( 'For setup the theme, First you need to click on the Begin activating plugins', 'medical-clinic-center' ); ?></p>
                <p><?php esc_html_e( '1. Install Mizan Demo Importor', 'medical-clinic-center' ); ?></p>
                <p><?php esc_html_e( '>> Then click to Return to Required Plugins Installer ', 'medical-clinic-center' ); ?></p>
                <p><?php esc_html_e( '2. Activate Mizan Demo Importor ', 'medical-clinic-center' ); ?></p>
                <p><?php esc_html_e( '>> Click on the start now button', 'medical-clinic-center' ); ?></p>
                <p><?php esc_html_e( '>> Click install plugins', 'medical-clinic-center' ); ?></p>
                <p><?php esc_html_e( '>> Click import demo button to setup the theme and click visit your site button', 'medical-clinic-center' ); ?></p>
            </div>
        <?php } ?>
    </div>
</div><!-- .panel-left -->