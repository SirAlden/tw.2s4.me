var logout = document.getElementById('logout')
var after = document.getElementById('after')
res = null;
data = null;
async function sendAdminRequest(actionPath, callback, opts = { get: false, delete: false }) {
    try {
        let method = "POST";
        if (opts.delete) {
            method = "DELETE";
        } else if (opts.get) {
            method = "GET";
        }

        const res = await fetch(`/admin/${actionPath}`, {
            method,
            credentials: "include",
            headers: (method !== "GET") ? { "Content-Type": "application/json" } : undefined,
            body: (method !== "GET" && opts.body) ? JSON.stringify(opts.body) : undefined
        });

        if (!res.ok) {
            const errorText = await res.text();
            document.getElementById("chk").innerText = res.status + ": " + errorText;
            return;
        }

        const contentType = res.headers.get("content-type");
        let data;
        if (contentType && contentType.includes("application/json")) {
            data = await res.json();
        } else {
            data = await res.text();
        }

        callback(data);

    } catch (err) {
        document.getElementById("chk").innerText = err.message || err;
    }
}
logout.addEventListener("click", () => {
    if (confirm("Are you sure you want to log out?")) {
        sendAdminRequest('logout', (data) => {
            if (data.refresh) {
                document.body.textContent = "You may need to refresh if you want to log back."
            }
        }, { get: true })
    }
});
function normString(input) {
    if (input === undefined || input === null) return "";
    if (typeof input === "string") return input;
    if (typeof input === "function") return input.toString();
    return String(input);
}

function noop() { }


const accTableBody = document.querySelector('#accountsTable tbody');
const accSearchInput = document.getElementById('accSearchInput');
const accRefreshBtn = document.getElementById('accRefreshBtn');
const accPaginationDiv = document.getElementById('accPagination');
let accCurrentPage = 1;
let accTotalPages = 1;
const accPageSize = 10;

const connTableBody = document.querySelector('#connectionsTable tbody');
const connSearchInput = document.getElementById('connSearchInput');
const connRefreshBtn = document.getElementById('connRefreshBtn');
const connPaginationDiv = document.getElementById('connPagination');
let connCurrentPage = 1;
let connTotalPages = 1;
const connPageSize = 10;

const worldsTableBody = document.querySelector('#worldsTable tbody');
const worldSearchInput = document.getElementById('worldSearchInput');
const worldRefreshBtn = document.getElementById('worldRefreshBtn');
const worldPaginationDiv = document.getElementById('worldPagination');
let worldCurrentPage = 1;
let worldTotalPages = 1;
const worldPageSize = 10;

function formatUnixTime(unixTime) {
    if (!unixTime) return '-';
    const date = new Date(unixTime * 1000);
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    const weekday = date.toLocaleString('en-US', { weekday: 'short' });
    return `${yy}/${mm}/${dd} ${hh}:${min}:${ss} ${weekday}`;
}

