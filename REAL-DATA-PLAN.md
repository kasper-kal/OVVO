The UI of OVVO has been approved.

We are now beginning the REAL-DATA IMPLEMENTATION PHASE.

Turn the existing prototype into a genuinely functional, independent Dutch public transport journey planner.

You are responsible for implementing the code, data integrations, routing, backend behaviour, error handling, tests and documentation.

I direct the product. I should not need to write the application's code manually.

A. Preserve the approved UI

Inspect the complete existing project before changing it.

Preserve the approved design, layouts, typography, navigation, components and interactions.

Do not replace the application with a generic dashboard or regenerate the entire project from scratch.

Make only the changes necessary to implement real functionality, handle real data correctly and improve reliability.

B. Investigate Freebuff's actual technical capabilities

Before committing to an architecture, inspect the current app and determine what the active Freebuff environment can actually support.

Verify:

- The existing frontend and backend architecture.
- Available database and server-side features.
- How the app is previewed and deployed.
- Whether long-running processes are supported.
- Whether Docker, Java or persistent external services can be run.
- Available memory, storage and execution limits.
- Support for scheduled tasks and background work.
- Secure environment variables and secrets.
- Outbound connections to external services.
- The available way to connect an independently hosted routing engine.

Do not assume the environment is a general-purpose server.

Do not assume OpenTripPlanner can run inside a short-lived serverless function.

Choose the simplest architecture that satisfies the real requirements.

Prefer existing Freebuff capabilities for the frontend and application backend. If a separate routing service is necessary, investigate a suitable option and verify its current resource requirements, free-tier conditions and ability to remain available.

Do not purchase a service, activate a paid plan or enable billable resources without asking me first.

If no suitable free deployment option is available, implement and test the portions that can be completed, document the precise blocker, and ask for approval before introducing a paid dependency.

C. Use real, verified data sources

Do not scrape 9292 or use private 9292 APIs.

Investigate genuine public transport data sources and verify their current availability, coverage, licensing, freshness and access conditions.

Begin by inspecting the Dutch GTFS distribution:

https://gtfs.ovapi.nl/openov-nl/

Verify the actual current dataset URL before downloading it. Do not hard-code an assumed filename or assume the listing never changes.

Inspect the archive and verify the relevant GTFS files, including stops, routes, trips, stop times, service calendars and calendar exceptions.

Determine the dataset's validity dates and the operators and regions it appears to cover.

Produce a concise data-source report. Do not claim nationwide coverage if the available dataset does not demonstrate it.

For any additional source, verify its real endpoint and access method. Do not invent URLs, credentials, data fields or APIs.

D. Build a repeatable timetable pipeline

Implement a reliable process to obtain and validate the timetable data.

It must:

- Download the verified dataset.
- Detect failed, incomplete or corrupted downloads.
- Validate the data before activating it.
- Record retrieval time and relevant dataset validity information.
- Keep the last known working data if an update fails.
- Avoid replacing valid data with a broken update.
- Keep downloaded archives and generated routing graphs out of Git.
- Support safe updates.
- Provide readable logs and diagnostics.

Use the dataset's actual update mechanism and metadata where available.

Do not repeatedly download large archives unnecessarily.

Document how the timetable data is updated and how failures are handled.

E. Configure the routing engine

Investigate and use OpenTripPlanner 2.10.0 as the primary routing engine unless a verified technical limitation makes it unsuitable.

Use the documentation for that exact version:

https://docs.opentripplanner.org/en/v2.10.0/

Verify the compatible Java version, runtime image, configuration files, graph-building procedure, API behaviour and resource requirements before implementation.

Use actual compatible timetable and street-network data.

Obtain appropriate OpenStreetMap-derived street-network data. Verify its source, licensing, current availability and compatibility before downloading it.

Build the routing graph and verify that it actually loads and can return real itineraries.

If the graph fails to build, diagnose the real error. If the current environment lacks sufficient memory or the ability to run a persistent service, investigate an appropriate deployment arrangement rather than inventing a successful build.

Do not report success until the routing engine has been exercised.

F. Implement genuine journey planning

Replace the mock journey implementation with actual routing-engine requests.

