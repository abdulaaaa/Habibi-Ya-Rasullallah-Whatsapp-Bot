import API_BASE_URL from "./../config.js";

// Dashboard JavaScript

let currentEditId = null;
let messageModal = null;
let currentPrayerTimes = null;

// Helper function to convert 24-hour time to 12-hour format with AM/PM and EST
function formatTimeTo12Hour(time24) {
    const [hour24, minute] = time24.split(':').map(Number);
    const hour12 = hour24 % 12 || 12;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${String(minute).padStart(2, '0')} ${ampm} EST`;
}

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Bootstrap modal after DOM is ready
    messageModal = new bootstrap.Modal(document.getElementById('messageModal'));

    // Setup schedule type toggle
    setupScheduleTypeToggle();

    checkWhatsAppStatus();
    loadMessages();

    // Refresh status every 30 seconds
    setInterval(checkWhatsAppStatus, 30000);
});

// Setup toggle between fixed and prayer time schedules
function setupScheduleTypeToggle() {
    const scheduleTypeRadios = document.querySelectorAll('input[name="scheduleType"]');
    const prayerNameSelect = document.getElementById('prayerName');

    scheduleTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const fixedSection = document.getElementById('fixedTimeSection');
            const prayerSection = document.getElementById('prayerTimeSection');
            const sendTimeInput = document.getElementById('sendTime');

            if (e.target.value === 'fixed') {
                fixedSection.style.display = 'block';
                prayerSection.style.display = 'none';
                sendTimeInput.required = true;
            } else {
                fixedSection.style.display = 'none';
                prayerSection.style.display = 'block';
                sendTimeInput.required = false;
                loadPrayerTimes();
            }
        });
    });

    // Update preview when prayer selection changes
    prayerNameSelect.addEventListener('change', () => {
        if (currentPrayerTimes) {
            updatePrayerTimePreview();
        }
    });
}

// Load today's prayer times
async function loadPrayerTimes() {
    const previewDiv = document.getElementById('prayerTimePreview');
    previewDiv.textContent = 'Loading prayer times...';

    try {
        const response = await fetch(`${API_BASE_URL}/api/prayer-times`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
            currentPrayerTimes = data.times;
            updatePrayerTimePreview();
        } else {
            previewDiv.textContent = 'Failed to load prayer times';
        }
    } catch (error) {
        console.error('Error loading prayer times:', error);
        previewDiv.textContent = 'Error loading prayer times';
    }
}

// Update the prayer time preview text
function updatePrayerTimePreview() {
    const prayerName = document.getElementById('prayerName').value;
    const previewDiv = document.getElementById('prayerTimePreview');

    if (!currentPrayerTimes || !currentPrayerTimes[prayerName]) {
        previewDiv.textContent = 'Prayer time not available';
        return;
    }

    const prayerTime = currentPrayerTimes[prayerName];

    // Calculate time + 10 minutes
    const [hour, minute] = prayerTime.split(':').map(Number);
    const totalMinutes = hour * 60 + minute + 10;
    const newHour = Math.floor(totalMinutes / 60) % 24;
    const newMinute = totalMinutes % 60;
    const displayTime24 = `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;

    // Format both times to 12-hour format with EST
    const prayerTime12 = formatTimeTo12Hour(prayerTime);
    const sendTime12 = formatTimeTo12Hour(displayTime24);

    const prayerNameCap = prayerName.charAt(0).toUpperCase() + prayerName.slice(1);
    previewDiv.textContent = `Today's ${prayerNameCap} is at ${prayerTime12}. Message will send at ${sendTime12}`;
}