function prettifyHeader(key) {
    const words = key.replace(/([a-z])([A-Z])/g, '$1 $2').split(/[_\s]+/);
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function renderWorlds(data) {
    if (!data || !data.data || data.data.length === 0) {
        worldsTableBody.innerHTML = '<tr><td colspan="100%" style="text-align:center;">No worlds found.</td></tr>';
        worldPaginationDiv.innerHTML = '';
        return;
    }

    const attrKeys = Object.keys(data.data[0].attributes || {})
        .filter(key => key !== 'webhook' && key !== 'theme');

    const headRow = document.querySelector('#worldsTable thead tr');

    Array.from(headRow.querySelectorAll('.attrHeader')).forEach(el => el.remove());

    attrKeys.forEach(key => {
        const th = document.createElement('th');
        th.classList.add('attrHeader');
        th.innerText = prettifyHeader(key);
        th.style.width = '60px';
        headRow.insertBefore(th, headRow.querySelector('th:last-child'));
    });

    worldsTableBody.innerHTML = data.data.map(w => {
        const attrCells = attrKeys.map(k => {
            const v = w.attributes[k];
            return `<td style="text-align:center;">${v === true ? 'Yes' : v === false ? 'No' : v ?? 'No'}</td>`;
        }).join('');

        return `<tr>
            <td>${w.id}</td>
            <td>${w.namespace}</td>
            <td>${w.name}</td>
            ${attrCells}
            <td><a href="${w.link}" target="_blank" style="color:#80c0ff;">${w.link}</a></td>
        </tr>`;
    }).join('');
    const current = Number(worldCurrentPage);
    const total = Number(worldTotalPages);
    worldPaginationDiv.innerHTML = `
        <button ${current <= 1 ? 'disabled' : ''} onclick="worldPrevPage()">Prev</button>
        <span>Page ${current} of ${total}</span>
        <button ${current >= total ? 'disabled' : ''} onclick="worldNextPage()">Next</button>`;
}

function loadWorlds() {
    const q = worldSearchInput.value;
    const endpoint = q
        ? `worlds/search?q=${encodeURIComponent(q)}&page=${worldCurrentPage}`
        : `worlds?page=${worldCurrentPage}`;
    sendAdminRequest(endpoint, data => {
        if (data.invalid_page) {
            worldCurrentPage = 1;
            loadWorlds();
            return;
        }
        worldTotalPages = data.totalPages;
        renderWorlds(data);
    }, { get: true });
}

function worldPrevPage() { if (worldCurrentPage > 1) { worldCurrentPage--; loadWorlds(); } }
function worldNextPage() { if (worldCurrentPage < worldTotalPages) { worldCurrentPage++; loadWorlds(); } }

worldSearchInput.addEventListener('input', () => { worldCurrentPage = 1; loadWorlds(); });
worldRefreshBtn.addEventListener('click', () => loadWorlds());
loadWorlds();

function loadAccounts() {
    const q = accSearchInput.value;
    const endpoint = q ? `user/search?q=${encodeURIComponent(q)}&page=${accCurrentPage}`
        : `user/oldest?page=${accCurrentPage}`;
    sendAdminRequest(endpoint, data => {
        if (!data || !data.data || data.data.length === 0) {
            accTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No users found.</td></tr>';
            accPaginationDiv.innerHTML = '';
            return;
        }
        accTotalPages = data.totalPages;
        accTableBody.innerHTML = data.data.map(u => `<tr>
            <td>${u.user}</td>
            <td>${u.id}</td>
            <td style="text-align:center;">${u.online ? 'Yes' : 'No'}</td>
            <td>${u.where || '-'}</td>
            <td>${u.last_ip || '-'}</td>
            <td>${formatUnixTime(Math.floor(new Date(u.date_joined).getTime() / 1000))}</td>
            <td>
                <button ${u.online && u.goto ? '' : 'disabled'} onclick="gotoUserByName(${JSON.stringify(u.user)})">Go</button>
                <button onclick="rollbackByUserId(${u.id}, ${JSON.stringify(u.user)})">Rollback</button>
                <button ${u.last_ip || u.online ? '' : 'disabled'} onclick="banUserIp(${JSON.stringify(u.user)})">Ban IP</button>
            </td>
        </tr>`).join('');
        const current = Number(accCurrentPage);
        const total = Number(accTotalPages);
        accPaginationDiv.innerHTML = `<button ${current <= 1 ? 'disabled' : ''} onclick="accPrevPage()">Prev</button>
            <span>Page ${current} of ${total}</span>
            <button ${current >= total ? 'disabled' : ''} onclick="accNextPage()">Next</button>`;
    }, { get: true });
}
function accPrevPage() { if (accCurrentPage > 1) { accCurrentPage--; loadAccounts(); } }
function accNextPage() { if (accCurrentPage < accTotalPages) { accCurrentPage++; loadAccounts(); } }
accSearchInput.addEventListener('input', () => { accCurrentPage = 1; loadAccounts(); });
accRefreshBtn.addEventListener('click', () => loadAccounts());
loadAccounts();

function loadConnections() {
    const q = connSearchInput.value;
    const endpoint = q ? `active/search?q=${encodeURIComponent(q)}&page=${connCurrentPage}`
        : `active?page=${connCurrentPage}`;
    sendAdminRequest(endpoint, data => {
        if (!data || !data.data || data.data.length === 0) {
            connTableBody.innerHTML = '<tr><td colspan="12" style="text-align:center;">No connections found.</td></tr>';
            connPaginationDiv.innerHTML = '';
            return;
        }
        connTotalPages = data.totalPages;
        connTableBody.innerHTML = data.data.map(c => {
            const worldsLink = `<a href="#" class="connWorldLink">Worlds...</a>`
            return `<tr>
        <td>${c.username}</td>
        <td>${c.id}</td>
        <td style="text-align:center;">${c.isAdmin ? 'Yes' : 'No'}</td>
        <td style="text-align:center;">${c.authenticated ? 'Yes' : 'No'}</td>
        <td>${worldsLink}</td>
        <td>${c.xy.x},${c.xy.y}</td>
        <td style="text-align:center;">${c.anonymous ? 'Yes' : 'No'}</td>
        <td>${c.ip || '-'}</td>
        <td>${c.color_index}</td>
        <td>${c.where || '-'}</td>
        <td>
            <button ${c.goto ? '' : 'disabled'} onclick="gotoClient(${JSON.stringify(String(c.id))})">Go</button>
            ${c.authUserId
                ? `<button onclick="rollbackByUserId(${c.authUserId}, ${JSON.stringify(c.username)})">Rollback</button>`
                : `<button onclick="rollbackByClientId(${JSON.stringify(String(c.id))}, ${JSON.stringify(c.username)})">Rollback</button>`}
            ${c.ip ? `<button onclick="banUserIp(${JSON.stringify(c.ip)})">Ban IP</button>` : ''}
        </td>
    </tr>`;
        }).join('');



        const current = Number(connCurrentPage);
        const total = Number(connTotalPages);
        connPaginationDiv.innerHTML = `<button ${current <= 1 ? 'disabled' : ''} onclick="connPrevPage()">Prev</button>
            <span>Page ${current} of ${total}</span>
            <button ${current >= total ? 'disabled' : ''} onclick="connNextPage()">Next</button>`;
    }, { get: true });
}
function connPrevPage() { if (connCurrentPage > 1) { connCurrentPage--; loadConnections(); } }
function connNextPage() { if (connCurrentPage < connTotalPages) { connCurrentPage++; loadConnections(); } }
connSearchInput.addEventListener('input', () => { connCurrentPage = 1; loadConnections(); });
connRefreshBtn.addEventListener('click', () => loadConnections());
loadConnections();
document.querySelector('#connectionsTable').addEventListener('click', (e) => {
    if (e.target.classList.contains('connWorldLink')) {
        e.preventDefault();
        const tr = e.target.closest('tr');
        const username = tr.children[0].innerText;

        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        const wtabb = document.querySelector('[data-tab="Worlds"]');
        const worldsTab = document.getElementById('Worlds');
        worldsTab.classList.add('active');
        wtabb.classList.add('active')

        worldSearchInput.value = username;
        worldCurrentPage = 1;
        loadWorlds();
    }
});
ids = []
const targetSelect = document.getElementById('targetId');

function loadActiveUsers() {
    const currentValue = targetSelect.value; // remember selection

    sendAdminRequest('active/all', data => {
        if (!data || !data.data || data.data.length === 0) return;

        targetSelect.innerHTML = '<option value="">-- NO TARGET --</option><option value="all">BROADCAST</option>';

        data.data.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.username === "-" ? user.id : user.username;
            targetSelect.appendChild(option);
        });

        if (currentValue) targetSelect.value = currentValue;
    });
}

targetSelect.addEventListener('click', () => {
    loadActiveUsers();
});


require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.43.0/min/vs' } });
require(['vs/editor/editor.main'], function () {
    const editor = monaco.editor.create(document.getElementById('remoteEditor'), {
        value: "// script goes here...\n",
        language: 'javascript',
        automaticLayout: true,
        theme: "vs-dark",
    });


    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false, // still check types
        noSyntaxValidation: false,   // still check syntax
        diagnosticCodesToIgnore: [6133, 7027, 2304] // 2304 = cannot find name (undefined)
    });


    const statusDiv = document.getElementById('remoteStatus');

    document.getElementById('executeScript').addEventListener('click', async () => {
        const script = editor.getValue();
        const targetId = document.getElementById('targetId').value;

        if (!targetId) {
            statusDiv.style.color = 'red';
            statusDiv.innerText = "Please select a Target ID!";
            return;
        }

        statusDiv.style.color = 'black';
        statusDiv.innerText = "Sending script...";
        const isBroadcast = targetId === "all";
        const endpoint = "remote";

        await sendAdminRequest("remote", (res) => {
            if (res.success) {
                statusDiv.style.color = 'green';
                statusDiv.innerText = isBroadcast
                    ? "Broadcast delivered successfully!"
                    : "Script delivered successfully!";
            } else {
                statusDiv.style.color = 'red';
                statusDiv.innerText = "Failed to send script: " + (res.error || JSON.stringify(res));
            }
        }, {
            body: isBroadcast ? { id: "all", script } : { id: targetId, script }
        });
    });

    document.getElementById('clearScript').addEventListener('click', () => {
        editor.setValue('');
        statusDiv.innerText = '';
    });

    document.getElementById('loadScript').addEventListener('click', () => {
        const saved = localStorage.getItem('remoteScript');
        if (saved) {
            editor.setValue(saved);
            statusDiv.style.color = 'green';
            statusDiv.innerText = "Script loaded from local storage.";
        } else {
            statusDiv.style.color = 'red';
            statusDiv.innerText = "No saved script found.";
        }
    });

    document.getElementById('saveScript').addEventListener('click', () => {
        const script = editor.getValue();
        localStorage.setItem('remoteScript', script);
        statusDiv.style.color = 'green';
        statusDiv.innerText = "Script saved locally.";
    });

    document.getElementById('fileInput').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = e => {
            editor.setValue(e.target.result);
            statusDiv.style.color = 'green';
            statusDiv.innerText = `Loaded script from file: ${file.name}`;
        };
        reader.onerror = e => {
            statusDiv.style.color = 'red';
            statusDiv.innerText = "Failed to read file.";
        };
        reader.readAsText(file);
    });
});
sendAdminRequest('uptime', d => {
    const now = new Date();
    const started = new Date(now.getTime() - d.uptime * 1000);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const month = months[started.getMonth()];
    const day = started.getDate();
    const year = started.getFullYear();

    let hours = started.getHours();
    const minutes = started.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // convert 0-23 to 12-hour format

    document.getElementById('started').innerText =
        `${month} ${day}, ${year}, ${hours}:${minutes} ${ampm}`;
}, { get: true });
const whitelistEnable = document.getElementById('whitelistEnable');
const whitelistStatus = document.getElementById('whitelistStatus');
const whAddUserInput = document.getElementById('whAddUserInput');
const whAddBtn = document.getElementById('whAddBtn');
const whUserList = document.getElementById('whUserList');

