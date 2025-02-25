<?php

  $medical_clinic_center_color_palette_css = '';

	// Global Color

	$medical_clinic_center_first_color = medical_clinic_center_get_option('medical_clinic_center_first_color', '#42c2c9' );

	if($medical_clinic_center_first_color != false){
		$medical_clinic_center_color_palette_css .=':root {';
			$medical_clinic_center_color_palette_css .='--primary-color: '.esc_attr($medical_clinic_center_first_color).'!important;';
		$medical_clinic_center_color_palette_css .='}';
	}

	$medical_clinic_center_color_palette_css .='}';

  /*-------------- Copyright Text Align-------------------*/

	$medical_clinic_center_copyright_text_align = medical_clinic_center_get_option('medical_clinic_center_copyright_text_align');
	$medical_clinic_center_color_palette_css .='.site-footer{';
	$medical_clinic_center_color_palette_css .='text-align: '.esc_attr($medical_clinic_center_copyright_text_align).' !important;';
	$medical_clinic_center_color_palette_css .='}';
	$medical_clinic_center_color_palette_css .='
	@media screen and (max-width:575px) {
	.site-footer{';
	$medical_clinic_center_color_palette_css .='text-align: center !important;';
	$medical_clinic_center_color_palette_css .='} }';

  // copyright font size
	$medical_clinic_center_copyright_text_font_size = medical_clinic_center_get_option('medical_clinic_center_copyright_text_font_size');
	$medical_clinic_center_color_palette_css .='#colophon p, #colophon a , #colophon{';
	$medical_clinic_center_color_palette_css .='font-size: '.esc_attr($medical_clinic_center_copyright_text_font_size).'px;';
	$medical_clinic_center_color_palette_css .='}';