<?php
/**
 * Theme Options.
 *
 * @package medical_clinic_center
 */

$default = medical_clinic_center_get_default_theme_options();

// Add Panel.
$wp_customize->add_panel( 'medical_clinic_center_theme_option_panel',
	array(
	'title'      => __( 'Theme Options', 'medical-clinic-center' ),
	'priority'   => 100,
	'capability' => 'edit_theme_options',
	)
);

// Typography Section.

$medical_clinic_center_font_array = array(
	''                       => 'No Fonts',
	'Abril Fatface'          => 'Abril Fatface',
	'Acme'                   => 'Acme',
	'Anton'                  => 'Anton',
	'Architects Daughter'    => 'Architects Daughter',
	'Arimo'                  => 'Arimo',
	'Arsenal'                => 'Arsenal',
	'Arvo'                   => 'Arvo',
	'Alegreya'               => 'Alegreya',
	'Alfa Slab One'          => 'Alfa Slab One',
	'Averia Serif Libre'     => 'Averia Serif Libre',
	'Bangers'                => 'Bangers',
	'Boogaloo'               => 'Boogaloo',
	'Bad Script'             => 'Bad Script',
	'Bitter'                 => 'Bitter',
	'Bree Serif'             => 'Bree Serif',
	'BenchNine'              => 'BenchNine',
	'Cabin'                  => 'Cabin',
	'Cardo'                  => 'Cardo',
	'Courgette'              => 'Courgette',
	'Cherry Swash'           => 'Cherry Swash',
	'Cormorant Garamond'     => 'Cormorant Garamond',
	'Crimson Text'           => 'Crimson Text',
	'Cuprum'                 => 'Cuprum',
	'Cookie'                 => 'Cookie',
	'Chewy'                  => 'Chewy',
	'Days One'               => 'Days One',
	'Dosis'                  => 'Dosis',
	'Droid Sans'             => 'Droid Sans',
	'Economica'              => 'Economica',
	'Fredoka One'            => 'Fredoka One',
	'Fjalla One'             => 'Fjalla One',
	'Francois One'           => 'Francois One',
	'Frank Ruhl Libre'       => 'Frank Ruhl Libre',
	'Gloria Hallelujah'      => 'Gloria Hallelujah',
	'Great Vibes'            => 'Great Vibes',
	'Handlee'                => 'Handlee',
	'Hammersmith One'        => 'Hammersmith One',
	'Inconsolata'            => 'Inconsolata',
	'Indie Flower'           => 'Indie Flower',
	'IM Fell English SC'     => 'IM Fell English SC',
	'Julius Sans One'        => 'Julius Sans One',
	'Josefin Slab'           => 'Josefin Slab',
	'Josefin Sans'           => 'Josefin Sans',
	'Kanit'                  => 'Kanit',
	'Lobster'                => 'Lobster',
	'Lato'                   => 'Lato',
	'Lora'                   => 'Lora',
	'Libre Baskerville'      => 'Libre Baskerville',
	'Lobster Two'            => 'Lobster Two',
	'Merriweather'           => 'Merriweather',
	'Monda'                  => 'Monda',
	'Montserrat'             => 'Montserrat',
	'Muli'                   => 'Muli',
	'Marck Script'           => 'Marck Script',
	'Noto Serif'             => 'Noto Serif',
	'Open Sans'              => 'Open Sans',
	'Overpass'               => 'Overpass',
	'Overpass Mono'          => 'Overpass Mono',
	'Oxygen'                 => 'Oxygen',
	'Orbitron'               => 'Orbitron',
	'Patua One'              => 'Patua One',
	'Pacifico'               => 'Pacifico',
	'Padauk'                 => 'Padauk',
	'Playball'               => 'Playball',
	'Playfair Display'       => 'Playfair Display',
	'PT Sans'                => 'PT Sans',
	'Philosopher'            => 'Philosopher',
	'Permanent Marker'       => 'Permanent Marker',
	'Poiret One'             => 'Poiret One',
	'Quicksand'              => 'Quicksand',
	'Quattrocento Sans'      => 'Quattrocento Sans',
	'Raleway'                => 'Raleway',
	'Rubik'                  => 'Rubik',
	'Rokkitt'                => 'Rokkitt',
	'Russo One'              => 'Russo One',
	'Righteous'              => 'Righteous',
	'Slabo'                  => 'Slabo',
	'Source Sans Pro'        => 'Source Sans Pro',
	'Shadows Into Light Two' => 'Shadows Into Light Two',
	'Shadows Into Light'     => 'Shadows Into Light',
	'Sacramento'             => 'Sacramento',
	'Shrikhand'              => 'Shrikhand',
	'Tangerine'              => 'Tangerine',
	'Ubuntu'                 => 'Ubuntu',
	'VT323'                  => 'VT323',
	'Varela Round'           => 'Varela Round',
	'Vampiro One'            => 'Vampiro One',
	'Vollkorn'               => 'Vollkorn',
	'Volkhov'                => 'Volkhov',
	'Yanone Kaffeesatz'      => 'Yanone Kaffeesatz'
);

