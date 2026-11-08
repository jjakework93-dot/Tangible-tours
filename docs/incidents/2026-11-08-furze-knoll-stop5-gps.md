# Furze Knoll stop 5 and stop 7 GPS autoplay — 8 November 2026

Tour `79685f26-e428-4561-abe7-32bafa7a4d2a`, Devizes to Avebury by Bike. Stop 5, Furze Knoll, played from a tap and did not start on its own while the rider was in the red circle. This note separates what was checked from what is still only a possibility. No tour data was written, no stop was recreated, and the published site was not changed.

## What this repository is

`jjakework93-dot/Tangible-tours` contained only a README when this investigation started. The published rider app is the Lovable project `f2f122a8-b6c9-4dcc-9fbb-9a9848e53ae2`, commit `9b2642722bd0d5a369543b804a739c4af01ce74d` (5 November 2026, “Fix Google Ads loader typing”). The later preview commit is recorded below and is not the public site.

The public site is https://tangibletours.com. Its published page still carries `data-commit-sha="9b2642722bd0d5a369543b804a739c4af01ce74d"` and `assets/index-BP7lQ-Wm.js`. Publishing is a separate Lovable action, and that snapshot was not republished. An unpublished preview commit, `0e1e9294c843725b4f4bfe9a580fe3062523eaae`, now holds the queue edit described below. The preview address returned 401 from this environment, so the GPS screen was not clicked there. Lovable’s typecheck on that edit passed. The service worker asks the network first and uses its cache when the network fails. An online phone on the public site is still on the published snapshot.

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

## Stop 7, read back without writing

At 13:06 GMT stop 7, “On to Silbury Hill”, was still 51.392409, -1.880840, radius 376 m, trigger on enter, playback once, audio `1793561910246-ry-to-sil-new-bike-t.mp3`. Its row timestamp is the same 12:16 bulk save as the other chapters. The pin and the file name match the earlier reading. Stop 6, “The Wansdyke”, was still 51.390921, -1.914480, radius 300 m. The saved route’s nearest vertex is about 10 m from the stop 7 pin and about 6 m from the stop 6 pin, so an accurate fix on that line is inside both circles. Stop 6 and stop 7 circles are about 2,340 m apart and do not meet.

The same published function that plays stop 5 plays stop 7 when the fix is inside 376 m and the gates below are open. There is still no uploaded diagnostics line, so there is no server evidence that accuracy, an info queue, or any other gate fired for stop 7.

## Stop 8, same ride, same limit

At 13:24 GMT stop 8, “Silbury Hill”, was still 51.414836, -1.857679, radius 102 m, trigger on enter, playback once, empty trim, audio `1793563489597-Silbury-New.mp3`. The row timestamp is the same 12:16 bulk save. The saved route’s nearest vertex is on that pin, inside the 102 m circle. The 150 m guard uses the reported accuracy, not the zone size, so it applies to this smaller circle in the same way as to stops 5 and 7. A reported point on the pin with accuracy 151 is rejected and the stop is not marked played. A reported point on the pin with accuracy 12 plays. There is no phone log that the guard did this on the ride. The 300 m proposal stays unapproved because of the false warnings already measured.

A cause that fits all three stops has to leave each one unplayed if the progress line was still “next” when the rider was inside it. These session states do that, and they last until the page is reloaded or the switch is changed:

- Reported accuracy over 150 m on each fix. The banner still moves. Info audio is skipped on those same fixes.
- The owner GPS switch off.

These do not fit a run of unplayed stops, because each one marks the stop played:

- A blocked info `play()`. The info title stays current. The promise rejection does not call the completion handler. Stops 5, 7, and 8 would be queued and counted done, with no “starting audio” line, until Skip. The media `error` event does call completion and would then start the held story. Stop 5 staying on “next 5” means this hold had not happened yet.
- A rejected story `play()`. The played mark is written before `play()`, and the rejection only toasts. The stop stays counted and is not armed again.
- The fresh-run gate ends at the first GPS arrival. A GPS play of stop 4, or a jump from the stop list, leaves later stops free. It cannot by itself silence 5, 7, 8, and 9.