async function refreshWhitelist() {
    sendAdminRequest("whitelist/list", (data) => {
        // data[0] is the enabled boolean, data[1] is the users array
        const enabled = data[0];
        const users = data[1];

        // Update UI State
        whitelistEnable.checked = enabled;
        whitelistStatus.textContent = enabled ? "STATUS: ACTIVE" : "STATUS: INACTIVE";
        whitelistStatus.style.color = enabled ? "#0f0" : "#555";

        // Clear and Rebuild List
        whUserList.innerHTML = "";

        if (users.length === 0) {
            whUserList.innerHTML = '<span style="color: #333; font-size: 11px;">NO USERS AUTHORIZED</span>';
            return;
        }

        users.forEach(user => {
            const tag = document.createElement("div");
            tag.style = "background: #1a1a1a; border: 1px solid #333; padding: 2px 8px; display: flex; align-items: center; gap: 8px; font-size: 12px; color: #ccc;";

            const label = document.createElement("span");
            label.textContent = user;

            const removeBtn = document.createElement("span");
            removeBtn.innerHTML = "&times;";
            removeBtn.style = "color: #f55; cursor: pointer; font-weight: bold; font-family: sans-serif;";
            removeBtn.onclick = () => removeUser(user);

            tag.appendChild(label);
            tag.appendChild(removeBtn);
            whUserList.appendChild(tag);
        });
    }, { get: true });
}

function toggleWhitelist(state) {
    sendAdminRequest("whitelist/toggle", () => refreshWhitelist(), {
        method: 'POST',
        body: { toggle: state }
    });
}

function addUser() {
    const user = whAddUserInput.value.trim();
    if (!user) return;

    sendAdminRequest("whitelist/add", () => {
        whAddUserInput.value = "";
        refreshWhitelist();
    }, {
        method: 'POST',
        body: { user: user }
    });
}

function removeUser(user) {
    sendAdminRequest("whitelist/remove", () => refreshWhitelist(), {
        method: 'POST',
        body: { user: user }
    });
}
whitelistEnable.addEventListener("change", e => toggleWhitelist(e.target.checked));

whAddBtn.addEventListener("click", addUser);

whAddUserInput.addEventListener("keydown", e => {
    if (e.key === "Enter") addUser();
});

refreshWhitelist();
let starterStatus = document.getElementById('starterStatus');
let starterEditor, remoteEditor;
let serverFS = {};

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(target).classList.add('active');

        if (target === "Starter-Scripts" && starterEditor) {
            setTimeout(() => { starterEditor.layout(); syncStarterScripts(); }, 50);
        }
        if (target === "World Scripts" && worldEditor) {
            setTimeout(() => { worldEditor.layout(); }, 50);
        }
        if (target === "Remote Scripts" && remoteEditor) {
            setTimeout(() => remoteEditor.layout(), 50);
        }
        if (target === "User Manager") {
            loadRecentEditors();
        }
    });
});

require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.43.0/min/vs' } });
require(['vs/editor/editor.main'], function () {
    starterEditor = monaco.editor.create(document.getElementById('starterEditor'), {
        value: "// Select a file to edit\n",
        language: 'javascript', theme: 'vs-dark', automaticLayout: true
    });
});

require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.43.0/min/vs' } });
require(['vs/editor/editor.main'], function () {
    worldEditor = monaco.editor.create(document.getElementById('worldEditor'), {
        value: "// Select a world to edit\n",
        language: 'javascript', theme: 'vs-dark', automaticLayout: true
    });
});

async function syncStarterScripts() {
    sendAdminRequest('.ss', (data) => {
        serverFS = data || {};
        renderFileList();
    }, { get: true });
}

