// Dashboard JavaScript

let currentEditId = null;
let messageModal = null;

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Bootstrap modal after DOM is ready
    messageModal = new bootstrap.Modal(document.getElementById('messageModal'));

    checkWhatsAppStatus();
    loadMessages();

    // Refresh status every 30 seconds
    setInterval(checkWhatsAppStatus, 30000);
});

// Check WhatsApp connection status
async function checkWhatsAppStatus() {
    try {
        const response = await fetch('/api/whatsapp/status');
        const data = await response.json();

        const statusBadge = document.getElementById('whatsappStatus');
        if (data.connected) {
            statusBadge.className = 'badge bg-success';
            statusBadge.innerHTML = '<i class="bi bi-whatsapp me-1"></i> Connected';
        } else {
            statusBadge.className = 'badge bg-danger';
            statusBadge.innerHTML = '<i class="bi bi-whatsapp me-1"></i> Disconnected';
        }
    } catch (error) {
        console.error('Error checking WhatsApp status:', error);
    }
}

// Load all messages
async function loadMessages() {
    const container = document.getElementById('messagesContainer');

    try {
        const response = await fetch('/api/messages');
        const messages = await response.json();

        if (messages.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-inbox"></i>
                    <h5>No messages yet</h5>
                    <p>Click "Add Message" to create your first scheduled message</p>
                </div>
            `;
            return;
        }

        container.innerHTML = messages.map(msg => renderMessageCard(msg)).join('');
    } catch (error) {
        console.error('Error loading messages:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                Failed to load messages. Please refresh the page.
            </div>
        `;
    }
}

// Render a single message card
function renderMessageCard(msg) {
    const days = msg.days_of_week === '*' ? 'Every day' : formatDays(msg.days_of_week);
    const statusBadge = msg.is_active
        ? '<span class="badge bg-success">Active</span>'
        : '<span class="badge bg-secondary">Inactive</span>';

    // Detect Arabic text
    const hasArabic = /[\u0600-\u06FF]/.test(msg.message_content);
    const textClass = hasArabic ? 'rtl' : '';

    return `
        <div class="message-card">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <div class="flex-grow-1">
                    <div class="message-content ${textClass}">${escapeHtml(msg.message_content)}</div>
                </div>
                <div class="ms-3">
                    ${statusBadge}
                </div>
            </div>

            <div class="d-flex justify-content-between align-items-center">
                <div class="schedule-badge">
                    <i class="bi bi-clock"></i>
                    <span>${msg.send_time} - ${days}</span>
                </div>

                <div class="message-actions">
                    <button class="btn btn-sm btn-outline-primary" onclick="editMessage(${msg.id})">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-${msg.is_active ? 'warning' : 'success'}"
                            onclick="toggleMessage(${msg.id})">
                        <i class="bi bi-toggle-${msg.is_active ? 'on' : 'off'}"></i>
                        ${msg.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteMessage(${msg.id})">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Format days of week
function formatDays(daysStr) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = daysStr.split(',').map(d => dayNames[parseInt(d)]);
    return days.join(', ');
}

// Open add message modal
function openAddModal() {
    currentEditId = null;
    document.getElementById('modalTitle').textContent = 'Add Message';
    document.getElementById('messageForm').reset();
    document.getElementById('messageId').value = '';
    document.getElementById('isActive').checked = true;
}

// Edit message
async function editMessage(id) {
    try {
        const response = await fetch('/api/messages');
        const messages = await response.json();
        const msg = messages.find(m => m.id === id);

        if (!msg) return;

        currentEditId = id;
        document.getElementById('modalTitle').textContent = 'Edit Message';
        document.getElementById('messageId').value = id;
        document.getElementById('messageContent').value = msg.message_content;
        document.getElementById('sendTime').value = msg.send_time;
        document.getElementById('isActive').checked = msg.is_active;

        // Set days checkboxes
        document.querySelectorAll('.day-checkbox').forEach(cb => cb.checked = false);

        if (msg.days_of_week === '*') {
            document.getElementById('allDays').checked = true;
            document.querySelectorAll('.day-checkbox').forEach(cb => cb.checked = true);
        } else {
            msg.days_of_week.split(',').forEach(day => {
                document.getElementById(`day${day}`).checked = true;
            });
        }

        messageModal.show();
    } catch (error) {
        console.error('Error loading message:', error);
        showNotification('Failed to load message', 'danger');
    }
}

// Save message (create or update)
async function saveMessage() {
    const content = document.getElementById('messageContent').value.trim();
    const time = document.getElementById('sendTime').value;
    const isActive = document.getElementById('isActive').checked;

    // Get selected days
    const selectedDays = Array.from(document.querySelectorAll('.day-checkbox:checked'))
        .map(cb => cb.value);

    if (!content || !time || selectedDays.length === 0) {
        showNotification('Please fill all fields and select at least one day', 'warning');
        return;
    }

    const daysOfWeek = selectedDays.length === 7 ? '*' : selectedDays.join(',');

    const data = {
        message_content: content,
        send_time: time,
        days_of_week: daysOfWeek,
        is_active: isActive ? 1 : 0
    };

    try {
        const url = currentEditId ? `/api/messages/${currentEditId}` : '/api/messages';
        const method = currentEditId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showNotification(currentEditId ? 'Message updated successfully' : 'Message added successfully', 'success');
            messageModal.hide();
            loadMessages();
        } else {
            showNotification('Failed to save message', 'danger');
        }
    } catch (error) {
        console.error('Error saving message:', error);
        showNotification('Error saving message', 'danger');
    }
}

// Toggle message active status
async function toggleMessage(id) {
    try {
        const response = await fetch(`/api/messages/${id}/toggle`, {
            method: 'PATCH'
        });

        if (response.ok) {
            showNotification('Message status updated', 'success');
            loadMessages();
        } else {
            showNotification('Failed to update message status', 'danger');
        }
    } catch (error) {
        console.error('Error toggling message:', error);
        showNotification('Error updating message', 'danger');
    }
}

// Delete message
async function deleteMessage(id) {
    if (!confirm('Are you sure you want to delete this message?')) {
        return;
    }

    try {
        const response = await fetch(`/api/messages/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showNotification('Message deleted successfully', 'success');
            loadMessages();
        } else {
            showNotification('Failed to delete message', 'danger');
        }
    } catch (error) {
        console.error('Error deleting message:', error);
        showNotification('Error deleting message', 'danger');
    }
}

// Toggle all days checkbox
function toggleAllDays(checkbox) {
    const dayCheckboxes = document.querySelectorAll('.day-checkbox');
    dayCheckboxes.forEach(cb => cb.checked = checkbox.checked);
}

// Listen to individual day checkboxes
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.day-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            const allChecked = Array.from(document.querySelectorAll('.day-checkbox'))
                .every(checkbox => checkbox.checked);
            document.getElementById('allDays').checked = allChecked;
        });
    });
});

// Send test message
async function sendTestMessage() {
    const testMessage = 'اللّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ\n\nPeace and blessings be upon Prophet Muhammad ﷺ';

    try {
        const response = await fetch('/api/whatsapp/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: testMessage })
        });

        if (response.ok) {
            showNotification('Test message sent successfully!', 'success');
        } else {
            showNotification('Failed to send test message', 'danger');
        }
    } catch (error) {
        console.error('Error sending test message:', error);
        showNotification('Error sending test message', 'danger');
    }
}

// Logout
async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/';
    }
}

// Show notification (Bootstrap toast)
function showNotification(message, type = 'info') {
    // Simple alert for now - can be upgraded to Bootstrap toast
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