## Stop 9, and the map gesture

At 13:28 GMT chapter 9 was still “West Kennet Long Barrow”, 51.414157, -1.851983, radius 60 m, trigger on enter, playback once, empty trim, audio `1793566344050-West-Kennet-Long-Barrow-NEW-Bike-Tour.mp3`. The same 12:16 save. Silbury Hill is chapter 8. The saved route passes through this 60 m circle. Zooming that map out and back in did not start the speech. The earlier moment at stop 8, described as the map going off and on, did start speech once. That pair of results means the gesture is not a remedy.

The published page has three different map actions:

- Pinch zoom on the rider map, and the expand/collapse button, only change the map view. The map stays mounted. The GPS watch, the fresh-fix request, the played set, and the audio queue are untouched.
- “Show offline map” hides the live map and leaves it mounted. The on-page note says GPS stories continue. It does not restart the watch or play a held story.
- The page becoming visible again, which is what leaving the tour and coming back does, restarts the watch, asks for a new fix, and if a story is already waiting and the player is idle, starts that story. Coming online or a `pageshow` asks for a new fix and does not by itself play the waiting story.

Zoom failing at stop 9 matches the first action. It does not show whether stop 8 was a held story being released, or a later fix that the zone test accepted. It also does not show that the pins are right. A screen recording that names the control, and the diagnostics lines just before and after it, is what separates those. Do not repeat the gesture as a way to make a stop play.

The map clock and a fast-forward to about 11 minutes stay a separate report. Zoom does not seek the audio. The map time reads the same player and is not a second copy of the file.

## Exit worked, arrivals 5, 7, 8, 9, 10, and 12 did not

The field report is now those six arrival misses. Stop 12 is Avebury Henge, 51.428526, -1.854198, radius 60 m, enter, once. It is a miss. Jake heard a later stop and could not say whether it was 11 or 12. Because 12 failed, that success stays unidentified. It is not counted as stop 12, and it is not assigned to stop 11, the Red Lion. No stored title or info line contains “Avery”.

The finishing speech worked, and a leaving-zone trigger worked. The only chapter stored as an exit is 13, Farewell, at 51.430148, -1.853817, radius 350 m. A log line `Departure message 13` or `Left blue zone 13` is what would tie the rider’s words to that chapter. Manual play of stop 5 also worked. Stop 5 on the master row remains 51.395356, -1.957546, radius 320 m. The phone’s cached copy of that circle is still unknown.

Exit arming and the exit fire sit behind the same early returns as an arrival: the owner switch and reported accuracy over 150 m. A played exit means those two returns were open on the fix that armed the zone and on the fix that left it, and that the player could start a GPS clip. It does not mean they were open at stops 5, 7, 8, 9, 10, or 12. The harness can replay a ride where those arrivals are rejected and the exit still plays, and a ride where the same arrivals play and the exit still plays. The contrast by itself is not a cause. The 300 m proposal stays unapproved.

A miss that never logs `Reached stop` does not fetch that clip. Manual play of stop 5, and a GPS exit that did start audio, are separate from a zone test that never accepted the arrival. Signal between villages, and better signal at Avebury, stays a field impression. Stop 12 is in Avebury and failed, so village coverage is not an explanation.

## Phone log, 13:46–13:56, this session only

Jake attached the on-phone diagnostics at 14:35. He warned the tour had been stopped and restarted, and that this buffer is the latest session, not the earlier stop 5 miss. The raw track is not copied here. Times below are the event lines. Accuracies on the arrival and exit lines in this buffer are ±4 m. No `GPS fix too inaccurate` line appears.

Recorded order:

- 13:46:43 left red zone 11, the Red Lion. This buffer has no `Reached stop 11` line. 13:47:46 logs `Audio started: The Red Lion, Avebury`. That PLAY line alone does not show an automatic arrival.
- 13:48:15 entered and started `Rider Alert: Avebury Village` at ±4 m.
- 13:48:28 `Audio completed: Rider Alert: Avebury Village`.
- 13:48:37 entered blue zone 13, Farewell.
- 13:49:26 entered red zone 12 and `Reached stop 12: Avebury Henge` at ±4 m, then `WAITING IN QUEUE: stop 12 — position 1 of 1, plays after "Rider Alert: Avebury Village" finishes`.
- 13:50:04 left red zone 12.
- 13:51:05 left blue zone 13. 13:51:08 the departure was queued and Farewell’s audio start was logged. The 150 m return was open on that fix.
- 13:51:42 is the last GPS line before a run of `GPS quiet — auto-refreshing location` notes. Those notes are the page timer, not a network diagnosis. A fix returns at 14:34:06 with accuracy ±18 m, then the reported accuracy settles through the high twenties into single digits. Another leave of blue zone 13 is logged then.
- 13:54:04 `Audio completed: Farewell`, then `Leaving queue: stop 12` and a PLAY line for Avebury Henge.

Stop 12’s arrival in this log passed the accuracy return and the zone test. The 150 m guard is not the cause of this delay. The story was held for about four and a half minutes after the info clip had already logged completion, and it started when Farewell’s completion drained the queue, after the rider had already left zone 12.

The published busy check is `opening`, or a current clip whose id begins with `info-`, or audio that is actually playing. Completion runs the next queued clip and does not clear the current clip when nothing is waiting. The waiting-line text is that current title. At 13:49:26 the title was still the info alert whose completion had been logged at 13:48:28, and there is no second info PLAY line in between. The likely source is that finished info clip remaining current, so the info-id check stays true after `ended`. The exit path starts Farewell from audio being idle, which does not look at that info id, so Farewell can begin while the old title is still current. Farewell’s own completion then reaches `Leaving queue`. That is the code path that produces this log. It is not a second arrival of stop 12.

Extra PLAY lines after the labelled `stop 12:` and `stop 13:` starts are further `playing` events on the same element. They are not extra GPS triggers, and a PLAY line is not proof the rider heard the audio.

That change is now in the unpublished preview commit below. It is not on https://tangibletours.com. This log does not explain the earlier stop 5 miss.

## Unpublished preview commit

The published player remains Lovable commit `9b2642722bd0d5a369543b804a739c4af01ce74d`. On 8 November 2026 the same three edits were applied to project `f2f122a8-b6c9-4dcc-9fbb-9a9848e53ae2` and saved as commit `0e1e9294c843725b4f4bfe9a580fe3062523eaae`. The diff is only `src/routes/gps-tours.$slug.tsx`: six added lines and two removed. The target lines were read at the baseline before the edit. Lovable reported a passing typecheck. `deploy_project` was not called. After the commit, the public homepage still named `9b2642722bd0d5a369543b804a739c4af01ce74d` and did not contain `0e1e9294`. Preview URL: https://id-preview--f2f122a8-b6c9-4dcc-9fbb-9a9848e53ae2.lovable.app. Editor: https://lovable.dev/projects/f2f122a8-b6c9-4dcc-9fbb-9a9848e53ae2. This environment got 401 from the preview, so the GPS page was not exercised there. Rollback of the preview is the baseline commit in Lovable version history. The public site does not need a rollback.

The patch file is `docs/incidents/patches/finished-info-does-not-hold-arrival.patch`. It targets `src/routes/gps-tours.$slug.tsx` at that commit. It does three things: an info title counts as busy only until its audio has ended; the next alert is not blocked by an info title whose audio has ended; and when a clip finishes with nothing waiting, that current clip is cleared. A paused or rejected info clip still holds the next stop. The owner switch and the 150 m return are unchanged. Farewell still starts when the player is idle, and waits when a story is actually playing.

`queue-side-by-side.test.mjs` runs the published rule and the patched rule on the same events. The published rule queues stop 12 after the finished Avebury Village alert. The patched rule starts stop 12 at that arrival. This is not a phone proof. The bug sits in the one GPS rider player used for these tours, so any later arrival can be held after an info alert has finished. The phone log confirms that only for stop 12. It does not show that stops 5, 7, 8, 9, or 10 failed for this reason.

## What to copy from the phone after the ride

