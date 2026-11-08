# Furze Knoll stop 5 GPS autoplay — 8 November 2026

Tour `79685f26-e428-4561-abe7-32bafa7a4d2a`, Devizes to Avebury by Bike. Stop 5, Furze Knoll, played from a tap and did not start on its own while the rider was in the red circle. This note separates what was checked from what is still only a possibility. No tour data was written, no stop was recreated, and the published site was not changed.

## What this repository is

`jjakework93-dot/Tangible-tours` contained only a README when this investigation started. The rider app is the Lovable project `f2f122a8-b6c9-4dcc-9fbb-9a9848e53ae2`, commit `9b2642722bd0d5a369543b804a739c4af01ce74d` (5 November 2026, “Fix Google Ads loader typing”). There has been no later code commit.

The public site is https://tangibletours.com. Its live bundles `assets/tour-triggers-BGs-ssOX.js` and `assets/gps-tours._slug-D7w8Gzr9.js` match that commit: the zone test is the same function, and the GPS caller passes numerical order as `true` and the tour’s `play_in_order` flag as the strict flag. The service worker asks the network first and uses its cache when the network fails. An online phone is on this published bundle. Publishing is a separate Lovable action. This branch was not published, and the Lovable editor was not asked to change the app.

The replay in this folder copies that verified decision so the tests can run here. It is not a second copy of the app, and it must not be synced over the Lovable project.

## Facts

- At 12:09:40 GMT the saved snapshot still had stop 5 at 51.394709, -1.955052, radius 420 m, trigger on enter, playback once, audio `1793561768803-Furze-KNoll-NEW-Bike-Tour.mp3`. The same pin and radius were already saved at 10:40 GMT. `play_in_order` was false. Travel mode is BICYCLE. Trigger mode on the stop is empty, so it is eligible while cycling.
- Studio snapshots then moved only stop 5: 12:10:59 to 51.395835, -1.956335, still 420 m; 12:11:08 radius 320 m; 12:11:18 to 51.395356, -1.957546, 320 m. The 12:16:28 manual save left it there. The audio file name did not change. Stops 1–4 and 6–13 kept the same pins, radii, enter/exit setting, and audio names between the 12:09 and 12:16 snapshots. Stops 4 and 6 are still 51.389878, -1.970966 and 51.390921, -1.91448.
- The open rider page loads chapters once. It does not subscribe to later studio saves. A phone that opened the tour before 12:10 still has the 420 m circle until it reloads. A reload now loads the 320 m circle, 187 m from the old pin.
- Stop 4’s 503 m circle and stop 5’s 420 m circle do not meet. The pins are about 1,228 m apart. A rider 95–385 m from the old stop 5 pin is outside stop 4.
- The nearest spoken alerts (Road Crossing, 10 m, and Cycling break, 50 m) are about 600 m from the old stop 5 pin. They are outside the 420 m circle. The reviewed 85-second track, 124 m down to 95 m then up to 385 m, stays inside a 420 m circle around that pin and outside those alerts.
- Distance on the rider banner is the haversine distance from the same GPS fix to the next unplayed stop. The red circle uses that stop’s saved radius. The heading-up rotation turns the map canvas, the dot, and the circle together.
- With stops 1–4 already played, `play_in_order` false, and a fix inside the radius, the published zone function returns stop 5. The replay covers 95 m, 124 m, 273 m, and 385 m on the 420 m pin, and 95 m and 273 m on the later 320 m pin. 385 m is outside the 320 m circle. 421 m is outside the 420 m circle.
- “4 of 13 stops done” and “Next stop: 5” are the played set. That display means chapters 1–4 are played and 5 is not. The forward-order lock blocks a stop only when some played chapter number is greater than or equal to it. It is open for stop 5 in that display.
- The same caller handles every stop. Farewell, chapter 13, is an exit zone: it arms inside the circle and plays on the way out.
- Manual play uses the stop list or the previous-track control. That path marks the chosen stop and every earlier chapter played, clears the fresh-run gate, and starts the file directly. A tap proving the MP3 does not prove a GPS arrival.
- Daily play totals are not tied to one phone or one ride. A manual tap of stop 5 increases the play count.
- Per-ride GPS lines stay on the phone. Diagnostics says they are not uploaded.

## What the reported ride implies

The progress line “4 of 13, next 5”, a distance of 95–385 m, and the 420 m circle together put the fix inside stop 5 and outside stop 4 and the nearby alerts. In that state the published function starts stop 5 on the first fix whose accuracy is 150 m or better.

A distance that falls from 124 m to 95 m is moving toward the centre the distance is measured to. Both samples are inside a 420 m circle around that centre. Crossing out of that same circle during those seconds would require the red mark on screen to be a different circle, or the circle sliding off the screen as the map pans.

