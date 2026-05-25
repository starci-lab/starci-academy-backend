const fs = require('fs');
const path = require('path');

const desktopDir = 'C:\\Users\\Cuong\\Desktop';

function getMetadataFromMd(filePath) {
  const metadata = { title: '', description: '' };
  if (!fs.existsSync(filePath)) return metadata;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Get title
    let titleIdx = lines.findIndex(l => l.trim() === '# title');
    if (titleIdx !== -1) {
      for (let i = titleIdx + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && line !== '-----') {
          metadata.title = line;
          break;
        }
      }
    }
    
    // Get description
    let descIdx = lines.findIndex(l => l.trim() === '# description');
    if (descIdx !== -1) {
      let descText = '';
      let dividerCount = 0;
      for (let i = descIdx + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '-----') {
          dividerCount++;
          if (dividerCount === 2) break; // End of description block
        } else if (line && dividerCount === 1) {
          descText += (descText ? ' ' : '') + line;
        }
      }
      metadata.description = descText;
    }
  } catch (e) {
    // ignore
  }
  return metadata;
}

function scanCourse(coursePath) {
  const modulesPath = path.join(coursePath, 'modules');
  if (!fs.existsSync(modulesPath)) return [];
  
  const modules = fs.readdirSync(modulesPath).filter(m => {
    return m !== '_legacy-7-react-basic' && fs.statSync(path.join(modulesPath, m)).isDirectory();
  });
  
  modules.sort((a, b) => {
    const idxA = parseInt(a.split('-')[0], 10);
    const idxB = parseInt(b.split('-')[0], 10);
    return idxA - idxB;
  });
  
  const courseData = [];
  
  modules.forEach(mod => {
    const modIdx = parseInt(mod.split('-')[0], 10);
    const modSlug = mod.split('-').slice(1).join(' ');
    const modName = modSlug.charAt(0).toUpperCase() + modSlug.slice(1);
    
    const contentsPath = path.join(modulesPath, mod, 'contents');
    if (!fs.existsSync(contentsPath)) return;
    
    const lessons = fs.readdirSync(contentsPath).filter(l => {
      return fs.statSync(path.join(contentsPath, l)).isDirectory();
    });
    lessons.sort((a, b) => {
      const idxA = parseInt(a.split('-')[0], 10);
      const idxB = parseInt(b.split('-')[0], 10);
      return idxA - idxB;
    });
    
    const lessonsData = [];
    lessons.forEach(les => {
      const lesIdx = parseInt(les.split('-')[0], 10);
      const viMdPath = path.join(contentsPath, les, 'vi.md');
      const enMdPath = path.join(contentsPath, les, 'en.md');
      
      const metaVi = getMetadataFromMd(viMdPath);
      const metaEn = getMetadataFromMd(enMdPath);
      
      const lessonTitle = metaVi.title || metaEn.title || les.split('-').slice(1).join(' ');
      const lessonDesc = metaVi.description || metaEn.description || 'Chưa có mô tả bài học.';
      
      const chalPath = path.join(contentsPath, les, 'challenges');
      const challenges = fs.existsSync(chalPath) ? fs.readdirSync(chalPath).filter(c => {
        return fs.statSync(path.join(chalPath, c)).isDirectory();
      }) : [];
      
      const challengesData = [];
      challenges.forEach(chal => {
        const chalViPath = path.join(chalPath, chal, 'vi.md');
        const chalEnPath = path.join(chalPath, chal, 'en.md');
        const chalMetaVi = getMetadataFromMd(chalViPath);
        const chalMetaEn = getMetadataFromMd(chalEnPath);
        
        challengesData.push({
          slug: chal,
          title: chalMetaVi.title || chalMetaEn.title || chal,
          description: chalMetaVi.description || chalMetaEn.description || 'Chưa có mô tả thử thách.'
        });
      });
      
      lessonsData.push({
        index: lesIdx,
        title: lessonTitle,
        description: lessonDesc,
        challenges: challengesData
      });
    });
    
    courseData.push({
      index: modIdx,
      name: modName,
      lessons: lessonsData
    });
  });
  
  return courseData;
}

function generateMarkdown(data, title) {
  let md = `# ${title}\n\n`;
  md += `Tài liệu này tổng hợp lộ trình học chi tiết bao gồm mô tả nội dung từng bài học và hệ thống thử thách thực hành (challenges) đi kèm.\n\n`;
  
  data.forEach(m => {
    md += `## 📦 Module ${m.index}: ${m.name}\n\n`;
    m.lessons.forEach(l => {
      md += `### 📖 Bài ${l.index}: ${l.title}\n`;
      md += `> **Mô tả:** ${l.description.trim()}\n\n`;
      
      if (l.challenges.length > 0) {
        md += `#### 🛠️ Thử thách thực hành (Challenges):\n`;
        const order = { 'easy': 1, 'medium': 2, 'hard': 3, 'insane': 4 };
        l.challenges.sort((a, b) => {
          const diffA = a.slug.split('-').pop().toLowerCase();
          const diffB = b.slug.split('-').pop().toLowerCase();
          return (order[diffA] || 99) - (order[diffB] || 99);
        }).forEach(c => {
          const diff = c.slug.split('-').pop().toUpperCase();
          md += `* **[${diff}] ${c.title}**\n`;
          md += `  * *Mô tả:* ${c.description.trim()}\n`;
        });
      } else {
        md += `* *Chưa có thử thách cho bài học này.*\n`;
      }
      md += `\n`;
    });
    md += `---\n\n`;
  });
  
  return md;
}

console.log('Scanning courses and generating detailed roadmaps with content descriptions...');
const fsData = scanCourse('c:\\Repositories\\ac\\starci-academy-backend\\.mount\\data\\courses\\0-fullstack-mastery');
const sdData = scanCourse('c:\\Repositories\\ac\\starci-academy-backend\\.mount\\data\\courses\\1-system-design-mastery');

const fsMd = generateMarkdown(fsData, 'Lộ Trình Học Chi Tiết - Fullstack Mastery');
const sdMd = generateMarkdown(sdData, 'Lộ Trình Học Chi Tiết - System Design Mastery');

const fsDest = path.join(desktopDir, 'Lo_trinh_Fullstack_Mastery.md');
const sdDest = path.join(desktopDir, 'Lo_trinh_System_Design_Mastery.md');

fs.writeFileSync(fsDest, fsMd, 'utf8');
fs.writeFileSync(sdDest, sdMd, 'utf8');

console.log(`Success! Written to ${fsDest} and ${sdDest}`);