function renderFileList() {
    const list = document.getElementById('fileList');
    list.innerHTML = "";
    const treeData = {};

    Object.keys(serverFS).forEach(path => {
        let current = treeData;
        path.split('/').forEach((part, i, arr) => {
            if (!current[part]) current[part] = (i === arr.length - 1) ? null : {};
            current = current[part];
        });
    });
    list.appendChild(buildTree(treeData, ""));
}
function deleteFile(path) {
    if (!confirm(`Delete ${path}?`)) return;

    sendAdminRequest('.ss/delete', (res) => {
        syncStarterScripts();

        if (document.getElementById('scriptFilename').value === path) {
            document.getElementById('scriptFilename').value = "";
            starterEditor.setValue("");
        }
    }, { delete: true, body: { path } });
}
function buildTree(obj, parentPath) {
    const fragment = document.createDocumentFragment();
    Object.keys(obj).sort().forEach(key => {
        const fullPath = parentPath ? `${parentPath}/${key}` : key;
        const isFile = obj[key] === null;
        const node = document.createElement('div');
        node.innerHTML = `
            <div class="tree-item" data-path="${fullPath}">
                <img src="${isFile ? '/admin/icons/file16.ico' : '/admin/icons/folder16.ico'}">
                <span>${key}</span>
            </div>
            <div class="tree-children hidden"></div>
        `;
        const item = node.querySelector('.tree-item');
        const children = node.querySelector('.tree-children');

        if (isFile) {
            item.onclick = () => {
                document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('active-file'));
                item.classList.add('active-file');
                document.getElementById('scriptFilename').value = fullPath;
                starterEditor.setValue(serverFS[fullPath] || "");
            };
            item.oncontextmenu = (e) => {
                e.preventDefault();
                if (confirm(`Delete file ${key}?`)) {
                    deleteItem(fullPath);
                }
            };
        } else {
            children.appendChild(buildTree(obj[key], fullPath));
            item.onclick = (e) => {
                e.stopPropagation();
                children.classList.toggle('hidden');
            };

            item.oncontextmenu = (e) => {
                e.preventDefault();
                if (confirm(`Delete folder ${key} and all its contents?`)) {
                    deleteItem(fullPath);
                }
            };
        }


        fragment.appendChild(node);
    });
    return fragment;
}
function deleteItem(path) {
    sendAdminRequest('.ss/delete', (res) => {
        if (document.getElementById('scriptFilename').value === path) {
            document.getElementById('scriptFilename').value = "";
            starterEditor.setValue("");
            starterStatus.style.color = 'green';
            starterStatus.innerText = `Deleted: ${path}`;
        }
        syncStarterScripts();
    }, { delete: true, body: { path } });
}
document.getElementById('saveStarterBtn').onclick = () => {
    const path = document.getElementById('scriptFilename').value;
    const content = starterEditor.getValue();
    sendAdminRequest('.ss/create', () => syncStarterScripts(), { body: { path, content } });
};
document.getElementById('saveStarterBtn').addEventListener('click', () => {
    const path = document.getElementById('scriptFilename').value.trim();
    const content = starterEditor.getValue();

    if (!path) {
        alert("Error: Filename/Path is required to save.");
        return;
    }
    sendAdminRequest('.ss/create', (res) => {
        if (res.success) {
            syncStarterScripts(); 
            starterStatus.style.color = 'green';
            starterStatus.innerText = `Saved: ${path}`;
        }
    }, { body: { path, content } });
});

document.getElementById('clearStarterBtn').addEventListener('click', () => {
    if (confirm("Clear editor? Unsaved changes will be lost.")) {
        document.getElementById('scriptFilename').value = "";
        starterEditor.setValue("// New script...\n");
        document.querySelectorAll('.tree-item').forEach(el => {
            el.classList.remove('active-file');
        });

        starterStatus.style.color = 'white';
        starterStatus.innerText = "Editor cleared.";
    }
});

let tagCurrentPage = 1;
let tagTotalPages = 1;

const tagsTableBody = document.querySelector('#tagsTable tbody');
const tagPaginationDiv = document.getElementById('tagPaginationDiv');

function renderTags(data) {
    if (!data || !data.data || data.data.length === 0) {
        tagsTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #444;">No tags registered.</td></tr>';
        if (tagPaginationDiv) tagPaginationDiv.innerHTML = '';
        return;
    }
    const sanitize = str => String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    tagsTableBody.innerHTML = data.data.map(t => {
        return `<tr>
            <td>${t.account}</td>
            <td>${sanitize(t.tag)}</td>
            <td>
                <button style="color:#f55; border-color:#500; font-size:10px;" onclick="deleteTag('${t.id}')">PURGE</button>
            </td>
        </tr>`;
    }).join('');
    const current = Number(tagCurrentPage);
    const total = Number(tagTotalPages);

    if (tagPaginationDiv) {
        tagPaginationDiv.innerHTML = `<button ${current <= 1 ? 'disabled' : ''} onclick="tagPrevPage()">Prev</button>
            <span style="color: #888; font-size: 11px; align-self: center;">Page ${current} of ${total}</span>
            <button ${current >= total ? 'disabled' : ''} onclick="tagNextPage()">Next</button>`;
    }
}

function loadTags() {
    const endpoint = `tags?page=${tagCurrentPage}`;

    sendAdminRequest(endpoint, data => {
        if (data.invalid_page) {
            tagCurrentPage = 1;
            loadTags();
            return;
        }
        tagTotalPages = data.totalPages || 1;
        renderTags(data);
    }, { get: true });
}
function tagPrevPage() {
    if (tagCurrentPage > 1) {
        tagCurrentPage--;
        loadTags();
    }
}

function tagNextPage() {
    if (tagCurrentPage < tagTotalPages) {
        tagCurrentPage++;
        loadTags();
    }
}
const newAccountInput = document.getElementById('newAccountInput');
const newTagInput = document.getElementById('newTagInput');
const tagchk = document.getElementById('tagchk');
const addTagBtn = document.getElementById('addTagBtn');
const refreshTagsBtn = document.getElementById('refreshTagsBtn');
addTagBtn.addEventListener('click', () => {
    const account = newAccountInput.value.trim();
    const tag = newTagInput.value.trim();
    tagchk.textContent = "";

    if (!account || !tag) {
        tagchk.textContent = "REQUIRED: ACC + TAG";
        return;
    }

    sendAdminRequest('tags/add', result => {
        if (result.success) {
            newAccountInput.value = '';
            newTagInput.value = '';
            tagchk.style.color = "green";
            tagchk.textContent = "SUCCESS";
            setTimeout(() => tagchk.textContent = "", 2000);
            loadTags();
        } else {
            tagchk.style.color = "#ff5555";
            tagchk.textContent = result.error || "FAILED";
        }
    }, {
        method: 'POST',
        body: { account, tag }
    });
});
refreshTagsBtn.addEventListener('click', () => loadTags());
function deleteTag(id) {
    if (!confirm("Permanently delete this tag? This action cannot be undone.")) return;
    sendAdminRequest(`tags/del/${id}`, (res) => {
        if (res.success) {
            loadTags(); 
        } else {
            alert("Failed to delete tag: " + (res.error || JSON.stringify(res)));
        }
    }, { delete: true });
}
loadTags();

function updateDiagnostics() {
    sendAdminRequest("server/diagnostics", (data) => {
        document.getElementById('cpuLoadText').textContent = data.cpuLoad + "%";
        document.getElementById('ramLoadText').textContent = data.ramUsage + "%";
        document.getElementById('uptimeText').textContent = data.uptime;
        document.getElementById('nodeVersion').textContent = data.nodeVersion;
        document.getElementById('serverVersion').textContent = data.version;

        document.getElementById('hwSpecs').innerHTML = `
            CPU: <span style="color:#eee">${data.cpuModel}</span><br>
            CPU CORES: <span style="color:#eee">${data.cores}</span><br>
            RAM: <span style="color:#eee">${data.ramTotal}</span><br>
        `;

        updateSegments('cpuGraph', data.cpuLoad, 'active-cpu');
        updateSegments('ramGraph', data.ramUsage, 'active-ram');

    }, { get: true });
}