One diagnostics copy covers the missed arrivals 5, 7, 8, 9, 10, and 12, plus the leaving speech. The lines that separate the cases are `GPS fix too inaccurate — skipped`, `Reached stop` with the number, `WAITING IN QUEUE`, `Leaving queue`, `Departure message` or `Left blue zone`, and `Info recording blocked` or `could not start`. Do not record stop 12 as a pass. If another later stop played, leave its number blank unless the log names it. The owner switch being off for the whole session would also have blocked the exit that did play. Zooming the map is not a remedy.

## What “appears” means in this app

The rider map does not draw an ordinary info pin. Parking and walk-start markers are the exception. A rider who sees a numbered pin and a red circle is seeing the stop, loaded with the chapter, with no accuracy test involved. The next-stop name and the distance are written from the GPS fix before the accuracy return, so that banner updates when the fix is rejected.

Info audio and story audio share the next step. After the dot is stored, a reported accuracy over 150 m returns. That return skips the info queue and the story test together. A diagnostics line `Info speech queued` is evidence the guard let the fix through. A player title that names an info point is also after that guard: the title is set when the queue starts the clip, including when `play()` is rejected and no sound starts. Seeing the next-stop banner is not that event.

## Info queue lifecycle

Info rows on this tour were created from 25 October through 4 November. None were created on 8 November. They are small circles, 10–50 m, with their own audio. They do not share a stop’s pin. The A361 alert is about 1,780 m from stop 7 and about 580 m from stop 6, so it is not inside either story circle.

On a fix the guard has accepted:

1. An alert with audio, not yet heard, whose reported point is inside its circle, is marked heard and pushed on the info queue. The heard mark is written before sound starts.
2. If the player is not already on an info clip, the queue starts that alert and sets the current clip to it.
3. The story test still runs on the same fix. If the story zone matches and the current clip is an info title, or audio is playing, the story is marked played and held. The log gets `Reached stop N` and `WAITING IN QUEUE: stop N`. The progress count includes N.
4. When the info clip reaches `ended`, or its error handler runs, the held story starts.
5. A rejected `play()` does not reach that completion handler. The info title stays current, audio stays paused, and later fixes do not start the story. The story is already marked played, so the zone will not arm it again. Skip clears the current clip and then starts the held story.
6. A pause of an info clip leaves the same busy state, because the busy check treats any current info title as busy even when audio is paused.

That hold is a real property of the published caller. It fits a ride only when the log contains both the reached line and the waiting line, and the progress count includes the stop. Stop 5’s reported line stayed “4 of 13, next 5”, so that hold had not marked stop 5. Stop 7’s progress count was not reported, so the log is what separates a hold from a rejected fix.

Deleting the info rows and adding them again is not supported by this. The rows are not inside the stop 5 or stop 7 circles. Removing them would drop the A361 warning the saved line does enter, and it would leave the accuracy return and the stop pins as they are. No test here shows a benefit from that destruction.

## Diagnostic decision tree

Copy the on-phone diagnostics before changing a pin, a radius, or an alert.

| On the phone | Established meaning |
| --- | --- |
| Distance updates, ignored count rises, line `GPS fix too inaccurate — skipped`, no `Info speech queued`, no `Reached stop` | The accuracy guard rejected the fix. Info audio and the story were both skipped. The banner can still name the next stop. |
| `Info speech queued`, then `Reached stop N` and `WAITING IN QUEUE: stop N`, progress includes N | The story was accepted and is held behind the info clip. Skip, or the info clip ending, is what starts it. A blocked `play()` leaves the info title on screen without the completion step. |
| Diagnostics distance says outside the zone | The loaded pin and radius do not contain the fix. The accuracy number was not the reason. After 12:11 a reload of stop 5 uses the 320 m circle. |
| Accuracy at or under 150, distance says inside, GPS switch on, and no reached line | This published decision would have played the stop. Keep the log. |
| Owner GPS switch off | The dot still moves. Triggers return before info and story tests. |

There is no server copy of this log. Nothing read today shows the accuracy number from the ride. A smooth change in the distance label is the reported position. It is not the reported accuracy, and it is not a speed measurement. The guard does not read speed. A stationary fix and a moving fix with the same reported accuracy take the same branch.

