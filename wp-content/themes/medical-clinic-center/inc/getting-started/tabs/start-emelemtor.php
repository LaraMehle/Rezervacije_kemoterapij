<?php
/**
 * Start Elementor.
 *
 */
?>
<!-- Start Elementor -->
<div id="start-panel" class="panel-left visible">
    <div id="medical-clinic-center-importer" class="tabcontent open">
        <?php if(!class_exists('Mizan_Importer_ThemeWhizzie')){
            $plugin_ins = Medical_Clinic_Center_Plugin_Activation_Mizan_Demo_Importor::get_instance();
            $medical_clinic_center_actions = $plugin_ins->recommended_actions;
            ?>
            <div class="medical-clinic-center-recommended-plugins ">
                    <div class="medical-clinic-center-action-list">
                        <?php if ($medical_clinic_center_actions): foreach ($medical_clinic_center_actions as $key => $medical_clinic_center_actionValue): ?>
                                <div class="medical-clinic-center-action" id="<?php echo esc_attr($medical_clinic_center_actionValue['id']);?>">
                                    <div class="action-inner plugin-activation-redirect">
                                        <h3 class="action-title"><?php echo esc_html($medical_clinic_center_actionValue['title']); ?></h3>
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
                <h3><?php esc_html_e('Welcome to Mizan Themes', 'medical-clinic-center'); ?></h3>
                <p class="start-text"><?php esc_html_e('The demo will import after you click the Start Quickly button.', 'medical-clinic-center'); ?></p>
                <div class="info-link">
                    <a class="button button-primary" href="<?php echo esc_url( admin_url('admin.php?page=mizandemoimporter-wizard') ); ?>"><?php esc_html_e('Start Quickly', 'medical-clinic-center'); ?></a>
                </div>
            </div>
        <?php } ?>
    </div>
</div>