function updateSegments(containerId, percentage, activeClass) {
    const segments = document.querySelectorAll(`#${containerId} segment`);
    const activeCount = Math.ceil(percentage / 10); 

    segments.forEach((seg, index) => {
        const reverseIndex = 9 - index;
        if (reverseIndex < activeCount) {
            seg.classList.add(activeClass);
        } else {
            seg.classList.remove(activeClass);
        }
    });
}
setInterval(() => {
    if (document.getElementById('Server Info').classList.contains('active')) {
        updateDiagnostics();
    }
}, 5000);

updateDiagnostics();
function loadActiveUsers_POC() {
    const currentValue = packetTargetId.value; 

    sendAdminRequest('active/all', data => {
        if (!data || !data.data || data.data.length === 0) return;

        packetTargetId.innerHTML = '<option value="">-- SELECT TARGET --</option><option value="broadcast">BROADCAST</option>';

        data.data.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.username === "-" ? user.id : user.username;
            packetTargetId.appendChild(option);
        });

        if (packetTargetId) packetTargetId.value = currentValue;
    });
}
const sendPacketBtn = document.getElementById('sendPacketBtn');
const packetPayloadInput = document.getElementById('packetPayloadInput');
const packetTargetId = document.getElementById('packetTargetId');
const packetStatus = document.getElementById('packetStatus');

packetTargetId.addEventListener('click', () => {
    loadActiveUsers_POC();
});

if (sendPacketBtn) {
    sendPacketBtn.addEventListener('click', () => {
        const targetClientId = packetTargetId.value;
        let packets;

        try {
            packets = JSON.parse(packetPayloadInput.value);
            if (!Array.isArray(packets)) throw new Error("Payload must be a JSON array.");
        } catch (e) {
            packetStatus.style.color = '#f55';
            packetStatus.textContent = "Invalid JSON: " + e.message;
            return;
        }

        if (!targetClientId) {
            packetStatus.style.color = '#f55';
            packetStatus.textContent = "Select a target.";
            return;
        }

        sendAdminRequest('poc/exec', (res) => {
            if (res.success) {
                packetStatus.style.color = '#0f0';
                packetStatus.textContent = "Packet sent successfully!";
                setTimeout(() => packetStatus.textContent = '', 3000);
            } else {
                packetStatus.style.color = '#f55';
                packetStatus.textContent = "Error: " + res.error;
            }
        }, { body: { targetClientId, packets } });
    });
}

const maintenanceToggle = document.getElementById('maintenanceToggle');
const maintenanceStatus = document.getElementById('maintenanceStatus');
const saveMaintenanceMessageBtn = document.getElementById('saveMaintenanceMessageBtn');
const maintenanceMessageInput = document.getElementById('maintenanceMessageInput');

if (maintenanceToggle) {
    maintenanceToggle.addEventListener('change', (e) => {
        sendAdminRequest('maintenance/toggle', (res) => {
            if (res.success) {
                maintenanceStatus.textContent = res.maintenance ? "STATUS: ACTIVE" : "STATUS: INACTIVE";
                maintenanceStatus.style.color = res.maintenance ? "#0f0" : "#555";
            }
        }, { body: { toggle: e.target.checked } });
    });

    saveMaintenanceMessageBtn.addEventListener('click', () => {
        const message = maintenanceMessageInput.value.trim();
        sendAdminRequest('maintenance/save_msg', (res) => {
            if (res.success) alert("Maintenance message saved.");
        }, { body: { message } });
    });
}
const chatLogsContainer = document.getElementById('chatLogsContainer');
const chatLogSearchInput = document.getElementById('chatLogSearchInput');
const chatLogRefreshBtn = document.getElementById('chatLogRefreshBtn');
const chatLogPagination = document.getElementById('chatLogPagination');
const escapeHTML = (str) => str.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[m]);
function loadChatLogs(page = 1) {
    if (!chatLogsContainer) return;

    const searchTerm = chatLogSearchInput ? chatLogSearchInput.value : '';
    chatLogsContainer.innerHTML = '<div style="padding:10px; color:#888;">Loading logs...</div>';

    sendAdminRequest(`chat_logs?page=${page}&q=${encodeURIComponent(searchTerm)}`, (res) => {
        if (res.success && res.data && res.data.length > 0) {
            chatLogsContainer.innerHTML = res.data.map(log => `
                <div style="padding: 4px; border-bottom: 1px solid #333; font-family: monospace; font-size: 12px;">
                    <span style="color: #888;">[${new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span style="color: #6a8759;">[${escapeHTML(log.world)}]</span>
                    <strong style="color: #4da6ff;">${escapeHTML(log.username)}:</strong> 
                    <span style="color: #eee;">${escapeHTML(log.message)}</span>
                </div>
            `).join('');
            renderPagination(res.page, res.totalPages);

            chatLogsContainer.scrollTop = chatLogsContainer.scrollHeight;
        } else {
            chatLogsContainer.innerHTML = '<div style="color: #888; padding: 10px;">No logs found.</div>';
            chatLogPagination.innerHTML = '';
        }
    }, { get: true });
}

function renderPagination(current, total) {
    if (!chatLogPagination) return;
    let html = '';

    // Simple Prev/Next buttons
    if (current > 1)
        html += `<button onclick="loadChatLogs(${current - 1})">Prev</button>`;

    html += `<span style="align-self:center; color:#888;">Page ${current} of ${total}</span>`;

    if (current < total)
        html += `<button onclick="loadChatLogs(${current + 1})">Next</button>`;

    chatLogPagination.innerHTML = html;
}

// Event Listeners
if (chatLogRefreshBtn) chatLogRefreshBtn.addEventListener('click', () => loadChatLogs(1));

if (chatLogSearchInput) {
    chatLogSearchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') loadChatLogs(1);
    });
}

loadChatLogs(1);




const enableRatelimitCheckbox = document.getElementById('enableRatelimit');
const ratelimitTableBody = document.querySelector('#ratelimitTable tbody');
function loadRatelimitSettings() {
    if (!ratelimitTableBody) return;

    sendAdminRequest('ratelimit/packets', (res) => {
        if (res.success && res.rateLimits) {
            // Populate the table
            renderRatelimitTable(res.rateLimits);

            if (enableRatelimitCheckbox) {
                enableRatelimitCheckbox.checked = res.enabled ?? true;
            }
        }
    }, { get: true });
}

