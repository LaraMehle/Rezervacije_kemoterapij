( function( api ) {

	// Extends our custom "medical-clinic-center" section.
	api.sectionConstructor['medical-clinic-center'] = api.Section.extend( {

		// No events for this type of section.
		attachEvents: function () {},

		// Always make the section active.
		isContextuallyActive: function () {
			return true;
		}
	} );

} )( wp.customize );