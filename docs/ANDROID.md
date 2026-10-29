# Future Android APK preparation — evaluation only

Capacitor is a suitable first candidate for packaging this offline Canvas/DOM
browser game in Android WebView. It can copy the same built web-dist into an APK,
preserve touch/keyboard/Web Audio code, and add native lifecycle/file/controller
integration incrementally. No Capacitor dependency, generated Android project,
SDK, APK, engine migration or gameplay change is included in this task.

A later evaluated Capacitor version should use webDir: web-dist and a stable
Android application ID chosen with the owner. Keep the existing web manifest/Site
identity separate from that new Android package identifier. No remote production
server.url should be required for offline gameplay. Review whether the PWA worker
should register inside WebView; the current worker is only prepared through the
web setup flow, so do not force a second caching layer into the APK.

Required work/tools include a supported Node runtime, a pinned Capacitor CLI/core/
Android major, Android Studio or Gradle CLI, the JDK version required by that
Capacitor/Android Gradle Plugin release, Android SDK platform/build-tools, Gradle
wrapper and adb. Select actual compatible SDK/JDK/AGP versions when doing the
conversion rather than treating an untested matrix as installed. Signing keys,
application ID, versionCode, target/min SDK and distribution channel need an
explicit release plan; keep keystores/passwords outside Git and backed up safely.

An Android phone alone is suitable for APK installation/testing; compiling,
signing and SDK work should run in a configured computer/cloud Android build
runner. This workspace has not been verified as such a runner. No APK build time,
Play Store readiness or signing credential is claimed.

Test real devices in portrait/landscape, safe areas/navigation bars, Android Back,
second-finger joystick/Pause/Dash, rotation/interruption/process death, refresh
rate, thermal frame pacing, sound unlock/focus/mixing, file export/import, storage
failure/migrations and installed version updates. Browser localStorage does not
automatically migrate into a separate WebView origin: use the existing JSON
backup with explicit verification, never silently replace owner records.

The preserved rendering modules leave space for later 2.5D work, but the private
state/Canvas APIs are still coupled. First define a renderer interface behind
existing behavior tests and measure representative phone scenes. Multiplayer
would require separate authority, simulation/network/state/save design; controller
support needs real device/input mapping tests. None requires selecting Unity,
Three.js or any other engine as part of this infrastructure task.