$wp_customize->add_section( 'medical_clinic_center_typography',
	array(
	'title'      => __( 'Typography', 'medical-clinic-center' ),
	'priority'   => 100,
	'capability' => 'edit_theme_options',
	'panel'      => 'medical_clinic_center_theme_option_panel',
	)
);

$wp_customize->add_setting( 'theme_options[medical_clinic_center_body_font_family]',
	array(
	'default'           => $default['medical_clinic_center_body_font_family'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'medical_clinic_center_sanitize_choices',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_body_font_family]',
	array(
	'label'    => __( 'Body font family', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_typography',
	'type'     => 'select',
	'choices'  => $medical_clinic_center_font_array,
	'priority' => 100,
	)
);

$wp_customize->add_setting( 'theme_options[medical_clinic_center_h1_font_family]',
	array(
	'default'           => $default['medical_clinic_center_h1_font_family'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'medical_clinic_center_sanitize_choices',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_h1_font_family]',
	array(
	'label'    => __( 'H1 font family', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_typography',
	'type'     => 'select',
	'choices'  => $medical_clinic_center_font_array,
	'priority' => 100,
	)
);

$wp_customize->add_setting( 'theme_options[medical_clinic_center_h1_font_size]',
	array(
	'default'           => $default['medical_clinic_center_h1_font_size'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'sanitize_text_field',
	)
);

$wp_customize->add_control( 'theme_options[medical_clinic_center_h1_font_size]',
	array(
	'label'    => __( 'H1 Font Size', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_typography',
	'type'     => 'text',
	'priority' => 100,
	)
);

$wp_customize->add_setting( 'theme_options[medical_clinic_center_h2_font_family]',
	array(
	'default'           => $default['medical_clinic_center_h2_font_family'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'medical_clinic_center_sanitize_choices',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_h2_font_family]',
	array(
	'label'    => __( 'H2 font family', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_typography',
	'type'     => 'select',
	'choices'  => $medical_clinic_center_font_array,
	'priority' => 100,
	)
);

$wp_customize->add_setting( 'theme_options[medical_clinic_center_h2_font_size]',
	array(
	'default'           => $default['medical_clinic_center_h2_font_size'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'sanitize_text_field',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_h2_font_size]',
	array(
	'label'    => __( 'H2 Font Size', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_typography',
	'type'     => 'text',
	'priority' => 100,
	)
);

$wp_customize->add_setting( 'theme_options[medical_clinic_center_h3_font_family]',
	array(
	'default'           => $default['medical_clinic_center_h3_font_family'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'medical_clinic_center_sanitize_choices',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_h3_font_family]',
	array(
	'label'    => __( 'H3 font family', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_typography',
	'type'     => 'select',
	'choices'  => $medical_clinic_center_font_array,
	'priority' => 100,
	)
);

$wp_customize->add_setting( 'theme_options[medical_clinic_center_h3_font_size]',
	array(
	'default'           => $default['medical_clinic_center_h3_font_size'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'sanitize_text_field',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_h3_font_size]',
	array(
	'label'    => __( 'H3 Font Size', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_typography',
	'type'     => 'text',
	'priority' => 100,
	)
);

$wp_customize->add_setting( 'theme_options[medical_clinic_center_h4_font_family]',
	array(
	'default'           => $default['medical_clinic_center_h4_font_family'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'medical_clinic_center_sanitize_choices',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_h4_font_family]',
	array(
	'label'    => __( 'H4 font family', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_typography',
	'type'     => 'select',
	'choices'  => $medical_clinic_center_font_array,
	'priority' => 100,
	)
);

$wp_customize->add_setting( 'theme_options[medical_clinic_center_h4_font_size]',
	array(
	'default'           => $default['medical_clinic_center_h4_font_size'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'sanitize_text_field',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_h4_font_size]',
	array(
	'label'    => __( 'H4 Font Size', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_typography',
	'type'     => 'text',
	'priority' => 100,
	)
);

$wp_customize->add_setting( 'theme_options[medical_clinic_center_h5_font_family]',
	array(
	'default'           => $default['medical_clinic_center_h5_font_family'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'medical_clinic_center_sanitize_choices',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_h5_font_family]',
	array(
	'label'    => __( 'H5 font family', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_typography',
	'type'     => 'select',
	'choices'  => $medical_clinic_center_font_array,
	'priority' => 100,
	)
);

$wp_customize->add_setting( 'theme_options[medical_clinic_center_h5_font_size]',
	array(
	'default'           => $default['medical_clinic_center_h5_font_size'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'sanitize_text_field',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_h5_font_size]',
	array(
	'label'    => __( 'H5 Font Size', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_typography',
	'type'     => 'text',
	'priority' => 100,
	)
);

$wp_customize->add_setting( 'theme_options[medical_clinic_center_h6_font_family]',
	array(
	'default'           => $default['medical_clinic_center_h6_font_family'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'medical_clinic_center_sanitize_choices',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_h6_font_family]',
	array(
	'label'    => __( 'H6 font family', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_typography',
	'type'     => 'select',
	'choices'  => $medical_clinic_center_font_array,
	'priority' => 100,
	)
);

$wp_customize->add_setting( 'theme_options[medical_clinic_center_h6_font_size]',
	array(
	'default'           => $default['medical_clinic_center_h6_font_size'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'sanitize_text_field',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_h6_font_size]',
	array(
	'label'    => __( 'H6 Font Size', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_typography',
	'type'     => 'text',
	'priority' => 100,
	)
);

// Global Color

$wp_customize->add_section( 'medical_clinic_center_section_global_color', array(
	'title'      => __( 'Theme Color', 'medical-clinic-center' ),
	'priority'   => 100,
	'capability' => 'edit_theme_options',
	'panel'      => 'medical_clinic_center_theme_option_panel',
));

$wp_customize->add_setting( 'theme_options[medical_clinic_center_first_color]', array(
	'default'           => $default['medical_clinic_center_first_color'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'sanitize_hex_color',
));

$wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'theme_options[medical_clinic_center_first_color]', array(
	'label'       => __( 'Highlight Color', 'medical-clinic-center' ),
	'description' => __( 'With a single click, you can change the highlight color of the inner page; use the Elementor editor for customization on the homepage.', 'medical-clinic-center' ),
	'section'     => 'medical_clinic_center_section_global_color',
	'settings'    => 'theme_options[medical_clinic_center_first_color]',
)));

// General Option.
$wp_customize->add_section( 'medical_clinic_center_section_general_option',
	array(
	'title'      => __( 'General Options', 'medical-clinic-center' ),
	'priority'   => 100,
	'capability' => 'edit_theme_options',
	'panel'      => 'medical_clinic_center_theme_option_panel',
	)
);

// Cursor Dot Outline
$wp_customize->add_setting(
    'theme_options[medical_clinic_center_enable_cursor_dot_outline]',
    array(
        'default' => $default['medical_clinic_center_enable_cursor_dot_outline'],
        'sanitize_callback' => 'medical_clinic_center_sanitize_checkbox',
    )
);
$wp_customize->add_control(
    'theme_options[medical_clinic_center_enable_cursor_dot_outline]',
    array(
        'label' => esc_html__('Enable Cursor Dot Outline', 'medical-clinic-center'),
        'section' => 'medical_clinic_center_section_general_option',
        'type' => 'checkbox',
    )
);


// Setting show scroll to top.
$wp_customize->add_setting( 'theme_options[medical_clinic_center_show_scroll_to_top]',
	array(
	'default'           => $default['medical_clinic_center_show_scroll_to_top'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'medical_clinic_center_sanitize_checkbox',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_show_scroll_to_top]',
	array(
	'label'    => __( 'Show Scroll To Top', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_general_option',
	'type'     => 'checkbox',
	'priority' => 100,
	)
);

// Setting show Preloader.
$wp_customize->add_setting( 'theme_options[medical_clinic_center_show_preloader_setting]',
	array(
	'default'           => $default['medical_clinic_center_show_preloader_setting'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'medical_clinic_center_sanitize_checkbox',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_show_preloader_setting]',
	array(
	'label'    => __( 'Show Preloader', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_general_option',
	'type'     => 'checkbox',
	'priority' => 100,
	)
);

// Setting show Sticky Header.
$wp_customize->add_setting( 'theme_options[medical_clinic_center_show_data_sticky_setting]',
	array(
	'default'           => $default['medical_clinic_center_show_data_sticky_setting'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'medical_clinic_center_sanitize_checkbox',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_show_data_sticky_setting]',
	array(
	'label'    => __( 'Show Sticky Header', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_general_option',
	'type'     => 'checkbox',
	'priority' => 100,
	)
);

// Post Option.
$wp_customize->add_section( 'medical_clinic_center_section_post_option',
	array(
	'title'      => __( 'Post Options', 'medical-clinic-center' ),
	'priority'   => 100,
	'capability' => 'edit_theme_options',
	'panel'      => 'medical_clinic_center_theme_option_panel',
	)
);

// Setting show Post date.
$wp_customize->add_setting( 'theme_options[medical_clinic_center_show_post_date_setting]',
	array(
	'default'           => $default['medical_clinic_center_show_post_date_setting'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'medical_clinic_center_sanitize_checkbox',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_show_post_date_setting]',
	array(
	'label'    => __( 'Show Post Date', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_post_option',
	'type'     => 'checkbox',
	'priority' => 100,
	)
);

// Setting show Post Heading.
$wp_customize->add_setting( 'theme_options[medical_clinic_center_show_post_heading_setting]',
	array(
	'default'           => $default['medical_clinic_center_show_post_heading_setting'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'medical_clinic_center_sanitize_checkbox',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_show_post_heading_setting]',
	array(
	'label'    => __( 'Show Post Heading', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_post_option',
	'type'     => 'checkbox',
	'priority' => 100,
	)
);

// Setting show Post Content.
$wp_customize->add_setting( 'theme_options[medical_clinic_center_show_post_content_setting]',
	array(
	'default'           => $default['medical_clinic_center_show_post_content_setting'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'medical_clinic_center_sanitize_checkbox',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_show_post_content_setting]',
	array(
	'label'    => __( 'Show Post Full Content', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_post_option',
	'type'     => 'checkbox',
	'priority' => 100,
	)
);

// Setting show Post admin.
$wp_customize->add_setting( 'theme_options[medical_clinic_center_show_post_admin_setting]',
	array(
	'default'           => $default['medical_clinic_center_show_post_admin_setting'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'medical_clinic_center_sanitize_checkbox',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_show_post_admin_setting]',
	array(
	'label'    => __( 'Show Post Admin', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_post_option',
	'type'     => 'checkbox',
	'priority' => 100,
	)
);

// Setting show Post Categories.
$wp_customize->add_setting( 'theme_options[medical_clinic_center_show_post_categories_setting]',
	array(
	'default'           => $default['medical_clinic_center_show_post_categories_setting'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'medical_clinic_center_sanitize_checkbox',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_show_post_categories_setting]',
	array(
	'label'    => __( 'Show Post Categories', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_post_option',
	'type'     => 'checkbox',
	'priority' => 100,
	)
);

// Setting show Post Comments.
$wp_customize->add_setting( 'theme_options[medical_clinic_center_show_post_comments_setting]',
	array(
	'default'           => $default['medical_clinic_center_show_post_comments_setting'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'medical_clinic_center_sanitize_checkbox',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_show_post_comments_setting]',
	array(
	'label'    => __( 'Show Post Comments', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_post_option',
	'type'     => 'checkbox',
	'priority' => 100,
	)
);

// Setting show Post Featured Image.
$wp_customize->add_setting( 'theme_options[medical_clinic_center_show_post_featured_image_setting]',
	array(
	'default'           => $default['medical_clinic_center_show_post_featured_image_setting'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'medical_clinic_center_sanitize_checkbox',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_show_post_featured_image_setting]',
	array(
	'label'    => __( 'Show Post Featured Image', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_post_option',
	'type'     => 'checkbox',
	'priority' => 100,
	)
);

// Setting show Post Tags.
$wp_customize->add_setting( 'theme_options[medical_clinic_center_show_post_tags_setting]',
	array(
	'default'           => $default['medical_clinic_center_show_post_tags_setting'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'medical_clinic_center_sanitize_checkbox',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_show_post_tags_setting]',
	array(
	'label'    => __( 'Show Post Tags', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_post_option',
	'type'     => 'checkbox',
	'priority' => 100,
	)
);

// Header Section.
$wp_customize->add_section( 'medical_clinic_center_section_header',
	array(
	'title'      => __( 'Header Options', 'medical-clinic-center' ),
	'priority'   => 100,
	'capability' => 'edit_theme_options',
	'panel'      => 'medical_clinic_center_theme_option_panel',
	)
);

// Setting show_title.
$wp_customize->add_setting( 'theme_options[medical_clinic_center_show_title]',
	array(
	'default'           => $default['medical_clinic_center_show_title'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'medical_clinic_center_sanitize_checkbox',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_show_title]',
	array(
	'label'    => __( 'Show Site Title', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_header',
	'type'     => 'checkbox',
	'priority' => 100,
	)
);
// Setting show_tagline.
$wp_customize->add_setting( 'theme_options[medical_clinic_center_show_tagline]',
	array(
	'default'           => $default['medical_clinic_center_show_tagline'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'medical_clinic_center_sanitize_checkbox',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_show_tagline]',
	array(
	'label'    => __( 'Show Tagline', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_header',
	'type'     => 'checkbox',
	'priority' => 100,
	)
);

// Setting top header text
$wp_customize->add_setting( 'theme_options[medical_clinic_center_header_top_hiring_head]',
	array(
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'sanitize_text_field',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_header_top_hiring_head]',
	array(
	'label'    => __( 'Add Text', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_header',
	'type'     => 'text',
	'priority' => 100,
	)
);

// Setting top header text
$wp_customize->add_setting( 'theme_options[medical_clinic_center_header_top_emergency_call]',
	array(
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'sanitize_text_field',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_header_top_emergency_call]',
	array(
	'label'    => __( 'Add Emergency Phone Number', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_header',
	'type'     => 'text',
	'priority' => 100,
	)
);

// Setting Opening Time Text
$wp_customize->add_setting( 'theme_options[medical_clinic_center_header_top_timing_text]',
	array(
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'sanitize_text_field',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_header_top_timing_text]',
	array(
	'label'    => __( 'Add Opening Time Text', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_header',
	'type'     => 'text',
	'priority' => 100,
	)
);

// Setting Opening Time
$wp_customize->add_setting( 'theme_options[medical_clinic_center_header_top_timing]',
	array(
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'sanitize_text_field',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_header_top_timing]',
	array(
	'label'    => __( 'Add Opening Time', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_header',
	'type'     => 'text',
	'priority' => 100,
	)
);

// Setting Location Text
$wp_customize->add_setting( 'theme_options[medical_clinic_center_header_top_location_text]',
	array(
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'sanitize_text_field',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_header_top_location_text]',
	array(
	'label'    => __( 'Add Location Text', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_header',
	'type'     => 'text',
	'priority' => 100,
	)
);

// Setting Location
$wp_customize->add_setting( 'theme_options[medical_clinic_center_header_top_location]',
	array(
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'sanitize_text_field',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_header_top_location]',
	array(
	'label'    => __( 'Add Location', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_header',
	'type'     => 'text',
	'priority' => 100,
	)
);

// Setting Phone Text
$wp_customize->add_setting( 'theme_options[medical_clinic_center_header_top_phone_text]',
	array(
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'sanitize_text_field',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_header_top_phone_text]',
	array(
	'label'    => __( 'Add Phone Number Text', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_header',
	'type'     => 'text',
	'priority' => 100,
	)
);

// Setting Phone Number
$wp_customize->add_setting( 'theme_options[medical_clinic_center_header_top_phone_number]',
	array(
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'sanitize_text_field',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_header_top_phone_number]',
	array(
	'label'    => __( 'Add Phone Number', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_header',
	'type'     => 'text',
	'priority' => 100,
	)
);

// Setting book appointment 
$wp_customize->add_setting( 'theme_options[medical_clinic_center_header_top_booknow_btn_text]',
	array(
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'sanitize_text_field',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_header_top_booknow_btn_text]',
	array(
	'label'    => __( 'Add Button Text', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_header',
	'type'     => 'text',
	'priority' => 100,
	)
);

// Setting book appointment url
$wp_customize->add_setting( 'theme_options[medical_clinic_center_header_top_booknow_btn_link]',
	array(
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'esc_url_raw',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_header_top_booknow_btn_link]',
	array(
	'label'    => __( 'Add Button Link', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_header',
	'type'     => 'url',
	'priority' => 100,
	)
);

// Social Section.
$wp_customize->add_section( 'medical_clinic_center_section_social',
	array(
	'title'      => __( 'Social Media Options', 'medical-clinic-center' ),
	'priority'   => 100,
	'capability' => 'edit_theme_options',
	'panel'      => 'medical_clinic_center_theme_option_panel',
	)
);

// Setting top header button
$wp_customize->add_setting( 'theme_options[medical_clinic_center_social_media_facebook]',
	array(
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'esc_url_raw',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_social_media_facebook]',
	array(
	'label'    => __( 'Add Facebook Link', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_social',
	'type'     => 'url',
	'priority' => 100,
	)
);

// Setting top header button
$wp_customize->add_setting( 'theme_options[medical_clinic_center_social_media_twitter]',
	array(
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'esc_url_raw',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_social_media_twitter]',
	array(
	'label'    => __( 'Add Twitter Link', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_social',
	'type'     => 'url',
	'priority' => 100,
	)
);

// Setting top header button
$wp_customize->add_setting( 'theme_options[medical_clinic_center_social_media_instagram]',
	array(
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'esc_url_raw',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_social_media_instagram]',
	array(
	'label'    => __( 'Add Instagram Link', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_social',
	'type'     => 'url',
	'priority' => 100,
	)
);

// Setting top header button
$wp_customize->add_setting( 'theme_options[medical_clinic_center_social_media_linkdin]',
	array(
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'esc_url_raw',
	)
);

$wp_customize->add_control( 'theme_options[medical_clinic_center_social_media_linkdin]',
	array(
	'label'    => __( 'Add Linkdin Link', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_social',
	'type'     => 'url',
	'priority' => 100,
	)
);

// Setting top header button
$wp_customize->add_setting( 'theme_options[medical_clinic_center_social_media_youtube]',
	array(
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'esc_url_raw',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_social_media_youtube]',
	array(
	'label'    => __( 'Add Youbube Link', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_social',
	'type'     => 'url',
	'priority' => 100,
	)
);

// Layout Section.
$wp_customize->add_section( 'medical_clinic_center_section_layout',
	array(
	'title'      => __( 'Layout Options', 'medical-clinic-center' ),
	'priority'   => 100,
	'capability' => 'edit_theme_options',
	'panel'      => 'medical_clinic_center_theme_option_panel',
	)
);

// Setting global_layout.
$wp_customize->add_setting( 'theme_options[medical_clinic_center_global_layout]',
	array(
	'default'           => $default['medical_clinic_center_global_layout'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'medical_clinic_center_sanitize_select',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_global_layout]',
	array(
	'label'    => __( 'Global Layout', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_layout',
	'type'     => 'select',
	'choices'  => medical_clinic_center_get_global_layout_options(),
	'priority' => 100,
	)
);

// Setting archive_layout.
$wp_customize->add_setting( 'theme_options[medical_clinic_center_archive_layout]',
	array(
	'default'           => $default['medical_clinic_center_archive_layout'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'medical_clinic_center_sanitize_select',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_archive_layout]',
	array(
	'label'    => __( 'Archive Layout', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_layout',
	'type'     => 'select',
	'choices'  => medical_clinic_center_get_archive_layout_options(),
	'priority' => 100,
	)
);
// Setting archive_image.
$wp_customize->add_setting( 'theme_options[medical_clinic_center_archive_image]',
	array(
	'default'           => $default['medical_clinic_center_archive_image'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'medical_clinic_center_sanitize_select',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_archive_image]',
	array(
	'label'    => __( 'Image in Archive', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_layout',
	'type'     => 'select',
	'choices'  => medical_clinic_center_get_image_sizes_options( true, array( 'disable', 'thumbnail', 'medium', 'large' ), false ),
	'priority' => 100,
	)
);
// Setting archive_image_alignment.
$wp_customize->add_setting( 'theme_options[medical_clinic_center_archive_image_alignment]',
	array(
	'default'           => $default['medical_clinic_center_archive_image_alignment'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'medical_clinic_center_sanitize_select',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_archive_image_alignment]',
	array(
	'label'           => __( 'Image Alignment in Archive', 'medical-clinic-center' ),
	'section'         => 'medical_clinic_center_section_layout',
	'type'            => 'select',
	'choices'         => medical_clinic_center_get_image_alignment_options(),
	'priority'        => 100,
	'active_callback' => 'medical_clinic_center_is_image_in_archive_active',
	)
);
// Setting single_image.
$wp_customize->add_setting( 'theme_options[medical_clinic_center_single_image]',
	array(
	'default'           => $default['medical_clinic_center_single_image'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'medical_clinic_center_sanitize_select',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_single_image]',
	array(
	'label'    => __( 'Image in Single Post/Page', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_layout',
	'type'     => 'select',
	'choices'  => medical_clinic_center_get_image_sizes_options( true, array( 'disable', 'large' ), false ),
	'priority' => 100,
	)
);

// 404 Page Setting

$wp_customize->add_section( 'medical_clinic_center_404_page',
	array(
	'title'      => __( '404 Page Settings', 'medical-clinic-center' ),
	'priority'   => 100,
	'capability' => 'edit_theme_options',
	'panel'      => 'medical_clinic_center_theme_option_panel',
	)
);

$wp_customize->add_setting( 'theme_options[medical_clinic_center_404_page_title]',
	array(
	'default'           => $default['medical_clinic_center_404_page_title'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'sanitize_text_field',
	)
);

$wp_customize->add_control( 'theme_options[medical_clinic_center_404_page_title]',
	array(
	'label'    => __( 'Add Title', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_404_page',
	'type'     => 'text',
	'priority' => 100,
	)
);

$wp_customize->add_setting( 'theme_options[medical_clinic_center_404_page_text]',
	array(
	'default'           => $default['medical_clinic_center_404_page_text'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'sanitize_text_field',
	)
);

$wp_customize->add_control( 'theme_options[medical_clinic_center_404_page_text]',
	array(
	'label'    => __( 'Add Text', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_404_page',
	'type'     => 'text',
	'priority' => 100,
	)
);

// Footer Section.
$wp_customize->add_section( 'medical_clinic_center_section_footer',
	array(
	'title'      => __( 'Footer Options', 'medical-clinic-center' ),
	'priority'   => 100,
	'capability' => 'edit_theme_options',
	'panel'      => 'medical_clinic_center_theme_option_panel',
	)
);

// Setting copyright_text.
$wp_customize->add_setting( 'theme_options[medical_clinic_center_copyright_text]',
	array(
	'default'           => $default['medical_clinic_center_copyright_text'],
	'capability'        => 'edit_theme_options',
	'sanitize_callback' => 'medical_clinic_center_sanitize_textarea_content',
	'transport'         => 'postMessage',
	)
);
$wp_customize->add_control( 'theme_options[medical_clinic_center_copyright_text]',
	array(
	'label'    => __( 'Copyright Text', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_footer',
	'type'     => 'text',
	'priority' => 100,
	)
);

$wp_customize->add_setting('theme_options[medical_clinic_center_copyright_text_align]',
	array(
	'capability'        => 'edit_theme_options',
	'default' 			=> $default['medical_clinic_center_copyright_text_align'],
	'sanitize_callback' => 'medical_clinic_center_sanitize_choices'
));
$wp_customize->add_control('theme_options[medical_clinic_center_copyright_text_align]',array(
	'type' => 'radio',
	'label' => __('Copyright Text Alignment','medical-clinic-center'),
	'section' => 'medical_clinic_center_section_footer',
	'priority' => 100,
	'choices' => array(
		'left' => __('Left Align','medical-clinic-center'),
		'right' => __('Right Align','medical-clinic-center'),
		'center' => __('Center Align','medical-clinic-center'),
	),
) );

$wp_customize->add_setting( 'theme_options[medical_clinic_center_copyright_text_font_size]',
	array(
	'capability'        => 'edit_theme_options',
	'default'           => $default['medical_clinic_center_copyright_text_font_size'],
	'transport'            => 'refresh',
    'sanitize_callback'    => 'absint',
    'sanitize_js_callback' => 'absint',
	)
);

$wp_customize->add_control( 'theme_options[medical_clinic_center_copyright_text_font_size]',
	array(
	'label'    => __( 'Copyright Font Size', 'medical-clinic-center' ),
	'section'  => 'medical_clinic_center_section_footer',
	'type'     => 'number',
	'priority' => 100,
	)
);