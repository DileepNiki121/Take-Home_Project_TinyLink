// public/app.js
// Base URL for API endpoints
const API = '/api';


// ===============================
// FUNCTION: fetch all links (GET)
// Retrieves data from the backend to populate the dashboard.
// This function is correct and uses the GET method.
// ===============================
async function fetchLinks() {
  const res = await fetch(`${API}/links`);
  return res.ok ? res.json() : [];
}



// ===============================
// FUNCTION: render the dashboard table
// Reads links from the backend and draws the HTML table.
// ===============================
async function renderDashboard() {

  const body = document.getElementById('linksBody');
  const links = await fetchLinks();
  const searchInput = document.getElementById('search');

  function filtered() {
    const q = (searchInput?.value || '').toLowerCase();
    return links.filter(l =>
      l.code.toLowerCase().includes(q) ||
      l.target_url.toLowerCase().includes(q)
    );
  }

  function redraw() {
    body.innerHTML = '';
    const formatDate = (dateString) => 
        dateString ? new Date(dateString).toLocaleString() : '-';

    filtered().forEach(l => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="p-2">
          <a class="text-blue-600" href="/${l.code}" target="_blank">${l.code}</a>
        </td>
        <td class="p-2">
          <a class="underline"
              href="${l.target_url}"
              target="_blank">
              ${l.target_url.length > 60 ? l.target_url.slice(0, 60) + '...' : l.target_url}
          </a>
        </td>
        <td class="p-2">${l.total_clicks}</td>
        <td class="p-2">
          ${formatDate(l.last_clicked)}
        </td>
        <td class="p-2">
          <button class="deleteBtn px-2 py-1 bg-red-500 text-white rounded"
                  data-code="${l.code}">
            Delete
          </button>
          <button class="copyBtn px-2 py-1 bg-gray-200 rounded ml-2"
                  data-code="${l.code}">
            Copy
          </button>
        </td>
      `;
      body.appendChild(tr);
    });

    // DELETE button logic (remains POST /api/links/:code)
    document.querySelectorAll('.deleteBtn').forEach(btn => {
      btn.onclick = async () => {
        const code = btn.dataset.code;
        if (!confirm('Delete link ' + code + '?')) return;
        const resp = await fetch(`${API}/links/${code}`, {
          method: 'DELETE'
        });
        if (resp.status === 204) {
          await renderDashboard();
        } else {
          const errorData = await resp.json().catch(() => ({ error: 'Delete failed' }));
          alert(errorData.error || 'Delete failed');
        }
      };
    });

    // COPY button logic
    document.querySelectorAll('.copyBtn').forEach(btn => {
      btn.onclick = () => {
        const code = btn.dataset.code;
        navigator.clipboard.writeText(location.origin + '/' + code);
        btn.innerText = 'Copied';
        setTimeout(() => btn.innerText = 'Copy', 1000);
      };
    });
  }

  searchInput?.addEventListener('input', redraw);
  redraw();
}




// ===============================
// FUNCTION: handle create link form (PUT)
// Sends data to the backend via PUT /api/links.
// ===============================
async function handleCreateForm() {
  const form = document.getElementById('createForm');
  if (!form) return;

  const target = document.getElementById('target_url');
  const custom = document.getElementById('custom_code');
  const msg = document.getElementById('createMsg');

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    msg.innerText = '';

    const payload = { target_url: target.value.trim() };
    if (custom.value.trim()) payload.code = custom.value.trim();

    const btn = document.getElementById('createBtn');
    btn.disabled = true;

    try {
      // Send PUT request to /api/links <-- CHANGED from method: 'POST'
      const resp = await fetch(`${API}/links`, {
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await resp.json();

      if (resp.status === 201) {
        msg.innerText = `Created: ${data.code} → ${data.target_url}`;
        msg.classList.remove('text-red-600');
        msg.classList.add('text-green-600');
        target.value = '';
        custom.value = '';
        await renderDashboard(); // Reloads table to show new link
      } else {
        msg.innerText = data.error || 'Error creating link';
        msg.classList.remove('text-green-600');
        msg.classList.add('text-red-600');
      }

    } catch (err) {
      msg.innerText = 'Network error or server connection failed.';
      msg.classList.remove('text-green-600');
      msg.classList.add('text-red-600');
    } finally {
      btn.disabled = false;
    }
  });
}




// ===============================
// FUNCTION: show stats on /code/:code page
// ===============================
async function renderStats() {
  const code = window.__LINK_CODE__;
  const title = document.getElementById('codeTitle');
  const list = document.getElementById('statsList');

  try {
    const res = await fetch(`/api/links/${code}`);
    if (!res.ok) {
      title.innerText = `Code ${code} not found`;
      return;
    }

    const data = await res.json();
    title.innerText = `Stats — ${data.code}`;
    list.innerHTML = `
      <div><strong>Target URL:</strong> 
        <a class="text-blue-600" href="${data.target_url}" target="_blank">
          ${data.target_url}
        </a>
      </div>
      <div><strong>Total clicks:</strong> ${data.total_clicks}</div>
      <div><strong>Created at:</strong> 
        ${new Date(data.created_at).toLocaleString()}
      </div>
      <div><strong>Last clicked:</strong> 
        ${data.last_clicked ? new Date(data.last_clicked).toLocaleString() : '-'}
      </div>
    `;

  } catch (err) {
    title.innerText = 'Error loading stats';
  }
}



// ===============================
// PAGE INITIALIZATION
// ===============================
window.addEventListener('DOMContentLoaded', async () => {
  // If on dashboard page → load dashboard + form logic
  if (document.getElementById('createForm')) {
    await renderDashboard();
    await handleCreateForm();
  }

  // If on stats page → load stats
  if (window.__LINK_CODE__) {
    await renderStats();
  }
});