## Accuracy proposal, measured and not adopted

The proposal was an immediate threshold around 300 m, plus a timed fallback while reported accuracy stays poor. The owner has not approved a live number. These runs use the saved 957-point route, about 22.3 km, and labelled synthetic fixes. They do not show what the phone reported, and they do not show that either proposal would have played stop 5 or stop 7 on the ride.

The probe used for the fallback, and only as a probe, is: accept at once when reported accuracy is 150 m or better; after the reported point has stayed inside one zone for 20 seconds, also accept 151–300 m. Accuracy over 300 m stays rejected.

What the saved geometry does:

- Stop 7’s circle contains the route. A reported point 80 m from that pin with reported accuracy 220 is a true inside fix. The live 150 m guard rejects it. An immediate 300 m guard plays it on the first sample. The 20-second probe plays it only after that dwell. Accuracy 340 stays rejected by all three.
- The same reported accuracy at speed 0 and at 8.5 m/s is the same decision. Speed is not part of the guard.
- A report sitting on the A361 pin with reported accuracy 250, while the labelled true point is 250 m away, is rejected at 150 m and is a false road warning at immediate 300 m and after the 20-second probe. A report that claims accuracy 40 m while the true point is 250 m away fires on every policy. No threshold sees an error the phone does not report.
- The A361 alert, radius 50 m, has its nearest saved vertex about 45 m away. About 70 m of the saved line is inside the circle, near 10.8 km. The Wansdyke pin’s nearest vertex is near 10.2 km, about 600 m earlier along the line. The story circle and the crossing alert are different places. One 70 m parallel copy of the line misses the 50 m circle; the saved line and the other parallel copy enter it. That is a route-side fact. It does not identify a safe side, and nothing was moved.
- The 10 m “Rider Alert: Road Crossing” near Furze Knoll has its nearest saved vertex about 11 m away, so the saved line does not enter that circle. Raising the accuracy ceiling does not pull an on-route point at 11 m into a 10 m circle. Accepting a noisy report that does land inside it would play a warning the saved line never enters.
- Worst-case error aimed at a pin can fire a circle from anywhere within radius plus the accepted accuracy. For the A361 alert the route length inside that outer reach grows from the short true crossing, through a few hundred metres at 150 m of error, to a longer stretch at 300 m of error. The exact lengths are recomputed by `accuracy-proposal.test.mjs`.
- Empty ground between neighbouring circles is 234 m for stops 2 and 3, 290 m for stops 4 and 5 on the current pins, and 240 m for stops 8 and 9. An error of 150 m cannot bridge those circles. An error of 300 m can. Stop 6 and stop 7 stay far apart.

A stale coordinate is a different number from reported accuracy. The published watch may reuse a fix for up to 5 seconds. A 300 m rule does not reject a fresh-looking accuracy attached to an old coordinate. The fresh-run gate and a paused info title also still block a story when accuracy is 8 m. Changing the threshold does not touch those.

Recommendation: leave the live guard at 150 m. There is no phone log that it blocked stop 5 or stop 7. Immediate 300 m accepts false road warnings and can bridge three pairs of story circles. The 20-second probe is less hasty and still false-triggers a poor fix that sits still. Either change needs an approved number and a diagnostics log from a stationary check. This branch does not contain the app source, and no threshold was written into the published project.

## Separate route notes, not a safety fix

These are coordinate facts from the same read. They are not an instruction to move a pin or a line.

- The Wansdyke story pin and the A361 crossing alert are about 580 m apart in a straight line and about 600 m apart along the saved route. The story is the earlier of the two.
- The home checklist’s missing crossing warning matches two different geometries: the 10 m Road Crossing circle misses the saved line by a few metres, while the 50 m A361 circle contains a short piece of that line and can be missed by a parallel line 70 m to one side.
- The report that the map takes the wrong side of the Wansdyke is not resolved here. The two parallel copies above only show that 70 m is enough to leave the 50 m alert. They do not label a correct side.

## Stationary check after the ride

Use a second phone if the ride is still open. Leave Tour Studio closed so another autosave cannot move the pin.