function renderRatelimitTable(limits) {
    ratelimitTableBody.innerHTML = Object.entries(limits).map(([packet, value]) => `
        <tr>
            <td style="color: #4da6ff; font-family: monospace; font-weight: bold;">${packet}</td>
            <td id="limit-val-${packet}" style="color: #888;">${value}</td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <input type="number" id="input-${packet}" value="${value}" 
                           style="flex: 1; background: #000; border: 1px solid #333; color: #fff; padding: 2px 5px;">
                    <button onclick="updatePacketLimit('${packet}')" 
                            style="background: #1e5bb8; color: white; border: none; padding: 2px 10px; cursor: pointer;">
                        SET
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.updatePacketLimit = function (packetName) {
    const input = document.getElementById(`input-${packetName}`);
    const newValue = parseInt(input.value);

    if (isNaN(newValue) || newValue < 0) return alert("Please enter a non-negative integer.");
    sendAdminRequest('ratelimit/modify_packets', (res) => {
        if (res.success) {
            document.getElementById(`limit-val-${packetName}`).innerText = newValue;
            input.style.borderColor = "#28a745";
            setTimeout(() => input.style.borderColor = "#333", 1000);
        } else {
            alert("Update failed: " + (res.error || "Unknown error"));
        }
    }, {
        body: {
            packets: [{ [packetName]: newValue }]
        }
    });
};
if (enableRatelimitCheckbox) {
    enableRatelimitCheckbox.addEventListener('change', function () {
        sendAdminRequest('ratelimit/toggle', (res) => {
            if (!res.success) {
                this.checked = !this.checked;
                alert("Failed to update global ratelimit status.");
            }
        }, {
            body: { toggle: this.checked }
        });
    });
}
loadRatelimitSettings();
const modUsernameInput = document.getElementById('modUsernameInput');
const addModBtn = document.getElementById('addModBtn');
const removeModBtn = document.getElementById('removeModBtn');
const moderatorsTableBody = document.querySelector('#moderatorsTable tbody');

function loadModerators() {
    if (!moderatorsTableBody) return;

    sendAdminRequest('moderators/list', (res) => {
        if (res.success && res.moderators) {
            renderModeratorsTable(res.moderators);
        }
    }, { get: true });
}

function renderModeratorsTable(moderators) {
    moderatorsTableBody.innerHTML = moderators.map(mod => `
        <tr>
            <td style="font-family: monospace;">${escapeHTML(mod.username)}</td>
            <td>
                <button onclick="demoteModerator('${mod.username}')" 
                        style="background: #444; color: #ff6b6b; border: none; padding: 2px 8px; cursor: pointer; font-size: 10px;">
                    REVOKE
                </button>
            </td>
        </tr>
    `).join('');
}

if (addModBtn) {
    addModBtn.addEventListener('click', () => {
        const username = modUsernameInput.value.trim();
        if (!username) return;

        sendAdminRequest('moderators/promote', (res) => {
            if (res.success) {
                modUsernameInput.value = '';
                loadModerators();
            } else {
                alert(res.error || "Failed to promote user.");
            }
        }, { body: { username } });
    });
}

if (removeModBtn) {
    removeModBtn.addEventListener('click', () => {
        const username = modUsernameInput.value.trim();
        if (!username) return;
        demoteModerator(username);
    });
}

window.demoteModerator = function (username) {
    sendAdminRequest('moderators/demote', (res) => {
        if (res.success) {
            if (modUsernameInput.value.trim().toLowerCase() === username.toLowerCase()) {
                modUsernameInput.value = '';
            }
            loadModerators();
        } else {
            alert(res.error || "Failed to demote user.");
        }
    }, {
        delete: true,
        body: { username }
    });
};

loadModerators();

let tokensTableBody = document.querySelector('#tokensTable tbody');
let tokenCurrentPage = 1;

async function fetchTokens(page = 1) {
    tokenCurrentPage = page;
    try {
        const response = await fetch(`/admin/tokens/list?page=${page}`);
        const data = await response.json();

        if (data.invalid_page) {
            console.error("Invalid page requested");
            return;
        }

        renderTokens(data);
        renderTokenPagination(data.page, data.totalPages);
    } catch (err) {
        console.error("Failed to fetch tokens:", err);
        document.querySelector('#tokensTable tbody').innerHTML =
            '<tr><td colspan="3" style="text-align:center; color:red;">Error loading tokens.</td></tr>';
    }
}

function renderTokenPagination(current, total) {
    const container = document.getElementById('tokenPagination');
    if (total <= 1) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <button ${current <= 1 ? 'disabled' : ''} onclick="tokenPrevPage()" class="page-btn">Prev</button>
        <span style="color: #888; font-size: 12px;">Page ${current} of ${total}</span>
        <button ${current >= total ? 'disabled' : ''} onclick="tokenNextPage()" class="page-btn">Next</button>
    `;
}

// Navigation Helpers
function tokenNextPage() {
    fetchTokens(tokenCurrentPage + 1);
}

function tokenPrevPage() {
    if (tokenCurrentPage > 1) {
        fetchTokens(tokenCurrentPage - 1);
    }
}

function renderTokens(data) {
    const tbody = document.querySelector('#tokensTable tbody');
    if (!data.data || data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No active tokens.</td></tr>';
        return;
    }

    tbody.innerHTML = data.data.map(t => `
        <tr>
            <td style="font-family: monospace; font-size: 11px; color: #aaa;">${t.token}</td>
            <td>${t.username}</td>
            <td>
                <button onclick="invalidateToken('${t.username}')" style=" olor:white; border:none; padding:4px 8px; cursor:pointer; font-size: 11px;">
                    Invalidate
                </button>
            </td>
        </tr>
    `).join('');
}

async function invalidateToken(username) {
    const confirmed = confirm(`Are you sure you want to invalidate all tokens for "${username}"? This will disconnect them.`);
    if (!confirmed) return;

    try {
        const response = await fetch("/admin/token/invalidate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username: username })
        });

        const result = await response.json();

        if (result.success) {
            console.log(`Successfully invalidated tokens for ${username}`);
            fetchTokens(tokenCurrentPage);
        } else {
            alert("Error: " + (result.error || "Could not invalidate token."));
        }
    } catch (err) {
        console.error("Network error:", err);
        alert("Failed to communicate with the server.");
    }
}

fetchTokens();
let userCurrentPage = 1;
let userSearchQuery = "";

