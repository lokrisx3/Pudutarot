const fs = require('fs');
const cssPath = 'styles.css';
let css = fs.readFileSync(cssPath, 'utf8');
const current = `.header-brand {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.header-brand h1 {
  margin: 0;
}

.header-brand-icon {
  width: 42px;
  height: auto;
  display: block;
}

`;
if (!css.includes(current)) {
  throw new Error('Current header-brand block not found');
}
const replacement = `.header-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
  margin-bottom: 15px;
}

.header-brand h1 {
  margin: 0;
}

.header-brand-icon {
  width: 42px;
  height: auto;
  display: block;
}

`;
css = css.replace(current, replacement);
fs.writeFileSync(cssPath, css, 'utf8');
