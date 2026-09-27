/**
 * Piu Birthday App - Visitor Activity Tracker
 * SILENTLY records all page views, button clicks, and activities during visitor session.
 * Dispatches EXACTLY ONE summary email to sadhukhansoumya7319@gmail.com when visitor exits/leaves website or closes browser.
 */
(function () {
    let isInternalClicking = false;

    // Transient in-memory flag for internal link clicks (clears automatically after 1.5s)
    document.addEventListener('click', function (e) {
        const link = e.target.closest('a');
        if (link && link.href) {
            try {
                const targetUrl = new URL(link.href, window.location.origin);
                if (targetUrl.origin === window.location.origin) {
                    isInternalClicking = true;
                    setTimeout(() => { isInternalClicking = false; }, 1500);
                }
            } catch (err) {}
        }
    }, true);

    // 1. Session & Timing Management
    function getSessionId() {
        let sid = sessionStorage.getItem('piu_session_id');
        if (!sid) {
            sid = 'sess_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
            sessionStorage.setItem('piu_session_id', sid);
        }
        return sid;
    }

    function getSessionStartTime() {
        let startTime = sessionStorage.getItem('piu_session_start');
        if (!startTime) {
            startTime = new Date().toISOString();
            sessionStorage.setItem('piu_session_start', startTime);
        }
        return new Date(startTime);
    }

    function getPagesVisited() {
        try {
            return JSON.parse(sessionStorage.getItem('piu_pages_visited') || '[]');
        } catch (e) {
            return [];
        }
    }

    function recordPageVisited(path) {
        const pages = getPagesVisited();
        if (!pages.includes(path)) {
            pages.push(path);
            sessionStorage.setItem('piu_pages_visited', JSON.stringify(pages));
        }
    }

    function getTimelineEvents() {
        try {
            return JSON.parse(sessionStorage.getItem('piu_timeline_events') || '[]');
        } catch (e) {
            return [];
        }
    }

    function recordTimelineEvent(eventStr) {
        const events = getTimelineEvents();
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        events.push(`[${nowStr}] ${eventStr}`);
        sessionStorage.setItem('piu_timeline_events', JSON.stringify(events));
    }

    // 2. Client Device & Screen Detection
    function getDeviceDescription() {
        const w = window.screen.width;
        const h = window.screen.height;
        const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTablet = /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
        const dpr = window.devicePixelRatio || 1;

        let orientation = w < h ? 'Portrait' : 'Landscape';
        let category = '💻 Laptop / Desktop';

        if (isTablet) {
            category = '📱 Tablet';
        } else if (isMobile) {
            category = '📱 Mobile Phone';
        }

        return `${w}x${h} px (${category} ${orientation}, ${dpr}x DPR)`;
    }

    function buildSessionPayload(statusReason) {
        const startTime = getSessionStartTime();
        const endTime = new Date();
        const durationSec = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 1000));

        return {
            sessionId: getSessionId(),
            pageUrl: window.location.href,
            pageTitle: document.title,
            clientIp: '',
            userAgent: navigator.userAgent,
            screenResolution: getDeviceDescription(),
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            language: navigator.language || 'en-US',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
            clientTime: new Date().toLocaleString(),
            referrer: document.referrer || '',
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            totalDurationSeconds: durationSec,
            pagesVisited: getPagesVisited(),
            timelineEvents: getTimelineEvents(),
            finalStatus: statusReason || 'Visitor Exited Website'
        };
    }

    // 3. Dispatch Session Summary Email on Exit / Completion
    function sendSessionSummaryOnExit(reason) {
        // Skip if currently transitioning between internal links via click
        if (isInternalClicking) return;

        const events = getTimelineEvents();
        const lastSentCount = parseInt(sessionStorage.getItem('piu_last_sent_count') || '-1', 10);

        // Prevent duplicate emails if no new actions happened since last dispatch
        if (events.length > 0 && events.length === lastSentCount) return;

        const payload = buildSessionPayload(reason);
        const jsonPayload = JSON.stringify(payload);
        const endpoint = '/api/telemetry/track-session';

        try {
            if (window.fetch) {
                fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: jsonPayload,
                    keepalive: true
                }).catch(() => {});
            }

            if (navigator.sendBeacon) {
                const blob = new Blob([jsonPayload], { type: 'application/json' });
                navigator.sendBeacon(endpoint, blob);
            }

            sessionStorage.setItem('piu_last_sent_count', events.length.toString());
            console.log('[Tracker] Dispatched session exit telemetry report:', reason);
        } catch (e) {
            console.warn('[Tracker] Error dispatching session exit telemetry:', e);
        }
    }

    // 4. Global Helper to Record Activities Silently
    window.trackUserAction = function (actionName, details) {
        recordTimelineEvent(`${actionName}${details ? ' - ' + details : ''}`);
    };

    // 5. Record Initial Page Visit Silently into Session Timeline
    const currentPath = window.location.pathname || '/';
    recordPageVisited(currentPath);
    recordTimelineEvent(`Visited page: ${currentPath}`);

    // 6. Listen for Visitor Exit / Window Close / Tab Close / App Switch / Back Button
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            sendSessionSummaryOnExit('User switched tab or minimized browser');
        }
    });

    window.addEventListener('pagehide', () => {
        sendSessionSummaryOnExit('User closed tab or exited website');
    });

    window.addEventListener('beforeunload', () => {
        sendSessionSummaryOnExit('User closed browser or navigated away');
    });
})();