Support the following where the routing engine and available data permit:

- Origin and destination.
- Departure date and time.
- Arrival-by searches.
- Multiple itinerary options.
- Direct journeys and transfers.
- Walking connections.
- Transport modes.
- Departure and arrival times.
- Total journey duration.
- Transfer locations.
- Stops, routes and operators.
- Accessibility-related information.
- Supported journey preferences.

Implement validated API contracts and a typed adapter that translates real routing-engine responses into the format expected by the existing UI.

The frontend must display actual returned itineraries.

Do not invent journeys when no itinerary is returned. Do not hard-code station names, departures, platforms or journey times into production results.

Preserve missing information as missing rather than fabricating values.

Handle invalid inputs, routing errors, timeouts and no-result responses gracefully.

Correctly handle Dutch local time, daylight-saving transitions, service dates and GTFS service times extending past midnight.

For each preference, verify that it is genuinely supported and applied. If a setting cannot be honoured, do not pretend the route was calculated according to it.

G. Implement real location search

Replace mock autocomplete with a genuine location-search service.

Investigate the suitability of a real geocoding or place-search provider for Dutch addresses, stations, stops and places.

Verify coverage, authentication, limits, licensing, attribution and whether the intended usage is permitted.

Support address and house-number searches where the provider allows them.

Implement debounced search, loading states, no-results states, errors, appropriate result ranking and correct coordinate selection.

Resolve selected locations into the correct identifiers and coordinates required for journey planning.

Do not hard-code suggestions into production behaviour.

If current-location selection requires device permissions, ask for permission through the appropriate interface and handle refusal gracefully.

Do not violate the usage rules of public geocoding services.

H. Implement real stop details and departure boards

Connect the existing station and stop pages to genuine data.

Display actual scheduled departure or arrival information where available.

Show platforms, service identifiers, operators and other details only when supported by the underlying data.

Distinguish scheduled times from realtime estimates.

Make departure filters and stop navigation work with actual results.

Handle unavailable stops, no departures and upstream errors honestly.

Never generate plausible departure times as a fallback for a failed real-data request.

I. Implement realtime information where verified data permits

Investigate available Dutch realtime feeds through the relevant official NDOV/OpenOV information and verify how each feed actually works.

Do not assume that a feed is an HTTP endpoint, that every operator is covered or that all data is freely available.

Create a feed inventory recording:

- Provider.
- Feed type.
- Operator coverage.
- Connection method.
- Access requirements.
- Update frequency.
- Data freshness.
- Last successful ingestion.
- Current health.
- Features supported by actual observations.

Where supported, implement delays, cancellations, platform changes, service alerts, changed stops, realtime vehicle positions and realtime-aware journey updates.

Match realtime updates to the correct scheduled trips. Handle feed identifiers, timestamps, stale information, duplicate messages, unknown trips and outages.

Do not infer live information from the static timetable.

Do not attach a delay or vehicle position to a trip merely because its route number looks similar.

If an integration requires approval or credentials that are not available, complete the independent work first, document the exact blocker, and ask me for only the input that is genuinely required.

Never silently replace missing live information with fake realtime data.

J. Implement service disruptions

Connect the disruption interface to verified alerts or disruption data.

Implement relevant filters, alert details and navigation to affected stops or journeys where the data supports it.

Avoid duplicate alerts and expired information presented as current.

Do not claim a disruption affects a particular itinerary unless the available data supports that relationship.

K. Replace the illustrative map

Replace the local illustrative map with a real map that uses actual coordinates and, where available, genuine route geometry.

Connect selected routes and stops to the actual itinerary and stop data.

Display real vehicle markers only when backed by verified vehicle-position data.

Verify the mapping provider's terms, usage limits, attribution and caching requirements. Do not bulk-download public map tiles.

Show the required OpenStreetMap attribution when using the relevant OSM data or services.

The core journey-planning functionality must remain usable if the map fails to load.

L. Finish preferences and favourites

Connect the approved preference controls to real behaviour.

Implement relevant settings for supported travel modes, walking distance, transfers and accessibility.

Do not present a preference as applied when the backend ignored it.