Stop 4 and stop 5 cannot both be GPS arrivals in one running session if the fresh-run gate is still closed. That gate allows only the lowest chapter, stop 1, until one GPS arrival clears it. A GPS arrival of stop 4 clears it. The stop-list jump to stop 4 also clears it, and then stop 5 plays. The hidden “Skip to next stop” control (shown only when `play_in_order` is true) does not clear the gate. Using it to mark 1–4 played would silence stop 4 as well as stop 5. This tour’s flag is false, so that button is not on the page.

## Ruled out for this progress line

- Forward-order lock, for “next 5” with four earlier stops done.
- `play_in_order` false being ignored in a way that skips stop 5. The strict flag is off. Numerical order still plays the lowest matching zone, which is stop 5 once 1–4 are played.
- Stop 4’s circle covering Furze Knoll. The circles do not meet.
- An info alert holding the player across the reviewed track. Those alerts sit outside the 420 m circle. If a fix is inside an alert and a story at the same time, the story is marked played, queued, and started when the alert ends. The progress line would then count stop 5.
- Walk membership removing stop 5. This tour’s walk lists are empty.
- A different radius or pin used by the circle than by the distance label. Both read the loaded chapter.
- The GitHub README being the code the phone ran.

## Still open on the phone

These gates update the dot first and then return, so the rider can appear inside the circle with no audio and no change to “next 5”:

1. Accuracy worse than 150 m. The diagnostics log line is `GPS fix too inaccurate — skipped`, and the ignored count increases. Stop 4 can still have fired earlier on a better fix. This is the gate that can be true for Furze Knoll alone.
2. Owner trial with the GPS switch off. Once the signed-in owner check succeeds, GPS triggering follows that switch and defaults off. The dot still moves. Manual taps still play. A GPS arrival of stop 4 in that same session means the switch was on at that moment, or the arrival was a tap.
3. The page is still in its fresh-run gate and stop 5 is not the lowest chapter. A GPS arrival of stop 4, or a jump to stop 4 from the stop list, ends that gate. It does not by itself explain stop 4 playing and stop 5 not playing afterwards.
4. The phone was offline and served an older cached bundle than the one compared here. Online loads use the network copy.

There is no server trail of which gate fired. The phone diagnostics log is the record.

## Studio save during the ride

From 12:09 to 12:16 GMT the studio wrote repeated manual and automatic snapshots. Only stop 5’s pin and radius changed. Audio names for stops 1, 2, 3, and 7 stayed on the files already stored, including stop 2’s `1794134138947-ElevenLabs_audio_composition_2026-11-08T10_33_36.mp3`. Nothing in this investigation wrote the database. Restoring the 420 m pin is a later studio decision, after the ride, with the editor that would otherwise save again closed. An open rider page will not see a restore until it reloads.

## Same pattern on other stops

Any enter stop uses this path. The progress line is enough to tell the cases apart:

- Next stop N, fewer than N stops done, and a later stop already played: numerical order is holding N back. That was not the Furze Knoll line.
- Next stop N, the diagnostics distance line says inside the zone, accuracy is 150 m or better, and there is no “Reached stop N” line: the phone was not running this decision, or an exception stopped it before the zone test. Copy that log.
- Next stop N and the diagnostics line says the fix is outside the zone: the loaded radius or pin is the one on screen. After 12:11 that loaded stop 5 is the 320 m circle, not the 420 m circle.
- Chapter 13 plays when the rider leaves its circle.

## Stationary check after the ride

Use a second phone if the ride is still open. Leave Tour Studio closed so another autosave cannot move the pin.

1. Reload the tour so the geometry is known. A reload tests the current 320 m circle at 51.395356, -1.957546. It does not recreate the 420 m failure. The already-open phone, if it has not reloaded since before 12:10, is the phone that still has the 420 m circle.
2. Open Diagnostics before moving. If the account is the owner, set the GPS triggering switch on and leave it on. Off keeps the dot moving and plays nothing.
3. Start or resume so the progress line reads next 5, with stop 5 not already played. Stand still at a point whose diagnostics line says `inside zone`, with accuracy at or under 150 m.
4. Expect a log line `Reached stop 5` and the Furze Knoll file to start. Do not tap the stop; a tap starts the file without a GPS arrival and marks it played.
5. If the log says `GPS fix too inaccurate — skipped`, the accuracy gate is what the phone did. If the switch is off, that is what the phone did. If the log shows a good fix, inside the zone, GPS on, and no reached line, copy the log before anyone changes the pin or the radius.

## Tests

`npm test` runs `docs/incidents/stop5-trigger-replay.test.mjs`. The tests lock the verified decision: stop 4 then stop 5, a jump to stop 4 after restart, a story queued during other audio, once-only replay, strict order, and the 150 m accuracy gate. They also record the current fresh-run behaviour: skipping 1–4 without clearing that gate plays nothing, including stop 4. That control is not shown when `play_in_order` is false.

No production change is included. The reported on-screen state already plays stop 5 in this decision, so a wider trigger or a data edit would hide the phone gate rather than fix a zone-math bug.
