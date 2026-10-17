import type { Language } from '../state/types';

/**
 * The interface's second language.
 *
 * Keys are the English text itself, not invented identifiers: a string that has not been
 * translated yet falls back to the key, which is the English sentence it *is*, so a missing
 * entry reads as English rather than as `results.sort.label` on screen. That keeps the
 * dictionary a list of sentences rather than a second, parallel naming system, and it means
 * the only thing translating a new line requires is adding one line here.
 *
 * `{name}` in a value is filled from the call's variables.
 *
 * What is *not* translated is the demonstration data: stop names, line numbers, carrier names
 * and the text of the fourteen alerts. Those are the timetable talking, not the interface, and
 * a translated station name would be a lie about a real place.
 */
const NL: Record<string, string> = {
  /* ---------------------------------------------------------------- app shell */
  'Skip to main content': 'Ga naar de hoofdinhoud',
  'Main navigation': 'Hoofdnavigatie',
  'Quick navigation': 'Snelle navigatie',
  'All sections': 'Alle onderdelen',
  Home: 'Start',
  'Journey results': 'Reisresultaten',
  'Travel information': 'Reisinformatie',
  'Stations & stops': 'Stations en haltes',
  'Departure boards': 'Vertrektijden',
  Yours: 'Van jou',
  Settings: 'Instellingen',
  Boards: 'Borden',
  Disruptions: 'Storingen',
  'Delays, cancellations and planned works': 'Vertragingen, rituitval en gepland werk',
  Back: 'Terug',

  /* -------------------------------------------------------------- home screen */
  'Plan a journey and browse the network': 'Plan een reis en bekijk het netwerk',
  'Your current search results': 'De resultaten van je huidige zoekopdracht',
  'Stops, facilities and access': 'Haltes, voorzieningen en toegankelijkheid',
  'Departure times per stop': 'Vertrektijden per halte',
  'Plan a journey, check the network, and pick up where you left off.':
    'Plan een reis, bekijk het netwerk en ga verder waar je gebleven was.',
  'Your home screen is empty': 'Je startscherm is leeg',
  'Turn on customising at the foot of the page to add a widget.':
    'Zet onderaan de pagina aanpassen aan om een widget toe te voegen.',
  Customising: 'Aanpassen',
  'Customising home': 'Startscherm aanpassen',
  /*
   * Widget sizes have no visible words: the card is the size. What is left is the corner
   * handle's accessible name, the two tier names the settings screen does not already carry, and
   * the line a trimmed list uses to say how much it left out. `Compact`, `Standard` and `Full`
   * are already in this dictionary for the display settings and are the same words, so they are
   * reused rather than duplicated.
   */
  Tall: 'Hoog',
  'Resize {title}': 'Formaat van {title} aanpassen',
  '{count} more, not shown at this size': '{count} meer, niet getoond op dit formaat',
  'Customise home': 'Startscherm aanpassen',
  'Add widget': 'Widget toevoegen',
  'Add a widget': 'Een widget toevoegen',
  'Reset layout': 'Indeling herstellen',
  'Reset to the default layout': 'Terug naar de standaardindeling',
  'Or press and hold the home screen': 'Of houd het startscherm ingedrukt',
  'Keep holding to customise': 'Blijf vasthouden om aan te passen',
  'Drag to move': 'Sleep om te verplaatsen',
  'Move {title}': 'Verplaats {title}',
  Done: 'Klaar',
  Add: 'Toevoegen',
  Remove: 'Verwijderen',
  'Every widget in the catalogue is already on your home screen.':
    'Elke widget uit de catalogus staat al op je startscherm.',
  '{count} widget available.': '{count} widget beschikbaar.',
  '{count} widgets available.': '{count} widgets beschikbaar.',

  /* ------------------------------------------------------------ planner card */
  /*
   * The two rows say "From" and "To", and nothing else — the card asks one question per row and
   * the words after the colon were the field explaining what a stop is ("From: station, stop or
   * landmark"). Two entries, and the 320px measurement that had already trimmed them once, went
   * with the longer labels.
   */
  From: 'Van',
  To: 'Naar',
  'Where are you leaving from?': 'Waar vertrek je?',
  'Where do you want to go?': 'Waar wil je naartoe?',
  'Reverse origin and destination': 'Vertrek en bestemming omdraaien',
  'Reverse journey': 'Reis omdraaien',
  'Clear the departure stop': 'Vertrekhaltedep wissen',
  'Clear the destination': 'Bestemming wissen',
  Suggestions: 'Suggesties',
  'Use my current location': 'Mijn huidige locatie gebruiken',
  'Finding your location…': 'Je locatie wordt gezocht…',
  'Waiting for a position fix…': 'Wachten op een positiebepaling…',
  'Your street address, planned from the nearest stop.':
    'Je straatadres, gepland vanaf de dichtstbijzijnde halte.',
  'Choose on the map': 'Kies op de kaart',
  'Slide the map until the pin sits on the stop you want.':
    'Schuif de kaart tot de pin op de halte staat die je wilt.',
  'No stops match “{query}”': 'Geen haltes voor “{query}”',
  'Search by station, stop or landmark name, or use your location.':
    'Zoek op station, halte of herkenningspunt, of gebruik je locatie.',
  'Plan journey': 'Reis plannen',
  'Choose a stop on the map': 'Kies een halte op de kaart',
  'Centre the network': 'Netwerk centreren',
  'Zoom in': 'Inzoomen',
  'Zoom out': 'Uitzoomen',
  'Search for a stop': 'Zoek een halte',
  'Clear the search': 'Zoekopdracht wissen',
  'Select this stop': 'Deze halte kiezen',
  'No stop is placed on the map.': 'Er staat geen halte op de kaart.',
  'Network map. Drag to move the map; the stop nearest the pin is chosen.':
    'Netwerkkaart. Sleep om de kaart te verplaatsen; de halte het dichtst bij de pin wordt gekozen.',

  /* --------------------------------------------------------- departure board */
  'Departure times for one stop at a time.': 'Vertrektijden per halte.',
  'Refresh departures': 'Vertrektijden vernieuwen',
  Stop: 'Halte',
  'Search a station or stop': 'Zoek een station of halte',
  'Only a station or stop has a departure board.':
    'Alleen een station of halte heeft een vertrektijdenbord.',
  'Pick a stop': 'Kies een halte',
  'A board shows one stop at a time. Choose a station or stop above — the one you choose is kept for your next visit.':
    'Een bord toont één halte tegelijk. Kies hierboven een station of halte — je keuze blijft bewaard voor je volgende bezoek.',
  'Show {count} more': 'Nog {count} tonen',
  'Show fewer': 'Minder tonen',
  'No board here': 'Hier is geen bord',
  '{stop} is a walking destination: no bus, tram, metro, train or ferry calls there, so there are no departures to list. Pick a station or stop above.':
    '{stop} is een wandelbestemming: er komt geen bus, tram, metro, trein of veerdienst langs, dus er zijn geen vertrektijden. Kies hierboven een station of halte.',
  'Stop page': 'Haltepagina',
  /* The short name a stop card's own foot uses for "open this stop's departure board". */
  Board: 'Bord',
  'Next departures': 'Volgende vertrekkingen',
  'Next departures · from {time}': 'Volgende vertrekkingen · vanaf {time}',
  /*
   * The home screen's next-departures card is tied to **one** station, chosen once when the card
   * has none: the invitation, the button that opens the choice, the dialog around it, and the
   * line that names the station afterwards.
   */
  'Pick one station for this card. It keeps showing it, so a glance never has to search.':
    'Kies één halte voor deze kaart. Die blijft staan, zodat een snelle blik nooit hoeft te zoeken.',
  /* The untied card's field. Hidden on screen — the sentence above it says what it is for — but it
     is the field's accessible name, and the × beside it says "Clear …" with the same words. */
  'Station for this card': 'Halte voor deze kaart',
  '{stop} · from {time}': '{stop} · vanaf {time}',
  'auto-refresh every {seconds}s': 'automatisch verversen elke {seconds} s',
  '{count} delay in this window · ': '{count} vertraging in dit venster · ',
  '{count} delays in this window · ': '{count} vertragingen in dit venster · ',
  'Plan from here': 'Vanaf hier plannen',
  'Plan to here': 'Naar hier plannen',
  'Plan a journey first to use this shortcut':
    'Plan eerst een reis om deze snelkoppeling te gebruiken',

  /* ------------------------------------------------------------ stops screen */
  Search: 'Zoeken',
  'Stop type': 'Soort halte',
  'All types': 'Alle soorten',
  Sort: 'Sorteren',
  '{shown} of {total} stops': '{shown} van {total} haltes',
  'No stops match these filters': 'Geen haltes voor deze filters',
  'Clear the filters to see the whole network again.':
    'Wis de filters om het hele netwerk weer te zien.',
  'Clear filters': 'Filters wissen',
  Pinned: 'Vastgezet',
  Pin: 'Vastzetten',

  /* -------------------------------------------------------------- stop page */
  'Position on the map': 'Positie op de kaart',
  'Open map': 'Kaart openen',
  'Lines calling at this stop': 'Lijnen die deze halte aandoen',
  Facilities: 'Voorzieningen',
  'Nearby stops': 'Haltes in de buurt',

  /* ------------------------------------------------------------ preferences */
  'Travel preferences': 'Reisvoorkeuren',
  'Reset to defaults': 'Terug naar standaard',
  'Apply and view results': 'Toepassen en resultaten bekijken',
  'Effect on your current search': 'Gevolg voor je huidige zoekopdracht',
  'All preferences': 'Alle voorkeuren',
  'No active search to preview': 'Geen actieve zoekopdracht om te tonen',
  'Plan a journey to preview these preferences.':
    'Plan een reis om deze voorkeuren te bekijken.',

  /* --------------------------------------------------------------- settings */
  'Appearance, defaults and locally stored data. Every change applies immediately and is stored in this browser.':
    'Weergave, standaardwaarden en lokaal opgeslagen gegevens. Elke wijziging geldt meteen en wordt in deze browser bewaard.',
  Appearance: 'Weergave',
  'Light, dark or the device setting.': 'Licht, donker of de instelling van je apparaat.',
  System: 'Systeem',
  Light: 'Licht',
  Dark: 'Donker',
  Language: 'Taal',
  'The language of the interface.': 'De taal van de interface.',
  Display: 'Weergave',
  'Clock format': 'Kloknotatie',
  'Times across the app render as {sample}': 'Tijden in de app zien er zo uit: {sample}',
  '24-hour': '24-uurs',
  '12-hour': '12-uurs',
  'Date format': 'Datumnotatie',
  'Dates render as {sample}': 'Datums zien er zo uit: {sample}',
  Descriptive: 'Beschrijvend',
  Density: 'Dichtheid',
  'Compact tightens spacing while keeping the 4px rhythm and 44px touch targets.':
    'Compact maakt de tussenruimte kleiner met behoud van het 4px-ritme en aanraakvlakken van 44px.',
  Comfortable: 'Ruim',
  Compact: 'Compact',
  'Raised contrast': 'Verhoogd contrast',
  'Strengthens ink and hairline borders for readability.':
    'Versterkt tekst en haarlijnen voor betere leesbaarheid.',
  'Reduce motion': 'Minder beweging',
  'Turns off the spring press and hover transitions.':
    'Zet de veer-effecten bij indrukken en aanwijzen uit.',
  Location: 'Locatie',
  'Use my location': 'Mijn locatie gebruiken',
  'Fills in the nearest stop when you plan a journey. The browser asks on your first visit.':
    'Vult de dichtstbijzijnde halte in als je een reis plant. De browser vraagt het bij je eerste bezoek.',
  'Planner and board defaults': 'Standaardwaarden voor planner en bord',
  'Default search type': 'Standaard zoekwijze',
  'Which option the planner starts with.': 'Waarmee de planner begint.',
  'Depart at': 'Vertrek om',
  'Arrive by': 'Aankomst voor',
  'Default origin': 'Standaard vertrekpunt',
  'Prefills the From field when you open the planner. Clear it to start empty.':
    'Vult het veld Van vast in als je de planner opent. Maak het leeg om zonder te beginnen.',
  Off: 'Uit',
  '{seconds} sec': '{seconds} sec',
  'Check the board': 'Bekijk het bord',
  'Locally stored data': 'Lokaal opgeslagen gegevens',
  'Pinned stops': 'Vastgezette haltes',
  'Favourited journeys': 'Favoriete reizen',
  'Recent searches': 'Recente zoekopdrachten',
  Preferences: 'Voorkeuren',
  'Storage location': 'Opslaglocatie',
  'This browser (localStorage)': 'Deze browser (localStorage)',
  'Remove all stored data': 'Alle gegevens verwijderen',
  'Browse stops': 'Haltes bekijken',
  'Manage on the home screen': 'Beheren op het startscherm',
  'Preview with current settings': 'Voorbeeld met huidige instellingen',
  'A quick look at how times, dates, density and the accent colours render with the settings you have chosen.':
    'Een korte blik op hoe tijden, datums, dichtheid en de accentkleuren eruitzien met jouw instellingen.',
  Time: 'Tijd',
  Duration: 'Duur',
  Date: 'Datum',
  Relative: 'Relatief',
  Time2: 'Tijd',
  Highlighted: 'Gemarkeerd',
  /*
   * 'Positive status' and 'Delay' were only ever read by the settings preview, where the two
   * pills sat side by side and read as the same thing (reported). The preview keeps the two
   * shapes it is actually about — Highlighted and Neutral — and the entries went with them.
   * A disruption of type `delay` is named by `DISRUPTION_TYPE_LABELS` in the data, not here.
   */
  Neutral: 'Neutraal',
  /*
   * The palette. A colour's name is a name (it is the same word in both languages, as the brand
   * tokens are); what it *does* is a sentence, so each one is translated.
   */
  'Accent colours': 'Accentkleuren',
  'Signature coral': 'Signaalkoraal',
  'Where you are: the current section in the navigation, the alert count and the focus ring.':
    'Waar je bent: het huidige onderdeel in de navigatie, het aantal storingen en de focusring.',
  Butter: 'Boter',
  'Highlights, tags and the notice banner.': 'Markeringen, labels en de meldingsbalk.',
  Sage: 'Salie',
  'Cleared and allowed states, and the water on the map.':
    'Vrijgegeven en toegestane staten, en het water op de kaart.',
  'Coral tint': 'Koraaltint',
  'Delays, disruptions, the bus badge and a field that needs fixing.':
    'Vertragingen, storingen, het buslabel en een veld dat nog niet klopt.',
  Obsidian: 'Obsidiaan',
  'The navigation bar, the primary action and the dark tier.':
    'De navigatiebalk, de hoofdactie en de donkere laag.',
  'Running green': 'Rijdt-groen',
  'The live dot on a service that is running.': 'De live-stip bij een dienst die rijdt.',
  /* The settings with no sample of their own, named with the value in force. */
  'Currently in effect': 'Nu actief',
  '{appearance} — from your device': '{appearance} — van je apparaat',
  Contrast: 'Contrast',
  Raised: 'Verhoogd',
  Standard: 'Standaard',
  Motion: 'Beweging',
  Reduced: 'Verminderd',
  Full: 'Volledig',
  'Settings are presentation-only: they never change the timetable or your journeys.':
    'Instellingen gaan alleen over de weergave: ze veranderen nooit de dienstregeling of je reizen.',
  'About OVVO': 'Over OVVO',
  'Design system': 'Ontwerpsysteem',
  'Stops': 'Haltes',
  'Services': 'Diensten',
  'Alerts': 'Storingen',
  'Built with': 'Gemaakt met',
  'Back to the planner': 'Terug naar de planner',
  'Browse the {count} stops': 'Bekijk de {count} haltes',
  'Remove all locally stored data?': 'Alle lokaal opgeslagen gegevens verwijderen?',
  'Preferences, pins, favourited journeys, recent searches and location permission are deleted from this browser. Settings return to their defaults.':
    'Voorkeuren, vastgezette haltes, favoriete reizen, recente zoekopdrachten en locatietoestemming worden uit deze browser verwijderd. Instellingen gaan terug naar de standaard.',
  'Remove everything': 'Alles verwijderen',
  Cancel: 'Annuleren',

  /* ------------------------------------------------------------- not found */
  'Page not found': 'Pagina niet gevonden',
  'This page does not exist.': 'Deze pagina bestaat niet.',
  'Nothing here': 'Hier is niets',
  'Network map': 'Netwerkkaart',

  /* ---------------------------------------------------------------- toasts */
  'Origin and destination must be different stops':
    'Vertrek en bestemming moeten verschillende haltes zijn',
  Unpinned: 'Niet meer vastgezet',
  'All locally stored data has been removed': 'Alle lokaal opgeslagen gegevens zijn verwijderd',
  'Location is unavailable': 'Locatie is niet beschikbaar',
  'Location access was not granted.': 'Locatietoegang is niet gegeven.',
  'This browser cannot provide a location.': 'Deze browser kan geen locatie geven.',
  'No stop is close enough to your position.': 'Geen halte dicht genoeg bij je positie.',
  'Location is unavailable right now': 'Locatie is nu niet beschikbaar',

  /* --------------------------------------------------------------- results */
  'No search has been run in this browser yet.':
    'In deze browser is nog geen zoekopdracht gedaan.',
  'Nothing to show yet': 'Nog niets te tonen',
  'Plan a journey first — the results of your search will appear here and survive a refresh.':
    'Plan eerst een reis — de resultaten verschijnen hier en blijven na een vernieuwing staan.',
  'Open the journey planner': 'Open de reisplanner',
  'Start:': 'Vertrek:',
  'End:': 'Aankomst:',
  'Leave:': 'Vertrek:',
  'Arrive:': 'Aankomst:',
  Now: 'Nu',
  Options: 'Opties',
  '{count} changed from the defaults': '{count} gewijzigd ten opzichte van de standaard',
  'Filter by mode': 'Filter op vervoermiddel',
  'Clear mode filter': 'Vervoermiddelfilter wissen',
  'Direct journeys only': 'Alleen directe reizen',
  'With delays': 'Met vertraging',
  'Hide cancelled': 'Ritten die niet rijden verbergen',
  Carriers: 'Vervoerders',
  'Reset all filters': 'Alle filters wissen',
  'Alerts affect this search': 'Storingen beïnvloeden deze zoekopdracht',
  '— view details': '— bekijk details',
  'Earlier options': 'Eerdere opties',
  'Later options': 'Latere opties',
  'Reset to {time}': 'Terug naar {time}',
  Best: 'Beste',
  Fastest: 'Snelste',
  'Fewest transfers': 'Minste overstappen',
  'Least walking': 'Minste lopen',
  Cheapest: 'Goedkoopste',
  'Latest departure': 'Laatste vertrek',
  '{shown} of {total} shown': '{shown} van {total} getoond',
  'No journeys match your settings': 'Geen reizen passen bij je instellingen',
  '{total} journeys were planned for this search, but these settings removed all of them.':
    '{total} reizen zijn gepland voor deze zoekopdracht, maar deze instellingen hebben ze allemaal weggefilterd.',
  'No journey matches this search with these settings.':
    'Geen reis past bij deze zoekopdracht met deze instellingen.',
  'Switch one of these back on and the list fills up again':
    'Zet een van deze weer aan en de lijst loopt weer vol',
  'Nothing helps for this search — try another time or another pair of stops.':
    'Niets helpt voor deze zoekopdracht — probeer een ander tijdstip of een ander tweetal haltes.',
  'Reset result filters': 'Resultaatfilters wissen',
  'Adjust travel preferences': 'Reisvoorkeuren aanpassen',
  'Try one hour later': 'Probeer een uur later',
  'About these results': 'Over deze resultaten',
  'Fares, occupancy, delays and platforms are indicative.':
    'Prijzen, drukte, vertragingen en sporen zijn indicatief.',
  'Back to planner': 'Terug naar de planner',
  'Departure stop': 'Vertrekhalte',
  'Arrival stop': 'Aankomsthalte',
  'How do you reach the first stop?': 'Hoe kom je bij de eerste halte?',
  'How do you leave the last stop?': 'Hoe verlaat je de laatste halte?',
  'The planner will not begin your journey with a bicycle leg unless you ask for one.':
    'De planner begint je reis niet met een fietsstuk, tenzij je daarom vraagt.',
  'The planner will not end your journey with a bicycle leg unless you ask for one.':
    'De planner eindigt je reis niet met een fietsstuk, tenzij je daarom vraagt.',
  'Date and time': 'Datum en tijd',
  'By default a journey is planned from today, right now.':
    'Standaard wordt een reis gepland vanaf vandaag, nu meteen.',
  Hour: 'Uur',
  Minutes: 'Minuten',
  'Depart at or arrive by': 'Vertrek om of aankomst voor',
  'Today, now': 'Vandaag, nu',

  /* ------------------------------------------------------------ journey card */
  'Legs': 'Etappes',
  'Journey legs': 'Etappes van de reis',
  Direct: 'Direct',
  'Delay +{minutes} min': 'Vertraging +{minutes} min',
  Cancelled: 'Rit vervalt',
  'Walking only': 'Alleen lopen',
  'No transfers': 'Geen overstappen',
  '{count} transfer': '{count} overstap',
  '{count} transfers': '{count} overstappen',
  '{count} minute walk': '{count} minuten lopen',
  'Step-free': 'Zonder trappen',
  'Bicycle allowed': 'Fiets mee toegestaan',
  Occupancy: 'Drukte',
  'Expected quiet': 'Naar verwachting rustig',
  'Expected fairly busy': 'Naar verwachting redelijk druk',
  'Expected busy': 'Naar verwachting druk',
  'Journey details': 'Reisdetails',
  'Show on map': 'Op de kaart tonen',
  Favourite: 'Favoriet maken',
  Favourited: 'Favoriet',

  /* ------------------------------------------------------- widget catalogue */
  Plan: 'Plannen',
  About: 'Over',
  'Plan a journey': 'Een reis plannen',
  'Where are you going? Departing today, right now.':
    'Waar ga je naartoe? Vertrek vandaag, nu meteen.',
  'Every route, filtered by mode.': 'Elke route, gefilterd op vervoermiddel.',
  'Showing your journey': 'Je reis op de kaart',
  'Showing this stop': 'Deze halte op de kaart',
  'Keep this search': 'Deze zoekopdracht bewaren',
  Kept: 'Bewaard',
  'This search is in your recent searches.': 'Deze zoekopdracht staat bij je recente zoekopdrachten.',
  'Searching does not save anything — keep it here to find it again.':
    'Zoeken bewaart niets — bewaar het hier om het terug te vinden.',
  'The journeys you saved, one tap to repeat.':
    'De reizen die je opsloeg, met één tik opnieuw.',
  'Your last searches in this browser.': 'Je laatste zoekopdrachten in deze browser.',
  'The next departures from your default stop.':
    'De volgende vertrekkingen vanaf je standaardhalte.',
  'Alerts right now': 'Storingen nu',
  'How many alerts are active, and the top three.':
    'Hoeveel storingen er zijn, en de drie belangrijkste.',
  'Alerts at your pinned stops': 'Storingen bij je vastgezette haltes',
  'Only the alerts that touch stops you pinned.':
    'Alleen storingen die je vastgezette haltes raken.',
  'Quick actions': 'Snelle acties',
  'Jump straight to boards, stops, alerts and settings.':
    'Direct naar borden, haltes, storingen en instellingen.',
  'Right now': 'Nu',
  'The current time and a one-tap re-run of your search from now.':
    'De huidige tijd en je zoekopdracht opnieuw vanaf nu, met één tik.',
  'Your travel preferences': 'Je reisvoorkeuren',
  'The modes and limits shaping every search.':
    'De vervoermiddelen en limieten die elke zoekopdracht bepalen.',
  'The stops you pinned, ready as an origin.':
    'De haltes die je vastzette, klaar als vertrekpunt.',
  'Find a stop': 'Een halte zoeken',
  'Search every stop from here.': 'Zoek hier in alle haltes.',
  'Services per mode': 'Diensten per vervoermiddel',
  'How many services each mode has.': 'Hoeveel diensten elk vervoermiddel heeft.',
  'Lines at the busiest stop': 'Lijnen bij de drukste halte',
  'The services calling at the busiest stop.': 'De diensten die de drukste halte aandoen.',
  Operators: 'Vervoerders',
  'The operators and the modes they run.': 'De vervoerders en de vervoermiddelen die ze runnen.',
  'Stored on this device': 'Opgeslagen op dit apparaat',
  'What this browser keeps, and a way to clear it.':
    'Wat deze browser bewaart, en hoe je het wist.',
  'Network at a glance': 'Netwerk in het kort',
  'How big the network is.': 'Hoe groot het netwerk is.',
  'How OVVO works.': 'Hoe OVVO werkt.',

  /* ---------------------------------------------------------- stops screen */
  'Every stop has its own page with facilities, access information, a departure board and alerts.':
    'Elke halte heeft een eigen pagina met voorzieningen, toegankelijkheid, vertrektijden en storingen.',
  'Across the network': 'In het hele netwerk',
  'With departure board': 'Met vertrektijdenbord',
  'Everything but walking landmarks': 'Alles behalve wandelbestemmingen',
  'Sit at the top of the stop lists': 'Staan bovenaan de haltelijsten',
  Regions: "Regio's",
  'Where the stops are': 'Waar de haltes liggen',
  'Search stops': 'Haltes zoeken',
  'Name, city, code or region': 'Naam, plaats, code of regio',
  Region: 'Regio',
  'All regions': "Alle regio's",
  City: 'Plaats',
  'All cities': 'Alle plaatsen',
  'Sort by': 'Sorteren op',
  Name: 'Naam',
  Connections: 'Verbindingen',
  'Modes at the stop': 'Vervoermiddelen bij de halte',
  'Favourites only': 'Alleen favorieten',
  /*
   * Nearest-first, and the honesty about where "nearest" came from. The device's own fix and the
   * network's estimate of the address the request came from are not the same claim, so each has
   * its own sentence and neither pretends to be the other.
   */
  Nearest: 'Dichtstbij',
  'Nearest first, from your device location.': 'Dichtstbijzijnde eerst, vanaf je apparaatlocatie.',
  /* The stop picker's own four sections and the line under the closest-stops one. */
  'Closest stops': 'Dichtstbijzijnde haltes',
  'Popular stops': 'Populaire haltes',
  'From your device location.': 'Vanaf je apparaatlocatie.',
  'From an approximate IP location — it can be off by a lot.':
    'Vanaf een geschatte IP-locatie — die kan er flink naast zitten.',
  'Turn on location to see what is closest.': 'Zet locatie aan om te zien wat het dichtstbij is.',
  'Nearest first, from an approximate IP location — it can be off by a lot.':
    'Dichtstbijzijnde eerst, vanaf een benaderde IP-locatie — die kan er flink naast zitten.',
  'Sorted by {sort}. Turn on location for nearest-first.':
    'Gesorteerd op {sort}. Zet locatie aan voor dichtstbijzijnde eerst.',
  'Is this where you leave from, or where you are going?':
    'Is dit waar je vertrekt, of waar je naartoe gaat?',
  'Plan with {stop}': 'Plannen met {stop}',
  /* `Plan` and `Show {count} more` already exist as entries higher up; `More` is new. */
  More: 'Meer',
  /* The board's row of favourited locations — the stops the traveller has pinned. */
  Favourites: 'Favorieten',
  'Stairs only': 'Alleen trappen',
  Departures: 'Vertrektijden',
  'Plan a journey first, then use these shortcuts':
    'Plan eerst een reis en gebruik dan deze snelkoppelingen',
  'Origin updated': 'Vertrekpunt bijgewerkt',
  'Destination updated': 'Bestemming bijgewerkt',
  'Use the navigation for the planner, results, stops and departure boards.':
    'Gebruik de navigatie voor de planner, resultaten, haltes en vertrektijden.',

  /* ------------------------------------------------------ settings, in full */
  'Allowed for this browser — you can turn it off again here at any time.':
    'Toegestaan voor deze browser — je kunt het hier altijd weer uitzetten.',
  'Not allowed. Switch it on here whenever you want it.':
    'Niet toegestaan. Zet het hier aan wanneer je wilt.',
  'No answer yet — the question appears the first time you open the app.':
    'Nog geen antwoord — de vraag verschijnt als je de app voor het eerst opent.',
  '{pins}, {journeys} and {searches} will be deleted. The app then starts fresh.':
    '{pins}, {journeys} en {searches} worden verwijderd. De app begint daarna opnieuw.',
  '{favourites}, {board}, {journeys} and {searches} will be deleted. The app then starts fresh.':
    '{favourites}, {board}, {journeys} en {searches} worden verwijderd. De app begint daarna opnieuw.',
  'Preferences, favourites, board pins, favourited journeys, recent searches and location permission are deleted from this browser. Settings return to their defaults.':
    'Voorkeuren, favorieten, vastgezette borden, favoriete reizen, recente zoekopdrachten en locatietoestemming worden uit deze browser verwijderd. Instellingen keren terug naar de standaardwaarden.',
  'pinned stops': 'vastgezette haltes',
  /* ------------------------------------------------- heart (favourite) vs pin (board) */
  /*
   * The two ideas, each in its own words: a **heart** marks a stop the traveller uses (it leads
   * the lists and the search), a **pin** puts that stop's board on the departure screen. They
   * used to share the word "pinned" and the same glyph; these lines are where that stops.
   */
  'Add {stop} to favourites': '{stop} aan favorieten toevoegen',
  'Remove {stop} from favourites': '{stop} uit favorieten verwijderen',
  'Pin {stop} to the departure board': '{stop} op het vertrektijdenbord zetten',
  'Unpin {stop} from the departure board': '{stop} van het vertrektijdenbord halen',
  'Favourite stops': 'Favoriete haltes',
  'favourite stops': 'favoriete haltes',
  'stops pinned to the board': 'haltes vastgezet op het bord',
  'Every stop you pin, one board each.': 'Elke halte die je vastzet, een eigen bord.',
  'Add a stop to the board': 'Halte aan het bord toevoegen',
  '{count} stop pinned to the board': '{count} halte vastgezet op het bord',
  '{count} stops pinned to the board': '{count} haltes vastgezet op het bord',
  'Choose stops': 'Haltes kiezen',
  'No stops pinned to the board': 'Geen haltes vastgezet op het bord',
  'Showing your default origin': 'Je standaardvertrekpunt wordt getoond',
  'Favourite stops lead your stop lists.': 'Favoriete haltes staan bovenaan je haltelijsten.',
  'Names for your favourites': 'Namen voor je favorieten',
  'Give a stop you have favourited your own name — Work, Home, Closest bus stop. The name is used everywhere the stop appears, and this screen is the only place to change it.':
    'Geef een favoriete halte je eigen naam — Werk, Thuis, Dichtstbijzijnde bushokje. De naam wordt overal gebruikt waar de halte verschijnt, en dit scherm is de enige plek om hem te wijzigen.',
  'For example: Work': 'Bijvoorbeeld: Werk',
  'Shown as {name}': 'Wordt getoond als {name}',
  'Use the official name': 'Gebruik de officiële naam',
  'Heart a stop first — its name appears here once it is a favourite.':
    'Markeer eerst een halte met een hart — dan verschijnt de naam hier.',
  'Pinned stops have their board on the departure board page.':
    'Vastgezette haltes hebben hun bord op de vertrektijdenpagina.',
  'Pin a stop and its departures appear here. You can pin several at once — they are the boards this page shows, not your favourites.':
    'Zet een halte vast en de vertrektijden verschijnen hier. Je kunt er meerdere tegelijk vastzetten — dat zijn de borden op deze pagina, niet je favorieten.',
  'Stops on the departure board': 'Haltes op het vertrektijdenbord',
  'Pin the stops whose boards you want here. A heart is a favourite: a stop you like, which leads your lists but does not add a board.':
    'Zet de haltes vast waarvan je de borden hier wilt. Een hart is een favoriet: een halte die je leuk vindt, die bovenaan je lijsten staat maar geen bord toevoegt.',
  'Show {count} board': 'Toon {count} bord',
  'Show {count} boards': 'Toon {count} borden',
  'No stop matches that search.': 'Geen halte gevonden voor die zoekopdracht.',
  'Affecting my favourites': 'Die mijn favorieten raken',
  'Alerts at your favourite stops': 'Storingen bij je favoriete haltes',
  'Heart a stop and any alert affecting it shows up here.':
    'Markeer een halte met een hart en elke storing die haar raakt verschijnt hier.',
  'No alerts affect your favourite stops right now.':
    'Geen storingen bij je favoriete haltes op dit moment.',
  'Heart a stop from its page and it is listed here for one-tap planning.':
    'Markeer een halte op haar pagina met een hart en ze staat hier voor plannen met één tik.',
  'The stops you hearted, ready as an origin.': 'De haltes die je een hart gaf, klaar als vertrekpunt.',
  'Only the alerts that touch stops you hearted.': 'Alleen storingen bij haltes die je een hart gaf.',
  'favourited journeys': 'favoriete reizen',
  'recent searches': 'recente zoekopdrachten',
  '5 sec': '5 sec',
  '60 sec': '60 sec',
  /* --------------------------------------------------- widget bodies + modes */
  'Map route filter': 'Filter op route',
  'All routes': 'Alle routes',
  '{mode} routes only': 'alleen {mode}',
  'Network map: {scope}, {count} stops': 'Netwerkkaart: {scope}, {count} haltes',
  'Nothing favourited yet.': 'Nog geen favorieten.',
  'Busiest sample stops': 'Drukste voorbeelhaltes',
  'Busiest sample stop: {stop}': 'Drukste voorbeeldhalte: {stop}',
  'Nothing kept yet — keep a search from its results to put it here.':
    'Nog niets bewaard — bewaar een zoekopdracht vanaf de resultaten om die hier te zetten.',
  'Change travel preferences': 'Reisvoorkeuren aanpassen',
  'Re-run my search from now': 'Mijn zoekopdracht opnieuw vanaf nu',
  'No default origin set — pick one in Settings.':
    'Geen standaard vertrekpunt — kies er een bij Instellingen.',
  'Default origin: {stop}': 'Standaard vertrekpunt: {stop}',
  Walking: 'Lopen',
  Biking: 'Fietsen',
  Train: 'Trein',
  Bus: 'Bus',
  Tram: 'Tram',
  Metro: 'Metro',
  Ferry: 'Veerboot',
  Station: 'Station',
  Airport: 'Luchthaven',
  'Metro stop': 'Metrohalte',
  'Tram stop': 'Tramhalte',
  'Bus stop': 'Bushalte',
  'Ferry stop': 'Veerhalte',
  Landmark: 'Herkenningspunt',

  /* --------------------------------------------------------------- journeys */
  Cycle: 'Fietsen',
  Walk: 'Lopen',
  Service: 'Dienst',
  'On time': 'Op tijd',
  Platform: 'Spoor',
  'Arrival platform': 'Aankomstspoor',
  'Platform {platform}': 'Spoor {platform}',
  'Direction {headsign}': 'Richting {headsign}',
  '{count} intermediate stop': '{count} tussenhalte',
  '{count} intermediate stops': '{count} tussenhalten',
  'No intermediate stops on this service.': 'Geen tussenhalten op deze rit.',
  'Transfer · {duration} at {stop}': 'Overstap · {duration} bij {stop}',
  'Transfer via walk to {stop}': 'Overstap met een stuk lopen naar {stop}',
  'Step-free transfer': 'Overstap zonder trappen',
  'Staff assistance available': 'Personeel kan helpen',
  Bicycle: 'Fiets',
  'Walk to, from and between stops.': 'Lopen naar, van en tussen haltes.',
  'Cycle short access and egress legs where a marked bicycle path exists.':
    'Fiets korte stukken naar en van de halte waar een fietspad ligt.',

  /* --------------------------------------------------- preference summary */
  'Modes: {list}': 'Vervoermiddelen: {list}',
  'No transport modes selected': 'Geen vervoermiddelen gekozen',
  'Walking turned off': 'Lopen uitgezet',
  'No walking limit': 'Geen looplimiet',
  'Walking up to {minutes} min': 'Maximaal {minutes} min lopen',
  'Max {count} transfer': 'Maximaal {count} overstap',
  'Max {count} transfers': 'Maximaal {count} overstappen',
  'Unlimited transfers': 'Onbeperkt overstappen',
  'Prefers fewer transfers': 'Liever minder overstappen',
  'Prefers less walking': 'Liever minder lopen',

  'Pin {stop}': 'Zet {stop} vast',
  'Unpin {stop}': 'Zet {stop} los',
  '{count} alert affects {stop}': '{count} storing raakt {stop}',
  '{count} alerts affect {stop}': '{count} storingen raken {stop}',
};

const DICTIONARIES: Record<Language, Record<string, string>> = {
  en: {},
  nl: NL,
};

/** Every language the interface can be written in. */
export const LANGUAGES: { value: Language; label: string; english: string }[] = [
  { value: 'en', label: 'English', english: 'English' },
  { value: 'nl', label: 'Nederlands', english: 'Dutch' },
];

/**
 * The one text lookup. `key` is the English text; `vars` fills `{name}` placeholders in
 * whichever language wins. A missing translation returns the key, so English is never lost.
 */
export function translate(
  language: Language,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const table = DICTIONARIES[language];
  let out = (table && table[key]) || key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      out = out.split(`{${name}}`).join(String(value));
    }
  }
  return out;
}

/** Which of the two languages a value is, without trusting stored data. */
export function asLanguage(value: unknown): Language {
  return value === 'nl' ? 'nl' : 'en';
}

/** The BCP-47 tag for the language, for `Intl` and the document's own `lang`. */
export const LOCALE_TAG: Record<Language, string> = { en: 'en-GB', nl: 'nl-NL' };
