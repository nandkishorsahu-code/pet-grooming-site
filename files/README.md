# World Clock — Multiple Time Zones Component

This is a small, dependency-free digital clock component that displays current times for multiple time zones. It can be embedded into any static site.

Features:
- Live updates every second
- Add/remove time zones (IANA names such as "America/New_York")
- Includes "Local time" and "UTC"
- 24-hour / 12-hour toggle (preference saved in localStorage)
- Persists selected time zones and order in localStorage
- Accessible: aria-live regions and readable aria-labels on cards

How to use:
1. Copy the `clock.html` markup into a page on your site (or include the relevant fragment in an existing page).
2. Copy `css/clock.css` and `js/clock.js` into your site's `css/` and `js/` folders respectively (or inline them).
3. Ensure the HTML includes:
   - <link rel="stylesheet" href="css/clock.css">
   - <script src="js/clock.js" defer></script>
4. Open the page — the clock will load and show the default time zones.
5. Add/remove time zones using the select + Add button. Your selections are saved in localStorage.

Customization ideas:
- Replace the select with a searchable autocomplete using a larger IANA timezone list.
- Show UTC offsets numerically (e.g., UTC+02:00) if you need exact offset display — this component relies on Intl and browser timeZoneName output.
- Style the cards to match your site's theme.
- Hook a server-side persistence if you want user-specific saved lists across devices.

Browser support:
- Modern browsers with Intl.DateTimeFormat support. The component uses formatToParts to extract the time zone name when available.

If you want, I can:
- Integrate this into your pet-grooming site (insert a "Clock" page or widget in the header/footer).
- Add a searchable timezone picker with the complete IANA tzlist.
- Provide numeric UTC offset calculation and DST-aware offset display.

Which next step would you like? (Embed into existing site, add searchable picker, or add numeric offsets.)  