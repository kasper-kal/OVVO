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
  /* ---------------------------------------------------------------- connection */
  "You're offline": 'Je bent offline',
  'OVVO still works — your journeys, boards and saved stops are all here.':
    'OVVO blijft werken — je reizen, borden en bewaarde haltes staan er allemaal.',
  'Departure times are not live.': 'Vertrektijden zijn niet live.',
  'They come from the timetable until the connection is back.':
    'Ze komen uit de dienstregeling tot je weer online bent.',
  'Back online — live times resume.': 'Weer online — live tijden hervatten.',
  'Not live': 'Niet live',
  'Scheduled times, not live updates.': 'Geplande tijden, geen live updates.',
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
  'Tap Edit at the top to add a widget.':
    'Tik bovenaan op Wijzig om een widget toe te voegen.',
  Edit: 'Wijzig',
  Customising: 'Aanpassen',
  'Customising home': 'Startscherm aanpassen',
  /*
   * There are no widget sizes to name any more: the card is the width its widget declares and as
   * tall as its content. What is left of that vocabulary is the line a capped list uses to say how
   * much it left out, because the cards still cap their rows at a fixed number.
   */
  '{count} more, not shown at this size': '{count} meer, niet getoond op dit formaat',
  'Add widget': 'Widget toevoegen',
  'Add a widget': 'Een widget toevoegen',
  'Reset layout': 'Indeling herstellen',
  'Layout reset': 'Indeling hersteld',
  'Home layout': 'Indeling van het startscherm',
  'Reset to the default layout': 'Terug naar de standaardindeling',
  'Or press and hold the home screen': 'Of houd het startscherm ingedrukt',
  'Keep holding to customise': 'Blijf vasthouden om aan te passen',
  'Move {title}': 'Verplaats {title}',
  'Put it back': 'Zet terug',
  'Move undone': 'Verplaatsing teruggedraaid',
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
  'Search by station, stop, street address or landmark, or use your location.':
    'Zoek op station, halte, straatnaam of herkenningspunt, of gebruik je locatie.',
  'Looking for that address…': 'Dat adres wordt gezocht…',
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
  /* The Colours card's palette picker — a different question from `Appearance` above, and the
     hint is the sentence that keeps the two from being confused for one another. */
  'Colours for': 'Kleuren voor',
  'This only picks which palette you are editing. It does not change the app’s appearance — use Appearance for that.':
    'Dit kiest alleen welke kleuren je bewerkt. Het verandert de weergave van de app niet — gebruik daarvoor Weergave.',
  'The app is {appearance} right now, so you will see these colours when it is {mode}.':
    'De app is nu {appearance}, dus je ziet deze kleuren als hij {mode} is.',
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
  /* The widget catalogue after the widget audit (`WIDGET-AUDIT.md`): the merged card, the
     reworked alerts and re-run cards, and the two trims. */
  'Your journeys': 'Jouw reizen',
  'The journeys you saved and the searches you kept, ready to run again.':
    'De reizen die je bewaarde en de zoekopdrachten die je hield, klaar om opnieuw te gebruiken.',
  'Saved journeys': 'Bewaarde reizen',
  Repeat: 'Herhalen',
  'Heart a result on the results screen, or save the search from the bar above the list.':
    'Hart een resultaat op het resultaatscherm, of bewaar de zoekopdracht in de balk boven de lijst.',
  'It disappears from this widget; the search itself is untouched.':
    'Het verdwijnt uit dit blok; de zoekopdracht zelf blijft ongewijzigd.',
  'Unfavourite this journey?': 'Deze reis uit favorieten halen?',
  'Yes, unfavourite it': 'Ja, uit favorieten halen',
  'Delete all saved searches': 'Alle bewaarde zoekopdrachten verwijderen',
  'Delete all saved searches?': 'Alle bewaarde zoekopdrachten verwijderen?',
  '{count} stored in this browser': '{count} opgeslagen in deze browser',
  '{count} saved searches will be removed.': '{count} bewaarde zoekopdrachten worden verwijderd.',
  '1 saved search will be removed.': '1 bewaarde zoekopdracht wordt verwijderd.',
  'Alerts on your journeys': 'Storingen op jouw reizen',
  'Only the alerts that touch a journey you saved.': 'Alleen de storingen die een reis raken die je bewaarde.',
  'Heart a journey and any alert that touches it shows up here.':
    'Hart een reis en elke storing die hem raakt verschijnt hier.',
  'A saved journey is one result on the results screen, with its own times.':
    'Een bewaarde reis is één resultaat op het resultaatscherm, met zijn eigen tijden.',
  'No alerts touch the journeys you kept — all {count} are running as planned.':
    'Geen storingen raken de reizen die je bewaarde — alle {count} rijden volgens plan.',
  'All alerts': 'Alle storingen',
  'Re-run from now': 'Opnieuw vanaf nu',
  'Run the search you are looking at again, starting at this minute.':
    'Voer de zoekopdracht die je ziet opnieuw uit, vanaf deze minuut.',
  '{from} to {to}, starting at this minute.': '{from} naar {to}, vanaf deze minuut.',
  'Nothing to re-run yet — plan a journey first.': 'Nog niets om opnieuw te doen — plan eerst een reis.',
  'The stops you hearted, one tap each.': 'De haltes die je hartte, elk met één tik.',
  'Your stops: {stops}': 'Jouw haltes: {stops}',
  'Near you: {stops}': 'Bij jou in de buurt: {stops}',
  'Every route, with your own stops named and picked out.':
    'Elke lijn, met je eigen haltes benoemd en gemarkeerd.',
  'Search {count} stations, stops and landmarks': 'Zoek in {count} stations, haltes en plekken',
  /* The selection colour (see `lib/selection.ts`). `Butter`, `Sage` and `Obsidian` already
     exist in the palette section below; these are the rest of the row. */
  'Text selection': 'Tekstselectie',
  Coral: 'Koraal',
  Green: 'Groen',
  Custom: 'Eigen',
  /* The platform dialog the Custom chip opens; it has no visible label, only this one. */
  'Custom colour': 'Eigen kleur',
  'The colour behind selected text. The ink on it is chosen for contrast, so a dark colour gets light text.':
    'De kleur achter geselecteerde tekst. De inkt erop wordt op contrast gekozen, dus een donkere kleur krijgt lichte tekst.',
  /*
   * The two colour screens (`components/ui/ColourScreen.tsx`) and the personal background
   * (`lib/background.ts`). Three ways to say the same thing on one sheet, so the words are the
   * short names a phone uses rather than descriptions. The text selection's own colour is asked
   * for by the device, so it needs none of these — only the `Custom colour` label above.
   */
  'Background colour': 'Achtergrondkleur',
  'Primary colour': 'Primaire kleur',
  'Follow the background': 'Volg de achtergrond',
  /* The accent row in the preview specimen names what the first swatch really is. */
  'Theme colour': 'Themakleur',
  'Pick a colour from the grid, from the spectrum, or type its value.':
    'Kies een kleur uit het raster, uit het spectrum, of typ de waarde.',
  Colours: 'Kleuren',
  Spectrum: 'Spectrum',
  'Saturation and brightness': 'Verzadiging en helderheid',
  'Saturation {s}%, brightness {v}%': 'Verzadiging {s}%, helderheid {v}%',
  Hue: 'Tint',
  'Hex value': 'Hexwaarde',
  Background: 'Achtergrond',
  Cream: 'Crème',
  Colour: 'Kleur',
  Photo: 'Foto',
  Widgets: 'Widgets',
  Glass: 'Glas',
  'From your wallpaper': 'Uit je achtergrond',
  'From your photo': 'Uit je foto',
  'Tap or drag the photo to take the widgets’ colour from it — the same colour the Primary colour block sets.':
    'Tik of sleep op de foto om de kleur van de widgets eruit te halen — dezelfde kleur die het blok Primaire kleur instelt.',
  'Tap or drag on your wallpaper to take its colour':
    'Tik of sleep op je achtergrond om de kleur over te nemen',
  'Loading your photo…': 'Je foto wordt geladen…',
  Eyedropper: 'Pipet',
  'The page’s own colour. The widgets keep their colour — see Primary colour below. A dark choice keeps its colour and gets light text.':
    'De kleur van de pagina zelf. De widgets houden hun eigen kleur — zie Primaire kleur hieronder. Een donkere keuze blijft donker en krijgt lichte tekst.',
  'The cards, the panels, the sidebar and the accent. The page keeps its own colour.':
    'De kaarten, de panelen, de zijbalk en het accent. De pagina houdt zijn eigen kleur.',
  'Following the background: the widgets take the page’s colour, and the app’s own surfaces and coral while the page is cream.':
    'Volgt de achtergrond: de widgets nemen de kleur van de pagina, en de eigen oppervlakken en het koraal van de app zolang de pagina crème is.',
  'Your photo, kept on this device under a wash of the canvas colour.':
    'Je foto, op dit apparaat bewaard onder een waas van de canvaskleur.',
  'Translucent cards that show the photo through, blurred and saturated.':
    'Doorschijnende kaarten die de foto laten zien, vervaagd en verzadigd.',
  'Solid cards in the primary colour. Use the eyedropper to take one from the photo.':
    'Effen kaarten in de primaire kleur. Gebruik de pipet om er een uit de foto te halen.',
  'Choose a colour': 'Kies een kleur',
  'Choose a photo': 'Kies een foto',
  'Replace the photo': 'Foto vervangen',
  'Remove the photo': 'Foto verwijderen',
  'Choose a background photo': 'Kies een achtergrondfoto',
  'The app’s own warm canvas — the background it has always had.':
    'Het eigen warme canvas van de app — de achtergrond die er altijd al was.',
  /* The row-based Colours card: short values on the rows, one sentence on each screen. */
  'Page colour': 'Kleur van de pagina',
  'App default': 'App-standaard',
  'The app’s own warm canvas.': 'Het eigen warme canvas van de app.',
  'The page’s own colour. The widgets keep theirs — see Widgets.':
    'De kleur van de pagina zelf. De widgets houden de hunne — zie Widgets.',
  'Crop it to choose what the page shows.': 'Snijd het bij om te kiezen wat de pagina toont.',
  'Solid cards in the widgets’ colour.': 'Effen kaarten in de kleur van de widgets.',
  'Widgets’ colour': 'Kleur van de widgets',
  'The widgets take the page’s colour.': 'De widgets nemen de kleur van de pagina.',
  'A photo has no colour of its own, so this uses the app’s own surfaces and coral. Choose a colour, or take one from the photo.':
    'Een foto heeft geen eigen kleur, dus dit gebruikt de eigen oppervlakken en het koraal van de app. Kies een kleur, of haal er een uit de foto.',
  'The page is cream, so this uses the app’s own surfaces and coral.':
    'De pagina is crème, dus dit gebruikt de eigen oppervlakken en het koraal van de app.',
  /*
   * ***Default*, and the hint names the colour it paints.** The row said *Cream* while the dark
   * appearance drew `#121211`, so the label lied in one appearance; a per-appearance label
   * (Cream/Black) only trades that for a control that renames itself when the theme flips —
   * including by itself at sunset under **System**. The app's own canvas is **Default** in both,
   * the swatch shows it, and the hint below names it: cream in light, black in dark.
   */
  Default: 'Standaard',
  'The app’s own cream canvas.': 'Het eigen crème canvas van de app.',
  'The app’s own black canvas.': 'Het eigen zwarte canvas van de app.',
  'The page is the app’s own canvas, so this uses the app’s own surfaces and coral.':
    'De pagina is het eigen canvas van de app, dus dit gebruikt de eigen oppervlakken en het koraal.',
  /* Match colours: one fill for every button, picked in the pop-up. */
  'Match colours': 'Kleuren gelijkzetten',
  'Stop matching': 'Niet meer gelijkzetten',
  'The labels take {ink} ink — {ratio}:1': 'De labels nemen {ink} inkt — {ratio}:1',
  'Pick your own': 'Kies je eigen kleur',
  'Opens the colour picker of this device.': 'Opent de kleurenkiezer van dit apparaat.',
  'Button colour': 'Knopkleur',
  'Every button · {colour}': 'Elke knop · {colour}',
  /* Matching is the palette's three colours now — page, primary, selected text — and it is
     confirmed rather than applied on sight. Buttons are not among them. */
  'One colour for the page, the primary colour and the selected text — the same HEX in all three.':
    'Eén kleur voor de pagina, de primaire kleur en de geselecteerde tekst — dezelfde HEX in alle drie.',
  'Match all three': 'Zet alle drie gelijk',
  'Everything · {colour}': 'Alles · {colour}',
  'The page, the primary colour and the selected text are the same colour.':
    'De pagina, de primaire kleur en de geselecteerde tekst hebben dezelfde kleur.',
  'Give the page, the primary colour and the selected text one colour, confirmed in a pop-up.':
    'Geef de pagina, de primaire kleur en de geselecteerde tekst één kleur, bevestigd in een venster.',
  'Reset colours': 'Kleuren herstellen',
  'Reset the background': 'Achtergrond herstellen',
  'Reset the primary colour': 'Primaire kleur herstellen',
  'Reset the selected-text colour': 'Tekstselectiekleur herstellen',
  Cards: 'Kaarten',
  'Selected text': 'Geselecteerde tekst',
  Page: 'Pagina',
  Matched: 'Gelijkgezet',
  'Not matched yet': 'Nog niet gelijkgezet',
  'Press “Match all three” to apply it.': 'Druk op “Zet alle drie gelijk” om het toe te passen.',
  'Enter a whole colour, like #1B4D3E.': 'Voer een volledige kleur in, zoals #1B4D3E.',
  'The colour all three take': 'De kleur die alle drie krijgen',

  /* The colour redesign (`COLOURS_PLAN.md`): two screens for the photograph and one for any
     colour. The words are the controls' own, short enough for a phone. */
  'The cards take it with {ink} ink — {ratio}:1':
    'De kaarten nemen hem met {ink} inkt — {ratio}:1',
  'The cards take it with {ratio}:1 ink': 'De kaarten nemen hem met {ratio}:1 inkt',
  light: 'lichte',
  dark: 'donkere',
  'Take a colour out of the picture itself.': 'Haal een kleur uit de foto zelf.',
  'Drag the picture to sample, or use the arrow keys. Done keeps the colour.':
    'Sleep over de foto om te prikken, of gebruik de pijltjestoetsen. Klaar bewaart de kleur.',
  'Crop': 'Bijsnijden',
  'Crop the photo': 'Foto bijsnijden',
  'Save': 'Bewaren',
  'Frame': 'Kader',
  'This screen': 'Dit scherm',
  'Phone': 'Telefoon',
  'Square': 'Vierkant',
  '{share}% of the picture': '{share}% van de foto',
  'As it will look': 'Zo komt het eruit te zien',
  'The page background, as the crop will draw it.':
    'De achtergrond van de pagina, zoals het kader hem tekent.',
  'Drag to move the picture; pinch or use the wheel to zoom':
    'Sleep om de foto te verplaatsen; knijp of gebruik het wiel om te zoomen',
  'Your photo, kept on this device under a wash of the canvas colour. Crop it to choose what the page shows.':
    'Je foto, op dit apparaat bewaard onder een waas van de canvaskleur. Snijd hem bij om te kiezen wat de pagina laat zien.',
  'This browser cannot read the photo.': 'Deze browser kan de foto niet lezen.',
  'That file is not an image.': 'Dat bestand is geen afbeelding.',
  'That image is too large — try one under 12 MB.':
    'Die afbeelding is te groot — probeer er een onder 12 MB.',
  'That image could not be read.': 'Die afbeelding kon niet worden gelezen.',
  'This browser cannot resize an image.': 'Deze browser kan geen afbeelding verkleinen.',
  /* Battery saving, which is a reading rather than a switch (see `lib/power.ts`). */
  'Battery saving': 'Batterijbesparing',
  'Automatic: movement goes at 20%, and at 10% only what you need to catch a bus is drawn. Plugging in turns it off.':
    'Automatisch: beweging valt weg bij 20%, en bij 10% wordt alleen getoond wat je nodig hebt om een bus te halen. Aan de lader gaat het uit.',
  'This browser does not report the battery, so the full interface is always drawn.':
    'Deze browser geeft het batterijniveau niet door, dus de volledige interface blijft altijd zichtbaar.',
  'Super saving': 'Maximaal sparen',
  Saving: 'Sparen',
  Charging: 'Aan de lader',
  'Not reported': 'Niet doorgegeven',
  'Super energy saving is on — {cards} come back when this device is charged.':
    'Maximale energiebesparing staat aan — {cards} komen terug zodra dit apparaat aan de lader ligt.',
  'Only what you need to catch a bus is drawn, and Settings come back with the rest.':
    'Alleen wat je nodig hebt om een bus te halen wordt getoond, en Instellingen komen terug met de rest.',
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
  Earlier: 'Eerder',
  Later: 'Later',
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
  Direct: 'Direct',
  'Delay +{minutes} min': 'Vertraging +{minutes} min',
  Cancelled: 'Rit vervalt',
  'Walking only': 'Alleen lopen',
  'No transfers': 'Geen overstappen',
  '{count} transfer': '{count} overstap',
  '{count} transfers': '{count} overstappen',
  '{count} minute walk': '{count} minuten lopen',
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
  /*
   * The control that saves the search, and the words that tell it apart from the control that
   * saves one journey. A **saved search** is a pair of stops to run again; a **saved journey** is
   * one result with its own times. The round asked for that difference to be unmistakable.
   */
  'Save this search': 'Deze zoekopdracht opslaan',
  'Saved as a search': 'Opgeslagen als zoekopdracht',
  'Save this journey': 'Deze reis opslaan',
  'Saved journey': 'Reis opgeslagen',
  'Saved searches': 'Opgeslagen zoekopdrachten',
  'The searches you saved, one tap to repeat.':
    'De zoekopdrachten die je opsloeg, met één tik opnieuw.',
  'A saved search is a pair of stops you keep. A saved journey is one result with its own times.':
    'Een opgeslagen zoekopdracht is een set haltes die je bewaart. Een opgeslagen reis is één resultaat met zijn eigen tijden.',
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
  /* Said while the position is still being found, in place of the line about the order. */
  'Finding where you are, so the list can be nearest-first…':
    'Even kijken waar je bent, zodat de lijst dichtstbijzijnde eerst kan zijn…',
  'Is this where you leave from, or where you are going?':
    'Is dit waar je vertrekt, of waar je naartoe gaat?',
  'Plan with {stop}': 'Plannen met {stop}',
  /* `Plan` and `Show {count} more` already exist as entries higher up; `More` is new. */
  More: 'Meer',
  /* The board's row of favourited locations — the stops the traveller has pinned. */
  Favourites: 'Favorieten',
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
  'Heart a journey on the results screen and it waits here, with its times.':
    'Markeer een reis op de resultatenpagina met een hart en hij staat hier, met zijn tijden.',
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

  Type: 'Type',
  /* ------------------------------------------------- the last pass of the tree */
  "Disruptions & service alerts": "Storingen en reisinformatie",
  "Delays, cancellations, planned works, platform changes, crowding and weather alerts across the network.": "Vertragingen, rituitval, gepland werk, spoorwijzigingen, drukte en weerswaarschuwingen in het hele netwerk.",
  "Search in alerts": "Zoek in storingen",
  "For example: platform, ferry, works": "Bijvoorbeeld: perron, veerboot, werk",
  "Severity": "Ernst",
  "Start time": "Begintijd",
  "Line filter: {line}": "Lijnfilter: {line}",
  "Reset filters": "Filters wissen",
  "Transport mode": "Vervoerswijze",
  "Filter by affected stop": "Filter op getroffen halte",
  "For example: Utrecht, Schiphol, Blaak": "Bijvoorbeeld: Utrecht, Schiphol, Blaak",
  "No alerts match these filters": "Geen storingen voor deze filters",
  "The network has alerts; these filters removed all of them.": "Er zijn storingen in het netwerk; deze filters hebben ze allemaal weggefilterd.",
  "The line filter is on, which is the filter that cannot be cleared from Options.": "Het lijnfilter staat aan; dat filter wis je niet via Opties.",
  "The type, severity, mode or affected-stop filter removed every alert.": "Het filter op type, ernst, vervoerswijze of getroffen halte heeft alle storingen weggefilterd.",
  "Clear the line filter": "Lijnfilter wissen",
  "Alert details & advice": "Details en advies",
  "Information": "Informatie",
  "Disruption": "Storing",
  "Major disruption": "Grote storing",
  "Nothing in the network matches what is switched on here.": "Niets in het netwerk voldoet aan wat hier aanstaat.",
  "Nothing matches “{query}” with these filters.": "Niets komt overeen met “{query}” met deze filters.",
  "The region, city, stop type, modes or favourites-only filter removed every stop.": "Het filter op regio, stad, haltetype, vervoerswijzen of alleen favorieten heeft alle haltes weggefilterd.",
  "Search the whole network": "Zoek in het hele netwerk",
  "Your settings leave out {modes}, so journeys that need it are hidden.": "Je instellingen laten {modes} weg, dus reizen die het nodig hebben zijn verborgen.",
  "Walking is switched off and {modes} is left out, so the planner cannot build an access leg.": "Lopen staat uit en {modes} is weggelaten, dus de planner kan geen voor- of natransport maken.",
  "Walking is switched off and {modes} are left out, so the planner cannot build an access leg.": "Lopen staat uit en {modes} zijn weggelaten, dus de planner kan geen voor- of natransport maken.",
  "No mode is switched off, so the walking limit, the transfer limit or a result filter removed every option.": "Er staat geen vervoerswijze uit, dus de looplimiet, de overstaplimiet of een resultaatfilter heeft elke optie weggefilterd.",
  "Unknown stop": "Onbekende halte",
  "This stop is not in the network.": "Deze halte zit niet in het netwerk.",
  "Stop not found": "Halte niet gevonden",
  "Pick a stop from the full list instead.": "Kies een halte uit de volledige lijst.",
  "All stations & stops": "Alle stations en haltes",
  "Stop information": "Halte-informatie",
  "Platforms / stops": "Perrons / haltes",
  "Secure bicycle parking": "Beveiligde fietsenstalling",
  "No bicycle parking listed": "Geen fietsenstalling bekend",
  " · OV-fiets rental available": " · OV-fiets te huur",
  "Showing from {time} — the current time in this browser": "Getoond vanaf {time} — de huidige tijd in deze browser",
  "Open the full board": "Open het volledige bord",
  "Alerts at this stop": "Storingen bij deze halte",
  "No alerts affect this stop right now.": "Er zijn nu geen storingen bij deze halte.",
  "Details": "Details",
  "Lines calling here": "Lijnen die hier stoppen",
  "This is a walking landmark: it is reached on foot from the nearest stop rather than by a service.": "Dit is een wandelbestemming: je bereikt haar te voet vanaf de dichtstbijzijnde halte, niet met een dienst.",
  "{line} departures at {stop}": "Vertrekken van {line} bij {stop}",
  "· every {minutes} min": "· elke {minutes} min",
  "No other stop is within walking distance.": "Geen andere halte op loopafstand.",
  "Open {stop}": "Open {stop}",
  "{minutes} min walk": "{minutes} min lopen",
  "walking only": "alleen lopen",
  "Journey no longer in this session": "Reis niet meer in deze sessie",
  "Journeys are generated per search, so this option is not available right now.": "Reizen worden per zoekopdracht gemaakt, dus deze optie is nu niet beschikbaar.",
  "This journey could not be restored": "Deze reis kon niet worden hersteld",
  "Re-run the search to see the options again, or open one of your favourited journeys.": "Doe de zoekopdracht opnieuw om de opties te zien, of open een van je favoriete reizen.",
  "Re-run my last search": "Mijn laatste zoekopdracht opnieuw",
  "Alerts on this journey": "Storingen op deze reis",
  "— read the details and advice": "— lees de details en het advies",
  "Complete journey": "Volledige reis",
  "Journey summary": "Reisoverzicht",
  "Transfers": "Overstappen",
  "This is a direct journey — no transfers at all.": "Dit is een directe reis — zonder overstappen.",
  "Expected occupancy": "Verwachte drukte",
  "Every mode starts switched on; unselected modes are left out of your journeys.": "Elke wijze staat standaard aan; uitgezette wijzen blijven buiten je reizen.",
  "With no transport mode selected no journey can be planned.": "Zonder vervoerswijze kan er geen reis worden gepland.",
  "Applies to access, transfer and egress walks.": "Geldt voor lopen naar, tussen en na de ritten.",
  "Maximum walking time": "Maximale looptijd",
  "Maximum walking minutes": "Maximale loopminuten",
  "5 min": "5 min",
  "{count} minutes": "{count} minuten",
  "{count} min": "{count} min",
  "No limit": "Geen limiet",
  "Maximum number of transfers": "Maximaal aantal overstappen",
  "Counts changes between services, not walking links.": "Telt wissels tussen ritten, niet loopstukken.",
  "Prefer fewer transfers": "Liever minder overstappen",
  "Prefer less walking": "Liever minder lopen",
  "Ranks journeys with fewer changes higher, even if slower.": "Zet reizen met minder overstappen hoger, ook als ze langzamer zijn.",
  "Shortens walking links and ranks them lower.": "Maakt loopstukken korter en zet ze lager.",
  "Alert not found": "Storing niet gevonden",
  "This alert is not in the list.": "Deze storing staat niet in de lijst.",
  "Unknown alert": "Onbekende storing",
  "Return to the overview to browse the alerts that exist.": "Ga terug naar het overzicht om de bestaande storingen te bekijken.",
  "What is happening": "Wat er aan de hand is",
  "Advice": "Advies",
  "More alerts": "Meer storingen",
  "Other alerts": "Andere storingen",
  "Use your location?": "Je locatie gebruiken?",
  "OVVO uses this device's position to fill in where you are.": "OVVO gebruikt de positie van dit apparaat om in te vullen waar je bent.",
  "Requesting…": "Bezig met vragen…",
  "Allow location": "Locatie toestaan",
  "Not now": "Niet nu",
  "Sent once to OpenStreetMap to name the street. Not stored.": "Eén keer naar OpenStreetMap gestuurd om de straat te benoemen. Niet opgeslagen.",
  "These preferences shape your search results: the planner respects them, the results list filters by them and the ordering changes with them.": "Deze voorkeuren bepalen je zoekresultaten: de planner respecteert ze, de resultatenlijst filtert erop en de volgorde verandert ermee.",
  "See the results": "Bekijk de resultaten",
  "No journey matches these preferences": "Geen reis voldoet aan deze voorkeuren",
  "Plan a journey to preview these settings.": "Plan een reis om deze instellingen te bekijken.",
  "Close": "Sluiten",
  "Dismiss message": "Melding sluiten",
  "OVVO home": "OVVO-startpagina",
  "No departures right now": "Nu geen vertrekken",
  "This stop has no departures in the current window.": "Deze halte heeft in dit venster geen vertrekken.",
  "Alert for service {line}": "Storing voor dienst {line}",
  "Plan a journey to {stop}": "Plan een reis naar {stop}",
  "Show only the next departures": "Toon alleen de eerstvolgende vertrekken",
  "{shown} of {total} departures in this window": "{shown} van {total} vertrekken in dit venster",
  "This line has no departures left today at this stop.": "Deze lijn heeft vandaag geen vertrekken meer bij deze halte.",
  "Route": "Route",
  "Every saved search is removed from this browser. Pins, saved journeys and preferences stay as they are.": "Elke bewaarde zoekopdracht wordt uit deze browser verwijderd. Pinnen, bewaarde reizen en voorkeuren blijven zoals ze zijn.",
  "Yes, delete them": "Ja, verwijder ze",
  "Favourite this journey": "Markeer deze reis als favoriet",
  "Departure board": "Vertrektijdenbord",
  "Filters": "Filters",
  "Service notice": "Dienstmededeling",
  "Work on the line until 18:00 — add ten minutes.": "Werk aan de lijn tot 18:00 — reken tien minuten extra.",
  "Planning your journey": "Je reis wordt gepland",
  "When": "Wanneer",

  /* -------------------------------------------------------------- the six widgets */
  "Your commute": "Je woon-werkrit",
  "The journey you take most, counted down: the next service and when to leave.": "De reis die je het vaakst maakt, afgeteld: de volgende rit en wanneer je weg moet.",
  "Stops near you": "Haltes bij je in de buurt",
  "The closest stops that have a board, how far they are, and when the next one leaves.": "De dichtstbijzijnde haltes met een bord, hoe ver ze zijn en wanneer de volgende gaat.",
  "Facilities at your stations": "Voorzieningen op je stations",
  "What each stop you hearted lists: facilities, bicycle parking, OV-fiets.": "Wat elke favoriete halte vermeldt: voorzieningen, fietsenstalling, OV-fiets.",
  "What it costs": "Wat het kost",
  "The quickest option and the cheapest one, with their fares, side by side.": "De snelste en de goedkoopste optie, met hun prijs naast elkaar.",
  "Last service home": "Laatste rit naar huis",
  "The last departures from the stop your saved journey starts at.": "De laatste vertrekken vanaf de halte waar je bewaarde reis begint.",
  "A second departure board": "Een tweede vertrektijdenbord",
  "Another station’s next departures, beside the first card.": "De volgende vertrekken van een ander station, naast de eerste kaart.",
  "Heart the journey you take every morning and this card counts down to it.": "Markeer de reis die je elke ochtend maakt en deze kaart telt er naartoe af.",
  "Next {time} · leave in {minutes} min": "Volgende {time} · over {minutes} min weg",
  "Next {time} · leave now": "Volgende {time} · nu weg",
  "No service left in this window today.": "Vandaag geen ritten meer in dit venster.",
  "Turn on location and the stops around you appear here.": "Zet locatie aan en de haltes om je heen verschijnen hier.",
  "Settings can turn location on; the card never invents where you are.": "In Instellingen zet je locatie aan; de kaart verzint nooit waar je bent.",
  "Closest to your device location": "Dichtst bij je apparaatlocatie",
  "Closest to an approximate IP location": "Dichtst bij een geschatte IP-locatie",
  "next at {time}": "volgende om {time}",
  "no departure in this window": "geen vertrek in dit venster",
  "Heart a stop and its facilities are listed here.": "Markeer een halte en haar voorzieningen staan hier.",
  "The heart on a stop card is the one that fills this card.": "Het hart op een haltekaart is wat deze kaart vult.",
  "No facilities listed for this stop.": "Geen voorzieningen bekend voor deze halte.",
  "Plan a journey and its fare appears here beside its time.": "Plan een reis en de prijs verschijnt hier naast de tijd.",
  "Every result already carries a price; this card just puts the two next to each other.": "Elk resultaat heeft al een prijs; deze kaart zet ze alleen naast elkaar.",
  "This search": "Deze zoekopdracht",
  "Your saved journeys": "Je bewaarde reizen",
  "Heart the journey home and this card knows its last service.": "Markeer de reis naar huis en deze kaart kent de laatste rit.",
  "The last departures are read from the same board the departure screen draws.": "De laatste vertrekken komen van hetzelfde bord als op het vertrekscherm.",
  "Last services from {stop}": "Laatste ritten vanaf {stop}",
  "No late service from this stop in the data.": "Geen late rit vanaf deze halte in de gegevens.",
  "Read at {time}, the same minute the board uses.": "Gelezen om {time}, dezelfde minuut die het bord gebruikt.",

  /* The audit's language pass: one screen at a time, every visible and spoken string. */
  "All {count} stops on this map": "Alle {count} haltes op deze kaart",
  "Details of {alert}": "Details van {alert}",
  "Schematic local view of {stop} and the stops around it": "Schematisch beeld van {stop} en de haltes eromheen",
  "stop code {code}": "haltecode {code}",
  "No service calls at this station right now.": "Er stopt nu geen dienst op dit station.",
  "Search by station, stop or landmark name.": "Zoek op stations-, halte- of plaatsnaam.",
  "Clear {label}": "Wis {label}",
  "{label} suggestions": "Suggesties voor {label}",
  "Plan from {stop}": "Plan vanaf {stop}",
  "Plan to {stop}": "Plan naar {stop}",
  "Plan a journey to {stop} at {time}": "Plan een reis naar {stop} om {time}",
  "min walking": "min lopen",
  "No bicycle": "Geen fiets",
  "Change at {stop}": "Overstappen in {stop}",
  "Delay +{count} min": "Vertraging +{count} min",
  "Affected stops ({count})": "Getroffen haltes ({count})",
  "Affected services ({count})": "Getroffen diensten ({count})",
  "More alerts for {line}": "Meer storingen voor {line}",
  "See all alerts": "Alle storingen bekijken",
  "Alert": "Storing",
  "every {minutes} min": "elke {minutes} min",
  "Transport modes": "Vervoerswijzen",
  "Trade-offs": "Afwegingen",
  "Plan return journey": "Heen- en terugreis plannen",
  "No results for those filters": "Geen resultaten voor deze filters",
  "Try again with a different journey": "Probeer het met een andere reis",
  "{matching} of {total} journeys allowed": "{matching} van {total} reizen toegestaan",
  "Best now: {departure} → {arrival}": "Beste nu: {departure} → {arrival}",
  "Re-run {from} → {to}": "Opnieuw zoeken: {from} → {to}",
  "Plan a new journey": "Een nieuwe reis plannen",
  "Favourited journeys ({count})": "Bewaarde reizen ({count})",
  "departs {time}": "vertrekt {time}",
  "arrives {time}": "komt aan {time}",
  "direct": "rechtstreeks",
  "transfer": "overstap",
  "leg": "etappe",
  "{count} favourite stops": "{count} favoriete haltes",
  "{count} favourited journeys": "{count} bewaarde reizen",
  "{count} recent searches": "{count} recente zoekopdrachten",
  "Add {widget}": "{widget} toevoegen",
  "{widget} added to the home screen": "{widget} toegevoegd aan het beginscherm",
  "Put the arrangement back": "Zet de indeling terug",
  "Arrangement restored": "Indeling teruggezet",
  "Clear the search to see the whole network again": "Wis de zoekopdracht om het hele netwerk te zien",
  "Show every alert again, not only the ones you kept": "Toon alle storingen, niet alleen de bewaarde",
  "Journey details for {time}": "Reisdetails voor {time}",
  "Show the {time} journey on the map": "Toon de reis van {time} op de kaart",
  "Favourite the {time} journey": "Bewaar de reis van {time}",
  "Favourite the {from} to {to} journey": "Bewaar de reis van {from} tot {to}",
  "A journey cannot be planned for a day that has already gone.": "Een reis kan niet worden gepland voor een dag die al voorbij is.",
  /* The two lines the journey page still spoke in English: the walking end of the rail and the
     fare's own label beside the price (9.3). */
  "Arrive {time}": "Aankomst {time}",
  /* The journey page's three action labels, shortened to one word each (their accessible names
     keep the full sentence). */
  "Return": "Terug",
  "Map": "Kaart",
  "Saved": "Bewaard",
  "Indicative single fare": "Indicatief enkel ticket",
  "Walking only · no ticket needed": "Alleen lopen · geen ticket nodig",
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
