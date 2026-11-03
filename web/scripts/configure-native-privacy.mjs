/**
 * Idempotent privacy defaults after 'cap add' / 'cap sync'.
 * Does not request broad external-storage permissions.
 * Imports are exclusively local; no cloud backup.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const androidManifest = resolve(root, 'android/app/src/main/AndroidManifest.xml');
if (existsSync(androidManifest)) {
  let source = readFileSync(androidManifest, 'utf8');
  if (!source.includes('android.permission.RECORD_AUDIO')) {
    source = source.replace(/<application\b/, '  <uses-permission android:name="android.permission.RECORD_AUDIO" />\n  <application');
  }
  source = source.replace(/<application\b([^>]*?)>/s, (match, attrs) => {
    let result = attrs.replace(/\sandroid:allowBackup="[^"]*"/g, '')
      .replace(/\sandroid:dataExtractionRules="[^"]*"/g, '');
    result += '\n    android:allowBackup="false" android:dataExtractionRules="@xml/no_audio_backup_rules"';
    return '<application' + result + '>';
  });
  writeFileSync(androidManifest, source);
  const path = resolve(root, 'android/app/src/main/res/xml/no_audio_backup_rules.xml');
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
  <cloud-backup><exclude domain="root" path="." /></cloud-backup>
  <device-transfer><exclude domain="root" path="." /></device-transfer>
</data-extraction-rules>
`);
  process.stdout.write('Android: microphone declaration and backup exclusion applied.\n');
}

const iosInfo = resolve(root, 'ios/App/App/Info.plist');
if (existsSync(iosInfo)) {
  let source = readFileSync(iosInfo, 'utf8');
  if (!source.includes('NSMicrophoneUsageDescription')) {
    source = source.replace('</dict>', `  <key>NSMicrophoneUsageDescription</key>
  <string>Use the microphone only when you open the instrument tuner.</string>
</dict>`);
  }
  writeFileSync(iosInfo, source);
  const privacyPath = resolve(root, 'ios/App/App/PrivacyInfo.xcprivacy');
  mkdirSync(dirname(privacyPath), { recursive: true });
  writeFileSync(privacyPath, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
 "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
 <key>NSPrivacyAccessedAPITypes</key>
 <array>
  <dict>
   <key>NSPrivacyAccessedAPIType</key>
   <string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
   <key>NSPrivacyAccessedAPITypeReasons</key>
   <array><string>C617.1</string></array>
  </dict>
 </array>
</dict>
</plist>
`);

  // Ensure the generated privacy manifest is actually in the iOS app bundle.
  const projectPath = resolve(root, 'ios/App/App.xcodeproj/project.pbxproj');
  if (existsSync(projectPath)) {
    let project = readFileSync(projectPath, 'utf8');
    if (!project.includes('PrivacyInfo.xcprivacy')) {
      const fileId = 'BBBBBBBBBBBBBBBBBBBBBBB1';
      const buildId = 'BBBBBBBBBBBBBBBBBBBBBBB2';
      const marks = [
        '/* Begin PBXBuildFile section */',
        '/* Begin PBXFileReference section */',
        /\n\s*[A-F0-9]{24} \/\* Info.plist \*\/,/,
        /\n\s*[A-F0-9]{24} \/\* Assets.xcassets in Resources \*\/,/,
      ];
      const adds = [
        '\n\t\t' + buildId + ' /* PrivacyInfo.xcprivacy in Resources */ = {isa = PBXBuildFile; fileRef = ' + fileId + ' /* PrivacyInfo.xcprivacy */; };',
        '\n\t\t' + fileId + ' /* PrivacyInfo.xcprivacy */ = {isa = PBXFileReference; lastKnownFileType = text.xml; path = PrivacyInfo.xcprivacy; sourceTree = "<group>"; };',
        '\n\t\t\t\t' + fileId + ' /* PrivacyInfo.xcprivacy */,',
        '\n\t\t\t\t' + buildId + ' /* PrivacyInfo.xcprivacy in Resources */,',
      ];
      marks.forEach((mark, index) => {
        if (!(typeof mark === 'string' ? project.includes(mark) : mark.test(project))) {
          throw new Error('iOS privacy manifest project anchor not found: ' + index);
        }
        project = project.replace(mark, matched => matched + adds[index]);
      });
      writeFileSync(projectPath, project);
    }
  }
  process.stdout.write('iOS: tuner microphone usage and filesystem privacy manifest applied.\n');
}
if (!existsSync(androidManifest) && !existsSync(iosInfo)) {
  process.stdout.write('No native project generated yet; nothing changed.\n');
}
