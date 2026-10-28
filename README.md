# Last Stand: After Dark

Zombie survival roguelite for Android and web.

## Current baseline

`Last_Stand_After_Dark_Alpha_0_82.html` is the original Alpha 0.82 file, imported without changes. It contains the game, JavaScript, and embedded art/audio assets in one HTML file. No package installation or build is required for this baseline.

Verified import: 12,579,589 bytes; Git blob SHA `fd9e098f4a8d91449bf594ad126b25e5d190b538` matches the owner-supplied file exactly.

## Run locally

From the repository folder, with Python 3 installed:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/Last_Stand_After_Dark_Alpha_0_82.html` in a browser. To test on an Android phone on the same Wi-Fi, open the computer's local network address on port 8000 with the same filename. Local firewall settings may need to allow the server. Stop the server when finished.

Game saves remain in the browser's local storage; importing the source does not transfer existing player saves. Use the game's backup/export feature before changing browser or address.

## Branches and next development

- `main`: preserve the imported Alpha 0.82 baseline.
- `threejs-conversion`: starting branch for the planned Three.js conversion, with shared browser and Android builds.

The conversion and APK packaging have not been implemented. Keep the original HTML as a reference, preserve gameplay and mobile controls, and make conversion changes on `threejs-conversion` before reviewing them for merge.

## Validation

The supplied HTML parsed successfully; embedded asset JSON and JavaScript syntax checks passed during import. Full gameplay and Android device testing are still required before claiming runtime compatibility for future changes.
