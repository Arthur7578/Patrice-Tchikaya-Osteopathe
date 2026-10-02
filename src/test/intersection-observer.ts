import { vi } from "vitest";

/**
 * IntersectionObserver simulé (jsdom n'en a pas) : les tests déclenchent eux-mêmes les intersections.
 * `install()` le pose sur `window` et renvoie le registre des observateurs créés.
 */
export class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  readonly observed = new Set<Element>();
  disconnected = false;

  constructor(
    readonly callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit,
  ) {
    FakeIntersectionObserver.instances.push(this);
  }

  observe(element: Element) {
    this.observed.add(element);
  }
  unobserve(element: Element) {
    this.observed.delete(element);
  }
  disconnect() {
    this.disconnected = true;
    this.observed.clear();
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  /** Simule des entrées (élément observé, visible ou non). */
  trigger(entries: Array<{ target: Element; isIntersecting: boolean }>) {
    this.callback(entries as unknown as IntersectionObserverEntry[], this as unknown as IntersectionObserver);
  }

  static install() {
    FakeIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    return FakeIntersectionObserver.instances;
  }
}
