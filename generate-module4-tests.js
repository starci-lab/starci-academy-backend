const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTestFlow(lessonDir, outPath, tests) {
    console.log(`Starting test flow for ${lessonDir}`);
    // Setup docker
    if (fs.existsSync(path.join(lessonDir, '.docker', 'compose.yaml'))) {
        execSync('docker compose up -d', { cwd: path.join(lessonDir, '.docker'), stdio: 'inherit' });
        await wait(5000); // wait for DB
    }

    // Start server
    execSync('npm.cmd run build', { cwd: lessonDir, stdio: 'inherit' });
    const serverProcess = spawn('node', ['dist/main.js'], { cwd: lessonDir });
    
    serverProcess.stdout.on('data', (data) => console.log(`[SERVER]: ${data}`));
    serverProcess.stderr.on('data', (data) => console.error(`[SERVER ERR]: ${data}`));

    await wait(3000); // wait for server to start

    let markdown = `# Verification: ${path.basename(lessonDir)}\n\n`;

    for (const test of tests) {
        markdown += `### ${test.title}\n\n`;
        markdown += `**Request:**\n\`\`\`bash\n${test.curl}\n\`\`\`\n\n`;
        markdown += `**Expected Response:**\n\`\`\`json\n`;
        
        try {
            const fetchOpts = {
                method: test.method,
                headers: test.headers || {}
            };
            if (test.body) {
                fetchOpts.headers['Content-Type'] = 'application/json';
                fetchOpts.body = JSON.stringify(test.body);
            }
            if (test.redirect) {
                fetchOpts.redirect = test.redirect;
            }

            const res = await fetch(`http://localhost:3000${test.path}`, fetchOpts);
            const status = res.status;
            let resBody = '';
            
            if (test.redirect === 'manual' && status === 302) {
                resBody = JSON.stringify({ status: 302, location: res.headers.get('location') }, null, 2);
            } else {
                try {
                    const json = await res.json();
                    resBody = JSON.stringify(json, null, 2);
                    // Pass dynamic tokens to next steps if needed
                    if (test.onResponse) test.onResponse(json);
                } catch(e) {
                    resBody = await res.text();
                }
            }

            markdown += `// Status: ${status}\n${resBody}\n`;
        } catch (e) {
            markdown += `// Error: ${e.message}\n`;
        }
        markdown += `\`\`\`\n\n`;
    }

    // Teardown
    serverProcess.kill();
    if (fs.existsSync(path.join(lessonDir, '.docker', 'compose.yaml'))) {
        execSync('docker compose down -v', { cwd: path.join(lessonDir, '.docker'), stdio: 'inherit' });
    }

    fs.writeFileSync(outPath, markdown);
    console.log(`Saved ${outPath}`);
}