// Check WhatsApp connection status
async function checkWhatsAppStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/whatsapp/status`, {
            credentials: 'include'
        });
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
        const response = await fetch(`${API_BASE_URL}/api/messages`, {
            credentials: 'include'
        });
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

    // Format time display based on schedule type
    let timeDisplay;
    if (msg.schedule_type === 'prayer') {
        const prayerNameCap = msg.prayer_name.charAt(0).toUpperCase() + msg.prayer_name.slice(1);
        timeDisplay = `10 min after ${prayerNameCap}`;
    } else {
        timeDisplay = formatTimeTo12Hour(msg.send_time);
    }

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
                    <span>${timeDisplay} - ${days}</span>
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

    // Reset to fixed schedule type
    document.getElementById('scheduleFixed').checked = true;
    document.getElementById('fixedTimeSection').style.display = 'block';
    document.getElementById('prayerTimeSection').style.display = 'none';
    document.getElementById('sendTime').required = true;
}

// Edit message
async function editMessage(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/messages`, {
            credentials: 'include'
        });
        const messages = await response.json();
        const msg = messages.find(m => m.id === id);

        if (!msg) return;

        currentEditId = id;
        document.getElementById('modalTitle').textContent = 'Edit Message';
        document.getElementById('messageId').value = id;
        document.getElementById('messageContent').value = msg.message_content;
        document.getElementById('isActive').checked = msg.is_active;

        // Set schedule type
        const scheduleType = msg.schedule_type || 'fixed';
        if (scheduleType === 'prayer') {
            document.getElementById('schedulePrayer').checked = true;
            document.getElementById('fixedTimeSection').style.display = 'none';
            document.getElementById('prayerTimeSection').style.display = 'block';
            document.getElementById('sendTime').required = false;
            document.getElementById('prayerName').value = msg.prayer_name;
            await loadPrayerTimes();
        } else {
            document.getElementById('scheduleFixed').checked = true;
            document.getElementById('fixedTimeSection').style.display = 'block';
            document.getElementById('prayerTimeSection').style.display = 'none';
            document.getElementById('sendTime').required = true;
            document.getElementById('sendTime').value = msg.send_time;
        }

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
    const isActive = document.getElementById('isActive').checked;
    const scheduleType = document.querySelector('input[name="scheduleType"]:checked').value;

    // Get selected days
    const selectedDays = Array.from(document.querySelectorAll('.day-checkbox:checked'))
        .map(cb => cb.value);

    if (!content || selectedDays.length === 0) {
        showNotification('Please fill message content and select at least one day', 'warning');
        return;
    }

    const daysOfWeek = selectedDays.length === 7 ? '*' : selectedDays.join(',');

    const data = {
        message_content: content,
        days_of_week: daysOfWeek,
        is_active: isActive ? 1 : 0,
        schedule_type: scheduleType
    };

    // Add schedule-specific fields
    if (scheduleType === 'fixed') {
        const time = document.getElementById('sendTime').value;
        if (!time) {
            showNotification('Please select a send time', 'warning');
            return;
        }
        data.send_time = time;
    } else {
        data.prayer_name = document.getElementById('prayerName').value;
        data.prayer_offset = 10; // Fixed at 10 minutes
    }

    try {
        const url = currentEditId
            ? `${API_BASE_URL}/api/messages/${currentEditId}`
            : `${API_BASE_URL}/api/messages`;
        const method = currentEditId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showNotification(currentEditId ? 'Message updated successfully' : 'Message added successfully', 'success');
            messageModal.hide();
            loadMessages();
        } else {
            const errorData = await response.json();
            showNotification(errorData.error || 'Failed to save message', 'danger');
        }
    } catch (error) {
        console.error('Error saving message:', error);
        showNotification('Error saving message', 'danger');
    }
}

// Toggle message active status
async function toggleMessage(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/messages/${id}/toggle`, {
            method: 'PATCH',
            credentials: 'include'
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
        const response = await fetch(`${API_BASE_URL}/api/messages/${id}`, {
            method: 'DELETE',
            credentials: 'include'
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
    const testMessageContent = document.getElementById('testMessageContent').value.trim();

    if (!testMessageContent) {
        alert('Please enter a message to send');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/whatsapp/test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ message: testMessageContent })
        });

        if (response.ok) {
            showNotification('Test message sent successfully!', 'success');
            document.getElementById('testMessageContent').value = '';
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
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        localStorage.removeItem('isAuthenticated');
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        localStorage.removeItem('isAuthenticated');
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

// Make functions available globally
window.openAddModal = openAddModal;
window.editMessage = editMessage;
window.saveMessage = saveMessage;
window.toggleMessage = toggleMessage;
window.deleteMessage = deleteMessage;
window.toggleAllDays = toggleAllDays;
window.sendTestMessage = sendTestMessage;
window.logout = logout;
