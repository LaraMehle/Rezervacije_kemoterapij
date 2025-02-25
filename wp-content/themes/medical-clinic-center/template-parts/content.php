<?php
/**
 * Template part for displaying posts.
 *
 * @link https://codex.wordpress.org/Template_Hierarchy
 *
 * @package medical_clinic_center
 */

?>
<div class="blog-content">
	<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
		<?php $medical_clinic_center_archive_layout = medical_clinic_center_get_option( 'medical_clinic_center_archive_layout' );
		$show_post_image = medical_clinic_center_get_option( 'medical_clinic_center_show_post_featured_image_setting' );
		if ( true === $show_post_image ) { ?>
			<div class="blog-img">
				<?php if ( has_post_thumbnail() ) : ?>
					<?php
					$medical_clinic_center_archive_image           = medical_clinic_center_get_option( 'medical_clinic_center_archive_image' );
					$medical_clinic_center_archive_image_alignment = medical_clinic_center_get_option( 'medical_clinic_center_archive_image_alignment' );
					?>
					<?php if ( 'disable' !== $medical_clinic_center_archive_image ) : ?>
						<a href="<?php the_permalink(); ?>"><?php the_post_thumbnail( esc_attr( $medical_clinic_center_archive_image ), array( 'class' => 'align'. esc_attr( $medical_clinic_center_archive_image_alignment ) ) ); ?></a>
					<?php endif; ?>
				<?php endif; ?>
			</div>
		<?php }?>
		<div class="entry-content-wrapper">
			<?php medical_clinic_center_entry_meta_date(); ?>
			<?php $medical_clinic_center_show_post_heading = medical_clinic_center_get_option( 'medical_clinic_center_show_post_heading_setting' );
			if ( true === $medical_clinic_center_show_post_heading ) { ?>
				<header class="entry-header">
					<?php the_title( sprintf( '<h2 class="entry-title"><a href="%s" rel="bookmark">', esc_url( get_permalink() ) ), '</a></h2>' ); ?>
				</header>
			<?php } ?>
			<footer class="entry-footer">
				<?php medical_clinic_center_entry_footer(); ?>
			</footer>
		</div>
		<?php $medical_clinic_center_show_post_content = medical_clinic_center_get_option( 'medical_clinic_center_show_post_content_setting' );
		if ( true === $medical_clinic_center_show_post_content ) { ?>
			<div class="text-content">
				<?php if ( 'full' === $medical_clinic_center_archive_layout ) : ?>
					<?php
					the_content( sprintf(
						wp_kses( __( 'Continue reading %s <span class="meta-nav">&rarr;</span>', 'medical-clinic-center' ), array( 'span' => array( 'class' => array() ) ) ),
						the_title( '<span class="screen-reader-text">"', '"</span>', false )
					) );
					?>
					<?php
						wp_link_pages( array(
							'before' => '<div class="page-links">' . esc_html__( 'Pages:', 'medical-clinic-center' ),
							'after'  => '</div>',
						) );
					?>
			    <?php else : ?>
					<?php the_excerpt(); ?>
			    <?php endif; ?>
			</div>
		<?php } ?>
	</article>
</div>

