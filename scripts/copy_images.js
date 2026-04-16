const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../public/images');
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

fs.copyFileSync(
    'C:/Users/PMYLS/.gemini/antigravity/brain/9934c7e7-a988-48ca-9196-96440228e5a1/hero_doctor_dashboard_1772771709991.png',
    path.join(dir, 'hero_doctor_dashboard.png')
);

fs.copyFileSync(
    'C:/Users/PMYLS/.gemini/antigravity/brain/9934c7e7-a988-48ca-9196-96440228e5a1/nepal_healthcare_tech_1772771742336.png',
    path.join(dir, 'nepal_healthcare_tech.png')
);

console.log('Images copied successfully.');