async function main() {
    const basePath = 'c:/Repositories/ac/starci-academy-backend/.repo/fullstack-mastery-module-4-authentication-authorization-jwt-rbac';
    const outBase = 'c:/Repositories/ac/starci-academy-backend/.mount/data/courses/0-fullstack-mastery/modules/3-authentication-authorization-jwt-rbac/contents';

    let accessToken = '';
    let refreshToken = '';

    // L0
    await runTestFlow(
        path.join(basePath, '0-jwt-authentication-flow'),
        path.join(outBase, '0-jwt-authentication-flow', 'test.md'),
        [
            {
                title: '1. Register User',
                method: 'POST',
                path: '/auth/signup',
                body: { email: 'test@example.com', password: 'password123', name: 'Test User' },
                curl: 'curl -X POST http://localhost:3000/auth/signup -H "Content-Type: application/json" -d \'{"email":"test@example.com","password":"password123","name":"Test User"}\''
            },
            {
                title: '2. Login User',
                method: 'POST',
                path: '/auth/signin',
                body: { email: 'test@example.com', password: 'password123' },
                curl: 'curl -X POST http://localhost:3000/auth/signin -H "Content-Type: application/json" -d \'{"email":"test@example.com","password":"password123"}\'',
                onResponse: (data) => { accessToken = data.access_token; }
            },
            {
                title: '3. Access Protected Route',
                method: 'GET',
                path: '/users/profile',
                get headers() { return { 'Authorization': `Bearer ${accessToken}` }; },
                get curl() { return `curl -H "Authorization: Bearer <access_token>" http://localhost:3000/users/profile`; }
            }
        ]
    );

    // L1
    accessToken = '';
    refreshToken = '';
    await runTestFlow(
        path.join(basePath, '1-refresh-token-strategy'),
        path.join(outBase, '1-refresh-token-strategy', 'test.md'),
        [
            {
                title: '1. Register User',
                method: 'POST',
                path: '/auth/signup',
                body: { email: 'rt@example.com', password: 'password123', name: 'RT User' },
                curl: 'curl -X POST http://localhost:3000/auth/signup -H "Content-Type: application/json" -d \'{"email":"rt@example.com","password":"password123","name":"RT User"}\''
            },
            {
                title: '2. Login User (Gets AT + RT)',
                method: 'POST',
                path: '/auth/signin',
                body: { email: 'rt@example.com', password: 'password123' },
                curl: 'curl -X POST http://localhost:3000/auth/signin -H "Content-Type: application/json" -d \'{"email":"rt@example.com","password":"password123"}\'',
                onResponse: (data) => { accessToken = data.access_token; refreshToken = data.refresh_token; }
            },
            {
                title: '3. Refresh Token',
                method: 'POST',
                path: '/auth/refresh',
                get headers() { return { 'Authorization': `Bearer ${refreshToken}` }; },
                get curl() { return `curl -X POST http://localhost:3000/auth/refresh -H "Authorization: Bearer <refresh_token>"`; },
                onResponse: (data) => { accessToken = data.access_token; refreshToken = data.refresh_token; }
            },
            {
                title: '4. Logout',
                method: 'POST',
                path: '/auth/logout',
                get headers() { return { 'Authorization': `Bearer ${accessToken}` }; },
                get curl() { return `curl -X POST http://localhost:3000/auth/logout -H "Authorization: Bearer <access_token>"`; }
            }
        ]
    );

    // L2
    accessToken = '';
    await runTestFlow(
        path.join(basePath, '2-rbac-and-guards'),
        path.join(outBase, '2-rbac-and-guards', 'test.md'),
        [
            {
                title: '1. Register Admin User',
                method: 'POST',
                path: '/auth/signup',
                body: { email: 'admin@example.com', password: 'password123', name: 'Admin', role: 'ADMIN' },
                curl: 'curl -X POST http://localhost:3000/auth/signup -H "Content-Type: application/json" -d \'{"email":"admin@example.com","password":"password123","name":"Admin","role":"ADMIN"}\''
            },
            {
                title: '2. Login Admin User',
                method: 'POST',
                path: '/auth/signin',
                body: { email: 'admin@example.com', password: 'password123' },
                curl: 'curl -X POST http://localhost:3000/auth/signin -H "Content-Type: application/json" -d \'{"email":"admin@example.com","password":"password123"}\'',
                onResponse: (data) => { accessToken = data.access_token; }
            },
            {
                title: '3. Access Admin Dashboard',
                method: 'GET',
                path: '/admin/dashboard',
                get headers() { return { 'Authorization': `Bearer ${accessToken}` }; },
                get curl() { return `curl -H "Authorization: Bearer <access_token>" http://localhost:3000/admin/dashboard`; }
            }
        ]
    );

    // L3
    await runTestFlow(
        path.join(basePath, '3-oauth2-google-login'),
        path.join(outBase, '3-oauth2-google-login', 'test.md'),
        [
            {
                title: '1. Initiate Google OAuth (Redirect)',
                method: 'GET',
                path: '/auth/google',
                redirect: 'manual',
                curl: 'curl -i http://localhost:3000/auth/google'
            }
        ]
    );

}

main().catch(console.error);
