import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createViewManager } from '../router';

describe('createViewManager', () => {
  beforeEach(() => {
    document.body.dataset.view = 'landing';
    window.location.hash = '';
  });

  it('supports showDashboard and navigates to /dashboard', () => {
    const vm = createViewManager();
    const nav = { push: vi.fn() };
    vm.setNavigator(nav);

    vm.showDashboard();
    expect(vm.getView()).toBe('dashboard');
    expect(document.body.dataset.view).toBe('dashboard');
    expect(nav.push).toHaveBeenCalledWith('/dashboard');
    expect(window.location.hash).toBe('#dashboard');
    vm.destroy();
  });

  it('handles setView("dashboard")', () => {
    const vm = createViewManager();
    const nav = { push: vi.fn() };
    vm.setNavigator(nav);

    vm.setView('dashboard');
    expect(vm.getView()).toBe('dashboard');
    expect(nav.push).toHaveBeenCalledWith('/dashboard');
    expect(window.location.hash).toBe('#dashboard');
    vm.destroy();
  });

  it('routes #dashboard via routeHash', () => {
    const vm = createViewManager();
    const nav = { push: vi.fn() };
    vm.setNavigator(nav);

    window.location.hash = '#dashboard';
    vm.routeHash();
    expect(vm.getView()).toBe('dashboard');
    expect(nav.push).toHaveBeenCalledWith('/dashboard');
    vm.destroy();
  });
});