Implement saved locations, favourite stops, saved journeys and recent searches using appropriate persistence.

Use browser-local persistence where sufficient. Use a database only when it solves a real requirement.

Do not add user accounts merely to save single-user preferences.

M. Investigate additional 9292-style features

Investigate these features separately:

- Live vehicle positions.
- Detailed stop and station information.
- Service disruptions.
- Accessibility-aware routing.
- Shared mobility.
- Fare estimates.
- Ticket information and official purchase links.
- Subscription or travel-product comparisons.
- International connections.

For each, verify the actual data source, access conditions, coverage and implementation requirements.

Implement features that are feasible and supported by real information.

Do not invent fares, discounts, subscription details, vehicle availability, ticket purchases or international itineraries.

If reliable information is unavailable, communicate that limitation instead of presenting an estimate as a fact.

Do not let an optional unavailable feature prevent completion of the core planner.

N. Keep the architecture simple

Use Freebuff's supported application, database and backend capabilities where appropriate.

Do not introduce multiple databases, additional microservices, Kubernetes or other unnecessary infrastructure.

If a separate routing service is genuinely needed, document why and secure its connection to the application.

Keep API secrets server-side.

Create clear boundaries between the frontend, routing integration, timetable pipeline and realtime feeds.

O. Test actual functionality

Create and run meaningful tests.

Include:

- Search validation.
- Time and date handling.
- Itinerary normalization.
- Response parsing.
- Location search.
- Routing-engine integration.
- Departure-board retrieval.
- Preferences.
- Favourites.
- Error handling.
- Data freshness.
- Realtime update matching.
- Important frontend interactions.

Run an actual routing smoke test against the configured engine and genuine timetable data.

Where possible, verify the full flow from the UI to the backend, through the routing engine and back to the rendered results.

Clearly distinguish live integration tests from tests using fixtures or mock responses.

Do not disable failing tests, weaken assertions or substitute mock responses merely to create passing results.

If a test cannot be run in Freebuff's environment, explain why and identify what would be required to run it.

P. Keep real data honest

Production mode must never silently fall back to mock data.

Remove or isolate mock journeys, departure times, platform details, delays, vehicle positions and disruptions.

Mock information is allowed only in isolated tests or an explicitly enabled and clearly labelled demo mode.

When a real-data source fails or is unavailable, show an honest unavailable, stale, empty or error state.

Do not claim that an integration works merely because its interface or API route exists.

Q. Implement in milestones

Work through these milestones in order:

1. Inspect the existing project and platform capabilities.
2. Verify timetable and street-network data sources.
3. Implement dataset acquisition and validation.
4. Configure and verify the routing engine.
5. Implement genuine location search.
6. Connect real journey planning to the approved UI.
7. Connect stop pages and departure boards.
8. Implement supported preferences and favourites.
9. Integrate verified realtime feeds.
10. Connect disruptions and the real map.
11. Investigate additional features.
12. Run the full available test suite.
13. Document setup, operations and limitations.

After each milestone, perform the relevant checks and fix failures before moving on.

Do not spend the entire task generating an implementation plan. Carry out the work.

If one feature is blocked by external access, document the blocker and continue with independent work.

Do not ask me to make routine technical decisions you can resolve through investigation. Ask me when a decision genuinely depends on my preference or an authorization only I can provide.

R. Completion criteria

Do not call the application complete merely because the UI loads.

Verify that:

- The application starts.
- The routing engine is available.
- Real timetable data has been loaded.
- Real journey requests return actual results.
- The UI displays those real results.
- Location search uses a real configured provider.
- Departure boards use actual timetable data.
- Realtime features are backed by verified feeds where marked as available.
- Mock data cannot silently appear as production information.
- Important controls still work.
- Available tests have been run.
- Remaining limitations are documented.

Maintain a feature matrix with these statuses:

"COMPLETE", "PARTIAL", "BROKEN", "NOT STARTED", "BLOCKED", "UNVERIFIED".

Never claim that an unverified feature is complete.

When the milestones are finished, report what genuinely works, what you verified, what needs external access and what remains unfinished.

Then stop and wait for my next instruction.