async function fetchUsers(page = 1, query = "") {
    userCurrentPage = page;
    userSearchQuery = query;
    const path = `usr/list?page=${page}${query ? `&q=${encodeURIComponent(query)}` : ''}`;

    sendAdminRequest(path, (res) => {
        if (res && res.success) {
            renderUsers(res.users);
            renderUserPagination(res.page, res.totalPages);
        } else {
            console.error("User list error:", res?.error);
            const tbody = document.querySelector('#userAccountsTable tbody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:red;">Error loading users.</td></tr>';
        }
    }, { get: true });
}

function renderUsers(users) {
    const tbody = document.querySelector('#userAccountsTable tbody');
    if (!tbody) return;

    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#555;">No users found.</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(u => `
        <tr>
            <td>${u.username}</td>
            <td>${u.id}</td>
            <td>${u.last_ip || '-'}</td>
            <td style="width: 320px;">
                <button onclick="gotoUserByName(${JSON.stringify(u.username)})" style="padding:3px 8px; cursor:pointer">Go</button>
                <button onclick="rollbackByUserId(${u.id}, ${JSON.stringify(u.username)})" style="padding:3px 8px; cursor:pointer">Rollback</button>
                <button ${u.last_ip ? '' : 'disabled'} onclick="banUserIp(${JSON.stringify(u.username)})" style="padding:3px 8px; cursor:pointer">Ban IP</button>
                <button onclick="changeUserPassword(${JSON.stringify(u.username)})" style="padding:3px 8px; cursor:pointer">Pass</button>
                <button onclick="deleteUser(${JSON.stringify(u.username)})" style="padding:3px 8px; cursor:pointer;">Delete</button>
            </td>
        </tr>
    `).join('');
}

function renderUserPagination(current, total) {
    const container = document.getElementById('userPagination');
    if (!container) return;
    if (total <= 1 && !userSearchQuery) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <button ${current <= 1 ? 'disabled' : ''} onclick="fetchUsers(${current - 1}, userSearchQuery)">Prev</button>
        <span style="font-size: 11px; color: #888; margin: 0 10px;">Page ${current} of ${total}</span>
        <button ${current >= total ? 'disabled' : ''} onclick="fetchUsers(${current + 1}, userSearchQuery)">Next</button>
    `;
}

window.performUserSearch = () => {
    const q = document.getElementById('userSearchInput').value.trim();
    fetchUsers(1, q);
};

window.deleteUser = (username) => {
    if (!confirm(`Delete ${username}?`)) return;
    sendAdminRequest("usr/delete", (res) => {
        if (res.success) fetchUsers(userCurrentPage, userSearchQuery);
        else alert(res.error);
    }, {
        method: 'DELETE',
        body: { username },
        headers: { 'Content-Type': 'application/json' }
    });
};

window.changeUserPassword = (username) => {
    const newPassword = prompt(`New password for ${username}:`);
    if (!newPassword) return;
    sendAdminRequest("usr/change_password", (res) => {
        if (res.success) alert("Password updated.");
        else alert(res.error);
    }, {
        method: 'POST',
        body: { username, newPassword },
        headers: { 'Content-Type': 'application/json' }
    });
};

window.banUserIp = (username) => {
    if (!confirm(`IP-ban ${username}? This uses their current connection if they are online, otherwise their last login IP.`)) return;
    sendAdminRequest("ban/ip", (res) => {
        if (res && res.success) alert(`Banned IP ${res.ip || res.masked || ""}.`);
        else alert((res && res.error) || "IP ban failed.");
    }, { body: { target: username } });
};

document.getElementById('createUserBtn').onclick = () => {
    const username = document.getElementById('umUsernameInput').value.trim();
    const password = document.getElementById('umPasswordInput').value.trim();
    if (!username || !password) return alert("Fill fields.");

    sendAdminRequest("usr/create", (res) => {
        if (res.success) {
            document.getElementById('umUsernameInput').value = '';
            document.getElementById('umPasswordInput').value = '';
            fetchUsers(1, userSearchQuery);
        } else {
            alert(res.error);
        }
    }, {
        method: 'POST',
        body: { username, password },
        headers: { 'Content-Type': 'application/json' }
    });
};

fetchUsers();

function getRollbackMinutes() {
    const el = document.getElementById('rollbackMinutes');
    const n = parseInt(el && el.value, 10);
    return Number.isFinite(n) ? n : 5;
}

window.gotoUserByName = (username) => {
    if (!username || username === '(anonymous)') return alert("That user is not online.");
    sendAdminRequest(`usr/goto?name=${encodeURIComponent(username)}`, (res) => {
        if (!res || !res.success) return alert(res?.error || "User is not online.");
        window.open(res.url, "_blank");
    }, { get: true });
};

window.gotoClient = (clientId) => {
    sendAdminRequest(`usr/goto?clientId=${encodeURIComponent(clientId)}`, (res) => {
        if (!res || !res.success) return alert(res?.error || "Client is not online.");
        window.open(res.url, "_blank");
    }, { get: true });
};

window.rollbackByUserId = (userId, username) => {
    const minutes = getRollbackMinutes();
    const label = username || ("user #" + userId);
    sendAdminRequest(`rollback/preview?minutes=${minutes}&userId=${userId}`, (preview) => {
        if (!preview || !preview.success) return alert(preview?.error || "Preview failed.");
        if (!preview.cells) return alert(`No edits by ${label} in the last ${minutes} minutes.`);
        if (!confirm(`Roll back ${preview.cells} cells (${preview.edits} writes) by ${label} from the last ${minutes} minutes?`)) return;
        sendAdminRequest("rollback", (res) => {
            if (!res || !res.success) return alert(res?.error || "Rollback failed.");
            alert(`Restored ${res.restored} cells across ${res.worlds} world(s).`);
            loadRecentEditors();
        }, { body: { minutes, userId } });
    }, { get: true });
};

window.rollbackByClientId = (clientId, label) => {
    const minutes = getRollbackMinutes();
    const name = label || ("anon:" + clientId);
    sendAdminRequest(`rollback/preview?minutes=${minutes}&clientId=${encodeURIComponent(clientId)}`, (preview) => {
        if (!preview || !preview.success) return alert(preview?.error || "Preview failed.");
        if (!preview.cells) return alert(`No edits by ${name} in the last ${minutes} minutes.`);
        if (!confirm(`Roll back ${preview.cells} cells (${preview.edits} writes) by ${name} from the last ${minutes} minutes?`)) return;
        sendAdminRequest("rollback", (res) => {
            if (!res || !res.success) return alert(res?.error || "Rollback failed.");
            alert(`Restored ${res.restored} cells across ${res.worlds} world(s).`);
            loadRecentEditors();
        }, { body: { minutes, clientId } });
    }, { get: true });
};

function loadRecentEditors() {
    const minutes = getRollbackMinutes();
    const tbody = document.querySelector('#recentEditorsTable tbody');
    const status = document.getElementById('rollbackStatus');
    if (!tbody) return;
    sendAdminRequest(`rollback/editors?minutes=${minutes}`, (res) => {
        if (!res || !res.success) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:red;">Failed to load editors.</td></tr>';
            return;
        }
        if (status) status.textContent = `${res.editors.length} editor(s) in last ${minutes} min`;
        if (!res.editors.length) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#444;">No recent editors.</td></tr>';
            return;
        }
        tbody.innerHTML = res.editors.map(e => {
            const idLabel = e.anonymous ? (e.clientId || '-') : e.userId;
            const goBtn = e.anonymous
                ? `<button ${e.online ? '' : 'disabled'} onclick="gotoClient(${JSON.stringify(String(e.clientId || ''))})">Go</button>`
                : `<button ${e.online ? '' : 'disabled'} onclick="gotoUserByName(${JSON.stringify(e.username)})">Go</button>`;
            const rbBtn = e.anonymous
                ? (e.clientId ? `<button onclick="rollbackByClientId(${JSON.stringify(String(e.clientId))}, ${JSON.stringify(e.username)})">Rollback</button>` : '')
                : `<button onclick="rollbackByUserId(${e.userId}, ${JSON.stringify(e.username)})">Rollback</button>`;
            const banBtn = e.ip ? `<button onclick="banUserIp(${JSON.stringify(e.ip)})">Ban IP</button>` : '';
            return `
            <tr>
                <td>${e.username}</td>
                <td>${idLabel}</td>
                <td>${e.ip || '-'}</td>
                <td style="text-align:center;">${e.cells}</td>
                <td style="text-align:center;">${e.edits}</td>
                <td style="text-align:center;">${e.online ? 'Yes' : 'No'}</td>
                <td>${e.last_ts ? new Date(e.last_ts).toLocaleTimeString() : '-'}</td>
                <td>
                    ${goBtn}
                    ${rbBtn}
                    ${banBtn}
                </td>
            </tr>`;
        }).join('');
    }, { get: true });
}

