const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROJECT_NAME = 'TestProject';
const ROOT_DIR = path.join(__dirname, PROJECT_NAME);

// Utility to create directories safely
const mkdir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Create base directories
mkdir(ROOT_DIR);
mkdir(path.join(ROOT_DIR, 'Config'));
mkdir(path.join(ROOT_DIR, 'Saved'));

const contentDir = path.join(ROOT_DIR, 'Content');
mkdir(contentDir);
mkdir(path.join(contentDir, 'Materials'));
mkdir(path.join(contentDir, 'Textures', 'UI'));
mkdir(path.join(contentDir, 'Textures', 'Environment'));
mkdir(path.join(contentDir, 'Meshes', 'Characters'));
mkdir(path.join(contentDir, 'Meshes', 'Props'));
mkdir(path.join(contentDir, 'Maps'));
mkdir(path.join(contentDir, 'Audio'));
mkdir(path.join(contentDir, 'Blueprints'));

// 1. Create .uproject file
fs.writeFileSync(
  path.join(ROOT_DIR, `${PROJECT_NAME}.uproject`),
  JSON.stringify({
    FileVersion: 3,
    EngineAssociation: "5.3",
    Category: "",
    Description: "Fake Project for Testing",
    Modules: [
      {
        Name: PROJECT_NAME,
        Type: "Runtime",
        LoadingPhase: "Default"
      }
    ]
  }, null, 2)
);

console.log('Created project structure.');

let fileCount = 0;

// Helper to generate a dummy asset
const generateAsset = (subPath, name, ext, minSizeKB, maxSizeKB, contentString = '') => {
  const dir = path.join(contentDir, subPath);
  const filePath = path.join(dir, `${name}${ext}`);
  
  // Calculate size in bytes
  const sizeBytes = Math.floor(Math.random() * (maxSizeKB - minSizeKB + 1) + minSizeKB) * 1024;
  
  // Create buffer filled with random data (to simulate binary asset)
  const buffer = Buffer.alloc(sizeBytes);
  // Fill the first chunk with random data so hashes are different
  crypto.randomFillSync(buffer, 0, Math.min(1024, sizeBytes));
  
  // If we have a content string (e.g. for reference scanning), embed it at the start
  if (contentString) {
    buffer.write(contentString, 0, 'utf8');
  }
  
  fs.writeFileSync(filePath, buffer);
  fileCount++;
  return buffer; // return buffer to allow creating duplicates
};

// 2. Generate Maps
generateAsset('Maps', 'Level1', '.umap', 500, 2000, 'BP_Character M_Base T_Noise');
generateAsset('Maps', 'Level2', '.umap', 800, 3000, 'BP_Enemy M_Dark T_Wall');
generateAsset('Maps', 'MainMenu', '.umap', 100, 500, 'WBP_Menu');

// 3. Generate normal assets
for (let i = 1; i <= 20; i++) {
  generateAsset('Materials', `M_Material_${i}`, '.uasset', 10, 50);
  generateAsset('Textures/Environment', `T_EnvTex_${i}`, '.uasset', 500, 4000);
  generateAsset('Meshes/Props', `SM_Prop_${i}`, '.uasset', 100, 2000);
}

for (let i = 1; i <= 10; i++) {
  generateAsset('Blueprints', `BP_Class_${i}`, '.uasset', 20, 150, `SM_Prop_${i} M_Material_${i}`);
  generateAsset('Audio', `S_SoundEffect_${i}`, '.uasset', 50, 800);
  generateAsset('Textures/UI', `T_UI_Icon_${i}`, '.uasset', 5, 25);
  generateAsset('Meshes/Characters', `SK_Character_${i}`, '.uasset', 1000, 8000);
}

// 4. Create explicit intentional DUPLICATES
// Generate a 5MB base texture
const dupBuffer = generateAsset('Textures', 'T_BaseNoise', '.uasset', 5000, 5000, 'NOISE_DATA');

// Now save the exact same buffer 4 more times in different folders
const dupPaths = [
  'Textures/Environment/T_BaseNoise_Copy.uasset',
  'Materials/T_BaseNoise_Dup.uasset',
  'Meshes/Props/T_BaseNoise_Backup.uasset',
  'T_BaseNoise_Old.uasset' // root of Content
];

dupPaths.forEach(relPath => {
  const fullPath = path.join(contentDir, relPath);
  fs.writeFileSync(fullPath, dupBuffer);
  fileCount++;
});

console.log(`Generated ${fileCount} dummy asset files successfully.`);
console.log(`Intentional duplicates created for T_BaseNoise.`);
