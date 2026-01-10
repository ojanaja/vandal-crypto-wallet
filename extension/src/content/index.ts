// Inject inpage script
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inpage.js');
script.onload = () => script.remove();
(document.head || document.documentElement).appendChild(script);

// Forward messages from Inpage Script to Background
window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || event.data.source !== 'vandal-inpage') {
        return;
    }

    // Forward to background
    chrome.runtime.sendMessage(event.data, (response) => {
        // Forward response back to Inpage Script
        window.postMessage({
            source: 'vandal-content',
            id: event.data.id,
            ...response
        }, window.location.origin);
    });
});// We will inject window.solana here in Phase 4
