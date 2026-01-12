import { Storage } from './storage.js';

document.addEventListener('DOMContentLoaded', () => {
    Storage.init();
    handleHeaderScroll();
    initModals();
    initWaitlist();
    updateActiveNavLink();
});

function handleHeaderScroll() {
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

function initModals() {
    const modalTriggers = document.querySelectorAll('[data-modal]');
    const overlays = document.querySelectorAll('.modal-overlay');

    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const modalId = trigger.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        });
    });

    overlays.forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.classList.contains('modal-close')) {
                overlay.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });
}

function initWaitlist() {
    const waitlistForms = document.querySelectorAll('.waitlist-form');
    waitlistForms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = {
                email: formData.get('email'),
                name: formData.get('name') || ''
            };
            Storage.addToWaitlist(data);

            // Show success
            const btn = form.querySelector('button');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Subscribed!';
            btn.style.background = '#22c55e';
            form.reset();

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
                const modal = form.closest('.modal-overlay');
                if (modal) modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 2000);
        });
    });
}

function updateActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && (currentPath.endsWith(href) || (currentPath.endsWith('/') && href === 'index.html'))) {
            link.classList.add('active');
        }
    });
}

// Global utility for relative paths in JS if needed
export function getRelativePath(path) {
    // Simple helper to prefix paths if running on GH pages with base
    // But for this project we'll mostly use hardcoded relative links in HTML
    return path;
}
