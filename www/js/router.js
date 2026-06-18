/* ============================================
   REMINDO — Client-Side Hash Router
   Simple hash-based routing for the SPA
   ============================================ */

class Router {
    constructor() {
        this.routes = new Map();
        this.currentPath = '';
        this.historyStack = [];
        this._boundHandler = () => this._handleRoute();

        window.addEventListener('hashchange', this._boundHandler);
    }

    /** Register a route path with its handler function */
    register(path, handler) {
        this.routes.set(path, handler);
        return this; // Allow chaining
    }

    /** Navigate to a route */
    navigate(path) {
        window.location.hash = '#' + path;
    }

    /** Go back in history using native browser back to prevent history pollution */
    back() {
        if (this.historyStack.length > 1) {
            window.history.back();
        } else {
            this.navigate('/');
        }
    }

    /** Get current path */
    getCurrentPath() {
        return this.currentPath;
    }

    /** Start the router (process current hash) */
    start() {
        this._handleRoute();
    }

    /** Internal: process a route change */
    _handleRoute() {
        const hash = window.location.hash.slice(1) || '/';
        
        // Maintain a local history stack to detect if we actually have history
        if (this.historyStack.length > 1 && hash === this.historyStack[this.historyStack.length - 2]) {
            // User went back (either native back button or our back button)
            this.historyStack.pop();
        } else if (hash !== this.historyStack[this.historyStack.length - 1]) {
            // User went to a new page
            this.historyStack.push(hash);
        }

        this.currentPath = hash;

        // Scroll to top on route change
        const main = document.getElementById('mainContent');
        if (main) main.scrollTop = 0;

        // 1. Try exact match
        if (this.routes.has(hash)) {
            this.routes.get(hash)({});
            this._updateNav(hash);
            return;
        }

        // 2. Try parameterized routes
        for (const [route, handler] of this.routes) {
            const params = this._matchParams(route, hash);
            if (params) {
                handler(params);
                this._updateNav(hash);
                return;
            }
        }

        // 3. Fallback to home
        if (this.routes.has('/')) {
            this.navigate('/');
        }
    }

    /** Internal: match parameterized routes like /section/:id */
    _matchParams(route, path) {
        const routeParts = route.split('/');
        const pathParts = path.split('/');

        if (routeParts.length !== pathParts.length) return null;

        const params = {};
        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
                params[routeParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
            } else if (routeParts[i] !== pathParts[i]) {
                return null;
            }
        }
        return params;
    }

    /** Internal: update bottom nav active state */
    _updateNav(path) {
        const bottomNav = document.getElementById('bottomNav');
        if (!bottomNav) return;

        // Remove all active states
        bottomNav.querySelectorAll('.bottom-nav__item').forEach(item => {
            item.classList.remove('active');
        });

        // Set active based on current path
        if (path === '/') {
            document.getElementById('navHome')?.classList.add('active');
        }
        // Other nav items don't get auto-highlighted (sections stays unselected)
    }
}

// Global router instance
const router = new Router();