1. Reload the tour so the geometry is known. A reload tests the current 320 m circle at 51.395356, -1.957546. It does not recreate the 420 m failure. The already-open phone, if it has not reloaded since before 12:10, is the phone that still has the 420 m circle.
2. Open Diagnostics before moving. If the account is the owner, set the GPS triggering switch on and leave it on. Off keeps the dot moving and plays nothing.
3. Start or resume so the progress line reads next 5, with stop 5 not already played. Stand still at a point whose diagnostics line says `inside zone`, with accuracy at or under 150 m.
4. Expect a log line `Reached stop 5` and the Furze Knoll file to start. Do not tap the stop; a tap starts the file without a GPS arrival and marks it played.
5. If the log says `GPS fix too inaccurate — skipped`, the accuracy gate is what the phone did. If the switch is off, that is what the phone did. If the log shows a good fix, inside the zone, GPS on, and no reached line, copy the log before anyone changes the pin or the radius.

## Missing opening consonants, not a file verdict

A rider report says some speeches lose the first letter or letters, with “school” coming out like “hall”. A separate read-only listen of the files is already checking the recordings. This pass only looked at the published player. No file was opened, regenerated, or replaced.

Every chapter on this tour, including stops 5, 6, and 7, has its own audio file, an empty master link, and empty start and end times. For that shape the published cut rule asks the player to begin at 0. There are no Horatio asides on this tour to interrupt the first moment. The player has no fade-in. The end guard of a hundredth of a second only pulls a seek back from the end of a cut. It leaves a zero start at zero.

The seek helper sets the time once immediately and again when the new file’s metadata arrives, because phones can drop an early seek. The drop the code is written for sends playback back to the beginning of the file, which keeps an opening rather than removing one. A positive saved start time is put back when metadata arrives, and that would skip the opening of a master cut. This tour’s stories do not have that start time.

Info clips, the farewell, and the walking buffer set the time to 0 in the same step as the source change and do not use that metadata retry. On a standalone file the requested time is already 0.

Code-supported ways the first fraction of a second can still be hard to hear, none of them confirmed on a phone:

- The queue pauses the shared player and then starts the next file at once. There is no inserted silence before the speech. Bluetooth headsets often swallow or duck the first part of a stream that starts after a pause. The phone speaker is the comparison that separates that from the file.
- The deck applies the speed stored on the phone at every play. A speed above 1× shortens the opening consonants. The control shows the rate. 1× is the unchanged rate.
- A master-linked stop with a non-zero start time would skip that much of the recording on purpose. That is not how these thirteen chapters are stored.

A file that itself begins mid-word would also play that way, because the player starts these chapters at 0 and does not repair the audio. That possibility belongs to the file audit. This player reading does not choose between a damaged file and a headset.

## Tests

`npm test` runs the incident harness. It is not the rider app.

- `stop5-trigger-replay.test.mjs` locks stop 4 then stop 5, a jump to stop 4 after restart, once-only replay, strict order, and the 150 m gate.
- `info-queue.test.mjs` locks the shared accuracy return, the rider map omitting ordinary info pins, a story held behind an alert until the alert completes, and a blocked info `play()` that keeps the info title up until skip.
- `stops-5-7-8-session.test.mjs` locks the current pins for stops 8 and 9, a shared skip across 5, 7, 8, and 9, and the fact that pinch zoom does not start a queued story while a page return can.
- `queue-side-by-side.test.mjs` runs the published rule and the patched rule on the same events. Only the patched rule starts stop 12 after the finished alert. That rule is now the unpublished preview commit. The public site is unchanged.
- `opening-seek.test.mjs` locks the published cut rule: a standalone story with no start time seeks to 0, and the end guard does not move that start.
- `accuracy-proposal.test.mjs` compares the live 150 m guard, an immediate 300 m guard, and a 20-second 300 m probe on the saved route, including speed, a poor fix inside stop 7, an under-reported error, the A361 false warning, the parallel shift, and the circle gaps.

All 56 tests passed in this run. The side-by-side harness shows the published hold and the patched release. Neither result is a phone trial. The public site is still the baseline commit.