const rollbackAllBtn = document.getElementById('rollbackAllBtn');
if (rollbackAllBtn) {
    rollbackAllBtn.addEventListener('click', () => {
        const minutes = getRollbackMinutes();
        sendAdminRequest(`rollback/preview?minutes=${minutes}&all=1`, (preview) => {
            if (!preview || !preview.success) return alert(preview?.error || "Preview failed.");
            if (!preview.cells) return alert(`No edits in the last ${minutes} minutes.`);
            if (!confirm(`Roll back ALL ${preview.cells} cells (${preview.edits} writes) from every user in the last ${minutes} minutes?`)) return;
            sendAdminRequest("rollback", (res) => {
                if (!res || !res.success) return alert(res?.error || "Rollback failed.");
                alert(`Restored ${res.restored} cells across ${res.worlds} world(s).`);
                loadRecentEditors();
            }, { body: { minutes, all: true } });
        }, { get: true });
    });
}
const rollbackEditorsRefreshBtn = document.getElementById('rollbackEditorsRefreshBtn');
if (rollbackEditorsRefreshBtn) rollbackEditorsRefreshBtn.addEventListener('click', loadRecentEditors);
const rollbackMinutesEl = document.getElementById('rollbackMinutes');
if (rollbackMinutesEl) rollbackMinutesEl.addEventListener('change', loadRecentEditors);
loadRecentEditors();

const logToTypeCheckbox = document.getElementById('logToType');
const regClosedCheckbox = document.getElementById('regclosed');
function fetchServerSettings() {
    sendAdminRequest("settings/get", (res) => {
        if (res && res.success && res.settings) {
            logToTypeCheckbox.checked = !!res.settings.l;
            regClosedCheckbox.checked = !!res.settings.regclosed;
        }
    }, { get: true });
}
function updateServerSettings() {
    const payload = {
        l: logToTypeCheckbox.checked,
        regclosed: regClosedCheckbox.checked
    };

    sendAdminRequest("settings/update", (res) => {
        if (res && res.success) {
        } else {
            alert("Failed to save settings: " + (res?.error || "Unknown error"));
            fetchServerSettings();
        }
    }, {
        method: 'POST',
        body: payload,
        headers: { 'Content-Type': 'application/json' }
    });
}
logToTypeCheckbox.addEventListener('change', updateServerSettings);
regClosedCheckbox.addEventListener('change', updateServerSettings);
fetchServerSettings();

document.getElementById('execBanBtn').addEventListener('click', async () => {
    const target = document.getElementById('banInput').value;
    const type = document.getElementById('banActionType').value;
    const reason = document.getElementById('banReasonInput').value;
    const expiresAt = parseInt(document.getElementById('banExpiryInput').value) || 0;
    const status = document.getElementById('banStatus');

    if (!target) return;

    status.textContent = "EXECUTING...";
    status.style.color = "#ff5555";

    const endpoint = type === 'ip' ? '/admin/ban/ip' : '/admin/ban/account';
    const payload = type === 'ip' ? { target, reason } : { username: target, reason, expiresAt };

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const data = await res.json().catch(() => ({}));
            if (type === 'ip' && data && data.success === false) {
                status.textContent = data.error || "ERROR";
                return;
            }
            document.getElementById('banInput').value = '';
            document.getElementById('banReasonInput').value = '';
            status.textContent = data.ip ? `SUCCESS (${data.ip})` : "SUCCESS";
            status.style.color = "#55ff55";
            refreshBans();
        } else {
            const err = await res.json();
            status.textContent = err.error || "ERROR";
        }
    } catch (e) {
        status.textContent = "NET ERROR";
    }
});

document.getElementById('refreshBansBtn').addEventListener('click', refreshBans);

async function refreshBans() {
    try {
        const res = await fetch('/admin/bans/list');
        const data = await res.json();
        renderBansTable(data);
    } catch (e) {
        console.error("Failed to fetch bans", e);
    }
}

function renderBansTable(data) {
    const tbody = document.getElementById('bansTableBody');
    document.getElementById('accountBanCount').textContent = data.accounts.length;
    document.getElementById('ipBanCount').textContent = data.ips.length;

    tbody.innerHTML = '';

    data.accounts.forEach(b => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${b.username} (ID: ${b.uid})</td>
            <td style="text-align:center; color:#ff5555; font-weight:bold;">YES</td>
            <td style="text-align:center; color:#444;">NO</td>
            <td style="font-size:11px;">${b.reason} <br><small style="color:#666;">By: ${b.issuer}</small></td>
            <td style="text-align:center;">
                <button onclick="unbanAccount(${b.uid})" style="background:#222; border-color:#444; font-size:10px; padding:2px 5px;">UNBAN</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    data.ips.forEach(b => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${b.masked}</td>
            <td style="text-align:center; color:#444;">NO</td>
            <td style="text-align:center; color:#ff5555; font-weight:bold;">YES</td>
            <td style="font-size:11px; color:#888;">Dry IP Ban</td>
            <td style="text-align:center;">
                <button onclick="unbanIP('${b.ip}')" style="background:#222; border-color:#444; font-size:10px; padding:2px 5px;">RELEASE</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (data.accounts.length === 0 && data.ips.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#333; padding:20px;">Database Clean - No Bans Active</td></tr>';
    }
}

async function unbanAccount(uid) {
    if (!confirm("Lift account restriction for UID " + uid + "?")) return;
    await fetch('/admin/unban/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid })
    });
    refreshBans();
}

async function unbanIP(ip) {
    if (!confirm("Lift IP restriction for " + ip + "?")) return;
    await fetch('/admin/unban/ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip })
    });
    refreshBans();
}

refreshBans();