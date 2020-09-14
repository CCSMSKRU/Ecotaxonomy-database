$('document').ready(function () {

	let CHBox = {
		cb: null,
		inputTimeout: null,

		is_taxon: null,
		alternatives: [],

		order: ['kingdom', 'phylum', 'class', 'order', 'family', 'genus'],
		order_ru: ['Царство', 'Тип', 'Класс', 'Отряд', 'Семейство', 'Род'],

		properties: [{
			title: 'eventID',
			description: 'An identifier for the set of information associated with an Event (something that occurs at a place and time). May be a global unique identifier or an identifier specific to the data set.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#eventID">http://rs.tdwg.org/dwc/terms/index.htm#eventID</a>'
		}, {
			title: 'parentEventID',
			description: 'An event identifier for the super event which is composed of one or more sub-sampling events. The value must refer to an existing eventID. If the identifier is local it must exist within the given dataset. May be a globally unique identifier or an identifier specific to the data set.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#parentEventID">http://rs.tdwg.org/dwc/terms/index.htm#parentEventID</a>'
		}, {
			title: 'samplingProtocol',
			description: 'The name of, reference to, or description of the method or protocol used during an Event.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#samplingProtocol">http://rs.tdwg.org/dwc/terms/index.htm#samplingProtocol</a>'
		}, {
			title: 'sampleSizeValue',
			description: 'A numeric value for a measurement of the size (time duration, length, area, or volume) of a sample in a sampling event.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#sampleSizeValue">http://rs.tdwg.org/dwc/terms/index.htm#sampleSizeValue</a>'
		}, {
			title: 'sampleSizeUnit',
			description: 'The unit of measurement of the size (time duration, length, area, or volume) of a sample in a sampling event.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#sampleSizeUnit">http://rs.tdwg.org/dwc/terms/index.htm#sampleSizeUnit</a>'
		}, {
			title: 'samplingEffort',
			description: 'The amount of effort expended during an Event.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#samplingEffort">http://rs.tdwg.org/dwc/terms/index.htm#samplingEffort</a>'
		}, {
			title: 'eventDate',
			description: 'The date-time or interval during which an Event occurred. For occurrences, this is the date-time when the event was recorded. Not suitable for a time in a geological context. Recommended best practice is to use an encoding scheme, such as ISO 8601:2004(E).<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#eventDate">http://rs.tdwg.org/dwc/terms/index.htm#eventDate</a>'
		}, {
			title: 'eventTime',
			description: 'The time or interval during which an Event occurred. Recommended best practice is to use an encoding scheme, such as ISO 8601:2004(E).<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#eventTime">http://rs.tdwg.org/dwc/terms/index.htm#eventTime</a>'
		}, {
			title: 'startDayOfYear',
			description: 'The earliest ordinal day of the year on which the Event occurred (1 for January 1, 365 for December 31, except in a leap year, in which case it is 366).<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#startDayOfYear">http://rs.tdwg.org/dwc/terms/index.htm#startDayOfYear</a>'
		}, {
			title: 'endDayOfYear',
			description: 'The latest ordinal day of the year on which the Event occurred (1 for January 1, 365 for December 31, except in a leap year, in which case it is 366).<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#endDayOfYear">http://rs.tdwg.org/dwc/terms/index.htm#endDayOfYear</a>'
		}, {
			title: 'year',
			description: 'The four-digit year in which the Event occurred, according to the Common Era Calendar.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#year">http://rs.tdwg.org/dwc/terms/index.htm#year</a>'
		}, {
			title: 'month',
			description: 'The ordinal month in which the Event occurred.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#month">http://rs.tdwg.org/dwc/terms/index.htm#month</a>'
		}, {
			title: 'day',
			description: 'The integer day of the month on which the Event occurred.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#day">http://rs.tdwg.org/dwc/terms/index.htm#day</a>'
		}, {
			title: 'verbatimEventDate',
			description: 'The verbatim original representation of the date and time information for an Event.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#verbatimEventDate">http://rs.tdwg.org/dwc/terms/index.htm#verbatimEventDate</a>'
		}, {
			title: 'habitat',
			description: 'A category or description of the habitat in which the Event occurred.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#habitat">http://rs.tdwg.org/dwc/terms/index.htm#habitat</a>'
		}, {
			title: 'fieldNumber',
			description: 'An identifier given to the event in the field. Often serves as a link between field notes and the Event.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#fieldNumber">http://rs.tdwg.org/dwc/terms/index.htm#fieldNumber</a>'
		}, {
			title: 'fieldNotes',
			description: 'One of a) an indicator of the existence of, b) a reference to (publication, URI), or c) the text of notes taken in the field about the Event.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#fieldNotes">http://rs.tdwg.org/dwc/terms/index.htm#fieldNotes</a>'
		}, {
			title: 'eventRemarks',
			description: 'Comments or notes about the Event.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#eventRemarks">http://rs.tdwg.org/dwc/terms/index.htm#eventRemarks</a>'
		}, {
			title: 'geologicalContextID',
			description: 'An identifier for the set of information associated with a GeologicalContext (the location within a geological context, such as stratigraphy). May be a global unique identifier or an identifier specific to the data set.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#geologicalContextID">http://rs.tdwg.org/dwc/terms/index.htm#geologicalContextID</a>'
		}, {
			title: 'earliestEonOrLowestEonothem',
			description: 'The full name of the earliest possible geochronologic eon or lowest chrono-stratigraphic eonothem or the informal name ("Precambrian") attributable to the stratigraphic horizon from which the cataloged item was collected.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#earliestEonOrLowestEonothem">http://rs.tdwg.org/dwc/terms/index.htm#earliestEonOrLowestEonothem</a>'
		}, {
			title: 'latestEonOrHighestEonothem',
			description: 'The full name of the latest possible geochronologic eon or highest chrono-stratigraphic eonothem or the informal name ("Precambrian") attributable to the stratigraphic horizon from which the cataloged item was collected.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#latestEonOrHighestEonothem">http://rs.tdwg.org/dwc/terms/index.htm#latestEonOrHighestEonothem</a>'
		}, {
			title: 'earliestEraOrLowestErathem',
			description: 'The full name of the earliest possible geochronologic era or lowest chronostratigraphic erathem attributable to the stratigraphic horizon from which the cataloged item was collected.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#earliestEraOrLowestErathem">http://rs.tdwg.org/dwc/terms/index.htm#earliestEraOrLowestErathem</a>'
		}, {
			title: 'latestEraOrHighestErathem',
			description: 'The full name of the latest possible geochronologic era or highest chronostratigraphic erathem attributable to the stratigraphic horizon from which the cataloged item was collected.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#latestEraOrHighestErathem">http://rs.tdwg.org/dwc/terms/index.htm#latestEraOrHighestErathem</a>'
		}, {
			title: 'earliestPeriodOrLowestSystem',
			description: 'The full name of the earliest possible geochronologic period or lowest chronostratigraphic system attributable to the stratigraphic horizon from which the cataloged item was collected.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#earliestPeriodOrLowestSystem">http://rs.tdwg.org/dwc/terms/index.htm#earliestPeriodOrLowestSystem</a>'
		}, {
			title: 'latestPeriodOrHighestSystem',
			description: 'The full name of the latest possible geochronologic period or highest chronostratigraphic system attributable to the stratigraphic horizon from which the cataloged item was collected.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#latestPeriodOrHighestSystem">http://rs.tdwg.org/dwc/terms/index.htm#latestPeriodOrHighestSystem</a>'
		}, {
			title: 'earliestEpochOrLowestSeries',
			description: 'The full name of the earliest possible geochronologic epoch or lowest chronostratigraphic series attributable to the stratigraphic horizon from which the cataloged item was collected.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#earliestEpochOrLowestSeries">http://rs.tdwg.org/dwc/terms/index.htm#earliestEpochOrLowestSeries</a>'
		}, {
			title: 'latestEpochOrHighestSeries',
			description: 'The full name of the latest possible geochronologic epoch or highest chronostratigraphic series attributable to the stratigraphic horizon from which the cataloged item was collected.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#latestEpochOrHighestSeries">http://rs.tdwg.org/dwc/terms/index.htm#latestEpochOrHighestSeries</a>'
		}, {
			title: 'earliestAgeOrLowestStage',
			description: 'The full name of the earliest possible geochronologic age or lowest chronostratigraphic stage attributable to the stratigraphic horizon from which the cataloged item was collected.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#earliestAgeOrLowestStage">http://rs.tdwg.org/dwc/terms/index.htm#earliestAgeOrLowestStage</a>'
		}, {
			title: 'latestAgeOrHighestStage',
			description: 'The full name of the latest possible geochronologic age or highest chronostratigraphic stage attributable to the stratigraphic horizon from which the cataloged item was collected.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#latestAgeOrHighestStage">http://rs.tdwg.org/dwc/terms/index.htm#latestAgeOrHighestStage</a>'
		}, {
			title: 'lowestBiostratigraphicZone',
			description: 'The full name of the lowest possible geological biostratigraphic zone of the stratigraphic horizon from which the cataloged item was collected.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#lowestBiostratigraphicZone">http://rs.tdwg.org/dwc/terms/index.htm#lowestBiostratigraphicZone</a>'
		}, {
			title: 'highestBiostratigraphicZone',
			description: 'The full name of the highest possible geological biostratigraphic zone of the stratigraphic horizon from which the cataloged item was collected.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#highestBiostratigraphicZone">http://rs.tdwg.org/dwc/terms/index.htm#highestBiostratigraphicZone</a>'
		}, {
			title: 'lithostratigraphicTerms',
			description: 'The combination of all litho-stratigraphic names for the rock from which the cataloged item was collected.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#lithostratigraphicTerms">http://rs.tdwg.org/dwc/terms/index.htm#lithostratigraphicTerms</a>'
		}, {
			title: 'group',
			description: 'The full name of the lithostratigraphic group from which the cataloged item was collected.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#group">http://rs.tdwg.org/dwc/terms/index.htm#group</a>'
		}, {
			title: 'formation',
			description: 'The full name of the lithostratigraphic formation from which the cataloged item was collected.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#formation">http://rs.tdwg.org/dwc/terms/index.htm#formation</a>'
		}, {
			title: 'member',
			description: 'The full name of the lithostratigraphic member from which the cataloged item was collected.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#member">http://rs.tdwg.org/dwc/terms/index.htm#member</a>'
		}, {
			title: 'bed',
			description: 'The full name of the lithostratigraphic bed from which the cataloged item was collected.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#bed">http://rs.tdwg.org/dwc/terms/index.htm#bed</a>'
		}, {
			title: 'locationID',
			description: 'An identifier for the set of location information (data associated with dcterms:Location). May be a global unique identifier or an identifier specific to the data set.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#locationID">http://rs.tdwg.org/dwc/terms/index.htm#locationID</a>'
		}, {
			title: 'higherGeographyID',
			description: 'An identifier for the geographic region within which the Location occurred. Recommended best practice is to use an persistent identifier from a controlled vocabulary such as the Getty Thesaurus of Geographic Names.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#higherGeographyID">http://rs.tdwg.org/dwc/terms/index.htm#higherGeographyID</a>'
		}, {
			title: 'higherGeography',
			description: 'A list (concatenated and separated) of geographic names less specific than the information captured in the locality term. The recommended best practice is to separate the values with a vertical bar (\' | \').<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#higherGeography">http://rs.tdwg.org/dwc/terms/index.htm#higherGeography</a>'
		}, {
			title: 'continent',
			description: 'The name of the continent in which the Location occurs. Recommended best practice is to use a controlled vocabulary such as the Getty Thesaurus of Geographic Names or the ISO 3166 Continent code.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#continent">http://rs.tdwg.org/dwc/terms/index.htm#continent</a>'
		}, {
			title: 'waterBody',
			description: 'The name of the water body in which the Location occurs. Recommended best practice is to use a controlled vocabulary such as the Getty Thesaurus of Geographic Names.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#waterBody">http://rs.tdwg.org/dwc/terms/index.htm#waterBody</a>'
		}, {
			title: 'islandGroup',
			description: 'The name of the island group in which the Location occurs. Recommended best practice is to use a controlled vocabulary such as the Getty Thesaurus of Geographic Names.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#islandGroup">http://rs.tdwg.org/dwc/terms/index.htm#islandGroup</a>'
		}, {
			title: 'island',
			description: 'The name of the island on or near which the Location occurs. Recommended best practice is to use a controlled vocabulary such as the Getty Thesaurus of Geographic Names.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#island">http://rs.tdwg.org/dwc/terms/index.htm#island</a>'
		}, {
			title: 'country',
			description: 'The name of the country or major administrative unit in which the Location occurs. Recommended best practice is to use a controlled vocabulary such as the Getty Thesaurus of Geographic Names.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#country">http://rs.tdwg.org/dwc/terms/index.htm#country</a>'
		}, {
			title: 'countryCode',
			description: 'The standard code for the country in which the Location occurs. Recommended best practice is to use ISO 3166-1-alpha-2 country codes.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#countryCode">http://rs.tdwg.org/dwc/terms/index.htm#countryCode</a>'
		}, {
			title: 'stateProvince',
			description: 'The name of the next smaller administrative region than country (state, province, canton, department, region, etc.) in which the Location occurs.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#stateProvince">http://rs.tdwg.org/dwc/terms/index.htm#stateProvince</a>'
		}, {
			title: 'county',
			description: 'The full, unabbreviated name of the next smaller administrative region than stateProvince (county, shire, department, etc.) in which the Location occurs.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#county">http://rs.tdwg.org/dwc/terms/index.htm#county</a>'
		}, {
			title: 'municipality',
			description: 'The full, unabbreviated name of the next smaller administrative region than county (city, municipality, etc.) in which the Location occurs. Do not use this term for a nearby named place that does not contain the actual location.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#municipality">http://rs.tdwg.org/dwc/terms/index.htm#municipality</a>'
		}, {
			title: 'locality',
			description: 'The specific description of the place. Less specific geographic information can be provided in other geographic terms (higherGeography, continent, country, stateProvince, county, municipality, waterBody, island, islandGroup). This term may contain information modified from the original to correct perceived errors or standardize the description.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#locality">http://rs.tdwg.org/dwc/terms/index.htm#locality</a>'
		}, {
			title: 'verbatimLocality',
			description: 'The original textual description of the place.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#verbatimLocality">http://rs.tdwg.org/dwc/terms/index.htm#verbatimLocality</a>'
		}, {
			title: 'verbatimElevation',
			description: 'The original description of the elevation (altitude, usually above sea level) of the Location.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#verbatimElevation">http://rs.tdwg.org/dwc/terms/index.htm#verbatimElevation</a>'
		}, {
			title: 'minimumElevationInMeters',
			description: 'The lower limit of the range of elevation (altitude, usually above sea level), in meters.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#minimumElevationInMeters">http://rs.tdwg.org/dwc/terms/index.htm#minimumElevationInMeters</a>'
		}, {
			title: 'maximumElevationInMeters',
			description: 'The upper limit of the range of elevation (altitude, usually above sea level), in meters.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#maximumElevationInMeters">http://rs.tdwg.org/dwc/terms/index.htm#maximumElevationInMeters</a>'
		}, {
			title: 'verbatimDepth',
			description: 'The original description of the depth below the local surface.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#verbatimDepth">http://rs.tdwg.org/dwc/terms/index.htm#verbatimDepth</a>'
		}, {
			title: 'minimumDepthInMeters',
			description: 'The lesser depth of a range of depth below the local surface, in meters.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#minimumDepthInMeters">http://rs.tdwg.org/dwc/terms/index.htm#minimumDepthInMeters</a>'
		}, {
			title: 'maximumDepthInMeters',
			description: 'The greater depth of a range of depth below the local surface, in meters.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#maximumDepthInMeters">http://rs.tdwg.org/dwc/terms/index.htm#maximumDepthInMeters</a>'
		}, {
			title: 'minimumDistanceAboveSurfaceInMeters',
			description: 'The lesser distance in a range of distance from a reference surface in the vertical direction, in meters. Use positive values for locations above the surface, negative values for locations below. If depth measures are given, the reference surface is the location given by the depth, otherwise the reference surface is the location given by the elevation.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#minimumDistanceAboveSurfaceInMeters">http://rs.tdwg.org/dwc/terms/index.htm#minimumDistanceAboveSurfaceInMeters</a>'
		}, {
			title: 'maximumDistanceAboveSurfaceInMeters',
			description: 'The greater distance in a range of distance from a reference surface in the vertical direction, in meters. Use positive values for locations above the surface, negative values for locations below. If depth measures are given, the reference surface is the location given by the depth, otherwise the reference surface is the location given by the elevation.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#maximumDistanceAboveSurfaceInMeters">http://rs.tdwg.org/dwc/terms/index.htm#maximumDistanceAboveSurfaceInMeters</a>'
		}, {
			title: 'locationAccordingTo',
			description: 'Information about the source of this Location information. Could be a publication (gazetteer), institution, or team of individuals.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#locationAccordingTo">http://rs.tdwg.org/dwc/terms/index.htm#locationAccordingTo</a>'
		}, {
			title: 'locationRemarks',
			description: 'Comments or notes about the Location.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#locationRemarks">http://rs.tdwg.org/dwc/terms/index.htm#locationRemarks</a>'
		}, {
			title: 'verbatimCoordinates',
			description: 'The verbatim original spatial coordinates of the Location. The coordinate ellipsoid, geodeticDatum, or full Spatial Reference System (SRS) for these coordinates should be stored in verbatimSRS and the coordinate system should be stored in verbatimCoordinateSystem.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#verbatimCoordinates">http://rs.tdwg.org/dwc/terms/index.htm#verbatimCoordinates</a>'
		}, {
			title: 'verbatimLatitude',
			description: 'The verbatim original latitude of the Location. The coordinate ellipsoid, geodeticDatum, or full Spatial Reference System (SRS) for these coordinates should be stored in verbatimSRS and the coordinate system should be stored in verbatimCoordinateSystem.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#verbatimLatitude">http://rs.tdwg.org/dwc/terms/index.htm#verbatimLatitude</a>'
		}, {
			title: 'verbatimLongitude',
			description: 'The verbatim original longitude of the Location. The coordinate ellipsoid, geodeticDatum, or full Spatial Reference System (SRS) for these coordinates should be stored in verbatimSRS and the coordinate system should be stored in verbatimCoordinateSystem.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#verbatimLongitude">http://rs.tdwg.org/dwc/terms/index.htm#verbatimLongitude</a>'
		}, {
			title: 'verbatimCoordinateSystem',
			description: 'The spatial coordinate system for the verbatimLatitude and verbatimLongitude or the verbatimCoordinates of the Location. Recommended best practice is to use a controlled vocabulary.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#verbatimCoordinateSystem">http://rs.tdwg.org/dwc/terms/index.htm#verbatimCoordinateSystem</a>'
		}, {
			title: 'verbatimSRS',
			description: 'The ellipsoid, geodetic datum, or spatial reference system (SRS) upon which coordinates given in verbatimLatitude and verbatimLongitude, or verbatimCoordinates are based. Recommended best practice is use the EPSG code as a controlled vocabulary to provide an SRS, if known. Otherwise use a controlled vocabulary for the name or code of the geodetic datum, if known. Otherwise use a controlled vocabulary for the name or code of the ellipsoid, if known. If none of these is known, use the value "unknown".<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#verbatimSRS">http://rs.tdwg.org/dwc/terms/index.htm#verbatimSRS</a>'
		}, {
			title: 'decimalLatitude',
			description: 'The geographic latitude (in decimal degrees, using the spatial reference system given in geodeticDatum) of the geographic center of a Location. Positive values are north of the Equator, negative values are south of it. Legal values lie between -90 and 90, inclusive.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#decimalLatitude">http://rs.tdwg.org/dwc/terms/index.htm#decimalLatitude</a>'
		}, {
			title: 'decimalLongitude',
			description: 'The geographic longitude (in decimal degrees, using the spatial reference system given in geodeticDatum) of the geographic center of a Location. Positive values are east of the Greenwich Meridian, negative values are west of it. Legal values lie between -180 and 180, inclusive.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#decimalLongitude">http://rs.tdwg.org/dwc/terms/index.htm#decimalLongitude</a>'
		}, {
			title: 'geodeticDatum',
			description: 'The ellipsoid, geodetic datum, or spatial reference system (SRS) upon which the geographic coordinates given in decimalLatitude and decimalLongitude as based. Recommended best practice is use the EPSG code as a controlled vocabulary to provide an SRS, if known. Otherwise use a controlled vocabulary for the name or code of the geodetic datum, if known. Otherwise use a controlled vocabulary for the name or code of the ellipsoid, if known. If none of these is known, use the value "unknown".<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#geodeticDatum">http://rs.tdwg.org/dwc/terms/index.htm#geodeticDatum</a>'
		}, {
			title: 'coordinateUncertaintyInMeters',
			description: 'The horizontal distance (in meters) from the given decimalLatitude and decimalLongitude describing the smallest circle containing the whole of the Location. Leave the value empty if the uncertainty is unknown, cannot be estimated, or is not applicable (because there are no coordinates). Zero is not a valid value for this term.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#coordinateUncertaintyInMeters">http://rs.tdwg.org/dwc/terms/index.htm#coordinateUncertaintyInMeters</a>'
		}, {
			title: 'coordinatePrecision',
			description: 'A decimal representation of the precision of the coordinates given in the decimalLatitude and decimalLongitude.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#coordinatePrecision">http://rs.tdwg.org/dwc/terms/index.htm#coordinatePrecision</a>'
		}, {
			title: 'pointRadiusSpatialFit',
			description: 'The ratio of the area of the point-radius (decimalLatitude, decimalLongitude, coordinateUncertaintyInMeters) to the area of the true (original, or most specific) spatial representation of the Location. Legal values are 0, greater than or equal to 1, or undefined. A value of 1 is an exact match or 100% overlap. A value of 0 should be used if the given point-radius does not completely contain the original representation. The pointRadiusSpatialFit is undefined (and should be left blank) if the original representation is a point without uncertainty and the given georeference is not that same point (without uncertainty). If both the original and the given georeference are the same point, the pointRadiusSpatialFit is 1.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#pointRadiusSpatialFit">http://rs.tdwg.org/dwc/terms/index.htm#pointRadiusSpatialFit</a>'
		}, {
			title: 'footprintWKT',
			description: 'A Well-Known Text (WKT) representation of the shape (footprint, geometry) that defines the Location. A Location may have both a point-radius representation (see decimalLatitude) and a footprint representation, and they may differ from each other.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#footprintWKT">http://rs.tdwg.org/dwc/terms/index.htm#footprintWKT</a>'
		}, {
			title: 'footprintSRS',
			description: 'A Well-Known Text (WKT) representation of the Spatial Reference System (SRS) for the footprintWKT of the Location. Do not use this term to describe the SRS of the decimalLatitude and decimalLongitude, even if it is the same as for the footprintWKT - use the geodeticDatum instead.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#footprintSRS">http://rs.tdwg.org/dwc/terms/index.htm#footprintSRS</a>'
		}, {
			title: 'footprintSpatialFit',
			description: 'The ratio of the area of the footprint (footprintWKT) to the area of the true (original, or most specific) spatial representation of the Location. Legal values are 0, greater than or equal to 1, or undefined. A value of 1 is an exact match or 100% overlap. A value of 0 should be used if the given footprint does not completely contain the original representation. The footprintSpatialFit is undefined (and should be left blank) if the original representation is a point and the given georeference is not that same point. If both the original and the given georeference are the same point, the footprintSpatialFit is 1.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#footprintSpatialFit">http://rs.tdwg.org/dwc/terms/index.htm#footprintSpatialFit</a>'
		}, {
			title: 'georeferencedBy',
			description: 'A list (concatenated and separated) of names of people, groups, or organizations who determined the georeference (spatial representation) the Location. The recommended best practice is to separate the values with a vertical bar (' | ').<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#georeferencedBy">http://rs.tdwg.org/dwc/terms/index.htm#georeferencedBy</a>'
		}, {
			title: 'georeferencedDate',
			description: 'The date on which the Location was georeferenced. Recommended best practice is to use an encoding scheme, such as ISO 8601:2004(E).<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#georeferencedDate">http://rs.tdwg.org/dwc/terms/index.htm#georeferencedDate</a>'
		}, {
			title: 'georeferenceProtocol',
			description: 'A description or reference to the methods used to determine the spatial footprint, coordinates, and uncertainties.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#georeferenceProtocol">http://rs.tdwg.org/dwc/terms/index.htm#georeferenceProtocol</a>'
		}, {
			title: 'georeferenceSources',
			description: 'A list (concatenated and separated) of maps, gazetteers, or other resources used to georeference the Location, described specifically enough to allow anyone in the future to use the same resources. The recommended best practice is to separate the values with a vertical bar (' | ').<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#georeferenceSources">http://rs.tdwg.org/dwc/terms/index.htm#georeferenceSources</a>'
		}, {
			title: 'georeferenceVerificationStatus',
			description: 'A categorical description of the extent to which the georeference has been verified to represent the best possible spatial description. Recommended best practice is to use a controlled vocabulary.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#georeferenceVerificationStatus">http://rs.tdwg.org/dwc/terms/index.htm#georeferenceVerificationStatus</a>'
		}, {
			title: 'georeferenceRemarks',
			description: 'Notes or comments about the spatial description determination, explaining assumptions made in addition or opposition to the those formalized in the method referred to in georeferenceProtocol.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#georeferenceRemarks">http://rs.tdwg.org/dwc/terms/index.htm#georeferenceRemarks</a>'
		}, {
			title: 'type',
			description: 'The nature or genre of the resource. For Darwin Core, recommended best practice is to use the name of the class that defines the root of the record.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#dcterms:type">http://rs.tdwg.org/dwc/terms/index.htm#dcterms:type</a>'
		}, {
			title: 'modified',
			description: 'The most recent date-time on which the resource was changed. For Darwin Core, recommended best practice is to use an encoding scheme, such as ISO 8601:2004(E)<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#dcterms:modified">http://rs.tdwg.org/dwc/terms/index.htm#dcterms:modified</a>'
		}, {
			title: 'language',
			description: 'A language of the resource. Recommended best practice is to use a controlled vocabulary such as RFC 4646 [RFC4646]<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#dcterms:language">http://rs.tdwg.org/dwc/terms/index.htm#dcterms:language</a>'
		}, {
			title: 'license',
			description: 'A legal document giving official permission to do something with the resource.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#dcterms:license">http://rs.tdwg.org/dwc/terms/index.htm#dcterms:license</a>'
		}, {
			title: 'rightsHolder',
			description: 'A person or organization owning or managing rights over the resource<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#dcterms:rightsHolder">http://rs.tdwg.org/dwc/terms/index.htm#dcterms:rightsHolder</a>'
		}, {
			title: 'accessRights',
			description: 'Information about who can access the resource or an indication of its security status. Access Rights may include information regarding access or restrictions based on privacy, security, or other policies<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#dcterms:accessRights">http://rs.tdwg.org/dwc/terms/index.htm#dcterms:accessRights</a>'
		}, {
			title: 'bibliographicCitation',
			description: 'A bibliographic reference for the resource as a statement indicating how this record should be cited (attributed) when used. Recommended practice is to include sufficient bibliographic detail to identify the resource as unambiguously as possible<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#dcterms:bibliographicCitation">http://rs.tdwg.org/dwc/terms/index.htm#dcterms:bibliographicCitation</a>'
		}, {
			title: 'references',
			description: 'A URL to a related resource that is referenced, cited, or otherwise pointed to by the described resource. Often another webpage showing the same, but richer resource<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#dcterms:references">http://rs.tdwg.org/dwc/terms/index.htm#dcterms:references</a>'
		}, {
			title: 'institutionID',
			description: 'An identifier for the institution having custody of the object(s) or information referred to in the record.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#institutionID">http://rs.tdwg.org/dwc/terms/index.htm#institutionID</a>'
		}, {
			title: 'datasetID',
			description: 'An identifier for the set of data. May be a global unique identifier or an identifier specific to a collection or institution.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#datasetID">http://rs.tdwg.org/dwc/terms/index.htm#datasetID</a>'
		}, {
			title: 'institutionCode',
			description: 'The name (or acronym) in use by the institution having custody of the object(s) or information referred to in the record.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#institutionCode">http://rs.tdwg.org/dwc/terms/index.htm#institutionCode</a>'
		}, {
			title: 'datasetName',
			description: 'The name identifying the data set from which the record was derived.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#datasetName">http://rs.tdwg.org/dwc/terms/index.htm#datasetName</a>'
		}, {
			title: 'ownerInstitutionCode',
			description: 'The name (or acronym) in use by the institution having ownership of the object(s) or information referred to in the record.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#ownerInstitutionCode">http://rs.tdwg.org/dwc/terms/index.htm#ownerInstitutionCode</a>'
		}, {
			title: 'informationWithheld',
			description: 'Additional information that exists, but that has not been shared in the given record.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#informationWithheld">http://rs.tdwg.org/dwc/terms/index.htm#informationWithheld</a>'
		}, {
			title: 'dataGeneralizations',
			description: 'Actions taken to make the shared data less specific or complete than in its original form. Suggests that alternative data of higher quality may be available on request.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#dataGeneralizations">http://rs.tdwg.org/dwc/terms/index.htm#dataGeneralizations</a>'
		}, {
			title: 'dynamicProperties',
			description: 'A list (concatenated and separated) of additional measurements, facts, characteristics, or assertions about the record. Meant to provide a mechanism for structured content such as key-value pairs. The recommended best practice is to use a key:value encoding schema such as JSON.<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#dynamicProperties">http://rs.tdwg.org/dwc/terms/index.htm#dynamicProperties</a>'
		}, {
			title: 'recordedBy',
			description: 'A list (concatenated and separated) of names of people, groups, or organizations responsible for recording the original Occurrence. The primary collector or observer, especially one who applies a personal identifier (recordNumber), should be listed first. The recommended best practice is to separate the values with a vertical bar (\' | \').<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#recordedBy">http://rs.tdwg.org/dwc/terms/index.htm#recordedBy</a>'
		}, {
			title: 'basisOfRecord',
			description: 'The specific nature of the data record - a subtype of the dcterms:type. Recommended best practice is to use a controlled vocabulary such as the Darwin Core Type Vocabulary (http://rs.tdwg.org/dwc/terms/type-vocabulary/index.htm).<br>see also <br><a href="http://rs.tdwg.org/dwc/terms/index.htm#basisOfRecord">http://rs.tdwg.org/dwc/terms/index.htm#basisOfRecord</a>'
		}],

		init: (name, alternatives, is_taxon, cb) => {
			CHBox.cb = typeof cb === "function" ? cb : null
			CHBox.is_taxon = !!is_taxon
			CHBox.alternatives = alternatives && alternatives.length ? alternatives : []

			// console.log(CHBox.properties);

			$('.ch_box .header').html(name || '')
			$('.ch_box input').val('')
			$('.ch_box ul').html('')
			$('.ch_box_wrapper').removeClass('hidden')

			CHBox.renderAlternatives(alternatives)
			CHBox.setHandlers()
		},
		destroy: () => {
			clearTimeout(CHTable.inputTimeout)
			CHBox.cb = null
			CHBox.is_taxon = null
			CHBox.alternatives = []
			$('.ch_box .header').html('')
			$('.ch_box input').val('')
			$('.ch_box ul').html('')
			$('.ch_box_wrapper').addClass('hidden')
		},

		renderAlternatives: (list) => {
			if (!!CHBox.is_taxon)
				CHBox.renderAlternatives_taxon(list)
			else
				CHBox.renderAlternatives_field(list)
		},
		renderAlternatives_taxon: (list) => {
			let tpl = `
				{{#rows}}
				<li>
					<div class="name_wrapper">
						<span class="name">{{name}}</span>
						<span class="type">{{type_ru}}</span>
					</div>
					<div class="classification">
						{{#types}}
						<span>{{.}}</span>
						{{/types}}
					</div>
				</li>
				{{/rows}}
			`

			let m = {
				rows: list.map(row => {
					let type_ru
					let types = []

					for (const i in CHBox.order) {
						let type = CHBox.order[i]
						if (type in row) {
							types.push(row[type])
							type_ru = CHBox.order_ru[i]
						}
					}

					return {
						name: row.canonicalName,
						type_ru, types
					}
				})
			}

			$('.ch_box ul').html(Mustache.render(tpl, m))

			CHBox.setListHandlers()
		},
		renderAlternatives_field: (list) => {
			let tpl = `
				{{#rows}}
				<li style="height: auto; padding: 10px 15px;">
					<div class="name_wrapper">
						<span class="name" style="font-weight: bold;">{{title}}</span>
					</div>
					<div class="classification">
						<span>{{{description}}}</span>
					</div>
				</li>
				{{/rows}}
			`

			let m = {
				rows: CHBox.properties.filter(row => list.indexOf(row.title) > -1)
			}

			$('.ch_box ul').html(Mustache.render(tpl, m))

			CHBox.setListHandlers()
		},

		getAlternatives: (query) => {
			if (!!CHBox.is_taxon)
				CHBox.getAlternatives_taxon(query)
			else
				CHBox.getAlternatives_field(query)
		},
		getAlternatives_taxon: (query) => {
			$.ajax({
				url: 'https://api.gbif.org/v1/species/suggest?limit=10&q=' + query,
				method: 'GET',
				dataType: 'json',
				error: function (err) {
					console.error('err', err)

					CHBox.renderAlternatives([])
				},
				success: function (res) {
					console.log('res', res)

					CHBox.renderAlternatives(res)
				}
			})
		},
		getAlternatives_field: (query) => {
			customQuery(server + '/api', {
				data: {
					command: 'compareColumnsForTableStn',
					object: 'taxon',
					params: JSON.stringify({
						query: query,
						properties: CHBox.properties.map(row => {
							return row.title
						})
					})
				}
			}, (err, res) => {
				console.log('err', err)
				console.log('res', res)

				if (!err)
					CHBox.renderAlternatives(res.options.map(row => row.target))
			}, false)
		},

		setHandlers: () => {
			$('#ch_box_cancel').off('click').on('click', () => {
				$('.ch_box_wrapper').addClass('hidden')
			})

			$('#ch_box_apply').off('click').on('click', () => {
				if (CHBox.cb)
					CHBox.cb($('#ch_box_input').val().trim())

				CHBox.destroy()
			})

			$('#ch_box_input').off('keydown').on('keydown', (e) => {
				clearTimeout(CHTable.inputTimeout)
				CHTable.inputTimeout = setTimeout(() => {
					let query = $(e.currentTarget).val()
					if (query.trim().length)
						CHBox.getAlternatives(query.trim())
					else
						CHBox.renderAlternatives([])
				}, 500)
			})
		},
		setListHandlers: () => {
			$('.ch_box ul li').off('click').on('click', (e) => {
				if (CHBox.cb)
					CHBox.cb($(e.currentTarget).find('.name').text())

				CHBox.destroy()
			})
		}
	}

	let CHTable = {
		page: 0,
		n_per_page: 25,
		sort_field_id: null,
		sort_dir: null,

		matchType_id: null,

		columns: [],
		rows: [],

		init: () => {
			CHTable.sort_field_id = null
			CHTable.sort_dir = null
			CHTable.pages_n = Math.ceil(CHTable.rows.length / CHTable.n_per_page)
			CHTable.setHandlers()
			CHTable.prepareColumns()
			CHTable.switchToPage(0)

			console.log(CHTable)
		},

		prepareColumns: () => {
			CHTable.columns.forEach((row, i) => {
				row.title_init = row.title
				if (row.columnsCompare && row.columnsCompare.length)
					row.title = row.columnsCompare[0].target
				else if (row.gbifCompare) {
					if ('canonicalName' in row.gbifCompare)
						row.title = row.gbifCompare.canonicalName
					else if (row.gbifCompare.alternatives && row.gbifCompare.alternatives.length)
						row.title = row.gbifCompare.alternatives[0].canonicalName
				}

				row.j = i
				row.is_taxon = row.is_taxon || row.gbifCompare ? 'checked' : null
			})
		},

		clear: () => {
			CHTable.sort_dir = null
			CHTable.sort_field_id = null

			CHTable.columns = []
			CHTable.rows = []

			CHTable.clearHTML()
		},
		clearHTML: () => {
			$('.ch_table tbody').empty()
			$('.ch_table thead').empty()
		},
		render: (page) => {
			CHTable.renderHeader()
			CHTable.renderBody(page)
		},
		renderHeader: () => {
			let tpl = `
				<tr>
					{{#columns}}
			        <th>
			            <div class="th_edit_tools">
			                <div class="th_edit_tool full">
			                    <div class="th_edit_button delete" data-column-id="{{j}}">Удалить колонку</div>
							</div>
			                <div class="th_edit_tool full">
			                    <div class="th_edit_button add_before" data-column-id="{{j}}">Добавить колонку слева</div>
							</div>
			                <div class="th_edit_tool">
				                <div class="is_taxon">
				                    <label>Подсчеты таксона?</label>
				                    <input type="checkbox" class="is_taxon_checkbox" data-column-id="{{j}}" {{is_taxon}} />
								</div>
							</div>
			                <div class="th_edit_tool full">
			                    <div class="th_edit_button change_title" data-column-id="{{j}}">{{title}}</div>
							</div>
						</div>
					</th>
					{{/columns}}
				</tr>
				<tr style="height: 25px;"></tr>
				<tr>
					{{#columns}}
			        <th>
			            <div class="th_content" data-column-id="{{j}}">
				            <div class="title">{{title_init}}</div>
				            {{#editable}}
				            <div class="status">(ред.)</div>
				            {{/editable}}
				            {{#dir_asc}}
				            <div class="direction">▲</div>
				            {{/dir_asc}}
				            {{#dir_desc}}
				            <div class="direction">▼</div>
				            {{/dir_desc}}
						</div>
					</th>
					{{/columns}}
				</tr>
		    `

			let m = {
				columns: CHTable.columns.map((row, i) => {
					row.dir_asc = CHTable.sort_field_id === i && CHTable.sort_dir === 'asc'
					row.dir_desc = CHTable.sort_field_id === i && CHTable.sort_dir === 'desc'
					return row
				})
			}

			$('.ch_table thead').html(Mustache.render(tpl, m))

			$('.ct-pagination-pagesCount').html(`Страницы: ${CHTable.pages_n}`)

			CHTable.setColumnsHandlers()
		},
		renderBody: (page) => {
			page = page || CHTable.page

			let tpl = `
				{{#rows}}
				<tr>
					{{#columns}}
					<td>
						<div class="td_content {{editable}}" data-row-id="{{i}}" data-column-id="{{j}}">
							<div class="value" {{{style}}}>{{{value}}}</div>
						</div>
					</td>
					{{/columns}}
				</tr>
				{{/rows}}
		    `

			let m = {
				rows: CHTable.rows.slice(page * CHTable.n_per_page, (page + 1) * CHTable.n_per_page).map((row, i) => {
					return {
						columns: row.map((row2, j) => {
							return {
								i: page * CHTable.n_per_page + i,
								j: j,
								editable: CHTable.columns[j].editable ? 'editable' : '',
								style: row2.style,
								value: row2.valueHTML || row2.value
							}
						})
					}
				})
			}

			$('.ch_table tbody').html(Mustache.render(tpl, m))

			CHTable.setBodyHandlers()
		},

		switchToPage: (n) => {
			CHTable.page = n || CHTable.page
			CHTable.clearHTML()
			CHTable.render(CHTable.page)

			$('.ct-pagination-current-input').val(n + 1)
		},

		sort: () => {
			function compare(a, b) {
				// Use toUpperCase() to ignore character casing
				let bandA
				let bandB

				for (let i = 0; i < a.length; i++) {
					if (i === CHTable.sort_field_id) {
						bandA = a[i].value
						break
					}
				}

				for (let i = 0; i < a.length; i++) {
					if (i === CHTable.sort_field_id) {
						bandB = b[i].value
						break
					}
				}

				bandA = bandA ? bandA : ''
				bandB = bandB ? bandB : ''

				if (CHTable.sort_dir === 'asc') {
					let tmp = bandA
					bandA = bandB
					bandB = tmp
				}

				let comparison = 0

				if (bandA > bandB) {
					comparison = 1
				} else if (bandA < bandB) {
					comparison = -1
				}

				return comparison
			}

			CHTable.rows.sort(compare)
			CHTable.switchToPage(0)

			// console.log('CHTable', CHTable);
		},

		setColumnsHandlers: () => {
			$('.th_content').off('click').on('click', (e) => {
				let $e = $(e.currentTarget)
				let j = +$e.attr('data-column-id')

				if (CHTable.columns.length <= j) return

				CHTable.sort_dir = !CHTable.sort_dir || CHTable.sort_dir === 'asc' || CHTable.sort_field_id !== j ? 'desc' : 'asc'
				CHTable.sort_field_id = j
				CHTable.sort()

				console.log(CHTable)
			})

			$('.th_edit_button.delete').off('click').on('click', (e) => {
				let $e = $(e.currentTarget)
				let j = +$e.attr('data-column-id')

				if (CHTable.columns.length <= j) return

				if (j === 0) {
					CHTable.columns = CHTable.columns.slice(1)
				} else {
					let start = CHTable.columns.slice(0, j)
					let end = CHTable.columns.slice(j + 1)
					CHTable.columns = start.concat(end)
				}

				for (let i = j; i < CHTable.columns.length; i++) {
					CHTable.columns[i].j--
				}

				for (let i = 0; i < CHTable.rows.length; i++) {
					let row = CHTable.rows[i]

					if (j === 0) {
						CHTable.rows[i] = row.slice(1)
					} else {
						let start = row.slice(0, j)
						let end = row.slice(j + 1)
						CHTable.rows[i] = start.concat(end)
					}
				}

				CHTable.switchToPage(null)

				// console.log(CHTable);
			})

			$('.th_edit_button.add_before').off('click').on('click', (e) => {
				let $e = $(e.currentTarget)
				let j = +$e.attr('data-column-id')

				if (CHTable.columns.length <= j) return

				for (let i = 0; i < CHTable.columns.length; i++) {
					if (i === j) {
						let obj = {
							dir_asc: false,
							dir_desc: false,
							is_taxon: null,
							j: j,
							title: "колонка" + CHTable.columns.length
						}

						if (j === 0) {
							CHTable.columns.unshift(obj)
						} else {
							let start = CHTable.columns.slice(0, j)
							let end = CHTable.columns.slice(j)
							start.push(obj)
							CHTable.columns = start.concat(end)
						}
					} else if (i > j) {
						CHTable.columns[i].j++
					}
				}

				for (let i = 0; i < CHTable.rows.length; i++) {
					let row = CHTable.rows[i]

					let obj = { value: null }

					if (j === 0) {
						row.unshift(obj)
					} else {
						let start = row.slice(0, j)
						let end = row.slice(j)
						start.push(obj)
						CHTable.rows[i] = start.concat(end)
					}
				}

				CHTable.switchToPage(null)

				// console.log(CHTable);
			})

			$('.th_edit_button.change_title').off('click').on('click', (e) => {
				let $e = $(e.currentTarget)
				let j = +$e.attr('data-column-id')

				if (CHTable.columns.length <= j) return

				let column = CHTable.columns[j]

				let alternatives
				if (!!column.is_taxon)
					alternatives = column.gbifCompare && column.gbifCompare.alternatives || []
				else
					alternatives = column.columnsCompare ? column.columnsCompare.map(row => row.target) : []

				CHBox.init(column.title, alternatives, !!column.is_taxon, (name) => {
					if (!name && !column.title || column.title === name) return

					column.title = name

					CHTable.renderHeader()
				})
			})

			$('.is_taxon_checkbox').off('change').on('change', (e) => {
				let $e = $(e.currentTarget)
				let j = +$e.attr('data-column-id')

				if (CHTable.columns.length <= j) return

				CHTable.columns[j].is_taxon = $e.is(":checked") ? 'checked' : null
			})
		},
		setBodyHandlers: () => {
			$('.td_content').off('click').on('click', (e) => {
				let $e = $(e.currentTarget)
				if ($(e.target).closest('.td_content_input').length) return

				let i = $e.attr('data-row-id')
				let j = $e.attr('data-column-id')

				if (CHTable.columns.length <= j) return
				if (CHTable.rows.length <= i) return

				let cell = CHTable.rows[i][j]

				// console.log(i, j);
				// console.log(cell);

				if ($(e.target).closest('.td_content_save.save_all').length) {
					let value = $e.find('input').val()
					CHTable.rows.forEach(row => {
						row[j].value = value
					})
					CHTable.switchToPage(null)
				} else if ($(e.target).closest('.td_content_save').length) {
					cell.value = $e.find('input').val()
					$e.html(`<div class="value">${cell.value}</div>`)
				} else {
					$e.html($('.td_content_editing.sample').clone().removeClass('sample'))
					$e.find('.td_content_editing input')
						.val(!cell.value && cell.value !== 0 ? '' : cell.value)
						.attr('id', `input_${i}${j}`)
						.focus()
				}
			})
		},
		setHandlers: () => {
			$('.ct-pagination-prev').off('click').on('click', () => {
				if (CHTable.page > 0)
					CHTable.switchToPage(CHTable.page - 1)
			})

			$('.ct-pagination-next').off('click').on('click', () => {
				if (CHTable.page < CHTable.pages_n - 1)
					CHTable.switchToPage(CHTable.page + 1)
			})

			$('.ct-pagination-current-input').off('change').on('change', (e) => {
				let page_tmp = +$(e.currentTarget).val() - 1

				if (page_tmp >= 0 && page_tmp < CHTable.pages_n && page_tmp !== CHTable.page) {
					CHTable.switchToPage(page_tmp)
				} else {
					$('.ct-pagination-current-input').val(CHTable.page + 1)
				}
			})
		},

		api_fields: ['matchType', 'confidence', 'scientificName', 'status',
			'rank', 'kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species']
	}

	$('#ch_upload_file_input').off('change').on('change', (e) => {
		let files = document.getElementById('ch_upload_file_input').files
		// console.log(files[0]);

		if (!files.length) return

		$('.ch_status, .ch_loader').removeClass('hidden')
		$('.ch_status_message').html('Обработка...')

		let fd = new FormData

		fd.append('file', files[0])

		customQuery(server + '/checkDataForTableStn', {
			processData: false,
			contentType: false,
			data: fd
		}, (err, res) => {
			console.log('err', err)
			console.log('res', res)

			if (!err) {
				$('.ch_status, .ch_loader').addClass('hidden')

				if (!res.data) return

				CHTable.rows = res.data.rows
				CHTable.columns = res.data.columns

				CHTable.init()
			}

			$(e.currentTarget).val(null)
		}, false)
	})

	$('#download_file').off('click').on('click', () => {
		if (!CHTable.rows.length) {
			$('.ch_loader').addClass('hidden')
			$('.ch_status').removeClass('hidden')
			$('.ch_status_message').html('Нет данных для скачивания.')
			return
		}

		customQuery(server + '/api', {
			data: {
				command: 'getTransformedTableFile',
				object: 'taxon',
				params: JSON.stringify({
					data: {
						rows: CHTable.rows,
						columns: CHTable.columns
					}
				})
			}
		}, (err, res) => {
			console.log('err', err)
			console.log('res', res)

			if (!err) {
				$("body").prepend(`<a class="temporary_download_link" id="${res.linkName}" href="${server + res.path + res.filename}" download="${res.filename}"></a>`)

				let jqElem = $('#' + res.linkName)
				jqElem[0].click()
				jqElem.remove()
			}
		}, false)
	})


	// let server = 'http://127.0.0.1:86';
	let server = 'http://ecotaxonomy.org:443'

	let customQuery = function (host, data, callback, do_auth) {
		$.ajax({
			url: host,
			method: 'POST',
			dataType: 'json',
			xhrFields: { withCredentials: true },
			...data,
			error: function (err) {
				console.error('err', err)

				$('.ch_loader').addClass('hidden')
				$('.ch_status_message').html('Сервер временно недоступен.')

				return callback({ code: -1, type: 'error', message: 'Сервер временно недоступен.', err: err })
			},
			success: function (res) {
				if (!do_auth && res.message === "noAuth") {
					$.ajax({
						url: server + '/api',
						method: 'POST',
						dataType: 'json',
						xhrFields: { withCredentials: true },
						data: {
							command: 'login',
							object: 'User',
							params: JSON.stringify({
								login: 'UNSECURE_API',
								password: '123'
							})
						},
						error: function (err) {
							console.error('error', err)
						},
						success: function (res) {
							console.log('success', res)
							if (res.code) return callback(res)

							return customQuery(host, data, callback, true)
						}
					})
				} else
					callback(null, res)
			}
		})
	}
})