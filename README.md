# Satanic Nightjar — Interactive micro-site

This small single-page site highlights quick facts about the Satanic Nightjar (a nocturnal nightjar) with orange accents and lightweight interactions (card flips, accent toggle, speech synthesis).

How to view

- Open `Index.html` in a browser (double-click or File → Open in browser). No server required (static site).

Features

- Responsive layout with an SVG illustration.
- Orange accent color scheme by default.
- Click/tap fact cards to flip and reveal details.
- "Hear a fact" uses the browser's speech synthesis to read a random fact or the currently open detail in the modal.

Related birds

- The site now includes comparison cards linking the Satanic Nightjar to related or similar birds: Common Nighthawk, Eastern Whip-poor-will, Potoo, and Owlet-nightjar. Each card explains similarities and differences in behavior, calls, and ecology.

Myths & folklore

- A new "Myths & folklore" section covers common cultural beliefs and misconceptions, including the "goatsucker" origin (caprimulgus), omens associated with nocturnal calls, false beliefs about harming livestock, medicinal folklore, and why nightjars are poor candidates for pets.

Hero image

- The site attempts to display a hero photo from a provided URL or a local copy in `assets/`. If you prefer to keep an offline copy in the repo, download the image and save it as `assets/satanic-nightjar.png` — the site prefers a local image but will use the remote asset when available.

New interactive features

- Search/filter: press / to focus the search box and filter cards by keyword.
- Double-click or long-press a card to open a modal with expanded details. Use ◀/▶ in the modal or Left/Right arrow keys to navigate facts.
- Random Fact button opens a random fact in the modal.
- A progress indicator shows how many facts you've viewed during the current session.

Speech controls

- Voice selector: pick a voice available in your browser.
- Rate slider: control speech speed.
- Play / Pause / Stop buttons: play a random fact or the modal content, pause/resume, or stop and clear highlights.
- Modal text is highlighted sentence-by-sentence while the browser reads it (when available).

Notes

- The site focuses on typical nightjar biology and behavior (nocturnal habits, camouflage, insectivorous diet, calls, ground nesting, and typical threats). If you have a specific species profile for the "Satanic Nightjar" (range, taxonomy, call recordings, or photos), I can update the content to include precise, sourced details.
- The speech feature uses the Web Speech API — some browsers may block or not support it.
- If you want to add high-quality photos or audio, place them in an `assets/` folder and update the HTML accordingly.

Enjoy! 🌙
